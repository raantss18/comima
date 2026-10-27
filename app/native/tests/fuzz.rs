//! Robustesse : le moteur ne doit jamais paniquer, boucler ou planter, quoi qu'on lui donne
//! (réponses de l'élève, questions mal formées, JSON arbitraire). Générateur pseudo-aléatoire sans dépendance.
use comima_core::{check, pyvm};
use serde_json::{json, Value};
use std::panic::{catch_unwind, AssertUnwindSafe};
use std::time::{Duration, Instant};

struct Rng(u64);
impl Rng {
    fn next(&mut self) -> u64 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 7;
        self.0 ^= self.0 << 17;
        self.0
    }
    fn below(&mut self, n: usize) -> usize {
        (self.next() % n as u64) as usize
    }
    fn pick<'a>(&mut self, xs: &'a [&'a str]) -> &'a str {
        xs[self.below(xs.len())]
    }
}

const FRAGMENTS: &[&str] = &[
    "def f(n):", "def f(a, b):", "    ", "        ", "\n", "return ", "if ", "elif ", "else:", "while ", "for ", " in ", "range(", "len(", "sum(",
    "[", "]", "(", ")", ",", ":", "=", "==", "+=", "//", "%", "**", "-", "*", "/", "n", "a", "b", "l", "x", "0", "1", "2", "10", "999999999999",
    "9223372036854775807", "-9223372036854775808", "True", "False", "None", "'ab'", "\"\"\"doc\"\"\"", "l.append(", "l[", "l[1:", "::-1]", "[::0]",
    "break", "continue", "pass", " and ", " or ", " not ", " is ", " if ", " else ", "lambda", "import os", "print(", "sorted(", "min(", "max(", "pow(",
    "round(", "chr(", "ord(", "int(", "float(", "str(", "zip(", "enumerate(", "'x'*", "[0]*", "\\", "#c", "\t", "{", "}", "@", "$", "é", "\u{1F600}",
];

fn random_program(r: &mut Rng) -> String {
    let mut s = String::new();
    for _ in 0..r.below(60) {
        s.push_str(r.pick(FRAGMENTS));
        if r.below(3) == 0 {
            s.push(' ');
        }
    }
    s
}

fn run_bounded(code: &str, args: &[Value]) {
    let t = Instant::now();
    let r = catch_unwind(AssertUnwindSafe(|| {
        let _ = pyvm::check_syntax(code);
        let _ = pyvm::run_function(code, "f", args);
    }));
    assert!(r.is_ok(), "panique sur : {code:?}");
    assert!(t.elapsed() < Duration::from_secs(20), "trop long ({:?}) sur : {code:?}", t.elapsed());
}

#[test]
fn programmes_aleatoires_ne_paniquent_pas() {
    let mut r = Rng(0x9E37_79B9_7F4A_7C15);
    for _ in 0..fuzz_n() {
        let p = random_program(&mut r);
        run_bounded(&p, &[json!(3), json!(5)]);
    }
}

#[test]
fn programmes_valides_mutes() {
    let bases = [
        "def f(a, b):\n    while b:\n        a, b = b, a % b\n    return a\n",
        "def f(n):\n    l = []\n    for i in range(n):\n        l.append(i * i)\n    return l[1:3], sum(l), l[::-1]\n",
        "def f(n):\n    return [x for x in range(n) if x % 2 == 0]\n",
        "def f(n):\n    s = 'ab'\n    return s * n + s.upper()\n",
        "def f(a, b):\n    if a > b:\n        return a\n    elif a == b:\n        return 0\n    else:\n        return b\n",
    ];
    let mut r = Rng(12345);
    for _ in 0..fuzz_n() {
        let mut b: Vec<char> = bases[r.below(bases.len())].chars().collect();
        for _ in 0..1 + r.below(4) {
            if b.is_empty() {
                break;
            }
            let i = r.below(b.len());
            match r.below(3) {
                0 => {
                    b.remove(i);
                }
                1 => {
                    for c in r.pick(FRAGMENTS).chars().rev() {
                        b.insert(i, c);
                    }
                }
                _ => b[i] = r.pick(FRAGMENTS).chars().next().unwrap_or('x'),
            }
        }
        let code: String = b.into_iter().collect();
        run_bounded(&code, &[json!(7), json!(3)]);
    }
}

#[test]
fn attaques_connues_sur_l_interpreteur() {
    // Chaque programme doit se terminer vite, sans panique ni dépassement de pile.
    let attaques = [
        // structures imbriquées sans fin, auto-référence
        "def f(n):\n    l = []\n    for i in range(100000):\n        l = [l]\n    return 1\n",
        "def f(n):\n    l = []\n    l.append(l)\n    return l\n",
        "def f(n):\n    l = []\n    l.append(l)\n    return str(l)\n",
        "def f(n):\n    a = []\n    b = [a]\n    a.append(b)\n    return a == b\n",
        "def f(n):\n    a = []\n    b = [a]\n    a.append(b)\n    return sorted([a, b])\n",
        "def f(n):\n    t = ()\n    for i in range(100000):\n        t = (t,)\n    return 1\n",
        // répétitions géantes
        "def f(n):\n    return [] * 1000000000000\n",
        "def f(n):\n    return '' * 1000000000000\n",
        "def f(n):\n    return [0] * 1000000000\n",
        "def f(n):\n    return 'abc' * 100000000\n",
        // découpages et pas extrêmes
        "def f(n):\n    return [1, 2, 3][::9223372036854775807]\n",
        "def f(n):\n    return [1, 2, 3][::-9223372036854775807]\n",
        "def f(n):\n    return [1, 2, 3][-9223372036854775808:9223372036854775807]\n",
        "def f(n):\n    return list(range(9223372036854775800, 9223372036854775807, 5))\n",
        "def f(n):\n    return list(range(-9223372036854775808, -9223372036854775800, 3))\n",
        // arithmétique extrême
        "def f(n):\n    return -9223372036854775808 // -1\n",
        "def f(n):\n    return -9223372036854775808 % -1\n",
        "def f(n):\n    return abs(-9223372036854775808)\n",
        "def f(n):\n    return 9223372036854775807 + 1\n",
        "def f(n):\n    return 2 ** 9223372036854775807\n",
        "def f(n):\n    return 10.0 ** 400\n",
        "def f(n):\n    return int(10.0 ** 400)\n",
        "def f(n):\n    return int(float('nan'))\n",
        "def f(n):\n    return round(1e300, 400)\n",
        "def f(n):\n    return pow(2, 9223372036854775807, 1000000007)\n",
        "def f(n):\n    return pow(2, 3, 0)\n",
        "def f(n):\n    return chr(-1)\n",
        "def f(n):\n    return chr(55296)\n",
        "def f(n):\n    return divmod(5, 0)\n",
        // appels sans argument, mauvais types
        "def f(n):\n    return sum()\n",
        "def f(n):\n    return min()\n",
        "def f(n):\n    return range()\n",
        "def f(n):\n    return len()\n",
        "def f(n):\n    return [].pop()\n",
        "def f(n):\n    return 'a'.join(1)\n",
        "def f(n):\n    return 'abc'[10]\n",
        "def f(n):\n    return (1, 2)[5]\n",
        "def f(n):\n    return 1 + 'a'\n",
        "def f(n):\n    return [3, 'a'] < [3, 4]\n",
        "def f(n):\n    return f()\n",
        "def f(n):\n    return f(1, 2, 3)\n",
        "def f(n):\n    n = n + n\n    return f(n)\n",
        // récursion et boucles
        "def f(n):\n    return f(n + 1) + f(n + 2)\n",
        "def f(n):\n    while True:\n        l = [0] * 1000\n",
        "def f(n):\n    x = 0\n    for i in range(200000):\n        for j in range(200000):\n            x += 1\n    return x\n",
        // syntaxe pathologique
        "def f(n):\n    return ((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((1))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))\n",
        "def f(n):\n    return [[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[1]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]\n",
        "def f(n):\n    return 1 if 2 if 3 if 4 else 5 else 6 else 7\n",
    ];
    for (i, a) in attaques.iter().enumerate() {
        eprintln!("attaque {i}");
        run_bounded(a, &[json!(3)]);
    }
    // programmes très longs et nuls
    run_bounded(&"x = 1\n".repeat(200_000), &[]);
    run_bounded(&"(".repeat(100_000), &[]);
    run_bounded(&"[".repeat(100_000), &[]);
    run_bounded(&format!("def f(n):\n{}return 1\n", "    if 1:\n".repeat(5_000)), &[]);
    run_bounded(&"\0\u{7f}\u{200b}".repeat(1000), &[]);
}

#[test]
fn moteur_json_arbitraire_ne_panique_pas() {
    let mut r = Rng(777);
    let types = ["qcm", "vrai-faux", "numeric", "expression", "ensemble", "n-uplet", "intervalle", "ordre", "trous", "code", "simulation", "preuve", "inconnu"];
    let junk = |r: &mut Rng, depth: u32| -> Value { gen(r, depth) };
    fn gen(r: &mut Rng, depth: u32) -> Value {
        match r.below(if depth > 3 { 6 } else { 9 }) {
            0 => Value::Null,
            1 => json!(r.below(2) == 0),
            2 => json!(r.next() as i64),
            3 => json!(r.next() as f64 / 7.0),
            4 => json!(["", "x", "1/0", "[1;", "]-inf; +inf[", "n^n^n^n", "sqrt(", "((((", "9999999999999999999999", "def f(", "é"][r.below(11)]),
            5 => json!("0"),
            6 | 7 => Value::Array((0..r.below(4)).map(|_| gen(r, depth + 1)).collect()),
            _ => Value::Object((0..r.below(4)).map(|i| (["enonce", "reponse", "choix", "bonnes", "etapes", "trous", "variables", "tests", "tests_caches", "fonction", "langage", "dependances", "tolerance", "type"][(i + r.below(14)) % 14].to_string(), gen(r, depth + 1))).collect()),
        }
    }
    for _ in 0..fuzz_n() * 5 {
        let mut q = junk(&mut r, 0);
        if !q.is_object() {
            q = json!({});
        }
        q["type"] = json!(types[r.below(types.len())]);
        let a = junk(&mut r, 0);
        let res = catch_unwind(AssertUnwindSafe(|| check::check(&q, &a)));
        assert!(res.is_ok(), "panique : question {q} réponse {a}");
        let s = comima_core::check_json(&q.to_string(), &a.to_string());
        assert!(serde_json::from_str::<Value>(&s).is_ok());
    }
    // JSON invalide, énorme, très imbriqué : verdict « invalid », jamais de panique
    for (q, a) in [("{", "}"), ("", ""), (&"[".repeat(100_000), "1"), ("{}", &"[".repeat(100_000)), (&"1".repeat(1_000_000), "2")] {
        let v: Value = serde_json::from_str(&comima_core::check_json(q, a)).unwrap();
        assert_eq!(v["status"], "invalid");
    }
}

/// Nombre d'itérations (4000 par défaut ; `COMIMA_FUZZ_N=200000 cargo test --test fuzz --release` pour une longue campagne).
fn fuzz_n() -> usize {
    std::env::var("COMIMA_FUZZ_N").ok().and_then(|v| v.parse().ok()).unwrap_or(4000)
}

#[test]
fn expressions_pathologiques() {
    // Saisies d'élève hostiles ou maladroites : jamais de panique, de pile épuisée ni d'attente longue.
    let q_expr = json!({"type":"expression","variables":["n"],"reponse":"n^2+1"});
    let q_num = json!({"type":"numeric","reponse":"42"});
    let q_set = json!({"type":"ensemble","reponse":[1,2,3]});
    let q_int = json!({"type":"intervalle","reponse":"[1; 5["});
    let bad: Vec<String> = vec![
        "(".repeat(200_000),
        ")".repeat(200_000),
        format!("{}n{}", "(".repeat(5_000), ")".repeat(5_000)),
        "n^".repeat(50_000) + "n",
        "9^9^9^9^9^9".to_string(),
        "10^1000000".to_string(),
        "999999999999999999999999999999999999^999999999999999999999^2".to_string(),
        "1".repeat(1_000_000),
        "1/0".to_string(),
        "0^0".to_string(),
        "sqrt(".repeat(10_000),
        "abs(".repeat(10_000) + &")".repeat(10_000),
        "-".repeat(100_000) + "n",
        "n!".to_string(),
        "\u{0}\u{1}\u{2}".to_string(),
        "𝔫^²".to_string(),
        "n".repeat(100_000),
        "[1; 5[".repeat(50_000),
        ";".repeat(200_000),
        "1;".repeat(100_000),
    ];
    for b in &bad {
        for q in [&q_expr, &q_num, &q_set, &q_int] {
            let t = Instant::now();
            let r = catch_unwind(AssertUnwindSafe(|| check::check(q, &json!(b))));
            assert!(r.is_ok(), "panique sur une saisie de {} octets", b.len());
            assert!(t.elapsed() < Duration::from_secs(10), "trop long ({:?}) pour {} octets", t.elapsed(), b.len());
        }
    }
}
