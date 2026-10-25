//! Expressions saisies par l'élève : analyse (avec multiplication implicite), évaluation
//! modulaire / flottante, test d'équivalence et aperçu LaTeX.

use crate::num::{inv, mulmod, powmod, Rat};

const MAX_LEN: usize = 400;
const MAX_DEPTH: usize = 60;
/// Deux nombres premiers : 2^61 − 1 et 2^31 − 1.
const PRIMES: [u64; 2] = [2_305_843_009_213_693_951, 2_147_483_647];
const POINTS: usize = 12;

#[derive(Clone, Debug, PartialEq)]
pub enum Func {
    Sqrt,
    Abs,
}

#[derive(Clone, Debug, PartialEq)]
pub enum Op {
    Add,
    Sub,
    Mul,
    Div,
    Pow,
}

#[derive(Clone, Debug, PartialEq)]
pub enum Expr {
    Num(Rat, String),
    Var(usize),
    Pi,
    Neg(Box<Expr>),
    Bin(Op, Box<Expr>, Box<Expr>),
    Func(Func, Box<Expr>),
}

/// Erreur de saisie : la réponse est refusée (jamais comptée fausse).
#[derive(Clone, Debug, PartialEq)]
pub enum ParseError {
    Empty,
    Incomplete,
    UnclosedParen,
    Unexpected(String),
    UnknownVar(String),
    TooLong,
    TooBig,
}

impl ParseError {
    pub fn code(&self) -> String {
        match self {
            ParseError::Empty => "empty".into(),
            ParseError::Incomplete => "incomplete".into(),
            ParseError::UnclosedParen => "unclosed_paren".into(),
            ParseError::Unexpected(s) => format!("unexpected:{s}"),
            ParseError::UnknownVar(s) => format!("unknown_var:{s}"),
            ParseError::TooLong => "too_long".into(),
            ParseError::TooBig => "too_big".into(),
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
enum Tok {
    Num(Rat, String),
    Var(usize),
    Pi,
    Func(Func),
    Op(char),
    LP,
    RP,
}

/// Remplace les symboles du clavier par leur forme ASCII ; virgule décimale entre deux chiffres.
pub fn normalize(s: &str) -> String {
    let chars: Vec<char> = s.chars().collect();
    let mut out = String::with_capacity(s.len());
    for (i, &c) in chars.iter().enumerate() {
        match c {
            '×' | '·' | '∙' | '⋅' | '*' => out.push('*'),
            '÷' | ':' => out.push('/'),
            '−' | '–' | '—' => out.push('-'),
            '²' => out.push_str("^2"),
            '³' => out.push_str("^3"),
            '√' => out.push_str("sqrt"),
            'π' => out.push_str("pi"),
            '∞' => out.push_str("inf"),
            ',' if i > 0
                && chars[i - 1].is_ascii_digit()
                && chars.get(i + 1).is_some_and(|c| c.is_ascii_digit()) =>
            {
                out.push('.')
            }
            _ => out.push(c),
        }
    }
    out
}

const FUNCS: [(&str, Option<Func>); 5] = [
    ("racine", Some(Func::Sqrt)),
    ("sqrt", Some(Func::Sqrt)),
    ("abs", Some(Func::Abs)),
    ("rac", Some(Func::Sqrt)),
    ("pi", None),
];

fn lex(s: &str, vars: &[String]) -> Result<Vec<Tok>, ParseError> {
    let s = normalize(s);
    if s.chars().count() > MAX_LEN {
        return Err(ParseError::TooLong);
    }
    let b: Vec<char> = s.chars().collect();
    let mut toks = Vec::new();
    let mut i = 0;
    while i < b.len() {
        let c = b[i];
        if c.is_whitespace() {
            i += 1;
        } else if c.is_ascii_digit() || (c == '.' && b.get(i + 1).is_some_and(|c| c.is_ascii_digit())) {
            let start = i;
            while i < b.len() && (b[i].is_ascii_digit() || b[i] == '.') {
                i += 1;
            }
            let raw: String = b[start..i].iter().collect();
            if raw.matches('.').count() > 1 {
                return Err(ParseError::Unexpected(".".into()));
            }
            let r = Rat::parse_decimal(&raw).ok_or(ParseError::TooBig)?;
            toks.push(Tok::Num(r, raw));
        } else if c.is_alphabetic() {
            let start = i;
            while i < b.len() && b[i].is_alphabetic() {
                i += 1;
            }
            let word: String = b[start..i].iter().collect();
            split_word(&word, vars, &mut toks)?;
        } else {
            toks.push(match c {
                '+' | '-' | '*' | '/' | '^' => Tok::Op(c),
                '(' => Tok::LP,
                ')' => Tok::RP,
                _ => return Err(ParseError::Unexpected(c.to_string())),
            });
            i += 1;
        }
    }
    if toks.is_empty() {
        return Err(ParseError::Empty);
    }
    Ok(toks)
}

/// « nsqrt », « xy », « pin » : découpage glouton en fonctions, π et variables déclarées.
fn split_word(word: &str, vars: &[String], toks: &mut Vec<Tok>) -> Result<(), ParseError> {
    let lower = word.to_lowercase();
    let mut rest = word;
    let mut rest_lower = lower.as_str();
    'outer: while !rest.is_empty() {
        for (name, f) in FUNCS.iter() {
            if rest_lower.starts_with(name) && !vars.iter().any(|v| rest.starts_with(v.as_str()) && v.len() > name.len()) {
                toks.push(match f {
                    Some(f) => Tok::Func(f.clone()),
                    None => Tok::Pi,
                });
                rest = &rest[name.len()..];
                rest_lower = &rest_lower[name.len()..];
                continue 'outer;
            }
        }
        let best = vars
            .iter()
            .enumerate()
            .filter(|(_, v)| rest.starts_with(v.as_str()))
            .max_by_key(|(_, v)| v.len());
        match best {
            Some((k, v)) => {
                toks.push(Tok::Var(k));
                rest_lower = &rest_lower[v.len()..];
                rest = &rest[v.len()..];
            }
            None => return Err(ParseError::UnknownVar(word.to_string())),
        }
    }
    Ok(())
}

struct Parser {
    toks: Vec<Tok>,
    pos: usize,
    depth: usize,
}

impl Parser {
    fn peek(&self) -> Option<&Tok> {
        self.toks.get(self.pos)
    }

    fn next(&mut self) -> Option<Tok> {
        let t = self.toks.get(self.pos).cloned();
        self.pos += 1;
        t
    }

    fn enter(&mut self) -> Result<(), ParseError> {
        self.depth += 1;
        if self.depth > MAX_DEPTH {
            Err(ParseError::TooLong)
        } else {
            Ok(())
        }
    }

    fn sum(&mut self) -> Result<Expr, ParseError> {
        let mut e = self.product()?;
        while let Some(Tok::Op(c @ ('+' | '-'))) = self.peek().cloned() {
            self.pos += 1;
            let r = self.product()?;
            e = Expr::Bin(if c == '+' { Op::Add } else { Op::Sub }, Box::new(e), Box::new(r));
        }
        Ok(e)
    }

    fn product(&mut self) -> Result<Expr, ParseError> {
        let mut e = self.unary()?;
        loop {
            match self.peek() {
                Some(Tok::Op(c @ ('*' | '/'))) => {
                    let op = if *c == '*' { Op::Mul } else { Op::Div };
                    self.pos += 1;
                    let r = self.unary()?;
                    e = Expr::Bin(op, Box::new(e), Box::new(r));
                }
                // Multiplication implicite : 2n, n(n+1), (a+b)(a-b), 3sqrt(2)
                Some(Tok::Num(..) | Tok::Var(_) | Tok::Pi | Tok::Func(_) | Tok::LP) => {
                    let r = self.power()?;
                    e = Expr::Bin(Op::Mul, Box::new(e), Box::new(r));
                }
                _ => return Ok(e),
            }
        }
    }

    fn unary(&mut self) -> Result<Expr, ParseError> {
        self.enter()?;
        let e = match self.peek() {
            Some(Tok::Op('-')) => {
                self.pos += 1;
                Expr::Neg(Box::new(self.unary()?))
            }
            Some(Tok::Op('+')) => {
                self.pos += 1;
                self.unary()?
            }
            _ => self.power()?,
        };
        self.depth -= 1;
        Ok(e)
    }

    fn power(&mut self) -> Result<Expr, ParseError> {
        let b = self.primary()?;
        if let Some(Tok::Op('^')) = self.peek() {
            self.pos += 1;
            let e = self.unary()?;
            return Ok(Expr::Bin(Op::Pow, Box::new(b), Box::new(e)));
        }
        Ok(b)
    }

    fn primary(&mut self) -> Result<Expr, ParseError> {
        self.enter()?;
        let e = match self.next() {
            None => return Err(ParseError::Incomplete),
            Some(Tok::Num(r, raw)) => Expr::Num(r, raw),
            Some(Tok::Var(k)) => Expr::Var(k),
            Some(Tok::Pi) => Expr::Pi,
            Some(Tok::LP) => {
                let e = self.sum()?;
                match self.next() {
                    Some(Tok::RP) => e,
                    None => return Err(ParseError::UnclosedParen),
                    Some(t) => return Err(ParseError::Unexpected(tok_str(&t))),
                }
            }
            Some(Tok::Func(f)) => {
                let arg = match self.peek() {
                    Some(Tok::Op('-')) => self.unary()?,
                    _ => self.primary()?,
                };
                Expr::Func(f, Box::new(arg))
            }
            Some(t) => return Err(ParseError::Unexpected(tok_str(&t))),
        };
        self.depth -= 1;
        Ok(e)
    }
}

fn tok_str(t: &Tok) -> String {
    match t {
        Tok::Op(c) => c.to_string(),
        Tok::RP => ")".into(),
        Tok::LP => "(".into(),
        Tok::Num(_, raw) => raw.clone(),
        _ => "?".into(),
    }
}

pub fn parse(s: &str, vars: &[String]) -> Result<Expr, ParseError> {
    let toks = lex(s, vars)?;
    let mut p = Parser { toks, pos: 0, depth: 0 };
    let e = p.sum()?;
    match p.next() {
        None => Ok(e),
        Some(Tok::RP) => Err(ParseError::Unexpected(")".into())),
        Some(t) => Err(ParseError::Unexpected(tok_str(&t))),
    }
}

// ---------------------------------------------------------------- évaluation

#[derive(Debug, PartialEq)]
enum EvalErr {
    NonPoly,
    DivZero,
}

#[derive(Clone, Copy)]
struct V {
    m: [u64; 2],
    q: Option<Rat>,
}

fn eval_mod(e: &Expr, xs: &[(Rat, [u64; 2])]) -> Result<V, EvalErr> {
    Ok(match e {
        Expr::Num(r, _) => V {
            m: [r.modp(PRIMES[0]).ok_or(EvalErr::NonPoly)?, r.modp(PRIMES[1]).ok_or(EvalErr::NonPoly)?],
            q: Some(*r),
        },
        Expr::Var(k) => V { m: xs[*k].1, q: Some(xs[*k].0) },
        Expr::Pi | Expr::Func(..) => return Err(EvalErr::NonPoly),
        Expr::Neg(a) => {
            let a = eval_mod(a, xs)?;
            V {
                m: [0, 1].map(|i| (PRIMES[i] - a.m[i]) % PRIMES[i]),
                q: a.q.and_then(|q| q.neg()),
            }
        }
        Expr::Bin(op, a, b) => {
            let a = eval_mod(a, xs)?;
            let b = eval_mod(b, xs)?;
            match op {
                Op::Add => V {
                    m: [0, 1].map(|i| ((a.m[i] as u128 + b.m[i] as u128) % PRIMES[i] as u128) as u64),
                    q: a.q.zip(b.q).and_then(|(x, y)| x.add(y)),
                },
                Op::Sub => V {
                    m: [0, 1].map(|i| ((a.m[i] as u128 + (PRIMES[i] - b.m[i]) as u128) % PRIMES[i] as u128) as u64),
                    q: a.q.zip(b.q).and_then(|(x, y)| x.sub(y)),
                },
                Op::Mul => V {
                    m: [0, 1].map(|i| mulmod(a.m[i], b.m[i], PRIMES[i])),
                    q: a.q.zip(b.q).and_then(|(x, y)| x.mul(y)),
                },
                Op::Div => {
                    if b.q.is_some_and(|q| q.n == 0) {
                        return Err(EvalErr::DivZero);
                    }
                    let mut m = [0; 2];
                    for i in 0..2 {
                        m[i] = mulmod(a.m[i], inv(b.m[i], PRIMES[i]).ok_or(EvalErr::DivZero)?, PRIMES[i]);
                    }
                    V { m, q: a.q.zip(b.q).and_then(|(x, y)| x.div(y)) }
                }
                Op::Pow => {
                    // L'exposant doit être un entier connu exactement (n, 2n+1…).
                    let e = b.q.filter(|q| q.is_int()).ok_or(EvalErr::NonPoly)?.n;
                    if e.unsigned_abs() > 1_000_000_000_000 {
                        return Err(EvalErr::NonPoly);
                    }
                    let mut m = [0; 2];
                    for i in 0..2 {
                        let base = if e < 0 { inv(a.m[i], PRIMES[i]).ok_or(EvalErr::DivZero)? } else { a.m[i] };
                        m[i] = powmod(base, e.unsigned_abs() as u64, PRIMES[i]);
                    }
                    let q = if e.abs() <= 128 { a.q.and_then(|x| x.pow(e as i64)) } else { None };
                    V { m, q }
                }
            }
        }
    })
}

fn eval_f(e: &Expr, xs: &[f64]) -> f64 {
    match e {
        Expr::Num(r, _) => r.to_f64(),
        Expr::Var(k) => xs[*k],
        Expr::Pi => std::f64::consts::PI,
        Expr::Neg(a) => -eval_f(a, xs),
        Expr::Func(Func::Sqrt, a) => eval_f(a, xs).sqrt(),
        Expr::Func(Func::Abs, a) => eval_f(a, xs).abs(),
        Expr::Bin(op, a, b) => {
            let (a, b) = (eval_f(a, xs), eval_f(b, xs));
            match op {
                Op::Add => a + b,
                Op::Sub => a - b,
                Op::Mul => a * b,
                Op::Div => a / b,
                Op::Pow => a.powf(b),
            }
        }
    }
}

/// Générateur pseudo-aléatoire déterministe (mêmes points sur le téléphone et sur le serveur).
pub struct SplitMix(pub u64);

impl SplitMix {
    pub fn next(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = self.0;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }
}

pub fn seed_of(s: &str) -> u64 {
    s.bytes().fold(0xcbf2_9ce4_8422_2325u64, |h, b| (h ^ b as u64).wrapping_mul(0x100_0000_01b3))
}

/// Résultat d'une comparaison : None si on n'a pas pu trancher (domaine vide…).
pub fn equivalent(a: &Expr, b: &Expr, nvars: usize, seed: u64) -> Option<bool> {
    let mut rng = SplitMix(seed);
    let need = if nvars == 0 { 1 } else { POINTS };
    let mut ok = 0;
    let mut tries = 0;
    let mut float_mode = false;
    while ok < need && tries < 200 {
        tries += 1;
        let xs: Vec<(Rat, [u64; 2])> = (0..nvars)
            .map(|_| {
                let x = 2 + rng.next() % (PRIMES[1] - 4);
                (Rat::int(x as i128), [x, x])
            })
            .collect();
        match (eval_mod(a, &xs), eval_mod(b, &xs)) {
            (Ok(va), Ok(vb)) => {
                if va.m != vb.m {
                    return Some(false);
                }
                ok += 1;
            }
            (Err(EvalErr::NonPoly), _) | (_, Err(EvalErr::NonPoly)) => {
                float_mode = true;
                break;
            }
            _ => {}
        }
    }
    if !float_mode {
        return (ok >= need).then_some(true);
    }
    // Racines, valeurs absolues, π, exposants fractionnaires : flottants avec tolérance relative.
    let (mut ok, mut tries) = (0, 0);
    while ok < need && tries < 200 {
        tries += 1;
        let xs: Vec<f64> = (0..nvars).map(|_| 0.5 + (rng.next() % 1_000_000) as f64 / 400_000.0).collect();
        let (x, y) = (eval_f(a, &xs), eval_f(b, &xs));
        if !x.is_finite() || !y.is_finite() {
            continue;
        }
        if (x - y).abs() > 1e-9 * x.abs().max(y.abs()).max(1.0) {
            return Some(false);
        }
        ok += 1;
    }
    (ok >= need).then_some(true)
}

/// Valeur approchée (pour les tolérances et les bornes d'intervalles).
pub fn approx(e: &Expr) -> f64 {
    eval_f(e, &[])
}

// ---------------------------------------------------------------- aperçu LaTeX

fn prec(e: &Expr) -> u8 {
    match e {
        Expr::Bin(Op::Add | Op::Sub, ..) => 1,
        Expr::Bin(Op::Mul, ..) => 2,
        Expr::Neg(_) => 3,
        Expr::Bin(Op::Pow, ..) => 4,
        _ => 5,
    }
}

fn wrap(e: &Expr, min: u8, vars: &[String]) -> String {
    let s = to_latex(e, vars);
    if prec(e) < min {
        format!("\\left({s}\\right)")
    } else {
        s
    }
}

pub fn to_latex(e: &Expr, vars: &[String]) -> String {
    match e {
        Expr::Num(_, raw) => raw.replace('.', "{,}"),
        Expr::Var(k) => vars[*k].clone(),
        Expr::Pi => "\\pi".into(),
        Expr::Neg(a) => format!("-{}", wrap(a, 3, vars)),
        Expr::Func(Func::Sqrt, a) => format!("\\sqrt{{{}}}", to_latex(a, vars)),
        Expr::Func(Func::Abs, a) => format!("\\left|{}\\right|", to_latex(a, vars)),
        Expr::Bin(op, a, b) => match op {
            Op::Add => format!("{} + {}", to_latex(a, vars), to_latex(b, vars)),
            Op::Sub => format!("{} - {}", to_latex(a, vars), wrap(b, 2, vars)),
            Op::Mul => {
                let (l, r) = (wrap(a, 2, vars), wrap(b, 3, vars));
                let sep = if matches!(**b, Expr::Num(..)) || matches!(**b, Expr::Neg(_)) { " \\times " } else { " " };
                format!("{l}{sep}{r}")
            }
            Op::Div => format!("\\frac{{{}}}{{{}}}", to_latex(a, vars), to_latex(b, vars)),
            Op::Pow => format!("{{{}}}^{{{}}}", wrap(a, 5, vars), to_latex(b, vars)),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn eq(a: &str, b: &str, vars: &[&str]) -> Option<bool> {
        let v: Vec<String> = vars.iter().map(|s| s.to_string()).collect();
        let (x, y) = (parse(a, &v).unwrap(), parse(b, &v).unwrap());
        equivalent(&x, &y, v.len(), seed_of(a))
    }

    #[test]
    fn equivalences() {
        assert_eq!(eq("n*(n+1)/2", "(n^2+n)/2", &["n"]), Some(true));
        assert_eq!(eq("n*(n+1)/2", "n(n+1)/2", &["n"]), Some(true));
        assert_eq!(eq("n*(n+1)/2", "n²/2 + n/2", &["n"]), Some(true));
        assert_eq!(eq("n*(n+1)/2", "n(n-1)/2", &["n"]), Some(false));
        assert_eq!(eq("(n+1)^2", "n^2+2n+1", &["n"]), Some(true));
        assert_eq!(eq("2^(n+1)", "2*2^n", &["n"]), Some(true));
        assert_eq!(eq("2^(n+1)", "2^n+2", &["n"]), Some(false));
        assert_eq!(eq("(a+b)^2", "a^2+2ab+b^2", &["a", "b"]), Some(true));
        assert_eq!(eq("(a+b)^2", "a^2+b^2", &["a", "b"]), Some(false));
        assert_eq!(eq("1/(x-1) - 1/x", "1/(x(x-1))", &["x"]), Some(true));
        assert_eq!(eq("sqrt(8)", "2√2", &[]), Some(true));
        assert_eq!(eq("sqrt(x^2)", "x", &["x"]), Some(true));
        assert_eq!(eq("0.5", "1/2", &[]), Some(true));
        assert_eq!(eq("0,5", "2/4", &[]), Some(true));
        assert_eq!(eq("2π", "2*pi", &[]), Some(true));
    }

    #[test]
    fn erreurs_de_saisie() {
        let v = vec!["n".to_string()];
        assert_eq!(parse("", &v), Err(ParseError::Empty));
        assert_eq!(parse("n*(n+1", &v), Err(ParseError::UnclosedParen));
        assert_eq!(parse("n+", &v), Err(ParseError::Incomplete));
        assert_eq!(parse("m+1", &v), Err(ParseError::UnknownVar("m".into())));
        assert_eq!(parse("n)", &v), Err(ParseError::Unexpected(")".into())));
        assert!(parse(&"(".repeat(300), &v).is_err());
    }

    #[test]
    fn apercu() {
        let v = vec!["n".to_string()];
        assert_eq!(to_latex(&parse("n(n+1)/2", &v).unwrap(), &v), "\\frac{n \\left(n + 1\\right)}{2}");
        assert_eq!(to_latex(&parse("-n^2", &v).unwrap(), &v), "-{n}^{2}");
    }
}
