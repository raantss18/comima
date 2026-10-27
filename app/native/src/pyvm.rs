//! Petit interpréteur d'un sous-ensemble de Python, pour corriger les questions `code` (langage python).
//!
//! Bac à sable : aucune entrée-sortie (sauf `print`, capturé), aucun `import`, aucun accès aux fichiers
//! ni au réseau ; temps borné par un nombre d'opérations, profondeur de récursion bornée, tailles de
//! listes et de chaînes bornées. Même code dans l'application (FFI) et sur le site (WebAssembly).
//!
//! Langage accepté : `def`, `return`, affectations (dont `a, b = b, a % b` et `l[i] = x`), `+= -= *= //= %= **=`,
//! `if/elif/else`, `while`, `for … in`, `break`, `continue`, `pass`, entiers (64 bits, dépassement = erreur),
//! flottants, booléens, `None`, chaînes, listes, tuples, listes en compréhension, expression conditionnelle,
//! `and or not in is`, comparaisons chaînées, découpage `l[a:b:c]`, et un jeu de fonctions et méthodes usuelles.

use serde_json::{json, Value};
use std::cell::{Cell, Ref, RefCell, RefMut};
use std::collections::HashMap;
use std::rc::Rc;

const MAX_STEPS: u64 = 4_000_000;
const MAX_DEPTH: usize = 80;
const MAX_LIST: usize = 200_000;
const MAX_STR: usize = 200_000;
const MAX_NEST: usize = 25;

#[derive(Debug, Clone, PartialEq)]
pub enum PyErr {
    /// Erreur de syntaxe (ligne, message).
    Syntax(usize, String),
    /// Erreur d'exécution (message court, en français).
    Runtime(String),
    /// Trop d'opérations ou de récursion.
    Limit,
    /// La fonction demandée n'est pas définie.
    NoFunction(String),
}

type R<T> = Result<T, PyErr>;

thread_local! {
    /// Budget de travail du programme en cours : une unité par nœud évalué, plus une par élément copié ou parcouru.
    static WORK: Cell<u64> = const { Cell::new(0) };
}

/// Compte `n` unités de travail (copie de liste, répétition, tri…) : un programme qui copie sans cesse de grandes
/// listes est arrêté comme une boucle infinie.
fn charge(n: usize) -> R<()> {
    WORK.with(|w| {
        let v = w.get().saturating_add(n as u64);
        w.set(v);
        if v > MAX_STEPS {
            Err(PyErr::Limit)
        } else {
            Ok(())
        }
    })
}

fn rt<T>(m: impl Into<String>) -> R<T> {
    Err(PyErr::Runtime(m.into()))
}

// ---------------------------------------------------------------- valeurs

#[derive(Clone, Debug)]
enum V {
    None,
    Bool(bool),
    Int(i64),
    Float(f64),
    Str(Rc<String>),
    List(Rc<Lst>),
    Tuple(Rc<Tup>),
    Func(Rc<FuncDef>),
    Builtin(String),
}

/// Profondeur d'imbrication maximale d'une liste ou d'un tuple (au-delà : erreur). Évite les dépassements de pile
/// à l'affichage, à la comparaison et à la libération des structures (`l = [l]` répété, etc.).
const MAX_NEST_V: u16 = 40;
const NEST_SAT: u16 = 1000;
/// Garde-fou des fonctions récursives sur les valeurs (au cas où une profondeur mémorisée serait périmée).
const REC_CAP: usize = 150;

/// Liste avec sa profondeur d'imbrication (1 pour une liste de nombres).
#[derive(Debug)]
struct Lst {
    v: RefCell<Vec<V>>,
    d: Cell<u16>,
}

impl Lst {
    fn new(v: Vec<V>) -> Self {
        let d = 1 + v.iter().map(vdepth).max().unwrap_or(0);
        Lst { v: RefCell::new(v), d: Cell::new(d.min(NEST_SAT)) }
    }
    fn borrow(&self) -> Ref<'_, Vec<V>> {
        self.v.borrow()
    }
    fn borrow_mut(&self) -> RefMut<'_, Vec<V>> {
        self.v.borrow_mut()
    }
    fn grow(&self, e: &V) {
        let n = (vdepth(e) + 1).min(NEST_SAT);
        if n > self.d.get() {
            self.d.set(n);
        }
    }
}

#[derive(Debug)]
struct Tup {
    v: Vec<V>,
    d: u16,
}

impl std::ops::Deref for Tup {
    type Target = Vec<V>;
    fn deref(&self) -> &Vec<V> {
        &self.v
    }
}

fn vdepth(v: &V) -> u16 {
    match v {
        V::List(l) => l.d.get(),
        V::Tuple(t) => t.d,
        _ => 0,
    }
}

fn check_depth(v: &V) -> R<()> {
    if vdepth(v) > MAX_NEST_V {
        rt("structure trop imbriquée")
    } else {
        Ok(())
    }
}

/// Ajout d'un élément dans une liste : refuse l'auto-référence et l'imbrication excessive.
fn guard_insert(l: &Rc<Lst>, e: &V) -> R<()> {
    if let V::List(x) = e {
        if Rc::ptr_eq(l, x) {
            return rt("une liste ne peut pas se contenir elle-même");
        }
    }
    if vdepth(e) >= MAX_NEST_V {
        return rt("structure trop imbriquée");
    }
    l.grow(e);
    Ok(())
}

fn list(v: Vec<V>) -> V {
    V::List(Rc::new(Lst::new(v)))
}

fn tuple(v: Vec<V>) -> V {
    let d = (1 + v.iter().map(vdepth).max().unwrap_or(0)).min(NEST_SAT);
    V::Tuple(Rc::new(Tup { v, d }))
}

fn s(x: impl Into<String>) -> V {
    V::Str(Rc::new(x.into()))
}

fn truthy(v: &V) -> bool {
    match v {
        V::None => false,
        V::Bool(b) => *b,
        V::Int(i) => *i != 0,
        V::Float(f) => *f != 0.0,
        V::Str(x) => !x.is_empty(),
        V::List(l) => !l.borrow().is_empty(),
        V::Tuple(t) => !t.is_empty(),
        _ => true,
    }
}

fn type_name(v: &V) -> &'static str {
    match v {
        V::None => "None",
        V::Bool(_) => "bool",
        V::Int(_) => "int",
        V::Float(_) => "float",
        V::Str(_) => "str",
        V::List(_) => "list",
        V::Tuple(_) => "tuple",
        _ => "fonction",
    }
}

fn as_f64(v: &V) -> Option<f64> {
    match v {
        V::Bool(b) => Some(*b as i64 as f64),
        V::Int(i) => Some(*i as f64),
        V::Float(f) => Some(*f),
        _ => None,
    }
}

fn as_i64(v: &V) -> Option<i64> {
    match v {
        V::Bool(b) => Some(*b as i64),
        V::Int(i) => Some(*i),
        _ => None,
    }
}

fn items(v: &V) -> R<Vec<V>> {
    match v {
        V::List(l) => {
            charge(l.borrow().len())?;
            Ok(l.borrow().clone())
        }
        V::Tuple(t) => {
            charge(t.v.len())?;
            Ok(t.v.clone())
        }
        V::Str(x) => {
            charge(x.len())?;
            Ok(x.chars().map(|c| s(c.to_string())).collect())
        }
        _ => rt(format!("« {} » n'est pas itérable", type_name(v))),
    }
}

fn eq(a: &V, b: &V) -> bool {
    eq_d(a, b, 0)
}

fn eq_d(a: &V, b: &V, d: usize) -> bool {
    if d > REC_CAP {
        return false;
    }
    match (a, b) {
        (V::None, V::None) => true,
        (V::Str(x), V::Str(y)) => x == y,
        (V::List(x), V::List(y)) => {
            let (x, y) = (x.borrow(), y.borrow());
            x.len() == y.len() && x.iter().zip(y.iter()).all(|(p, q)| eq_d(p, q, d + 1))
        }
        (V::Tuple(x), V::Tuple(y)) => x.len() == y.len() && x.iter().zip(y.iter()).all(|(p, q)| eq_d(p, q, d + 1)),
        _ => match (as_i64(a), as_i64(b)) {
            (Some(x), Some(y)) => x == y,
            _ => match (as_f64(a), as_f64(b)) {
                (Some(x), Some(y)) => x == y,
                _ => false,
            },
        },
    }
}

fn cmp(a: &V, b: &V) -> R<std::cmp::Ordering> {
    cmp_d(a, b, 0)
}

fn cmp_d(a: &V, b: &V, d: usize) -> R<std::cmp::Ordering> {
    use std::cmp::Ordering::*;
    if d > REC_CAP {
        return rt("structure trop imbriquée");
    }
    match (a, b) {
        (V::Str(x), V::Str(y)) => Ok(x.cmp(y)),
        (V::List(_), V::List(_)) | (V::Tuple(_), V::Tuple(_)) => {
            let (x, y) = (items(a)?, items(b)?);
            for (p, q) in x.iter().zip(y.iter()) {
                let c = cmp_d(p, q, d + 1)?;
                if c != Equal {
                    return Ok(c);
                }
            }
            Ok(x.len().cmp(&y.len()))
        }
        _ => {
            if let (Some(x), Some(y)) = (as_i64(a), as_i64(b)) {
                return Ok(x.cmp(&y));
            }
            match (as_f64(a), as_f64(b)) {
                (Some(x), Some(y)) => x.partial_cmp(&y).ok_or(()).or_else(|_| rt("comparaison impossible")),
                _ => rt(format!("impossible de comparer « {} » et « {} »", type_name(a), type_name(b))),
            }
        }
    }
}

fn repr(v: &V) -> String {
    repr_d(v, 0)
}

fn repr_d(v: &V, d: usize) -> String {
    if d > REC_CAP {
        return "…".into();
    }
    match v {
        V::None => "None".into(),
        V::Bool(b) => (if *b { "True" } else { "False" }).into(),
        V::Int(i) => i.to_string(),
        V::Float(f) => {
            if f.fract() == 0.0 && f.abs() < 1e15 {
                format!("{f:.1}")
            } else {
                f.to_string()
            }
        }
        V::Str(x) => format!("'{x}'"),
        V::List(l) => format!("[{}]", l.borrow().iter().map(|x| repr_d(x, d + 1)).collect::<Vec<_>>().join(", ")),
        V::Tuple(t) => {
            if t.len() == 1 {
                format!("({},)", repr_d(&t[0], d + 1))
            } else {
                format!("({})", t.iter().map(|x| repr_d(x, d + 1)).collect::<Vec<_>>().join(", "))
            }
        }
        V::Func(f) => format!("<fonction {}>", f.name),
        V::Builtin(n) => format!("<fonction {n}>"),
    }
}

fn text(v: &V) -> String {
    match v {
        V::Str(x) => x.to_string(),
        _ => repr(v),
    }
}

// ---------------------------------------------------------------- analyse lexicale

#[derive(Debug, Clone, PartialEq)]
enum Tok {
    Name(String),
    Int(i64),
    Float(f64),
    Str(String),
    Op(&'static str),
    Newline,
    Indent,
    Dedent,
    Eof,
}

const OPS3: [&str; 3] = ["**=", "//=", "..."];
const OPS2: [&str; 11] = ["==", "!=", "<=", ">=", "//", "**", "+=", "-=", "*=", "%=", "/="];
const OPS1: [&str; 18] = ["+", "-", "*", "/", "%", "<", ">", "=", "(", ")", "[", "]", ",", ":", ".", ";", "{", "}"];

fn lex(src: &str) -> R<Vec<(Tok, usize)>> {
    let c: Vec<char> = src.chars().collect();
    let n = c.len();
    let mut out: Vec<(Tok, usize)> = Vec::new();
    let mut i = 0;
    let mut line = 1;
    let mut paren = 0i32;
    let mut at_start = true;
    let mut indents = vec![0usize];
    let syn = |l: usize, m: &str| Err(PyErr::Syntax(l, m.to_string()));
    while i < n {
        if at_start && paren == 0 {
            let mut col = 0;
            let mut j = i;
            while j < n && (c[j] == ' ' || c[j] == '\t') {
                col += if c[j] == '\t' { 4 } else { 1 };
                j += 1;
            }
            if j >= n {
                break;
            }
            if c[j] == '\n' || c[j] == '\r' || c[j] == '#' {
                // ligne vide ou de commentaire : ignorée
                while j < n && c[j] != '\n' {
                    j += 1;
                }
                i = j + 1;
                line += 1;
                continue;
            }
            let top = *indents.last().unwrap();
            if col > top {
                indents.push(col);
                out.push((Tok::Indent, line));
            } else {
                while col < *indents.last().unwrap() {
                    indents.pop();
                    out.push((Tok::Dedent, line));
                }
                if col != *indents.last().unwrap() {
                    return syn(line, "indentation incohérente");
                }
            }
            i = j;
            at_start = false;
        }
        let ch = c[i];
        match ch {
            ' ' | '\t' | '\r' => i += 1,
            '#' => {
                while i < n && c[i] != '\n' {
                    i += 1;
                }
            }
            '\n' => {
                i += 1;
                line += 1;
                if paren == 0 {
                    if !matches!(out.last(), Some((Tok::Newline, _)) | None) {
                        out.push((Tok::Newline, line - 1));
                    }
                    at_start = true;
                }
            }
            '\\' if i + 1 < n && c[i + 1] == '\n' => {
                i += 2;
                line += 1;
            }
            '0'..='9' => {
                let st = i;
                while i < n && c[i].is_ascii_digit() {
                    i += 1;
                }
                let mut is_f = false;
                if i < n && c[i] == '.' && i + 1 < n && c[i + 1].is_ascii_digit() {
                    is_f = true;
                    i += 1;
                    while i < n && c[i].is_ascii_digit() {
                        i += 1;
                    }
                }
                if i < n && (c[i] == 'e' || c[i] == 'E') {
                    let mut k = i + 1;
                    if k < n && (c[k] == '+' || c[k] == '-') {
                        k += 1;
                    }
                    if k < n && c[k].is_ascii_digit() {
                        is_f = true;
                        i = k;
                        while i < n && c[i].is_ascii_digit() {
                            i += 1;
                        }
                    }
                }
                let t: String = c[st..i].iter().collect();
                if is_f {
                    out.push((Tok::Float(t.parse().map_err(|_| PyErr::Syntax(line, "nombre invalide".into()))?), line));
                } else {
                    match t.parse::<i64>() {
                        Ok(v) => out.push((Tok::Int(v), line)),
                        Err(_) => return syn(line, "entier trop grand"),
                    }
                }
            }
            _ if ch.is_alphabetic() || ch == '_' => {
                let st = i;
                while i < n && (c[i].is_alphanumeric() || c[i] == '_') {
                    i += 1;
                }
                out.push((Tok::Name(c[st..i].iter().collect()), line));
            }
            '"' | '\'' => {
                let q = ch;
                let triple = i + 2 < n && c[i + 1] == q && c[i + 2] == q;
                i += if triple { 3 } else { 1 };
                let mut sbuf = String::new();
                let start_line = line;
                loop {
                    if i >= n {
                        return syn(start_line, "chaîne non terminée");
                    }
                    if triple {
                        if c[i] == q && i + 2 < n && c[i + 1] == q && c[i + 2] == q {
                            i += 3;
                            break;
                        }
                    } else if c[i] == q {
                        i += 1;
                        break;
                    } else if c[i] == '\n' {
                        return syn(start_line, "chaîne non terminée");
                    }
                    if c[i] == '\n' {
                        line += 1;
                    }
                    if c[i] == '\\' && i + 1 < n {
                        i += 1;
                        sbuf.push(match c[i] {
                            'n' => '\n',
                            't' => '\t',
                            '\\' => '\\',
                            '\'' => '\'',
                            '"' => '"',
                            o => o,
                        });
                        i += 1;
                    } else {
                        sbuf.push(c[i]);
                        i += 1;
                    }
                    if sbuf.len() > MAX_STR {
                        return syn(start_line, "chaîne trop longue");
                    }
                }
                out.push((Tok::Str(sbuf), start_line));
            }
            _ => {
                let rest: String = c[i..(i + 3).min(n)].iter().collect();
                let mut found: Option<&'static str> = None;
                for o in OPS3 {
                    if rest.starts_with(o) {
                        found = Some(o);
                    }
                }
                if found.is_none() {
                    for o in OPS2 {
                        if rest.starts_with(o) {
                            found = Some(o);
                        }
                    }
                }
                if found.is_none() {
                    for o in OPS1 {
                        if rest.starts_with(o) {
                            found = Some(o);
                        }
                    }
                }
                let Some(o) = found else {
                    return syn(line, &format!("caractère inattendu « {ch} »"));
                };
                match o {
                    "(" | "[" | "{" => paren += 1,
                    ")" | "]" | "}" => paren -= 1,
                    _ => {}
                }
                i += o.chars().count();
                out.push((Tok::Op(o), line));
            }
        }
    }
    if !matches!(out.last(), Some((Tok::Newline, _)) | None) {
        out.push((Tok::Newline, line));
    }
    while indents.len() > 1 {
        indents.pop();
        out.push((Tok::Dedent, line));
    }
    out.push((Tok::Eof, line));
    Ok(out)
}

// ---------------------------------------------------------------- arbre

#[derive(Debug)]
enum Expr {
    Lit(Lit),
    Name(String),
    List(Vec<Expr>),
    Tuple(Vec<Expr>),
    Bin(Box<Expr>, &'static str, Box<Expr>),
    Neg(Box<Expr>),
    Not(Box<Expr>),
    And(Box<Expr>, Box<Expr>),
    Or(Box<Expr>, Box<Expr>),
    Cmp(Box<Expr>, Vec<(&'static str, Expr)>),
    Index(Box<Expr>, Box<Expr>),
    Slice(Box<Expr>, Option<Box<Expr>>, Option<Box<Expr>>, Option<Box<Expr>>),
    Call(Box<Expr>, Vec<Expr>),
    Attr(Box<Expr>, String),
    IfExp(Box<Expr>, Box<Expr>, Box<Expr>),
    Comp(Box<Expr>, Vec<Clause>),
}

#[derive(Debug)]
enum Lit {
    None,
    Bool(bool),
    Int(i64),
    Float(f64),
    Str(String),
}

#[derive(Debug)]
struct Clause {
    target: Target,
    iter: Expr,
    conds: Vec<Expr>,
}

#[derive(Debug)]
enum Target {
    Name(String),
    Index(Expr, Expr),
    Tuple(Vec<Target>),
}

#[derive(Debug)]
enum Stmt {
    Expr(Expr),
    Assign(Vec<Target>, Expr),
    Aug(Target, &'static str, Expr),
    If(Vec<(Expr, Vec<Stmt>)>, Vec<Stmt>),
    While(Expr, Vec<Stmt>),
    For(Target, Expr, Vec<Stmt>),
    Def(Rc<FuncDef>),
    Return(Option<Expr>),
    Break,
    Continue,
    Pass,
}

#[derive(Debug)]
pub struct FuncDef {
    name: String,
    params: Vec<(String, Option<Lit>)>,
    body: Vec<Stmt>,
}

const KEYWORDS: [&str; 28] = [
    "def", "return", "if", "elif", "else", "while", "for", "in", "not", "and", "or", "break", "continue", "pass", "True",
    "False", "None", "is", "import", "from", "lambda", "class", "try", "except", "with", "global", "del", "yield",
];

struct Parser {
    t: Vec<(Tok, usize)>,
    p: usize,
    nest: usize,
}

impl Parser {
    fn peek(&self) -> &Tok {
        &self.t[self.p].0
    }
    fn line(&self) -> usize {
        self.t[self.p].1
    }
    fn next(&mut self) -> Tok {
        let t = self.t[self.p].0.clone();
        if self.p + 1 < self.t.len() {
            self.p += 1;
        }
        t
    }
    fn err<T>(&self, m: impl Into<String>) -> R<T> {
        Err(PyErr::Syntax(self.line(), m.into()))
    }
    fn is_op(&self, o: &str) -> bool {
        matches!(self.peek(), Tok::Op(x) if *x == o)
    }
    fn is_kw(&self, k: &str) -> bool {
        matches!(self.peek(), Tok::Name(x) if x == k)
    }
    fn eat_op(&mut self, o: &str) -> bool {
        if self.is_op(o) {
            self.next();
            true
        } else {
            false
        }
    }
    fn eat_kw(&mut self, k: &str) -> bool {
        if self.is_kw(k) {
            self.next();
            true
        } else {
            false
        }
    }
    fn expect_op(&mut self, o: &str) -> R<()> {
        if self.eat_op(o) {
            Ok(())
        } else {
            self.err(format!("« {o} » attendu"))
        }
    }

    fn program(&mut self) -> R<Vec<Stmt>> {
        let mut v = Vec::new();
        while *self.peek() != Tok::Eof {
            if *self.peek() == Tok::Newline {
                self.next();
                continue;
            }
            if *self.peek() == Tok::Indent {
                return self.err("indentation inattendue");
            }
            v.push(self.stmt()?);
        }
        Ok(v)
    }

    fn block(&mut self) -> R<Vec<Stmt>> {
        self.expect_op(":")?;
        if *self.peek() != Tok::Newline {
            // instruction sur la même ligne : `if x: return 1`
            let st = self.simple()?;
            while self.eat_op(";") {
                if *self.peek() == Tok::Newline {
                    break;
                }
            }
            if *self.peek() == Tok::Newline {
                self.next();
            }
            return Ok(vec![st]);
        }
        self.next();
        if *self.peek() != Tok::Indent {
            return self.err("bloc indenté attendu");
        }
        self.next();
        let mut v = Vec::new();
        while *self.peek() != Tok::Dedent && *self.peek() != Tok::Eof {
            if *self.peek() == Tok::Newline {
                self.next();
                continue;
            }
            v.push(self.stmt()?);
        }
        if *self.peek() == Tok::Dedent {
            self.next();
        }
        Ok(v)
    }

    fn stmt(&mut self) -> R<Stmt> {
        self.nest += 1;
        if self.nest > MAX_NEST {
            return self.err("blocs trop imbriqués");
        }
        let r = self.stmt_inner();
        self.nest -= 1;
        r
    }

    fn stmt_inner(&mut self) -> R<Stmt> {
        if self.eat_kw("if") {
            let mut arms = Vec::new();
            let c = self.expr()?;
            arms.push((c, self.block()?));
            let mut other = Vec::new();
            loop {
                if self.eat_kw("elif") {
                    let c = self.expr()?;
                    arms.push((c, self.block()?));
                } else if self.eat_kw("else") {
                    other = self.block()?;
                    break;
                } else {
                    break;
                }
            }
            return Ok(Stmt::If(arms, other));
        }
        if self.eat_kw("while") {
            let c = self.expr()?;
            return Ok(Stmt::While(c, self.block()?));
        }
        if self.eat_kw("for") {
            let t = self.target_list()?;
            if !self.eat_kw("in") {
                return self.err("« in » attendu");
            }
            let it = self.testlist()?;
            return Ok(Stmt::For(t, it, self.block()?));
        }
        if self.eat_kw("def") {
            let Tok::Name(name) = self.next() else { return self.err("nom de fonction attendu") };
            self.expect_op("(")?;
            let mut params = Vec::new();
            while !self.is_op(")") {
                let Tok::Name(p) = self.next() else { return self.err("nom de paramètre attendu") };
                let mut d = None;
                if self.eat_op("=") {
                    d = Some(match self.next() {
                        Tok::Int(i) => Lit::Int(i),
                        Tok::Float(f) => Lit::Float(f),
                        Tok::Str(x) => Lit::Str(x),
                        Tok::Name(n) if n == "None" => Lit::None,
                        Tok::Name(n) if n == "True" => Lit::Bool(true),
                        Tok::Name(n) if n == "False" => Lit::Bool(false),
                        _ => return self.err("valeur par défaut : une constante est attendue"),
                    });
                }
                params.push((p, d));
                if !self.eat_op(",") {
                    break;
                }
            }
            self.expect_op(")")?;
            let body = self.block()?;
            return Ok(Stmt::Def(Rc::new(FuncDef { name, params, body })));
        }
        for k in ["import", "from", "class", "try", "with", "lambda", "global", "del", "yield"] {
            if self.is_kw(k) {
                return self.err(format!("« {k} » n'est pas disponible ici"));
            }
        }
        let st = self.simple()?;
        while self.eat_op(";") {
            if *self.peek() == Tok::Newline {
                break;
            }
        }
        match self.peek() {
            Tok::Newline => {
                self.next();
            }
            Tok::Eof | Tok::Dedent => {}
            _ => return self.err("fin de ligne attendue"),
        }
        Ok(st)
    }

    fn simple(&mut self) -> R<Stmt> {
        if self.eat_kw("return") {
            if matches!(self.peek(), Tok::Newline | Tok::Eof | Tok::Dedent) || self.is_op(";") {
                return Ok(Stmt::Return(None));
            }
            return Ok(Stmt::Return(Some(self.testlist()?)));
        }
        if self.eat_kw("break") {
            return Ok(Stmt::Break);
        }
        if self.eat_kw("continue") {
            return Ok(Stmt::Continue);
        }
        if self.eat_kw("pass") {
            return Ok(Stmt::Pass);
        }
        let first = self.testlist()?;
        for op in ["+=", "-=", "*=", "/=", "//=", "%=", "**="] {
            if self.eat_op(op) {
                let t = self.to_target(first)?;
                let v = self.testlist()?;
                return Ok(Stmt::Aug(t, &op[..op.len() - 1], v));
            }
        }
        if self.is_op("=") {
            let mut targets = vec![self.to_target(first)?];
            let mut value;
            loop {
                self.next(); // '='
                value = self.testlist()?;
                if self.is_op("=") {
                    targets.push(self.to_target(value)?);
                } else {
                    break;
                }
            }
            return Ok(Stmt::Assign(targets, value));
        }
        Ok(Stmt::Expr(first))
    }

    fn to_target(&self, e: Expr) -> R<Target> {
        match e {
            Expr::Name(n) => Ok(Target::Name(n)),
            Expr::Index(a, b) => Ok(Target::Index(*a, *b)),
            Expr::Tuple(v) | Expr::List(v) => Ok(Target::Tuple(v.into_iter().map(|x| self.to_target(x)).collect::<R<Vec<_>>>()?)),
            _ => self.err("affectation impossible à cet endroit"),
        }
    }

    fn target_list(&mut self) -> R<Target> {
        let mut v = vec![self.target_atom()?];
        let mut tuple = false;
        while self.eat_op(",") {
            tuple = true;
            if self.is_kw("in") {
                break;
            }
            v.push(self.target_atom()?);
        }
        Ok(if tuple { Target::Tuple(v) } else { v.pop().unwrap() })
    }

    fn target_atom(&mut self) -> R<Target> {
        if self.eat_op("(") {
            let t = self.target_list()?;
            self.expect_op(")")?;
            return Ok(match t {
                Target::Tuple(v) => Target::Tuple(v),
                other => Target::Tuple(vec![other]),
            });
        }
        let e = self.postfix()?;
        self.to_target(e)
    }

    // expr (liste de valeurs : tuple implicite)
    fn testlist(&mut self) -> R<Expr> {
        let first = self.expr()?;
        if !self.is_op(",") {
            return Ok(first);
        }
        let mut v = vec![first];
        while self.eat_op(",") {
            if matches!(self.peek(), Tok::Newline | Tok::Eof | Tok::Dedent) || self.is_op("=") || self.is_op(")") || self.is_op(":") {
                break;
            }
            v.push(self.expr()?);
        }
        Ok(Expr::Tuple(v))
    }

    fn expr(&mut self) -> R<Expr> {
        self.nest += 1;
        if self.nest > MAX_NEST * 2 {
            return self.err("expression trop imbriquée");
        }
        let r = self.ifexp();
        self.nest -= 1;
        r
    }

    fn ifexp(&mut self) -> R<Expr> {
        let a = self.or_expr()?;
        if self.eat_kw("if") {
            let c = self.or_expr()?;
            if !self.eat_kw("else") {
                return self.err("« else » attendu");
            }
            let b = self.expr()?;
            return Ok(Expr::IfExp(Box::new(c), Box::new(a), Box::new(b)));
        }
        Ok(a)
    }

    fn or_expr(&mut self) -> R<Expr> {
        let mut a = self.and_expr()?;
        while self.eat_kw("or") {
            a = Expr::Or(Box::new(a), Box::new(self.and_expr()?));
        }
        Ok(a)
    }

    fn and_expr(&mut self) -> R<Expr> {
        let mut a = self.not_expr()?;
        while self.eat_kw("and") {
            a = Expr::And(Box::new(a), Box::new(self.not_expr()?));
        }
        Ok(a)
    }

    fn not_expr(&mut self) -> R<Expr> {
        if self.eat_kw("not") {
            return Ok(Expr::Not(Box::new(self.not_expr()?)));
        }
        self.comparison()
    }

    fn comparison(&mut self) -> R<Expr> {
        let a = self.arith()?;
        let mut rest = Vec::new();
        loop {
            let op: &'static str = if self.eat_op("==") {
                "=="
            } else if self.eat_op("!=") {
                "!="
            } else if self.eat_op("<=") {
                "<="
            } else if self.eat_op(">=") {
                ">="
            } else if self.eat_op("<") {
                "<"
            } else if self.eat_op(">") {
                ">"
            } else if self.eat_kw("in") {
                "in"
            } else if self.is_kw("not") && matches!(self.t.get(self.p + 1), Some((Tok::Name(n), _)) if n == "in") {
                self.next();
                self.next();
                "not in"
            } else if self.eat_kw("is") {
                if self.eat_kw("not") {
                    "is not"
                } else {
                    "is"
                }
            } else {
                break;
            };
            rest.push((op, self.arith()?));
        }
        Ok(if rest.is_empty() { a } else { Expr::Cmp(Box::new(a), rest) })
    }

    fn arith(&mut self) -> R<Expr> {
        let mut a = self.term()?;
        loop {
            let op: &'static str = if self.eat_op("+") {
                "+"
            } else if self.eat_op("-") {
                "-"
            } else {
                break;
            };
            a = Expr::Bin(Box::new(a), op, Box::new(self.term()?));
        }
        Ok(a)
    }

    fn term(&mut self) -> R<Expr> {
        let mut a = self.unary()?;
        loop {
            let op: &'static str = if self.eat_op("*") {
                "*"
            } else if self.eat_op("//") {
                "//"
            } else if self.eat_op("/") {
                "/"
            } else if self.eat_op("%") {
                "%"
            } else {
                break;
            };
            a = Expr::Bin(Box::new(a), op, Box::new(self.unary()?));
        }
        Ok(a)
    }

    fn unary(&mut self) -> R<Expr> {
        if self.eat_op("-") {
            return Ok(Expr::Neg(Box::new(self.unary()?)));
        }
        if self.eat_op("+") {
            return self.unary();
        }
        self.power()
    }

    fn power(&mut self) -> R<Expr> {
        let a = self.postfix()?;
        if self.eat_op("**") {
            let b = self.unary()?; // associatif à droite, - autorisé dans l'exposant
            return Ok(Expr::Bin(Box::new(a), "**", Box::new(b)));
        }
        Ok(a)
    }

    fn postfix(&mut self) -> R<Expr> {
        let mut a = self.atom()?;
        loop {
            if self.eat_op("(") {
                let mut args = Vec::new();
                while !self.is_op(")") {
                    args.push(self.expr()?);
                    if !self.eat_op(",") {
                        break;
                    }
                }
                self.expect_op(")")?;
                a = Expr::Call(Box::new(a), args);
            } else if self.eat_op("[") {
                let lo = if self.is_op(":") { None } else { Some(Box::new(self.expr()?)) };
                if self.eat_op(":") {
                    let hi = if self.is_op("]") || self.is_op(":") { None } else { Some(Box::new(self.expr()?)) };
                    let step = if self.eat_op(":") && !self.is_op("]") { Some(Box::new(self.expr()?)) } else { None };
                    self.expect_op("]")?;
                    a = Expr::Slice(Box::new(a), lo, hi, step);
                } else {
                    self.expect_op("]")?;
                    a = Expr::Index(Box::new(a), lo.ok_or(()).or_else(|_| self.err("indice attendu"))?);
                }
            } else if self.eat_op(".") {
                let Tok::Name(n) = self.next() else { return self.err("nom attendu après « . »") };
                a = Expr::Attr(Box::new(a), n);
            } else {
                break;
            }
        }
        Ok(a)
    }

    fn atom(&mut self) -> R<Expr> {
        let line = self.line();
        match self.next() {
            Tok::Int(i) => Ok(Expr::Lit(Lit::Int(i))),
            Tok::Float(f) => Ok(Expr::Lit(Lit::Float(f))),
            Tok::Str(x) => {
                let mut x = x;
                while let Tok::Str(more) = self.peek().clone() {
                    self.next();
                    x.push_str(&more);
                }
                Ok(Expr::Lit(Lit::Str(x)))
            }
            Tok::Name(n) => match n.as_str() {
                "True" => Ok(Expr::Lit(Lit::Bool(true))),
                "False" => Ok(Expr::Lit(Lit::Bool(false))),
                "None" => Ok(Expr::Lit(Lit::None)),
                k if KEYWORDS.contains(&k) => Err(PyErr::Syntax(line, format!("« {k} » inattendu"))),
                _ => Ok(Expr::Name(n)),
            },
            Tok::Op("(") => {
                if self.eat_op(")") {
                    return Ok(Expr::Tuple(vec![]));
                }
                let first = self.expr()?;
                if self.is_kw("for") {
                    let cl = self.clauses()?;
                    self.expect_op(")")?;
                    return Ok(Expr::Comp(Box::new(first), cl));
                }
                if self.eat_op(",") {
                    let mut v = vec![first];
                    while !self.is_op(")") {
                        v.push(self.expr()?);
                        if !self.eat_op(",") {
                            break;
                        }
                    }
                    self.expect_op(")")?;
                    return Ok(Expr::Tuple(v));
                }
                self.expect_op(")")?;
                Ok(first)
            }
            Tok::Op("[") => {
                if self.eat_op("]") {
                    return Ok(Expr::List(vec![]));
                }
                let first = self.expr()?;
                if self.is_kw("for") {
                    let cl = self.clauses()?;
                    self.expect_op("]")?;
                    return Ok(Expr::Comp(Box::new(first), cl));
                }
                let mut v = vec![first];
                while self.eat_op(",") {
                    if self.is_op("]") {
                        break;
                    }
                    v.push(self.expr()?);
                }
                self.expect_op("]")?;
                Ok(Expr::List(v))
            }
            Tok::Op("{") => Err(PyErr::Syntax(line, "les dictionnaires et ensembles ne sont pas disponibles ici".into())),
            t => Err(PyErr::Syntax(line, format!("expression attendue, trouvé {}", describe(&t)))),
        }
    }

    fn clauses(&mut self) -> R<Vec<Clause>> {
        let mut out = Vec::new();
        while self.eat_kw("for") {
            let target = self.target_list()?;
            if !self.eat_kw("in") {
                return self.err("« in » attendu");
            }
            let iter = self.or_expr()?;
            let mut conds = Vec::new();
            while self.eat_kw("if") {
                conds.push(self.or_expr()?);
            }
            out.push(Clause { target, iter, conds });
        }
        Ok(out)
    }
}

fn describe(t: &Tok) -> String {
    match t {
        Tok::Newline => "la fin de la ligne".into(),
        Tok::Indent => "une indentation".into(),
        Tok::Dedent => "un retour d'indentation".into(),
        Tok::Eof => "la fin du code".into(),
        Tok::Op(o) => format!("« {o} »"),
        Tok::Name(n) => format!("« {n} »"),
        _ => "autre chose".into(),
    }
}

// ---------------------------------------------------------------- exécution

struct Frame {
    vars: HashMap<String, V>,
    global: bool,
}

enum Flow {
    Next,
    Break,
    Continue,
    Return(V),
}

pub struct Vm {
    globals: HashMap<String, V>,
    steps: u64,
    depth: usize,
    pub output: String,
}

fn lit(l: &Lit) -> V {
    match l {
        Lit::None => V::None,
        Lit::Bool(b) => V::Bool(*b),
        Lit::Int(i) => V::Int(*i),
        Lit::Float(f) => V::Float(*f),
        Lit::Str(x) => s(x.clone()),
    }
}

const BUILTINS: [&str; 24] = [
    "range", "len", "abs", "min", "max", "sum", "int", "float", "str", "bool", "sorted", "list", "print", "pow", "divmod", "round",
    "any", "all", "enumerate", "zip", "reversed", "tuple", "chr", "ord",
];

fn floordiv(a: i64, b: i64) -> R<i64> {
    if b == 0 {
        return rt("division par zéro");
    }
    let q = a.checked_div(b).ok_or(()).or_else(|_| rt("entier trop grand"))?;
    Ok(if a % b != 0 && ((a < 0) != (b < 0)) { q - 1 } else { q })
}

fn modulo(a: i64, b: i64) -> R<i64> {
    if b == 0 {
        return rt("modulo par zéro");
    }
    let r = a.checked_rem(b).unwrap_or(0);
    Ok(if r != 0 && ((r < 0) != (b < 0)) { r + b } else { r })
}

fn binop(op: &str, a: &V, b: &V) -> R<V> {
    // chaînes et listes
    match (op, a, b) {
        ("+", V::Str(x), V::Str(y)) => {
            if x.len() + y.len() > MAX_STR {
                return rt("chaîne trop longue");
            }
            charge((x.len() + y.len()) / 16)?;
            return Ok(s(format!("{x}{y}")));
        }
        ("+", V::List(x), V::List(y)) => {
            if x.borrow().len() + y.borrow().len() > MAX_LIST {
                return rt("liste trop longue");
            }
            charge(x.borrow().len() + y.borrow().len())?;
            let mut v = x.borrow().clone();
            v.extend(y.borrow().iter().cloned());
            return Ok(list(v));
        }
        ("+", V::Tuple(x), V::Tuple(y)) => {
            let mut v = x.v.clone();
            v.extend(y.iter().cloned());
            return Ok(tuple(v));
        }
        ("*", V::Str(x), n) | ("*", n, V::Str(x)) if as_i64(n).is_some() => {
            let k = as_i64(n).unwrap().max(0) as usize;
            if x.is_empty() || k == 0 {
                return Ok(s(""));
            }
            if x.len().saturating_mul(k) > MAX_STR {
                return rt("chaîne trop longue");
            }
            charge(x.len().saturating_mul(k) / 16)?;
            return Ok(s(x.repeat(k)));
        }
        ("*", V::List(x), n) | ("*", n, V::List(x)) if as_i64(n).is_some() => {
            let k = as_i64(n).unwrap().max(0) as usize;
            if x.borrow().is_empty() || k == 0 {
                return Ok(list(vec![]));
            }
            if x.borrow().len().saturating_mul(k) > MAX_LIST {
                return rt("liste trop longue");
            }
            charge(x.borrow().len().saturating_mul(k))?;
            let mut v = Vec::new();
            for _ in 0..k {
                v.extend(x.borrow().iter().cloned());
            }
            return Ok(list(v));
        }
        ("%", V::Str(_), _) => return rt("le formatage « % » n'est pas disponible ici"),
        _ => {}
    }
    if let (Some(x), Some(y)) = (as_i64(a), as_i64(b)) {
        let ovf = || rt::<V>("entier trop grand");
        return match op {
            "+" => x.checked_add(y).map(V::Int).ok_or(()).or_else(|_| ovf()),
            "-" => x.checked_sub(y).map(V::Int).ok_or(()).or_else(|_| ovf()),
            "*" => x.checked_mul(y).map(V::Int).ok_or(()).or_else(|_| ovf()),
            "//" => Ok(V::Int(floordiv(x, y)?)),
            "%" => Ok(V::Int(modulo(x, y)?)),
            "/" => {
                if y == 0 {
                    rt("division par zéro")
                } else {
                    Ok(V::Float(x as f64 / y as f64))
                }
            }
            "**" => {
                if y >= 0 {
                    let e = u32::try_from(y).map_err(|_| PyErr::Runtime("exposant trop grand".into()))?;
                    x.checked_pow(e).map(V::Int).ok_or(()).or_else(|_| ovf())
                } else if x == 0 {
                    rt("division par zéro")
                } else {
                    Ok(V::Float((x as f64).powf(y as f64)))
                }
            }
            _ => rt("opération inconnue"),
        };
    }
    if let (Some(x), Some(y)) = (as_f64(a), as_f64(b)) {
        return match op {
            "+" => Ok(V::Float(x + y)),
            "-" => Ok(V::Float(x - y)),
            "*" => Ok(V::Float(x * y)),
            "/" => {
                if y == 0.0 {
                    rt("division par zéro")
                } else {
                    Ok(V::Float(x / y))
                }
            }
            "//" => {
                if y == 0.0 {
                    rt("division par zéro")
                } else {
                    Ok(V::Float((x / y).floor()))
                }
            }
            "%" => {
                if y == 0.0 {
                    rt("modulo par zéro")
                } else {
                    Ok(V::Float(x - y * (x / y).floor()))
                }
            }
            "**" => Ok(V::Float(x.powf(y))),
            _ => rt("opération inconnue"),
        };
    }
    rt(format!("opération « {op} » impossible entre « {} » et « {} »", type_name(a), type_name(b)))
}

fn norm_index(i: i64, len: usize) -> R<usize> {
    let j = if i < 0 { i + len as i64 } else { i };
    if j < 0 || j as usize >= len {
        rt("indice hors limites")
    } else {
        Ok(j as usize)
    }
}

fn slice_bounds(len: usize, lo: Option<i64>, hi: Option<i64>, step: i64) -> Vec<usize> {
    let n = len as i64;
    let clamp = |v: i64, lo_b: i64, hi_b: i64| v.max(lo_b).min(hi_b);
    let fix = |v: i64| if v < 0 { v + n } else { v };
    let mut out = Vec::new();
    if step > 0 {
        let a = clamp(lo.map(fix).unwrap_or(0), 0, n);
        let b = clamp(hi.map(fix).unwrap_or(n), 0, n);
        let mut i = a;
        while i < b {
            out.push(i as usize);
            i = match i.checked_add(step) {
                Some(v) => v,
                None => break,
            };
        }
    } else {
        let a = clamp(lo.map(fix).unwrap_or(n - 1), -1, n - 1);
        let b = clamp(hi.map(fix).unwrap_or(-1), -1, n - 1);
        let mut i = a;
        while i > b {
            out.push(i as usize);
            i = match i.checked_add(step) {
                Some(v) => v,
                None => break,
            };
        }
    }
    out
}

impl Vm {
    pub fn new() -> Self {
        WORK.with(|w| w.set(0));
        Vm { globals: HashMap::new(), steps: 0, depth: 0, output: String::new() }
    }

    fn tick(&mut self) -> R<()> {
        self.steps += 1;
        charge(1)
    }

    fn get(&self, f: &Frame, n: &str) -> R<V> {
        if !f.global {
            if let Some(v) = f.vars.get(n) {
                return Ok(v.clone());
            }
        }
        if let Some(v) = self.globals.get(n) {
            return Ok(v.clone());
        }
        if BUILTINS.contains(&n) {
            return Ok(V::Builtin(n.to_string()));
        }
        rt(format!("le nom « {n} » n'est pas défini"))
    }

    fn set(&mut self, f: &mut Frame, n: &str, v: V) {
        if f.global {
            self.globals.insert(n.to_string(), v);
        } else {
            f.vars.insert(n.to_string(), v);
        }
    }

    fn assign(&mut self, t: &Target, v: V, f: &mut Frame) -> R<()> {
        match t {
            Target::Name(n) => {
                check_depth(&v)?;
                self.set(f, n, v);
                Ok(())
            }
            Target::Index(obj, idx) => {
                let o = self.eval(obj, f)?;
                let i = self.eval(idx, f)?;
                match o {
                    V::List(l) => {
                        let k = as_i64(&i).ok_or(()).or_else(|_| rt("l'indice doit être un entier"))?;
                        let len = l.borrow().len();
                        let j = norm_index(k, len)?;
                        guard_insert(&l, &v)?;
                        l.borrow_mut()[j] = v;
                        Ok(())
                    }
                    _ => rt("seules les listes peuvent être modifiées par indice"),
                }
            }
            Target::Tuple(ts) => {
                let vals = items(&v)?;
                if vals.len() != ts.len() {
                    return rt(format!("{} valeur(s) à répartir sur {} nom(s)", vals.len(), ts.len()));
                }
                for (t, x) in ts.iter().zip(vals) {
                    self.assign(t, x, f)?;
                }
                Ok(())
            }
        }
    }

    fn exec_block(&mut self, b: &[Stmt], f: &mut Frame) -> R<Flow> {
        for st in b {
            match self.exec(st, f)? {
                Flow::Next => {}
                other => return Ok(other),
            }
        }
        Ok(Flow::Next)
    }

    fn exec(&mut self, st: &Stmt, f: &mut Frame) -> R<Flow> {
        self.tick()?;
        match st {
            Stmt::Expr(e) => {
                self.eval(e, f)?;
            }
            Stmt::Assign(targets, e) => {
                let v = self.eval(e, f)?;
                for t in targets {
                    self.assign(t, v.clone(), f)?;
                }
            }
            Stmt::Aug(t, op, e) => {
                let cur = match t {
                    Target::Name(n) => self.get(f, n)?,
                    Target::Index(o, i) => {
                        let obj = self.eval(o, f)?;
                        let idx = self.eval(i, f)?;
                        self.index(&obj, &idx)?
                    }
                    Target::Tuple(_) => return rt("opération augmentée impossible sur plusieurs noms"),
                };
                let rhs = self.eval(e, f)?;
                // `l += [x]` modifie la liste en place, comme en Python
                let nv = if let (V::List(a), "+", V::List(b)) = (&cur, *op, &rhs) {
                    if a.borrow().len() + b.borrow().len() > MAX_LIST {
                        return rt("liste trop longue");
                    }
                    let extra = b.borrow().clone();
                    for x in &extra {
                        guard_insert(a, x)?;
                    }
                    a.borrow_mut().extend(extra);
                    cur.clone()
                } else {
                    binop(op, &cur, &rhs)?
                };
                self.assign(t, nv, f)?;
            }
            Stmt::If(arms, other) => {
                for (c, body) in arms {
                    if truthy(&self.eval(c, f)?) {
                        return self.exec_block(body, f);
                    }
                }
                return self.exec_block(other, f);
            }
            Stmt::While(c, body) => {
                while truthy(&self.eval(c, f)?) {
                    self.tick()?;
                    match self.exec_block(body, f)? {
                        Flow::Break => break,
                        Flow::Return(v) => return Ok(Flow::Return(v)),
                        _ => {}
                    }
                }
            }
            Stmt::For(t, it, body) => {
                let seq = items(&self.eval(it, f)?)?;
                for x in seq {
                    self.tick()?;
                    self.assign(t, x, f)?;
                    match self.exec_block(body, f)? {
                        Flow::Break => break,
                        Flow::Return(v) => return Ok(Flow::Return(v)),
                        _ => {}
                    }
                }
            }
            Stmt::Def(d) => {
                self.set(f, &d.name, V::Func(d.clone()));
            }
            Stmt::Return(e) => {
                let v = match e {
                    Some(e) => self.eval(e, f)?,
                    None => V::None,
                };
                return Ok(Flow::Return(v));
            }
            Stmt::Break => return Ok(Flow::Break),
            Stmt::Continue => return Ok(Flow::Continue),
            Stmt::Pass => {}
        }
        Ok(Flow::Next)
    }

    fn index(&mut self, o: &V, i: &V) -> R<V> {
        let k = as_i64(i).ok_or(()).or_else(|_| rt("l'indice doit être un entier"))?;
        match o {
            V::List(l) => {
                let l = l.borrow();
                Ok(l[norm_index(k, l.len())?].clone())
            }
            V::Tuple(t) => Ok(t[norm_index(k, t.len())?].clone()),
            V::Str(x) => {
                let cs: Vec<char> = x.chars().collect();
                Ok(s(cs[norm_index(k, cs.len())?].to_string()))
            }
            _ => rt(format!("« {} » n'a pas d'indices", type_name(o))),
        }
    }

    fn eval(&mut self, e: &Expr, f: &mut Frame) -> R<V> {
        self.tick()?;
        match e {
            Expr::Lit(l) => Ok(lit(l)),
            Expr::Name(n) => self.get(f, n),
            Expr::List(v) => {
                let mut out = Vec::with_capacity(v.len());
                for x in v {
                    out.push(self.eval(x, f)?);
                }
                let r = list(out);
                check_depth(&r)?;
                Ok(r)
            }
            Expr::Tuple(v) => {
                let mut out = Vec::with_capacity(v.len());
                for x in v {
                    out.push(self.eval(x, f)?);
                }
                let r = tuple(out);
                check_depth(&r)?;
                Ok(r)
            }
            Expr::Bin(a, op, b) => {
                let x = self.eval(a, f)?;
                let y = self.eval(b, f)?;
                binop(op, &x, &y)
            }
            Expr::Neg(a) => match self.eval(a, f)? {
                V::Int(i) => i.checked_neg().map(V::Int).ok_or(()).or_else(|_| rt("entier trop grand")),
                V::Bool(b) => Ok(V::Int(-(b as i64))),
                V::Float(x) => Ok(V::Float(-x)),
                v => rt(format!("« - » impossible sur « {} »", type_name(&v))),
            },
            Expr::Not(a) => Ok(V::Bool(!truthy(&self.eval(a, f)?))),
            Expr::And(a, b) => {
                let x = self.eval(a, f)?;
                if truthy(&x) {
                    self.eval(b, f)
                } else {
                    Ok(x)
                }
            }
            Expr::Or(a, b) => {
                let x = self.eval(a, f)?;
                if truthy(&x) {
                    Ok(x)
                } else {
                    self.eval(b, f)
                }
            }
            Expr::Cmp(first, rest) => {
                let mut left = self.eval(first, f)?;
                for (op, e) in rest {
                    let right = self.eval(e, f)?;
                    let ok = match *op {
                        "==" => eq(&left, &right),
                        "!=" => !eq(&left, &right),
                        "<" => cmp(&left, &right)? == std::cmp::Ordering::Less,
                        ">" => cmp(&left, &right)? == std::cmp::Ordering::Greater,
                        "<=" => cmp(&left, &right)? != std::cmp::Ordering::Greater,
                        ">=" => cmp(&left, &right)? != std::cmp::Ordering::Less,
                        "in" | "not in" => {
                            let found = match &right {
                                V::Str(h) => match &left {
                                    V::Str(n) => h.contains(n.as_str()),
                                    _ => return rt("« in » sur une chaîne demande une chaîne"),
                                },
                                _ => items(&right)?.iter().any(|x| eq(x, &left)),
                            };
                            found == (*op == "in")
                        }
                        "is" => eq(&left, &right),
                        "is not" => !eq(&left, &right),
                        _ => false,
                    };
                    if !ok {
                        return Ok(V::Bool(false));
                    }
                    left = right;
                }
                Ok(V::Bool(true))
            }
            Expr::Index(o, i) => {
                let ov = self.eval(o, f)?;
                let iv = self.eval(i, f)?;
                self.index(&ov, &iv)
            }
            Expr::Slice(o, lo, hi, st) => {
                let ov = self.eval(o, f)?;
                let mut num = |e: &Option<Box<Expr>>, this: &mut Vm, f: &mut Frame| -> R<Option<i64>> {
                    match e {
                        None => Ok(None),
                        Some(x) => as_i64(&this.eval(x, f)?).map(Some).ok_or(()).or_else(|_| rt("les bornes d'un découpage sont des entiers")),
                    }
                };
                let (a, b, c) = (num(lo, self, f)?, num(hi, self, f)?, num(st, self, f)?);
                let step = c.unwrap_or(1);
                if step == 0 {
                    return rt("le pas d'un découpage ne peut pas être 0");
                }
                match &ov {
                    V::List(l) => {
                        let l = l.borrow();
                        charge(l.len() / 4)?;
                        Ok(list(slice_bounds(l.len(), a, b, step).into_iter().map(|i| l[i].clone()).collect()))
                    }
                    V::Tuple(t) => Ok(tuple(slice_bounds(t.len(), a, b, step).into_iter().map(|i| t[i].clone()).collect())),
                    V::Str(x) => {
                        let cs: Vec<char> = x.chars().collect();
                        Ok(s(slice_bounds(cs.len(), a, b, step).into_iter().map(|i| cs[i]).collect::<String>()))
                    }
                    _ => rt("découpage impossible sur ce type"),
                }
            }
            Expr::IfExp(c, a, b) => {
                if truthy(&self.eval(c, f)?) {
                    self.eval(a, f)
                } else {
                    self.eval(b, f)
                }
            }
            Expr::Comp(elt, clauses) => {
                let mut out = Vec::new();
                self.comp(elt, clauses, 0, f, &mut out)?;
                let r = list(out);
                check_depth(&r)?;
                Ok(r)
            }
            Expr::Attr(_, _) => rt("un attribut ne peut être utilisé que pour appeler une méthode"),
            Expr::Call(callee, args) => {
                if let Expr::Attr(obj, name) = &**callee {
                    let o = self.eval(obj, f)?;
                    let mut av = Vec::with_capacity(args.len());
                    for a in args {
                        av.push(self.eval(a, f)?);
                    }
                    return self.method(o, name, av);
                }
                let c = self.eval(callee, f)?;
                let mut av = Vec::with_capacity(args.len());
                for a in args {
                    av.push(self.eval(a, f)?);
                }
                self.call(&c, av)
            }
        }
    }

    fn comp(&mut self, elt: &Expr, cl: &[Clause], k: usize, f: &mut Frame, out: &mut Vec<V>) -> R<()> {
        if k == cl.len() {
            if out.len() >= MAX_LIST {
                return rt("liste trop longue");
            }
            out.push(self.eval(elt, f)?);
            return Ok(());
        }
        let c = &cl[k];
        let seq = items(&self.eval(&c.iter, f)?)?;
        'outer: for x in seq {
            self.tick()?;
            self.assign(&c.target, x, f)?;
            for cond in &c.conds {
                if !truthy(&self.eval(cond, f)?) {
                    continue 'outer;
                }
            }
            self.comp(elt, cl, k + 1, f, out)?;
        }
        Ok(())
    }

    fn call(&mut self, c: &V, args: Vec<V>) -> R<V> {
        match c {
            V::Func(d) => {
                if args.len() > d.params.len() || args.len() < d.params.iter().filter(|p| p.1.is_none()).count() {
                    return rt(format!("« {} » attend {} argument(s), {} donné(s)", d.name, d.params.len(), args.len()));
                }
                if self.depth >= MAX_DEPTH {
                    return Err(PyErr::Limit);
                }
                let mut fr = Frame { vars: HashMap::new(), global: false };
                for (i, (p, dflt)) in d.params.iter().enumerate() {
                    let v = match args.get(i) {
                        Some(v) => v.clone(),
                        None => lit(dflt.as_ref().unwrap()),
                    };
                    fr.vars.insert(p.clone(), v);
                }
                self.depth += 1;
                let r = self.exec_block(&d.body, &mut fr);
                self.depth -= 1;
                match r? {
                    Flow::Return(v) => Ok(v),
                    _ => Ok(V::None),
                }
            }
            V::Builtin(n) => self.builtin(n, args),
            _ => rt(format!("« {} » n'est pas une fonction", type_name(c))),
        }
    }

    fn builtin(&mut self, n: &str, a: Vec<V>) -> R<V> {
        let need = |k: usize| -> R<()> {
            if a.len() == k {
                Ok(())
            } else {
                rt(format!("« {n} » attend {k} argument(s)"))
            }
        };
        let int = |v: &V| as_i64(v).ok_or(()).or_else(|_| rt::<i64>("un entier est attendu"));
        match n {
            "len" => {
                need(1)?;
                Ok(V::Int(match &a[0] {
                    V::Str(x) => x.chars().count() as i64,
                    V::List(l) => l.borrow().len() as i64,
                    V::Tuple(t) => t.len() as i64,
                    v => return rt(format!("« len » impossible sur « {} »", type_name(v))),
                }))
            }
            "range" => {
                let (lo, hi, st) = match a.len() {
                    1 => (0, int(&a[0])?, 1),
                    2 => (int(&a[0])?, int(&a[1])?, 1),
                    3 => (int(&a[0])?, int(&a[1])?, int(&a[2])?),
                    _ => return rt("« range » attend 1 à 3 arguments"),
                };
                if st == 0 {
                    return rt("le pas de « range » ne peut pas être 0");
                }
                let mut out = Vec::new();
                let mut i = lo;
                while (st > 0 && i < hi) || (st < 0 && i > hi) {
                    if out.len() >= MAX_LIST {
                        return rt("« range » trop grand");
                    }
                    out.push(V::Int(i));
                    i = match i.checked_add(st) {
                        Some(v) => v,
                        None => break,
                    };
                }
                Ok(list(out))
            }
            "abs" => {
                need(1)?;
                match &a[0] {
                    V::Float(x) => Ok(V::Float(x.abs())),
                    v => Ok(V::Int(int(v)?.checked_abs().ok_or(()).or_else(|_| rt::<i64>("entier trop grand"))?)),
                }
            }
            "min" | "max" => {
                let seq = if a.len() == 1 { items(&a[0])? } else { a.clone() };
                if seq.is_empty() {
                    return rt(format!("« {n} » d'une séquence vide"));
                }
                let mut best = seq[0].clone();
                for x in &seq[1..] {
                    let c = cmp(x, &best)?;
                    if (n == "min" && c == std::cmp::Ordering::Less) || (n == "max" && c == std::cmp::Ordering::Greater) {
                        best = x.clone();
                    }
                }
                Ok(best)
            }
            "sum" => {
                if a.is_empty() {
                    return rt("« sum » attend une séquence");
                }
                let mut acc = if a.len() > 1 { a[1].clone() } else { V::Int(0) };
                for x in items(&a[0])? {
                    acc = binop("+", &acc, &x)?;
                }
                Ok(acc)
            }
            "int" => {
                need(1)?;
                match &a[0] {
                    V::Float(x) => Ok(V::Int(x.trunc() as i64)),
                    V::Str(x) => x.trim().parse::<i64>().map(V::Int).map_err(|_| PyErr::Runtime(format!("« {x} » n'est pas un entier"))),
                    v => Ok(V::Int(int(v)?)),
                }
            }
            "float" => {
                need(1)?;
                match &a[0] {
                    V::Str(x) => x.trim().parse::<f64>().map(V::Float).map_err(|_| PyErr::Runtime(format!("« {x} » n'est pas un nombre"))),
                    v => as_f64(v).map(V::Float).ok_or(()).or_else(|_| rt("un nombre est attendu")),
                }
            }
            "str" => {
                need(1)?;
                Ok(s(text(&a[0])))
            }
            "bool" => {
                need(1)?;
                Ok(V::Bool(truthy(&a[0])))
            }
            "list" | "tuple" => {
                let v = if a.is_empty() { vec![] } else { items(&a[0])? };
                Ok(if n == "list" { list(v) } else { tuple(v) })
            }
            "sorted" => {
                need(1)?;
                let mut v = items(&a[0])?;
                charge(v.len().saturating_mul(10))?;
                let mut err = None;
                v.sort_by(|x, y| {
                    cmp(x, y).unwrap_or_else(|e| {
                        err = Some(e);
                        std::cmp::Ordering::Equal
                    })
                });
                match err {
                    Some(e) => Err(e),
                    None => Ok(list(v)),
                }
            }
            "reversed" => {
                need(1)?;
                let mut v = items(&a[0])?;
                v.reverse();
                Ok(list(v))
            }
            "enumerate" => {
                need(1)?;
                Ok(list(items(&a[0])?.into_iter().enumerate().map(|(i, x)| tuple(vec![V::Int(i as i64), x])).collect()))
            }
            "zip" => {
                let seqs = a.iter().map(items).collect::<R<Vec<_>>>()?;
                let m = seqs.iter().map(|x| x.len()).min().unwrap_or(0);
                Ok(list((0..m).map(|i| tuple(seqs.iter().map(|x| x[i].clone()).collect())).collect()))
            }
            "any" | "all" => {
                need(1)?;
                let t = items(&a[0])?.iter().map(truthy).collect::<Vec<_>>();
                Ok(V::Bool(if n == "any" { t.iter().any(|x| *x) } else { t.iter().all(|x| *x) }))
            }
            "pow" => {
                if a.len() == 3 {
                    let (b, e, m) = (int(&a[0])?, int(&a[1])?, int(&a[2])?);
                    if e < 0 || m == 0 {
                        return rt("« pow » : exposant négatif ou modulo nul");
                    }
                    let (mut r, mut base, mut ex) = (1i128, (b as i128).rem_euclid(m as i128), e);
                    while ex > 0 {
                        self.tick()?;
                        if ex & 1 == 1 {
                            r = r * base % (m as i128);
                        }
                        base = base * base % (m as i128);
                        ex >>= 1;
                    }
                    return Ok(V::Int(modulo(r as i64, m)?));
                }
                need(2)?;
                binop("**", &a[0], &a[1])
            }
            "divmod" => {
                need(2)?;
                let (x, y) = (int(&a[0])?, int(&a[1])?);
                Ok(tuple(vec![V::Int(floordiv(x, y)?), V::Int(modulo(x, y)?)]))
            }
            "round" => {
                if a.is_empty() {
                    return rt("« round » attend un nombre");
                }
                let x = as_f64(&a[0]).ok_or(()).or_else(|_| rt("un nombre est attendu"))?;
                if a.len() > 1 {
                    let d = int(&a[1])?;
                    let p = 10f64.powi(d as i32);
                    Ok(V::Float((x * p).round() / p))
                } else {
                    // arrondi au pair le plus proche, comme Python
                    let r = x.round();
                    let r = if (x - x.trunc()).abs() == 0.5 && (r as i64) % 2 != 0 { r - x.signum() } else { r };
                    Ok(V::Int(r as i64))
                }
            }
            "chr" => {
                need(1)?;
                char::from_u32(int(&a[0])? as u32).map(|c| s(c.to_string())).ok_or(()).or_else(|_| rt("code de caractère invalide"))
            }
            "ord" => {
                need(1)?;
                match &a[0] {
                    V::Str(x) if x.chars().count() == 1 => Ok(V::Int(x.chars().next().unwrap() as i64)),
                    _ => rt("« ord » attend un caractère"),
                }
            }
            "print" => {
                let line = a.iter().map(text).collect::<Vec<_>>().join(" ");
                if self.output.len() < 10_000 {
                    self.output.push_str(&line);
                    self.output.push('\n');
                }
                Ok(V::None)
            }
            _ => rt(format!("la fonction « {n} » n'existe pas")),
        }
    }

    fn method(&mut self, o: V, name: &str, a: Vec<V>) -> R<V> {
        match &o {
            V::List(l) => {
                charge(l.borrow().len() / 8)?;
                match (name, a.len()) {
                ("append", 1) => {
                    if l.borrow().len() >= MAX_LIST {
                        return rt("liste trop longue");
                    }
                    guard_insert(l, &a[0])?;
                    l.borrow_mut().push(a[0].clone());
                    Ok(V::None)
                }
                ("extend", 1) => {
                    let extra = items(&a[0])?;
                    if l.borrow().len() + extra.len() > MAX_LIST {
                        return rt("liste trop longue");
                    }
                    for x in &extra {
                        guard_insert(l, x)?;
                    }
                    l.borrow_mut().extend(extra);
                    Ok(V::None)
                }
                ("insert", 2) => {
                    let i = as_i64(&a[0]).ok_or(()).or_else(|_| rt("l'indice doit être un entier"))?;
                    let len = l.borrow().len();
                    let j = (if i < 0 { i + len as i64 } else { i }).clamp(0, len as i64) as usize;
                    guard_insert(l, &a[1])?;
                    l.borrow_mut().insert(j, a[1].clone());
                    Ok(V::None)
                }
                ("pop", 0) | ("pop", 1) => {
                    let len = l.borrow().len();
                    if len == 0 {
                        return rt("« pop » sur une liste vide");
                    }
                    let j = if a.is_empty() { len - 1 } else { norm_index(as_i64(&a[0]).unwrap_or(-1), len)? };
                    Ok(l.borrow_mut().remove(j))
                }
                ("remove", 1) => {
                    let pos = l.borrow().iter().position(|x| eq(x, &a[0]));
                    match pos {
                        Some(p) => {
                            l.borrow_mut().remove(p);
                            Ok(V::None)
                        }
                        None => rt("« remove » : valeur absente de la liste"),
                    }
                }
                ("reverse", 0) => {
                    l.borrow_mut().reverse();
                    Ok(V::None)
                }
                ("sort", 0) => {
                    let sorted = self.builtin("sorted", vec![o.clone()])?;
                    *l.borrow_mut() = items(&sorted)?;
                    Ok(V::None)
                }
                ("count", 1) => {
                    charge(l.borrow().len())?;
                    Ok(V::Int(l.borrow().iter().filter(|x| eq(x, &a[0])).count() as i64))
                }
                ("index", 1) => match l.borrow().iter().position(|x| eq(x, &a[0])) {
                    Some(p) => Ok(V::Int(p as i64)),
                    None => rt("« index » : valeur absente de la liste"),
                },
                ("copy", 0) => {
                    charge(l.borrow().len())?;
                    Ok(list(l.borrow().clone()))
                }
                _ => rt(format!("la méthode « {name} » n'existe pas pour une liste")),
                }
            }
            V::Str(x) => match (name, a.len()) {
                ("upper", 0) => Ok(s(x.to_uppercase())),
                ("lower", 0) => Ok(s(x.to_lowercase())),
                ("strip", 0) => Ok(s(x.trim())),
                ("isdigit", 0) => Ok(V::Bool(!x.is_empty() && x.chars().all(|c| c.is_ascii_digit()))),
                ("isalpha", 0) => Ok(V::Bool(!x.is_empty() && x.chars().all(|c| c.is_alphabetic()))),
                ("count", 1) => match &a[0] {
                    V::Str(p) if !p.is_empty() => Ok(V::Int(x.matches(p.as_str()).count() as i64)),
                    _ => rt("« count » attend une chaîne non vide"),
                },
                ("find", 1) => match &a[0] {
                    V::Str(p) => Ok(V::Int(x.find(p.as_str()).map(|b| x[..b].chars().count() as i64).unwrap_or(-1))),
                    _ => rt("« find » attend une chaîne"),
                },
                ("replace", 2) => match (&a[0], &a[1]) {
                    (V::Str(p), V::Str(q)) if !p.is_empty() => Ok(s(x.replace(p.as_str(), q))),
                    _ => rt("« replace » attend deux chaînes"),
                },
                ("startswith", 1) => match &a[0] {
                    V::Str(p) => Ok(V::Bool(x.starts_with(p.as_str()))),
                    _ => rt("« startswith » attend une chaîne"),
                },
                ("endswith", 1) => match &a[0] {
                    V::Str(p) => Ok(V::Bool(x.ends_with(p.as_str()))),
                    _ => rt("« endswith » attend une chaîne"),
                },
                ("split", 0) => Ok(list(x.split_whitespace().map(s).collect())),
                ("split", 1) => match &a[0] {
                    V::Str(p) if !p.is_empty() => Ok(list(x.split(p.as_str()).map(s).collect())),
                    _ => rt("« split » attend un séparateur non vide"),
                },
                ("join", 1) => {
                    let parts = items(&a[0])?;
                    let mut out = String::new();
                    for (i, p) in parts.iter().enumerate() {
                        match p {
                            V::Str(t) => {
                                if i > 0 {
                                    out.push_str(x);
                                }
                                out.push_str(t);
                            }
                            _ => return rt("« join » attend des chaînes"),
                        }
                        if out.len() > MAX_STR {
                            return rt("chaîne trop longue");
                        }
                    }
                    Ok(s(out))
                }
                _ => rt(format!("la méthode « {name} » n'existe pas pour une chaîne")),
            },
            V::Tuple(t) => match (name, a.len()) {
                ("count", 1) => Ok(V::Int(t.iter().filter(|x| eq(x, &a[0])).count() as i64)),
                ("index", 1) => match t.iter().position(|x| eq(x, &a[0])) {
                    Some(p) => Ok(V::Int(p as i64)),
                    None => rt("« index » : valeur absente"),
                },
                _ => rt(format!("la méthode « {name} » n'existe pas pour un tuple")),
            },
            _ => rt(format!("« {} » n'a pas de méthode « {name} »", type_name(&o))),
        }
    }
}

// ---------------------------------------------------------------- interface JSON

fn from_json(v: &Value) -> V {
    match v {
        Value::Null => V::None,
        Value::Bool(b) => V::Bool(*b),
        Value::Number(n) => match n.as_i64() {
            Some(i) => V::Int(i),
            None => V::Float(n.as_f64().unwrap_or(0.0)),
        },
        Value::String(x) => s(x.clone()),
        Value::Array(a) => list(a.iter().map(from_json).collect()),
        Value::Object(_) => V::None,
    }
}

fn to_json(v: &V) -> Value {
    to_json_d(v, 0)
}

fn to_json_d(v: &V, d: usize) -> Value {
    if d > REC_CAP {
        return Value::Null;
    }
    match v {
        V::None => Value::Null,
        V::Bool(b) => json!(b),
        V::Int(i) => json!(i),
        V::Float(f) => json!(f),
        V::Str(x) => json!(x.as_str()),
        V::List(l) => Value::Array(l.borrow().iter().map(|x| to_json_d(x, d + 1)).collect()),
        V::Tuple(t) => Value::Array(t.iter().map(|x| to_json_d(x, d + 1)).collect()),
        _ => Value::Null,
    }
}

/// Résultat d'un appel de fonction : la valeur (JSON) et ce que le programme a affiché.
pub struct Call {
    pub value: Value,
    pub output: String,
}

/// Analyse `code`, l'exécute (définitions et instructions du niveau supérieur), puis appelle `fname(args…)`.
pub fn run_function(code: &str, fname: &str, args: &[Value]) -> R<Call> {
    let toks = lex(code)?;
    let mut p = Parser { t: toks, p: 0, nest: 0 };
    let prog = p.program()?;
    let mut vm = Vm::new();
    let mut top = Frame { vars: HashMap::new(), global: true };
    vm.exec_block(&prog, &mut top)?;
    let f = vm.globals.get(fname).cloned();
    let Some(f @ V::Func(_)) = f else { return Err(PyErr::NoFunction(fname.to_string())) };
    let r = vm.call(&f, args.iter().map(from_json).collect())?;
    Ok(Call { value: to_json(&r), output: std::mem::take(&mut vm.output) })
}

/// Vérifie seulement que `code` s'analyse (utile pour afficher une erreur de syntaxe avant les tests).
pub fn check_syntax(code: &str) -> R<()> {
    let toks = lex(code)?;
    Parser { t: toks, p: 0, nest: 0 }.program().map(|_| ())
}

/// Écriture Python d'une valeur JSON (pour les messages : `pgcd(12, 18)`).
pub fn py_repr(v: &Value) -> String {
    repr(&from_json(v))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn run(code: &str, f: &str, args: Vec<Value>) -> Value {
        run_function(code, f, &args).unwrap().value
    }

    #[test]
    fn pgcd_euclide() {
        let c = "def pgcd(a, b):\n    while b != 0:\n        a, b = b, a % b\n    return a\n";
        assert_eq!(run(c, "pgcd", vec![json!(12), json!(18)]), json!(6));
        assert_eq!(run(c, "pgcd", vec![json!(17), json!(5)]), json!(1));
    }

    #[test]
    fn somme_chiffres_et_floordiv_negatif() {
        let c = "def f(n):\n    s = 0\n    while n > 0:\n        s += n % 10\n        n //= 10\n    return s\n";
        assert_eq!(run(c, "f", vec![json!(12345)]), json!(15));
        let d = "def g(a, b):\n    return a // b, a % b\n";
        assert_eq!(run(d, "g", vec![json!(-7), json!(2)]), json!([-4, 1]));
        assert_eq!(run(d, "g", vec![json!(7), json!(-2)]), json!([-4, -1]));
    }

    #[test]
    fn listes_boucles_comprehensions() {
        let c = "def f(n):\n    pairs = [i for i in range(n) if i % 2 == 0]\n    r = []\n    for x in pairs:\n        r.append(x * x)\n    return sum(r), len(r), r[-1], r[1:3]\n";
        assert_eq!(run(c, "f", vec![json!(10)]), json!([120, 5, 64, [4, 16]]));
    }

    #[test]
    fn recursion_et_expression_conditionnelle() {
        let c = "def fact(n):\n    return 1 if n <= 1 else n * fact(n - 1)\n";
        assert_eq!(run(c, "fact", vec![json!(10)]), json!(3628800));
        let r = run_function("def f(n):\n    return f(n + 1)\n", "f", &[json!(0)]);
        assert_eq!(r.err(), Some(PyErr::Limit));
    }

    #[test]
    fn chaines_et_docstring() {
        let c = "def f(m):\n    \"\"\"Compte les voyelles.\n    Deux lignes.\"\"\"\n    n = 0\n    for ch in m.lower():\n        if ch in 'aeiou':\n            n += 1\n    return n\n";
        assert_eq!(run(c, "f", vec![json!("Madagascar")]), json!(4));
    }

    #[test]
    fn bornes_et_erreurs() {
        assert_eq!(run_function("def f():\n    while True:\n        pass\n", "f", &[]).err(), Some(PyErr::Limit));
        assert!(matches!(run_function("def f(:\n", "f", &[]).err(), Some(PyErr::Syntax(..))));
        assert!(matches!(run_function("import os\n", "f", &[]).err(), Some(PyErr::Syntax(..))));
        assert!(matches!(run_function("def f():\n    return 1 // 0\n", "f", &[]).err(), Some(PyErr::Runtime(_))));
        assert!(matches!(run_function("x = 1\n", "f", &[]).err(), Some(PyErr::NoFunction(_))));
        assert!(matches!(run_function("def f(n):\n    return 2 ** n\n", "f", &[json!(80)]).err(), Some(PyErr::Runtime(_))));
        assert!(matches!(run_function("def f():\n    return open('x')\n", "f", &[]).err(), Some(PyErr::Runtime(_))));
    }

    #[test]
    fn indentation_incoherente_et_ligne_unique() {
        assert!(matches!(check_syntax("def f(n):\n        return 1\n    return 2\n").err(), Some(PyErr::Syntax(..))));
        assert_eq!(run("def f(n):\n    if n > 0: return 'pos'\n    return 'non'\n", "f", vec![json!(2)]), json!("pos"));
    }

    #[test]
    fn print_capture_et_flottants() {
        let r = run_function("def f(x):\n    print('x =', x)\n    return x / 4\n", "f", &[json!(10)]).unwrap();
        assert_eq!(r.output, "x = 10\n");
        assert_eq!(r.value, json!(2.5));
    }
}
