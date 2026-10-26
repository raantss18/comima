//! Correction d'une réponse à partir de la question telle qu'elle figure dans le paquet.
//! Verdicts : correct | incorrect | invalid (saisie refusée, jamais comptée fausse) | manual.

use crate::expr::{approx, equivalent, parse, seed_of, Expr};
use serde_json::{json, Value};

pub fn verdict(status: &str, code: Option<String>) -> Value {
    match code {
        Some(c) => json!({ "status": status, "code": c }),
        None => json!({ "status": status }),
    }
}

fn ok(b: bool) -> Value {
    verdict(if b { "correct" } else { "incorrect" }, None)
}

fn invalid(code: impl Into<String>) -> Value {
    verdict("invalid", Some(code.into()))
}

fn text(v: &Value) -> Option<String> {
    match v {
        Value::String(s) => Some(s.clone()),
        Value::Number(n) => Some(n.to_string()),
        _ => None,
    }
}

fn vars_of(q: &Value) -> Vec<String> {
    q["variables"]
        .as_array()
        .map(|a| a.iter().filter_map(|v| v.as_str().map(String::from)).collect())
        .unwrap_or_default()
}

fn indices(v: &Value) -> Option<Vec<i64>> {
    match v {
        Value::Array(a) => a.iter().map(|x| x.as_i64()).collect(),
        Value::Number(n) => n.as_i64().map(|i| vec![i]),
        Value::String(s) => s.trim().parse().ok().map(|i| vec![i]),
        _ => None,
    }
}

/// Comparaison de deux nombres (exacte, ou flottante si racines / π).
fn same_number(a: &Expr, b: &Expr) -> bool {
    equivalent(a, b, 0, 1).unwrap_or(false)
}

/// Découpe « {1; 2; 3} », « (9, 2) », « 1, 2, 3 ».
fn split_list(s: &str) -> Vec<String> {
    let t = s.trim();
    let t = t
        .strip_prefix(['{', '(', '['])
        .and_then(|x| x.strip_suffix(['}', ')', ']']))
        .unwrap_or(t);
    if t.trim().is_empty() {
        return vec![];
    }
    let sep = if t.contains(';') { ';' } else { ',' };
    t.split(sep).map(|x| x.trim().to_string()).collect()
}

fn parse_list(s: &str) -> Result<Vec<Expr>, String> {
    let items = split_list(s);
    if items.is_empty() {
        return Err("empty".into());
    }
    items.iter().map(|x| parse(x, &[]).map_err(|e| e.code())).collect()
}

#[derive(Debug)]
enum Bound {
    MinusInf,
    PlusInf,
    At(Expr),
}

/// « [a; b[ », « ]-inf; 2] », et la notation anglaise « (a, b] ».
fn parse_interval(s: &str) -> Result<(bool, Bound, Bound, bool), String> {
    let t: String = s.trim().replace('∞', "inf");
    let mut ch = t.chars();
    let (l, r) = (ch.next().ok_or("empty")?, ch.next_back().ok_or("bad_interval")?);
    let inner: String = ch.collect();
    let left_closed = match l {
        '[' => true,
        ']' | '(' => false,
        _ => return Err("bad_interval".into()),
    };
    let right_closed = match r {
        ']' => true,
        '[' | ')' => false,
        _ => return Err("bad_interval".into()),
    };
    let parts: Vec<&str> = if inner.contains(';') { inner.split(';').collect() } else { inner.split(',').collect() };
    if parts.len() != 2 {
        return Err("bad_interval".into());
    }
    let bound = |p: &str| -> Result<Bound, String> {
        match p.trim().replace(' ', "").as_str() {
            "-inf" => Ok(Bound::MinusInf),
            "+inf" | "inf" => Ok(Bound::PlusInf),
            x => parse(x, &[]).map(Bound::At).map_err(|e| e.code()),
        }
    };
    Ok((left_closed, bound(parts[0])?, bound(parts[1])?, right_closed))
}

fn same_bound(a: &Bound, b: &Bound) -> bool {
    match (a, b) {
        (Bound::MinusInf, Bound::MinusInf) | (Bound::PlusInf, Bound::PlusInf) => true,
        (Bound::At(x), Bound::At(y)) => same_number(x, y),
        _ => false,
    }
}

pub fn check(q: &Value, a: &Value) -> Value {
    let typ = q["type"].as_str().unwrap_or("");
    match typ {
        "qcm" => {
            let (Some(mut want), Some(mut got)) = (indices(&q["bonnes"]), indices(a)) else {
                return invalid("empty");
            };
            if got.is_empty() {
                return invalid("empty");
            }
            want.sort_unstable();
            got.sort_unstable();
            got.dedup();
            ok(want == got)
        }
        "vrai-faux" => match (q["reponse"].as_bool(), a.as_bool()) {
            (Some(w), Some(g)) => ok(w == g),
            _ => invalid("empty"),
        },
        "numeric" => {
            let Some(s) = text(a) else { return invalid("empty") };
            let got = match parse(&s, &[]) {
                Ok(e) => e,
                Err(e) => return invalid(e.code()),
            };
            if let Some(tol) = q["tolerance"].as_f64() {
                let Some(w) = q["reponse"].as_f64() else { return invalid("bad_question") };
                let x = approx(&got);
                return if x.is_finite() { ok((x - w).abs() <= tol + 1e-12) } else { invalid("not_a_number") };
            }
            match text(&q["reponse"]).map(|w| parse(&w, &[])) {
                Some(Ok(w)) => ok(same_number(&w, &got)),
                _ => invalid("bad_question"),
            }
        }
        "expression" => {
            let vars = vars_of(q);
            let Some(s) = text(a) else { return invalid("empty") };
            let Some(want_src) = text(&q["reponse"]) else { return invalid("bad_question") };
            let Ok(want) = parse(&want_src, &vars) else { return invalid("bad_question") };
            let got = match parse(&s, &vars) {
                Ok(e) => e,
                Err(e) => return invalid(e.code()),
            };
            match equivalent(&want, &got, vars.len(), seed_of(&want_src)) {
                Some(b) => ok(b),
                None => invalid("cannot_check"),
            }
        }
        "ensemble" | "n-uplet" => {
            let Some(s) = text(a) else { return invalid("empty") };
            let got = match parse_list(&s) {
                Ok(l) => l,
                Err(c) => return invalid(c),
            };
            let want: Option<Vec<Expr>> = q["reponse"]
                .as_array()
                .and_then(|l| l.iter().map(|v| text(v).and_then(|t| parse(&t, &[]).ok())).collect());
            let Some(want) = want else { return invalid("bad_question") };
            if typ == "n-uplet" {
                return ok(want.len() == got.len() && want.iter().zip(&got).all(|(x, y)| same_number(x, y)));
            }
            // Ensemble : ordre et répétitions ignorés.
            let all_in = |xs: &[Expr], ys: &[Expr]| xs.iter().all(|x| ys.iter().any(|y| same_number(x, y)));
            ok(all_in(&want, &got) && all_in(&got, &want))
        }
        "intervalle" => {
            let Some(s) = text(a) else { return invalid("empty") };
            let got = match parse_interval(&s) {
                Ok(i) => i,
                Err(c) => return invalid(c),
            };
            let Some(Ok(want)) = text(&q["reponse"]).map(|w| parse_interval(&w)) else {
                return invalid("bad_question");
            };
            ok(want.0 == got.0 && want.3 == got.3 && same_bound(&want.1, &got.1) && same_bound(&want.2, &got.2))
        }
        "ordre" => {
            let n = q["etapes"].as_array().map_or(0, |e| e.len()) as i64;
            let Some(got) = indices(a) else { return invalid("empty") };
            if got.is_empty() {
                return invalid("empty");
            }
            if got.iter().any(|&i| i >= n) {
                return verdict("incorrect", Some("intrus".into()));
            }
            let mut seen = got.clone();
            seen.sort_unstable();
            seen.dedup();
            if seen.len() != got.len() || seen.len() as i64 != n || got.iter().any(|&i| i < 0) {
                return verdict("incorrect", Some("missing".into()));
            }
            let pos = |k: i64| got.iter().position(|&i| i == k).unwrap();
            let good = match q["dependances"].as_array() {
                Some(deps) => deps.iter().all(|d| match (d[0].as_i64(), d[1].as_i64()) {
                    (Some(x), Some(y)) if x < n && y < n => pos(x) < pos(y),
                    _ => true,
                }),
                None => got.iter().enumerate().all(|(k, &i)| k as i64 == i),
            };
            if good { ok(true) } else { verdict("incorrect", Some("order".into())) }
        }
        "trous" => {
            let Some(trous) = q["trous"].as_array() else { return invalid("bad_question") };
            let Some(got) = a.as_array() else { return invalid("empty") };
            if got.len() != trous.len() {
                return invalid("empty");
            }
            let parts: Vec<Value> = trous.iter().zip(got).map(|(t, g)| check(t, g)).collect();
            let st = |s: &str| parts.iter().any(|p| p["status"] == s);
            let status = if st("invalid") { "invalid" } else if st("incorrect") { "incorrect" } else { "correct" };
            json!({ "status": status, "parts": parts })
        }
        "code" if q["langage"] == "python" => check_python(q, a),
        // Pseudo-code, simulation, preuve rédigée : pas encore corrigés dans l'application.
        _ => verdict("manual", None),
    }
}

fn detailed(status: &str, code: &str, detail: String) -> Value {
    json!({ "status": status, "code": code, "detail": detail })
}

/// Valeurs de test égales : nombres à 1e-9 près, tableaux terme à terme, le reste à l'identique.
fn same(expected: &Value, got: &Value) -> bool {
    match (expected, got) {
        (Value::Number(x), Value::Number(y)) => {
            let (x, y) = (x.as_f64().unwrap_or(f64::NAN), y.as_f64().unwrap_or(f64::NAN));
            (x - y).abs() <= 1e-9 * x.abs().max(1.0)
        }
        (Value::Array(x), Value::Array(y)) => x.len() == y.len() && x.iter().zip(y).all(|(p, q)| same(p, q)),
        _ => expected == got,
    }
}

/// Question `code` en Python : le code de l'élève est exécuté (bac à sable de `pyvm`) sur les tests
/// affichés (`tests`) puis sur les tests cachés (`tests_caches`). Une erreur de syntaxe ou une fonction
/// absente n'est jamais comptée fausse (`invalid`) ; le détail du premier échec n'est montré que pour
/// un test affiché.
fn check_python(q: &Value, a: &Value) -> Value {
    use crate::pyvm::{self, PyErr};
    let Some(code) = a.as_str() else { return invalid("empty") };
    let (Some(fname), Some(shown)) = (q["fonction"].as_str(), q["tests"].as_array()) else { return invalid("bad_question") };
    if code.trim().is_empty() {
        return invalid("empty");
    }
    if let Err(e) = pyvm::check_syntax(code) {
        return match e {
            PyErr::Syntax(line, m) => detailed("invalid", "py_syntax", format!("ligne {line} : {m}")),
            _ => invalid("py_syntax"),
        };
    }
    let hidden = q["tests_caches"].as_array().cloned().unwrap_or_default();
    for (is_hidden, t) in shown.iter().map(|t| (false, t)).chain(hidden.iter().map(|t| (true, t))) {
        let Some(args) = t["entree"].as_array() else { return invalid("bad_question") };
        let call = format!("{fname}({})", args.iter().map(pyvm::py_repr).collect::<Vec<_>>().join(", "));
        match pyvm::run_function(code, fname, args) {
            Ok(r) => {
                if !same(&t["sortie"], &r.value) {
                    if is_hidden {
                        return detailed("incorrect", "py_fail", String::new());
                    }
                    // `expected` est donné à part : chaque interface écrit « attendu » dans sa langue.
                    let mut v = detailed("incorrect", "py_fail", format!("{call} → {}", pyvm::py_repr(&r.value)));
                    v["expected"] = json!(pyvm::py_repr(&t["sortie"]));
                    return v;
                }
            }
            Err(PyErr::NoFunction(f)) => return detailed("invalid", "py_nofunc", f),
            Err(PyErr::Syntax(line, m)) => return detailed("invalid", "py_syntax", format!("ligne {line} : {m}")),
            Err(PyErr::Limit) => return detailed("incorrect", "py_timeout", if is_hidden { String::new() } else { call }),
            Err(PyErr::Runtime(m)) => {
                return detailed("incorrect", "py_error", if is_hidden { m } else { format!("{call} : {m}") });
            }
        }
    }
    verdict("correct", None)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn code_q() -> Value {
        json!({"type":"code","langage":"python","fonction":"pgcd",
          "tests":[{"entree":[12,18],"sortie":6},{"entree":[7,0],"sortie":7}],
          "tests_caches":[{"entree":[1071,462],"sortie":21},{"entree":[17,5],"sortie":1}]})
    }

    #[test]
    fn code_python_corrige() {
        let bon = "def pgcd(a, b):\n    while b:\n        a, b = b, a % b\n    return a\n";
        assert_eq!(check(&code_q(), &json!(bon))["status"], "correct");
        // faux sur un test affiché : détail donné
        let faux = "def pgcd(a, b):\n    return a\n";
        let v = check(&code_q(), &json!(faux));
        assert_eq!(v["status"], "incorrect");
        assert!(v["detail"].as_str().unwrap().contains("pgcd(12, 18)"));
        // faux seulement sur un test caché : pas de détail
        let a_moitie = "def pgcd(a, b):\n    if a == 12 or b == 0:\n        return 6 if a == 12 else a\n    return 1\n";
        let v = check(&code_q(), &json!(a_moitie));
        assert_eq!(v["status"], "incorrect");
        assert_eq!(v["detail"], "");
        // jamais compté faux : syntaxe, fonction absente, réponse vide
        assert_eq!(check(&code_q(), &json!("def pgcd(a, b:\n"))["status"], "invalid");
        assert_eq!(check(&code_q(), &json!("def autre(a):\n    return a\n"))["code"], "py_nofunc");
        assert_eq!(check(&code_q(), &json!("   "))["status"], "invalid");
        // boucle infinie : borné
        let v = check(&code_q(), &json!("def pgcd(a, b):\n    while True:\n        pass\n"));
        assert_eq!(v["code"], "py_timeout");
        // pseudo-code : toujours manuel
        assert_eq!(check(&json!({"type":"code","langage":"pseudo"}), &json!("x"))["status"], "manual");
    }

    fn st(q: Value, a: Value) -> String {
        check(&q, &a)["status"].as_str().unwrap().to_string()
    }

    #[test]
    fn types() {
        assert_eq!(st(json!({"type":"qcm","bonnes":[0,3]}), json!([3,0])), "correct");
        assert_eq!(st(json!({"type":"qcm","bonnes":[0,3]}), json!([0])), "incorrect");
        assert_eq!(st(json!({"type":"numeric","reponse":"55"}), json!("110/2")), "correct");
        assert_eq!(st(json!({"type":"numeric","reponse":"-3/4"}), json!("-0,75")), "correct");
        assert_eq!(st(json!({"type":"numeric","reponse":"55"}), json!("5 5)")), "invalid");
        assert_eq!(st(json!({"type":"numeric","reponse":3.1416,"tolerance":0.001}), json!("π")), "correct");
        assert_eq!(st(json!({"type":"ensemble","reponse":[1,2,3,4,6,12]}), json!("{12; 6; 4; 3; 2; 1}")), "correct");
        assert_eq!(st(json!({"type":"ensemble","reponse":[1,2,3]}), json!("1, 2")), "incorrect");
        assert_eq!(st(json!({"type":"n-uplet","reponse":[9,2]}), json!("(9, 2)")), "correct");
        assert_eq!(st(json!({"type":"n-uplet","reponse":[9,2]}), json!("(2, 9)")), "incorrect");
        assert_eq!(st(json!({"type":"intervalle","reponse":"[-1; 5]"}), json!("[-1;5]")), "correct");
        assert_eq!(st(json!({"type":"intervalle","reponse":"[-1; 5]"}), json!("]-1;5]")), "incorrect");
        assert_eq!(st(json!({"type":"intervalle","reponse":"[1; +inf["}), json!("[1, ∞)")), "correct");
        let ordre = json!({"type":"ordre","etapes":[1,2,3,4,5],"dependances":[[1,2],[2,3],[0,4],[3,4]]});
        assert_eq!(st(ordre.clone(), json!([0,1,2,3,4])), "correct");
        assert_eq!(st(ordre.clone(), json!([1,2,3,0,4])), "correct");
        assert_eq!(st(ordre.clone(), json!([0,2,1,3,4])), "incorrect");
        assert_eq!(st(ordre.clone(), json!([0,1,2,3,5,4])), "incorrect");
        assert_eq!(st(json!({"type":"preuve"}), json!("…")), "manual");
    }
}
