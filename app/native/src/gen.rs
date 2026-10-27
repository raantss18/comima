//! Générateurs de questions : un modèle par thème, des nombres tirés au hasard selon le niveau (1 à 5), et une réponse
//! **calculée** (jamais recopiée) : elle est donc exacte, et deux séries ne se ressemblent pas.
//!
//! Même code pour l'application (FFI) et le site (WebAssembly). Une question générée est un objet JSON comme ceux des
//! paquets (`type`, `enonce`, `reponse`…), plus `id` (`g:<modèle>:<niveau>:<graine>`), `theme`, `notion` et `generated`.
//! Même modèle + même niveau + même graine = même question (reproductible, testable).

use serde_json::{json, Value};

/// Générateur pseudo-aléatoire SplitMix64 : petit, rapide, reproductible, sans dépendance.
pub struct Rng(u64);

impl Rng {
    pub fn new(seed: u64) -> Self {
        Rng(seed ^ 0x9E37_79B9_7F4A_7C15)
    }
    pub fn next(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = self.0;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }
    /// Entier de `lo` à `hi` inclus.
    pub fn range(&mut self, lo: i64, hi: i64) -> i64 {
        debug_assert!(lo <= hi);
        lo + (self.next() % ((hi - lo + 1) as u64)) as i64
    }
    pub fn pick<T: Copy>(&mut self, xs: &[T]) -> T {
        xs[(self.next() % xs.len() as u64) as usize]
    }
    pub fn flip(&mut self) -> bool {
        self.next() & 1 == 1
    }
}

// ------------------------------------------------------------------ arithmétique de base (exacte)

pub fn gcd(a: i128, b: i128) -> i128 {
    let (mut a, mut b) = (a.abs(), b.abs());
    while b != 0 {
        (a, b) = (b, a % b);
    }
    a
}

pub fn mod_pow(base: u128, mut exp: u128, m: u128) -> u128 {
    let mut result = 1 % m;
    let mut b = base % m;
    while exp > 0 {
        if exp & 1 == 1 {
            result = result * b % m;
        }
        b = b * b % m;
        exp >>= 1;
    }
    result
}

pub fn is_prime(n: u64) -> bool {
    if n < 2 {
        return false;
    }
    if n % 2 == 0 {
        return n == 2;
    }
    let mut d = 3;
    while d * d <= n {
        if n % d == 0 {
            return false;
        }
        d += 2;
    }
    true
}

/// Décomposition en facteurs premiers : [(p, exposant)].
pub fn factor(mut n: u64) -> Vec<(u64, u32)> {
    let mut out = Vec::new();
    let mut p = 2;
    while p * p <= n {
        if n % p == 0 {
            let mut e = 0;
            while n % p == 0 {
                n /= p;
                e += 1;
            }
            out.push((p, e));
        }
        p += if p == 2 { 1 } else { 2 };
    }
    if n > 1 {
        out.push((n, 1));
    }
    out
}

pub fn binom(n: u64, k: u64) -> u128 {
    let k = k.min(n - k.min(n));
    let mut r: u128 = 1;
    for i in 0..k {
        r = r * (n - i) as u128 / (i + 1) as u128;
    }
    r
}

pub fn factorial(n: u64) -> u128 {
    (1..=n as u128).product()
}

fn tex_factors(f: &[(u64, u32)]) -> String {
    f.iter().map(|&(p, e)| if e == 1 { format!("{p}") } else { format!("{p}^{{{e}}}") }).collect::<Vec<_>>().join(" \\times ")
}

// ------------------------------------------------------------------ question en construction

struct Out {
    typ: &'static str,
    fr: String,
    en: String,
    reponse: Value,
    extra: Vec<(&'static str, Value)>,
    expl: (String, String),
    hint: Option<(String, String)>,
}

fn both(fr: impl Into<String>, en: impl Into<String>) -> (String, String) {
    (fr.into(), en.into())
}

fn numeric(fr: String, en: String, answer: impl ToString, expl: (String, String)) -> Out {
    Out { typ: "numeric", fr, en, reponse: json!(answer.to_string()), extra: vec![], expl, hint: None }
}

fn with_hint(mut o: Out, fr: &str, en: &str) -> Out {
    o.hint = Some(both(fr, en));
    o
}

/// Un modèle : identifiant, thème, notions d'entraînement auxquelles il se rattache, et la fonction qui construit la question.
pub struct Kind {
    pub id: &'static str,
    pub theme: &'static str,
    pub notions: &'static [&'static str],
    build: fn(&mut Rng, u8) -> Out,
}

/// Coefficient écrit devant une inconnue : « 1 » ne s'écrit pas ($x$, pas $1x$).
fn co(a: i64) -> String {
    if a == 1 {
        String::new()
    } else {
        a.to_string()
    }
}

/// « + 3n », « - n » (rien si le coefficient est nul).
fn term(b: i64, v: &str) -> String {
    match b {
        0 => String::new(),
        b if b > 0 => format!("+ {}{v}", co(b)),
        b => format!("- {}{v}", co(-b)),
    }
}

/// « + 5 », « - 2 » (rien si la constante est nulle).
fn konst(x: i64) -> String {
    match x {
        0 => String::new(),
        x if x > 0 => format!("+ {x}"),
        x => format!("- {}", -x),
    }
}

fn lv(level: u8, a: i64, b: i64, c: i64, d: i64, e: i64) -> i64 {
    [a, b, c, d, e][(level.clamp(1, 5) - 1) as usize]
}

// ------------------------------------------------------------------ arithmétique

fn k_pgcd(r: &mut Rng, l: u8) -> Out {
    let g = r.range(2, lv(l, 6, 12, 30, 60, 120));
    let hi = lv(l, 9, 20, 40, 90, 400);
    let (m, n) = loop {
        let m = r.range(2, hi);
        let n = r.range(2, hi);
        if m != n {
            break (m, n);
        }
    };
    let (a, b) = (g as i128 * m as i128, g as i128 * n as i128);
    let (a, b) = if a >= b { (a, b) } else { (b, a) };
    let ans = gcd(a, b);
    // Étapes de l'algorithme d'Euclide.
    let (mut x, mut y) = (a, b);
    let mut steps = Vec::new();
    while y != 0 {
        steps.push(format!("{x} = {} \\times {y} + {}", x / y, x % y));
        (x, y) = (y, x % y);
    }
    numeric(
        format!("Quel est le PGCD de ${a}$ et ${b}$ ?"),
        format!("What is the GCD of ${a}$ and ${b}$?"),
        ans,
        both(
            format!("Algorithme d'Euclide : ${}$, d'où PGCD $= {ans}$.", steps.join(" ; ")),
            format!("Euclid's algorithm: ${}$, so GCD $= {ans}$.", steps.join("; ")),
        ),
    )
}

fn k_reste_puissance(r: &mut Rng, l: u8) -> Out {
    let a = r.range(2, lv(l, 7, 9, 12, 19, 29));
    let n = r.range(lv(l, 5, 10, 30, 100, 1000), lv(l, 12, 60, 400, 3000, 99999));
    let m = *[5i64, 7, 9, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47][..lv(l, 4, 6, 9, 12, 14) as usize].get(r.range(0, lv(l, 3, 5, 8, 11, 13)) as usize).unwrap_or(&7);
    let ans = mod_pow(a as u128, n as u128, m as u128);
    with_hint(
        numeric(
            format!("Quel est le reste de la division euclidienne de ${a}^{{{n}}}$ par ${m}$ ?"),
            format!("What is the remainder when ${a}^{{{n}}}$ is divided by ${m}$?"),
            ans,
            both(
                format!("On calcule les puissances de ${a}$ modulo ${m}$ : la suite est périodique, on réduit l'exposant. Résultat : ${ans}$."),
                format!("Compute the powers of ${a}$ modulo ${m}$: the sequence is periodic, reduce the exponent. Result: ${ans}$."),
            ),
        ),
        "Les puissances d'un entier modulo $m$ finissent par se répéter.",
        "Powers of an integer modulo $m$ eventually repeat.",
    )
}

fn k_chiffre_unites(r: &mut Rng, l: u8) -> Out {
    let a = r.range(2, lv(l, 9, 29, 99, 999, 9999));
    let n = r.range(lv(l, 5, 20, 100, 1000, 10000), lv(l, 30, 300, 5000, 99999, 999999));
    let ans = mod_pow(a as u128, n as u128, 10);
    with_hint(
        numeric(
            format!("Quel est le chiffre des unités de ${a}^{{{n}}}$ ?"),
            format!("What is the units digit of ${a}^{{{n}}}$?"),
            ans,
            both(
                format!("Seul le chiffre des unités de ${a}$ compte, et ses puissances se répètent avec une période d'au plus 4. Résultat : ${ans}$."),
                format!("Only the units digit of ${a}$ matters and its powers repeat with period at most 4. Result: ${ans}$."),
            ),
        ),
        "Regarde le reste modulo $10$ et cherche la période.",
        "Work modulo $10$ and look for the period.",
    )
}

fn k_nb_diviseurs(r: &mut Rng, l: u8) -> Out {
    let primes = [2u64, 3, 5, 7, 11, 13];
    let (np, emax) = (lv(l, 2, 2, 3, 3, 4) as usize, lv(l, 2, 3, 3, 3, 3) as u32);
    let mut n: u64 = 1;
    let mut f = Vec::new();
    for &p in primes.iter().take(np) {
        let e = r.range(1, emax as i64) as u32;
        n *= p.pow(e);
        f.push((p, e));
    }
    // Un facteur premier moins évident pour les niveaux élevés.
    if l >= 4 {
        let q = r.pick(&[17u64, 19, 23, 29]);
        if n * q <= 2_000_000 {
            n *= q;
            f.push((q, 1));
        }
    }
    let ans: u64 = f.iter().map(|&(_, e)| e as u64 + 1).product();
    numeric(
        format!("Combien ${n}$ a-t-il de diviseurs positifs ?"),
        format!("How many positive divisors does ${n}$ have?"),
        ans,
        both(
            format!("${n} = {}$, donc ${}$ diviseurs.", tex_factors(&f), f.iter().map(|&(_, e)| format!("({}+1)", e)).collect::<Vec<_>>().join(" \\times ") + &format!(" = {ans}")),
            format!("${n} = {}$, so ${}$ divisors.", tex_factors(&f), f.iter().map(|&(_, e)| format!("({}+1)", e)).collect::<Vec<_>>().join(" \\times ") + &format!(" = {ans}")),
        ),
    )
}

fn k_premier_suivant(r: &mut Rng, l: u8) -> Out {
    let n = r.range(lv(l, 10, 50, 200, 1000, 10000), lv(l, 60, 400, 2000, 20000, 200000)) as u64;
    let mut p = n + 1;
    while !is_prime(p) {
        p += 1;
    }
    numeric(
        format!("Quel est le plus petit nombre premier strictement supérieur à ${n}$ ?"),
        format!("What is the smallest prime strictly greater than ${n}$?"),
        p,
        both(
            format!("Les entiers de ${}$ à ${}$ sont composés ; ${p}$ est premier (aucun diviseur premier $\\le \\sqrt{{{p}}}$).", n + 1, p - 1),
            format!("The integers from ${}$ to ${}$ are composite; ${p}$ is prime (no prime divisor $\\le \\sqrt{{{p}}}$).", n + 1, p - 1),
        ),
    )
}

fn k_est_premier(r: &mut Rng, l: u8) -> Out {
    let hi = lv(l, 60, 300, 1500, 9000, 60000) as u64;
    let n = loop {
        let n = r.range(11, hi as i64) as u64;
        if n % 2 == 1 && n % 5 != 0 {
            // Équilibre : une chance sur deux de tomber sur un premier.
            if is_prime(n) == r.flip() {
                break n;
            }
        }
    };
    let prime = is_prime(n);
    let f = factor(n);
    Out {
        typ: "vrai-faux",
        fr: format!("Le nombre ${n}$ est premier."),
        en: format!("The number ${n}$ is prime."),
        reponse: json!(prime),
        extra: vec![],
        expl: if prime {
            both(format!("${n}$ n'a aucun diviseur premier inférieur ou égal à $\\sqrt{{{n}}}$ : il est premier."), format!("${n}$ has no prime divisor up to $\\sqrt{{{n}}}$: it is prime."))
        } else {
            both(format!("${n} = {}$ : il n'est pas premier.", tex_factors(&f)), format!("${n} = {}$: it is not prime.", tex_factors(&f)))
        },
        hint: Some(both("Teste les petits nombres premiers jusqu'à la racine carrée.", "Try small primes up to the square root.")),
    }
}

fn k_division_euclidienne(r: &mut Rng, l: u8) -> Out {
    let b = r.range(lv(l, 3, 5, 7, 11, 13), lv(l, 9, 15, 40, 99, 250));
    let q = r.range(lv(l, 2, 5, 20, 100, 1000), lv(l, 12, 40, 200, 999, 9999));
    let rem = r.range(0, b - 1);
    let a = q * b + rem;
    Out {
        typ: "n-uplet",
        fr: format!("Donne le couple $(q, r)$ de la division euclidienne de ${a}$ par ${b}$."),
        en: format!("Give the pair $(q, r)$ of the Euclidean division of ${a}$ by ${b}$."),
        reponse: json!([q.to_string(), rem.to_string()]),
        extra: vec![],
        expl: both(format!("${a} = {b} \\times {q} + {rem}$ avec $0 \\le {rem} < {b}$."), format!("${a} = {b} \\times {q} + {rem}$ with $0 \\le {rem} < {b}$.")),
        hint: None,
    }
}

fn k_inverse_modulaire(r: &mut Rng, l: u8) -> Out {
    let m = r.range(lv(l, 5, 7, 11, 23, 53), lv(l, 11, 19, 47, 97, 199));
    let a = loop {
        let a = r.range(2, m - 1);
        if gcd(a as i128, m as i128) == 1 {
            break a;
        }
    };
    let x = (1..m).find(|x| a * x % m == 1).unwrap();
    with_hint(
        numeric(
            format!("Quel entier $x$ tel que $0 < x < {m}$ vérifie ${a}x \\equiv 1 \\pmod{{{m}}}$ ?"),
            format!("Which integer $x$ with $0 < x < {m}$ satisfies ${a}x \\equiv 1 \\pmod{{{m}}}$?"),
            x,
            both(format!("${a} \\times {x} = {} = {} \\times {m} + 1$.", a * x, a * x / m), format!("${a} \\times {x} = {} = {} \\times {m} + 1$.", a * x, a * x / m)),
        ),
        "Comme $a$ et $m$ sont premiers entre eux, un tel $x$ existe : teste les multiples.",
        "Since $a$ and $m$ are coprime, such an $x$ exists: try the multiples.",
    )
}

fn k_base(r: &mut Rng, l: u8) -> Out {
    let base = if l <= 2 { 2 } else { r.pick(&[2i64, 3, 4, 5]) };
    let n = r.range(lv(l, 5, 12, 40, 200, 3000), lv(l, 30, 100, 400, 3000, 60000));
    let digits = |mut n: i64, b: i64| {
        let mut d = Vec::new();
        while n > 0 {
            d.push((n % b).to_string());
            n /= b;
        }
        d.reverse();
        d.join("")
    };
    if r.flip() {
        let s = digits(n, base);
        numeric(
            format!("Écris ${n}$ en base ${base}$ (réponds avec les chiffres, sans espace)."),
            format!("Write ${n}$ in base ${base}$ (answer with the digits, no spaces)."),
            s.clone(),
            both(format!("Divisions successives par ${base}$ : ${n}$ s'écrit ${s}$ en base ${base}$."), format!("Successive divisions by ${base}$: ${n}$ is written ${s}$ in base ${base}$.")),
        )
    } else {
        let s = digits(n, base);
        numeric(
            format!("Quel nombre (en base $10$) s'écrit ${s}$ en base ${base}$ ?"),
            format!("Which number (in base $10$) is written ${s}$ in base ${base}$?"),
            n,
            both(format!("On calcule $\\sum$ chiffre $\\times {base}^{{\\text{{rang}}}}$ : on trouve ${n}$."), format!("Compute $\\sum$ digit $\\times {base}^{{\\text{{position}}}}$: we get ${n}$.")),
        )
    }
}

fn k_diviseurs_premiers(r: &mut Rng, l: u8) -> Out {
    let primes = [2u64, 3, 5, 7, 11, 13, 17, 19, 23];
    let k = lv(l, 2, 2, 3, 3, 4) as usize;
    let mut chosen: Vec<u64> = Vec::new();
    while chosen.len() < k {
        let p = r.pick(&primes[..lv(l, 4, 5, 7, 8, 9) as usize]);
        if !chosen.contains(&p) {
            chosen.push(p);
        }
    }
    chosen.sort_unstable();
    let mut n: u64 = 1;
    for &p in &chosen {
        n *= p.pow(r.range(1, if l >= 3 { 3 } else { 2 }) as u32);
    }
    Out {
        typ: "ensemble",
        fr: format!("Donne l'ensemble des diviseurs **premiers** de ${n}$."),
        en: format!("Give the set of **prime** divisors of ${n}$."),
        reponse: json!(chosen.iter().map(|p| p.to_string()).collect::<Vec<_>>()),
        extra: vec![],
        expl: both(format!("${n} = {}$ : les diviseurs premiers sont {}.", tex_factors(&factor(n)), chosen.iter().map(|p| format!("${p}$")).collect::<Vec<_>>().join(", ")), format!("${n} = {}$: the prime divisors are {}.", tex_factors(&factor(n)), chosen.iter().map(|p| format!("${p}$")).collect::<Vec<_>>().join(", "))),
        hint: None,
    }
}

fn k_qcm_premiers(r: &mut Rng, l: u8) -> Out {
    let hi = lv(l, 50, 120, 400, 1500, 9000);
    let mut nums: Vec<u64> = Vec::new();
    while nums.len() < 5 {
        let n = r.range(7, hi) as u64;
        if !nums.contains(&n) && n % 2 == 1 {
            nums.push(n);
        }
    }
    // Au moins un premier et un composé.
    if !nums.iter().any(|&n| is_prime(n)) {
        let mut p = nums[0] + 2;
        while !is_prime(p) || nums.contains(&p) {
            p += 2;
        }
        nums[0] = p;
    }
    if nums.iter().all(|&n| is_prime(n)) {
        nums[1] = 9 * (nums[1] / 9 + 1) + 0;
        if nums[1] % 2 == 0 {
            nums[1] += 9;
        }
    }
    let bonnes: Vec<i64> = nums.iter().enumerate().filter(|(_, &n)| is_prime(n)).map(|(i, _)| i as i64).collect();
    Out {
        typ: "qcm",
        fr: "Parmi ces nombres, lesquels sont premiers ? (plusieurs réponses possibles)".into(),
        en: "Which of these numbers are prime? (several answers possible)".into(),
        reponse: Value::Null,
        extra: vec![
            ("choix", json!(nums.iter().map(|n| json!({"fr": n.to_string(), "en": n.to_string()})).collect::<Vec<_>>())),
            ("bonnes", json!(bonnes)),
        ],
        expl: both(
            nums.iter().map(|&n| if is_prime(n) { format!("${n}$ est premier") } else { format!("${n} = {}$", tex_factors(&factor(n))) }).collect::<Vec<_>>().join(" ; ") + ".",
            nums.iter().map(|&n| if is_prime(n) { format!("${n}$ is prime") } else { format!("${n} = {}$", tex_factors(&factor(n))) }).collect::<Vec<_>>().join("; ") + ".",
        ),
        hint: None,
    }
}

fn k_divisibilite_vf(r: &mut Rng, l: u8) -> Out {
    let d = r.pick(&[3i64, 4, 6, 7, 9, 11, 12, 13][..lv(l, 3, 4, 6, 7, 8) as usize]);
    let n = r.range(lv(l, 30, 100, 1000, 10000, 100000), lv(l, 400, 3000, 30000, 300000, 3000000));
    // Équilibre : une fois sur deux, on rapproche n d'un multiple.
    let n = if r.flip() { n / d * d } else { n };
    let ok = n % d == 0;
    Out {
        typ: "vrai-faux",
        fr: format!("${n}$ est divisible par ${d}$."),
        en: format!("${n}$ is divisible by ${d}$."),
        reponse: json!(ok),
        extra: vec![],
        expl: both(
            format!("${n} = {d} \\times {} + {}$ : {}.", n / d, n % d, if ok { "reste nul, donc divisible" } else { "le reste n'est pas nul" }),
            format!("${n} = {d} \\times {} + {}$: {}.", n / d, n % d, if ok { "zero remainder, so divisible" } else { "the remainder is not zero" }),
        ),
        hint: None,
    }
}

fn k_euler_contre_exemple(r: &mut Rng, l: u8) -> Out {
    // « n² + n + k est premier pour tout n ≥ 0 » : plus petit contre-exemple (k choisi parmi des valeurs connues ou aléatoires).
    let k = if l <= 2 { r.pick(&[11i64, 17, 41, 5, 7]) } else { r.range(3, 100) };
    let mut n = 0u64;
    while is_prime((n * n + n) + k as u64) && n < 5000 {
        n += 1;
    }
    let v = n * n + n + k as u64;
    let f = factor(v);
    numeric(
        format!("On observe que $n^2 + n + {k}$ est premier pour les premières valeurs de $n$. Quel est le plus petit entier $n \\ge 0$ pour lequel ce n'est **pas** un nombre premier ?"),
        format!("We notice that $n^2 + n + {k}$ is prime for the first values of $n$. What is the smallest integer $n \\ge 0$ for which it is **not** prime?"),
        n,
        both(format!("Pour $n = {n}$ : $n^2 + n + {k} = {v} = {}$. Un seul contre-exemple suffit.", tex_factors(&f)), format!("For $n = {n}$: $n^2 + n + {k} = {v} = {}$. A single counterexample is enough.", tex_factors(&f))),
    )
}

// ------------------------------------------------------------------ dénombrement

fn k_comites(r: &mut Rng, l: u8) -> Out {
    let n = r.range(lv(l, 5, 7, 10, 14, 20), lv(l, 8, 11, 16, 24, 40)) as u64;
    let k = r.range(2, (n as i64 / 2).max(2)) as u64;
    let ans = binom(n, k);
    numeric(
        format!("Combien de comités de ${k}$ personnes peut-on former parmi ${n}$ personnes ?"),
        format!("How many committees of ${k}$ people can be formed from ${n}$ people?"),
        ans,
        both(format!("$\\binom{{{n}}}{{{k}}} = {ans}$."), format!("$\\binom{{{n}}}{{{k}}} = {ans}$.")),
    )
}

fn k_chemins_grille(r: &mut Rng, l: u8) -> Out {
    let a = r.range(2, lv(l, 4, 5, 7, 9, 12)) as u64;
    let b = r.range(2, lv(l, 4, 5, 7, 9, 12)) as u64;
    let ans = binom(a + b, a);
    with_hint(
        numeric(
            format!("Sur un quadrillage, combien de chemins mènent du coin $(0, 0)$ au coin $({a}, {b})$ en n'allant que vers la droite ou vers le haut, d'un cran à la fois ?"),
            format!("On a grid, how many paths lead from the corner $(0, 0)$ to the corner $({a}, {b})$ moving only right or up, one step at a time?"),
            ans,
            both(format!("Il faut {a} pas à droite et {b} pas en haut, dans n'importe quel ordre : $\\binom{{{}}}{{{a}}} = {ans}$.", a + b), format!("{a} steps right and {b} steps up in any order: $\\binom{{{}}}{{{a}}} = {ans}$.", a + b)),
        ),
        "Chaque chemin est une suite de pas D et H : choisis la place des D.",
        "Each path is a word of R and U steps: choose the positions of the R's.",
    )
}

fn k_diagonales(r: &mut Rng, l: u8) -> Out {
    let n = r.range(lv(l, 5, 8, 12, 20, 60), lv(l, 9, 16, 30, 80, 500));
    let ans = n * (n - 3) / 2;
    numeric(
        format!("Combien de diagonales possède un polygone convexe à ${n}$ côtés ?"),
        format!("How many diagonals does a convex polygon with ${n}$ sides have?"),
        ans,
        both(format!("Chaque sommet est relié à ${}$ autres par une diagonale, et chaque diagonale compte deux fois : $\\frac{{{n} \\times {}}}{{2}} = {ans}$.", n - 3, n - 3), format!("Each vertex has ${}$ diagonals and each diagonal is counted twice: $\\frac{{{n} \\times {}}}{{2}} = {ans}$.", n - 3, n - 3)),
    )
}

fn k_anagrammes(r: &mut Rng, l: u8) -> Out {
    let letters = ['A', 'B', 'C', 'D', 'E', 'M', 'N', 'R'];
    let kinds = lv(l, 2, 3, 3, 4, 4) as usize;
    let mut counts: Vec<u64> = (0..kinds).map(|_| r.range(1, lv(l, 3, 3, 4, 4, 5)) as u64).collect();
    counts[0] = counts[0].max(2);
    let total: u64 = counts.iter().sum();
    let mut word = String::new();
    for (i, &c) in counts.iter().enumerate() {
        for _ in 0..c {
            word.push(letters[i]);
        }
    }
    // On mélange l'écriture pour ne pas donner les lettres regroupées.
    let mut chars: Vec<char> = word.chars().collect();
    for i in (1..chars.len()).rev() {
        chars.swap(i, r.range(0, i as i64) as usize);
    }
    let shown: String = chars.into_iter().collect();
    let ans = counts.iter().fold(factorial(total), |acc, &c| acc / factorial(c));
    numeric(
        format!("Combien de mots distincts (avec ou sans sens) peut-on former avec toutes les lettres de {shown} ?"),
        format!("How many distinct words (meaningful or not) can be formed using all the letters of {shown}?"),
        ans,
        both(
            format!("${total}!$ divisé par les factorielles des lettres répétées : ${} = {ans}$.", format!("\\frac{{{total}!}}{{{}}}", counts.iter().map(|c| format!("{c}!")).collect::<Vec<_>>().join(" \\times "))),
            format!("${total}!$ divided by the factorials of the repeated letters: ${} = {ans}$.", format!("\\frac{{{total}!}}{{{}}}", counts.iter().map(|c| format!("{c}!")).collect::<Vec<_>>().join(" \\times "))),
        ),
    )
}

fn k_tiroirs_chaussettes(r: &mut Rng, l: u8) -> Out {
    let k = r.range(2, lv(l, 4, 6, 8, 12, 20));
    let m = r.range(2, lv(l, 3, 4, 6, 8, 12));
    let ans = k * (m - 1) + 1;
    let (obj_fr, obj_en) = r.pick(&[("boules", "balls"), ("jetons", "tokens"), ("chaussettes", "socks")]);
    numeric(
        format!("Un sac contient beaucoup de {obj_fr} de ${k}$ couleurs différentes. Combien faut-il en prendre, au minimum, pour être **sûr** d'en avoir ${m}$ de la même couleur ?"),
        format!("A bag contains many {obj_en} of ${k}$ different colours. What is the minimum number you must take to be **sure** of having ${m}$ of the same colour?"),
        ans,
        both(format!("Au pire, on prend ${}$ de chaque couleur ({k} couleurs) sans atteindre ${m}$ : $ {k} \\times {} = {}$ ; le suivant en donne ${m}$ : ${ans}$.", m - 1, m - 1, k * (m - 1)), format!("At worst we take ${}$ of each colour ({k} colours) without reaching ${m}$: ${k} \\times {} = {}$; the next one gives ${m}$: ${ans}$.", m - 1, m - 1, k * (m - 1))),
    )
}

fn k_tiroirs_mois(r: &mut Rng, l: u8) -> Out {
    let boxes = r.pick(&[7i64, 12, 10, 26][..lv(l, 2, 3, 4, 4, 4) as usize]);
    let (box_fr, box_en) = match boxes {
        7 => ("jours de la semaine", "days of the week"),
        12 => ("mois de l'année", "months of the year"),
        10 => ("chiffres de $0$ à $9$", "digits from $0$ to $9$"),
        _ => ("lettres de l'alphabet", "letters of the alphabet"),
    };
    let n = r.range(boxes + 1, boxes * lv(l, 4, 6, 9, 15, 30) + 1);
    let ans = (n + boxes - 1) / boxes;
    numeric(
        format!("On range ${n}$ objets, chacun associé à l'un des {boxes} {box_fr}. Quel est le plus grand entier $m$ tel qu'on soit **sûr** qu'au moins $m$ objets partagent la même valeur ?"),
        format!("${n}$ objects are each assigned one of the {boxes} {box_en}. What is the largest integer $m$ such that at least $m$ objects are **certain** to share the same value?"),
        ans,
        both(format!("Principe des tiroirs : $\\lceil {n}/{boxes} \\rceil = {ans}$."), format!("Pigeonhole principle: $\\lceil {n}/{boxes} \\rceil = {ans}$.")),
    )
}

fn k_invariant_somme(r: &mut Rng, l: u8) -> Out {
    let n = r.range(lv(l, 4, 6, 10, 20, 50), lv(l, 8, 15, 30, 60, 200));
    if r.flip() {
        let ans = n * (n + 1) / 2;
        numeric(
            format!("Les nombres $1, 2, \\dots, {n}$ sont écrits au tableau. À chaque étape, on efface deux nombres $a$ et $b$ et on écrit leur somme $a + b$. Quel nombre reste-t-il à la fin ?"),
            format!("The numbers $1, 2, \\dots, {n}$ are written on a board. At each step, two numbers $a$ and $b$ are erased and their sum $a + b$ is written. What number is left at the end?"),
            ans,
            both(format!("La somme des nombres au tableau ne change pas (invariant) : $1 + 2 + \\dots + {n} = {ans}$."), format!("The sum of the numbers on the board never changes (invariant): $1 + 2 + \\dots + {n} = {ans}$.")),
        )
    } else {
        let even = (n * (n + 1) / 2) % 2 == 0;
        Out {
            typ: "vrai-faux",
            fr: format!("Les nombres $1, 2, \\dots, {n}$ sont écrits au tableau. À chaque étape, on efface deux nombres $a$ et $b$ et on écrit $|a - b|$. Le dernier nombre restant est pair."),
            en: format!("The numbers $1, 2, \\dots, {n}$ are written on a board. At each step, two numbers $a$ and $b$ are erased and $|a - b|$ is written. The last remaining number is even."),
            reponse: json!(even),
            extra: vec![],
            expl: both(
                format!("$|a - b|$ a la même parité que $a + b$ : la parité de la somme est invariante. Ici $1 + \\dots + {n} = {}$ est {}.", n * (n + 1) / 2, if even { "pair" } else { "impair" }),
                format!("$|a - b|$ has the same parity as $a + b$: the parity of the sum is invariant. Here $1 + \\dots + {n} = {}$ is {}.", n * (n + 1) / 2, if even { "even" } else { "odd" }),
            ),
            hint: Some(both("Cherche ce qui ne change jamais à chaque étape.", "Look for what never changes at each step.")),
        }
    }
}

// ------------------------------------------------------------------ suites et sommes

fn k_somme_entiers(r: &mut Rng, l: u8) -> Out {
    let n = r.range(lv(l, 5, 10, 20, 50, 100), lv(l, 20, 60, 120, 300, 1000));
    match r.range(0, 2) {
        0 => {
            let ans = n * (n + 1) / 2;
            numeric(format!("Calcule $1 + 2 + \\dots + {n}$."), format!("Compute $1 + 2 + \\dots + {n}$."), ans, both(format!("$\\frac{{n(n+1)}}{{2}} = \\frac{{{n} \\times {}}}{{2}} = {ans}$.", n + 1), format!("$\\frac{{n(n+1)}}{{2}} = \\frac{{{n} \\times {}}}{{2}} = {ans}$.", n + 1)))
        }
        1 => {
            let ans = n * (n + 1) * (2 * n + 1) / 6;
            numeric(format!("Calcule $1^2 + 2^2 + \\dots + {n}^2$."), format!("Compute $1^2 + 2^2 + \\dots + {n}^2$."), ans, both(format!("$\\frac{{n(n+1)(2n+1)}}{{6}} = {ans}$ pour $n = {n}$."), format!("$\\frac{{n(n+1)(2n+1)}}{{6}} = {ans}$ for $n = {n}$.")))
        }
        _ => {
            let ans = (n * (n + 1) / 2) * (n * (n + 1) / 2);
            let n2 = n.min(60);
            let ans2 = (n2 * (n2 + 1) / 2) * (n2 * (n2 + 1) / 2);
            let _ = ans;
            numeric(format!("Calcule $1^3 + 2^3 + \\dots + {n2}^3$."), format!("Compute $1^3 + 2^3 + \\dots + {n2}^3$."), ans2, both(format!("$\\left(\\frac{{n(n+1)}}{{2}}\\right)^2 = {}^2 = {ans2}$.", n2 * (n2 + 1) / 2), format!("$\\left(\\frac{{n(n+1)}}{{2}}\\right)^2 = {}^2 = {ans2}$.", n2 * (n2 + 1) / 2)))
        }
    }
}

fn k_suite_affine(r: &mut Rng, l: u8) -> Out {
    let u0 = r.range(-3, lv(l, 6, 9, 12, 15, 20));
    let a = r.range(2, lv(l, 3, 3, 4, 5, 6));
    let b = r.range(-5, lv(l, 5, 7, 9, 12, 15));
    let n = r.range(lv(l, 3, 4, 5, 6, 8), lv(l, 5, 6, 8, 10, 14));
    let mut u = u0 as i128;
    for _ in 0..n {
        u = a as i128 * u + b as i128;
    }
    let sign = if b >= 0 { format!("+ {b}") } else { format!("- {}", -b) };
    numeric(
        format!("La suite $(u_n)$ vérifie $u_0 = {u0}$ et $u_{{n+1}} = {a}u_n {sign}$. Calcule $u_{{{n}}}$."),
        format!("The sequence $(u_n)$ satisfies $u_0 = {u0}$ and $u_{{n+1}} = {a}u_n {sign}$. Compute $u_{{{n}}}$."),
        u,
        both(format!("On calcule de proche en proche jusqu'à $u_{{{n}}} = {u}$."), format!("Computing step by step up to $u_{{{n}}} = {u}$.")),
    )
}

fn k_recurrence_lineaire(r: &mut Rng, l: u8) -> Out {
    let (u0, u1) = (r.range(0, 3), r.range(1, 5));
    let p = r.range(1, lv(l, 3, 3, 4, 5, 6));
    let q = r.range(-3, lv(l, 3, 3, 4, 5, 6));
    let q = if q == 0 { 1 } else { q };
    let n = r.range(lv(l, 4, 5, 6, 8, 10), lv(l, 6, 8, 10, 12, 16));
    let (mut a, mut b) = (u0 as i128, u1 as i128);
    for _ in 1..n {
        let c = p as i128 * b + q as i128 * a;
        a = b;
        b = c;
    }
    let rel = format!("u_{{n+2}} = {}u_{{n+1}} {} {}u_n", if p == 1 { String::new() } else { p.to_string() }, if q >= 0 { "+" } else { "-" }, if q.abs() == 1 { String::new() } else { q.abs().to_string() });
    with_hint(
        numeric(
            format!("On pose $u_0 = {u0}$, $u_1 = {u1}$ et ${rel}$. Calcule $u_{{{n}}}$."),
            format!("Let $u_0 = {u0}$, $u_1 = {u1}$ and ${rel}$. Compute $u_{{{n}}}$."),
            b,
            both(format!("On calcule les termes un à un : $u_{{{n}}} = {b}$."), format!("Computing the terms one by one: $u_{{{n}}} = {b}$.")),
        ),
        "Calcule $u_2$, $u_3$, … de proche en proche.",
        "Compute $u_2$, $u_3$, … one after the other.",
    )
}

fn k_periode_fibonacci(r: &mut Rng, l: u8) -> Out {
    let m = r.range(2, lv(l, 7, 10, 13, 20, 30)) as u64;
    // Plus petite période de la suite de Fibonacci modulo m (période de Pisano).
    let (mut a, mut b, mut k) = (0u64, 1u64, 0u64);
    loop {
        let c = (a + b) % m;
        a = b;
        b = c;
        k += 1;
        if a == 0 && b == 1 {
            break;
        }
    }
    if r.flip() {
        // Un terme très éloigné : on réduit l'indice modulo la période.
        let n = r.range(lv(l, 20, 100, 1000, 100000, 1000000000), lv(l, 60, 900, 99999, 9999999, 99999999999)) as u64;
        let (mut x, mut y) = (0u64, 1u64);
        for _ in 0..(n % k) {
            let c = (x + y) % m;
            x = y;
            y = c;
        }
        return with_hint(
            numeric(
                format!("On note $F_0 = 0$, $F_1 = 1$, $F_{{n+2}} = F_{{n+1}} + F_n$. Quel est le reste de la division de $F_{{{n}}}$ par ${m}$ ?"),
                format!("Let $F_0 = 0$, $F_1 = 1$, $F_{{n+2}} = F_{{n+1}} + F_n$. What is the remainder when $F_{{{n}}}$ is divided by ${m}$?"),
                x,
                both(
                    format!("Modulo ${m}$, la suite est périodique de période ${k}$ ; ${n} \\equiv {} \\pmod{{{k}}}$, donc le reste est celui de $F_{{{}}}$ : ${x}$.", n % k, n % k),
                    format!("Modulo ${m}$ the sequence is periodic with period ${k}$; ${n} \\equiv {} \\pmod{{{k}}}$, so the remainder is that of $F_{{{}}}$: ${x}$.", n % k, n % k),
                ),
            ),
            "Cherche d'abord la période de la suite modulo ce nombre.",
            "First find the period of the sequence modulo this number.",
        );
    }
    with_hint(
        numeric(
            format!("On note $F_0 = 0$, $F_1 = 1$, $F_{{n+2}} = F_{{n+1}} + F_n$. Modulo ${m}$, la suite $F_n$ est périodique. Quelle est la plus petite période (le plus petit $k \\ge 1$ tel que $F_k \\equiv 0$ et $F_{{k+1}} \\equiv 1 \\pmod{{{m}}}$) ?"),
            format!("Let $F_0 = 0$, $F_1 = 1$, $F_{{n+2}} = F_{{n+1}} + F_n$. Modulo ${m}$, the sequence $F_n$ is periodic. What is the smallest period (the smallest $k \\ge 1$ with $F_k \\equiv 0$ and $F_{{k+1}} \\equiv 1 \\pmod{{{m}}}$)?"),
            k,
            both(format!("On calcule les termes modulo ${m}$ jusqu'à retrouver le couple $(0, 1)$ : après ${k}$ pas."), format!("Compute the terms modulo ${m}$ until the pair $(0, 1)$ comes back: after ${k}$ steps.")),
        ),
        "Écris les termes modulo $m$ jusqu'à revoir $0, 1$.",
        "Write the terms modulo $m$ until $0, 1$ reappears.",
    )
}

fn k_limite_rationnelle(r: &mut Rng, l: u8) -> Out {
    let (a, c) = (r.range(1, lv(l, 5, 7, 9, 12, 20)), r.range(1, lv(l, 4, 6, 8, 11, 15)));
    let (b, d) = (r.range(-9, 9), r.range(-9, 9));
    if l >= 3 && r.flip() {
        let g = gcd(a as i128, c as i128) as i64;
        numeric(
            format!("Calcule $\\displaystyle\\lim_{{n \\to +\\infty}} \\frac{{{}n^2 {}}}{{{}n^2 {}}}$ (réponds par un nombre ou une fraction).", co(a), term(b, "n"), co(c), konst(d)),
            format!("Compute $\\displaystyle\\lim_{{n \\to +\\infty}} \\frac{{{}n^2 {}}}{{{}n^2 {}}}$ (answer with a number or a fraction).", co(a), term(b, "n"), co(c), konst(d)),
            format!("{}/{}", a / g, c / g),
            both(format!("On divise par $n^2$ : la limite est le rapport des coefficients dominants, $\\frac{{{a}}}{{{c}}}$."), format!("Divide by $n^2$: the limit is the ratio of the leading coefficients, $\\frac{{{a}}}{{{c}}}$.")),
        )
    } else {
        let g = gcd(a as i128, c as i128) as i64;
        numeric(
            format!("Calcule $\\displaystyle\\lim_{{n \\to +\\infty}} \\frac{{{}n {}}}{{{}n {}}}$ (réponds par un nombre ou une fraction).", co(a), konst(b), co(c), konst(d)),
            format!("Compute $\\displaystyle\\lim_{{n \\to +\\infty}} \\frac{{{}n {}}}{{{}n {}}}$ (answer with a number or a fraction).", co(a), konst(b), co(c), konst(d)),
            format!("{}/{}", a / g, c / g),
            both(format!("On divise par $n$ : la limite est $\\frac{{{a}}}{{{c}}}$."), format!("Divide by $n$: the limit is $\\frac{{{a}}}{{{c}}}$.")),
        )
    }
}

fn k_derivee(r: &mut Rng, l: u8) -> Out {
    let k = r.range(-4, lv(l, 4, 5, 6, 7, 9));
    let (a, b, c) = (r.range(1, lv(l, 4, 5, 6, 8, 9)), r.range(-6, 6), r.range(-6, 6));
    if l >= 4 {
        // f(x) = a x^3 + b x^2 + c x : f'(k) = 3 a k^2 + 2 b k + c
        let ans = 3 * a * k * k + 2 * b * k + c;
        numeric(
            format!("Soit $f(x) = {}x^3 {} {}$. Calcule $f'({k})$.", co(a), term(b, "x^2"), term(c, "x")),
            format!("Let $f(x) = {}x^3 {} {}$. Compute $f'({k})$.", co(a), term(b, "x^2"), term(c, "x")),
            ans,
            both(format!("$f'(x) = {}x^2 {} {}$, donc $f'({k}) = {ans}$.", 3 * a, term(2 * b, "x"), konst(c)), format!("$f'(x) = {}x^2 {} {}$, so $f'({k}) = {ans}$.", 3 * a, term(2 * b, "x"), konst(c))),
        )
    } else {
        let ans = 2 * a * k + b;
        numeric(
            format!("Soit $f(x) = {}x^2 {} {}$. Calcule $f'({k})$.", co(a), term(b, "x"), konst(c)),
            format!("Let $f(x) = {}x^2 {} {}$. Compute $f'({k})$.", co(a), term(b, "x"), konst(c)),
            ans,
            both(format!("$f'(x) = {}x {}$, donc $f'({k}) = {ans}$.", 2 * a, konst(b)), format!("$f'(x) = {}x {}$, so $f'({k}) = {ans}$.", 2 * a, konst(b))),
        )
    }
}

fn k_amgm(r: &mut Rng, l: u8) -> Out {
    // Minimum de a x + b / x pour x > 0 : 2 √(ab), entier quand ab est un carré parfait.
    let m = r.range(1, lv(l, 6, 9, 13, 20, 40));
    let a = r.range(1, lv(l, 4, 6, 8, 10, 12));
    // b tel que a b = m^2 · s^2 : on prend b = a · t^2 pour que ab = (a t)^2.
    let t = r.range(1, lv(l, 3, 4, 5, 6, 8));
    let b = a * t * t;
    let ans = 2 * a * t;
    let _ = m;
    with_hint(
        numeric(
            format!("Quelle est la plus petite valeur de ${}x + \\dfrac{{{b}}}{{x}}$ pour $x > 0$ ?", co(a)),
            format!("What is the smallest value of ${}x + \\dfrac{{{b}}}{{x}}$ for $x > 0$?", co(a)),
            ans,
            both(
                format!("Par l'inégalité arithmético-géométrique : ${}x + \\frac{{{b}}}{{x}} \\ge 2\\sqrt{{{a} \\times {b}}} = {ans}$, avec égalité pour $x = {t}$.", co(a)),
                format!("By the AM–GM inequality: ${}x + \\frac{{{b}}}{{x}} \\ge 2\\sqrt{{{a} \\times {b}}} = {ans}$, with equality at $x = {t}$.", co(a)),
            ),
        ),
        "Compare la moyenne arithmétique et la moyenne géométrique de $ax$ et $b/x$.",
        "Compare the arithmetic and geometric means of $ax$ and $b/x$.",
    )
}

// ------------------------------------------------------------------ géométrie

fn k_angle_polygone(r: &mut Rng, l: u8) -> Out {
    let regulier = [3i64, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36];
    if l <= 2 || r.flip() {
        let n = r.range(lv(l, 5, 6, 8, 12, 20), lv(l, 9, 12, 20, 40, 100));
        numeric(
            format!("Quelle est la somme des angles intérieurs (en degrés) d'un polygone convexe à ${n}$ côtés ?"),
            format!("What is the sum of the interior angles (in degrees) of a convex polygon with ${n}$ sides?"),
            (n - 2) * 180,
            both(format!("On découpe en ${}$ triangles : $({n} - 2) \\times 180 = {}$.", n - 2, (n - 2) * 180), format!("Split into ${}$ triangles: $({n} - 2) \\times 180 = {}$.", n - 2, (n - 2) * 180)),
        )
    } else {
        let n = r.pick(&regulier[..(4 + l as usize * 2).min(regulier.len())]);
        let ans = (n - 2) * 180 / n;
        numeric(
            format!("Quelle est la mesure (en degrés) d'un angle intérieur d'un polygone régulier à ${n}$ côtés ?"),
            format!("What is the measure (in degrees) of an interior angle of a regular polygon with ${n}$ sides?"),
            ans,
            both(format!("$\\frac{{({n} - 2) \\times 180}}{{{n}}} = {ans}$."), format!("$\\frac{{({n} - 2) \\times 180}}{{{n}}} = {ans}$.")),
        )
    }
}

fn k_angle_triangle(r: &mut Rng, l: u8) -> Out {
    match r.range(0, 2) {
        0 => {
            let a = r.range(20, 80);
            let b = r.range(20, 170 - a);
            numeric(
                format!("Dans un triangle, deux angles mesurent ${a}^\\circ$ et ${b}^\\circ$. Combien mesure le troisième (en degrés) ?"),
                format!("In a triangle, two angles measure ${a}^\\circ$ and ${b}^\\circ$. How many degrees is the third?"),
                180 - a - b,
                both(format!("La somme des angles d'un triangle vaut $180^\\circ$ : $180 - {a} - {b} = {}$.", 180 - a - b), format!("The angles of a triangle sum to $180^\\circ$: $180 - {a} - {b} = {}$.", 180 - a - b)),
            )
        }
        1 => {
            let c = 2 * r.range(10, lv(l, 40, 60, 80, 85, 88));
            numeric(
                format!("Un angle inscrit dans un cercle intercepte le même arc qu'un angle au centre de ${c}^\\circ$. Combien mesure l'angle inscrit (en degrés) ?"),
                format!("An inscribed angle in a circle intercepts the same arc as a central angle of ${c}^\\circ$. How many degrees is the inscribed angle?"),
                c / 2,
                both(format!("L'angle inscrit vaut la moitié de l'angle au centre : ${c}/2 = {}$.", c / 2), format!("The inscribed angle is half the central angle: ${c}/2 = {}$.", c / 2)),
            )
        }
        _ => {
            let top = 2 * r.range(10, 40);
            numeric(
                format!("Un triangle isocèle a un angle au sommet de ${top}^\\circ$. Combien mesure chacun de ses angles à la base (en degrés) ?"),
                format!("An isosceles triangle has an apex angle of ${top}^\\circ$. How many degrees is each of its base angles?"),
                (180 - top) / 2,
                both(format!("$\\frac{{180 - {top}}}{{2}} = {}$.", (180 - top) / 2), format!("$\\frac{{180 - {top}}}{{2}} = {}$.", (180 - top) / 2)),
            )
        }
    }
}

fn k_pythagore(r: &mut Rng, l: u8) -> Out {
    let triples: [(i64, i64, i64); 10] = [(3, 4, 5), (5, 12, 13), (8, 15, 17), (7, 24, 25), (20, 21, 29), (9, 40, 41), (12, 35, 37), (11, 60, 61), (28, 45, 53), (33, 56, 65)];
    let (a, b, c) = r.pick(&triples[..(2 + 2 * l as usize).min(10)]);
    let k = r.range(1, lv(l, 3, 4, 6, 8, 10));
    let (a, b, c) = (a * k, b * k, c * k);
    if r.flip() {
        numeric(
            format!("Un triangle rectangle a des côtés de l'angle droit de longueurs ${a}$ et ${b}$. Quelle est la longueur de l'hypoténuse ?"),
            format!("A right triangle has legs of lengths ${a}$ and ${b}$. What is the length of the hypotenuse?"),
            c,
            both(format!("${a}^2 + {b}^2 = {} = {c}^2$ (théorème de Pythagore).", a * a + b * b), format!("${a}^2 + {b}^2 = {} = {c}^2$ (Pythagorean theorem).", a * a + b * b)),
        )
    } else {
        numeric(
            format!("Un triangle rectangle a une hypoténuse de longueur ${c}$ et un côté de l'angle droit de longueur ${a}$. Quelle est l'aire du triangle ?"),
            format!("A right triangle has hypotenuse ${c}$ and one leg of length ${a}$. What is the area of the triangle?"),
            if (a * b) % 2 == 0 { (a * b / 2).to_string() } else { format!("{}/2", a * b) },
            both(format!("L'autre côté vaut $\\sqrt{{{c}^2 - {a}^2}} = {b}$ ; aire $= \\frac{{{a} \\times {b}}}{{2}}$."), format!("The other leg is $\\sqrt{{{c}^2 - {a}^2}} = {b}$; area $= \\frac{{{a} \\times {b}}}{{2}}$.")),
        )
    }
}

fn k_integrale(r: &mut Rng, l: u8) -> Out {
    let (a, b, k) = (r.range(1, lv(l, 4, 5, 6, 8, 9)), r.range(-5, 6), r.range(1, lv(l, 4, 5, 6, 7, 9)));
    // ∫_0^k (a x + b) dx = a k² / 2 + b k
    let num = a * k * k + 2 * b * k;
    let ans = if num % 2 == 0 { (num / 2).to_string() } else { format!("{num}/2") };
    numeric(
        format!("Calcule $\\displaystyle\\int_0^{{{k}}} ({}x {})\\,dx$ (nombre ou fraction).", co(a), konst(b)),
        format!("Compute $\\displaystyle\\int_0^{{{k}}} ({}x {})\\,dx$ (number or fraction).", co(a), konst(b)),
        ans.clone(),
        both(
            format!("Une primitive est $\\frac{{{a}}}{{2}}x^2 {}$ : on obtient ${ans}$.", term(b, "x")),
            format!("An antiderivative is $\\frac{{{a}}}{{2}}x^2 {}$: we get ${ans}$.", term(b, "x")),
        ),
    )
}

/// Tous les modèles, avec les notions d'entraînement auxquelles ils se rattachent.
pub const KINDS: &[Kind] = &[
    Kind { id: "pgcd", theme: "arithmétique", notions: &["divisibilite-bases"], build: k_pgcd },
    Kind { id: "reste-puissance", theme: "arithmétique", notions: &["divisibilite-bases", "suites-periodes-sommes"], build: k_reste_puissance },
    Kind { id: "chiffre-unites", theme: "arithmétique", notions: &["divisibilite-bases", "suites-periodes-sommes"], build: k_chiffre_unites },
    Kind { id: "nb-diviseurs", theme: "arithmétique", notions: &["divisibilite-bases"], build: k_nb_diviseurs },
    Kind { id: "premier-suivant", theme: "arithmétique", notions: &["contre-exemples", "divisibilite-bases"], build: k_premier_suivant },
    Kind { id: "est-premier", theme: "arithmétique", notions: &["contre-exemples", "divisibilite-bases"], build: k_est_premier },
    Kind { id: "division-euclidienne", theme: "arithmétique", notions: &["divisibilite-bases"], build: k_division_euclidienne },
    Kind { id: "inverse-modulaire", theme: "arithmétique", notions: &["divisibilite-bases"], build: k_inverse_modulaire },
    Kind { id: "base", theme: "arithmétique", notions: &["divisibilite-bases"], build: k_base },
    Kind { id: "diviseurs-premiers", theme: "arithmétique", notions: &["divisibilite-bases"], build: k_diviseurs_premiers },
    Kind { id: "qcm-premiers", theme: "arithmétique", notions: &["contre-exemples", "divisibilite-bases"], build: k_qcm_premiers },
    Kind { id: "divisibilite-vf", theme: "arithmétique", notions: &["divisibilite-bases"], build: k_divisibilite_vf },
    Kind { id: "euler-contre-exemple", theme: "arithmétique", notions: &["contre-exemples"], build: k_euler_contre_exemple },
    Kind { id: "comites", theme: "combinatoire", notions: &["denombrement"], build: k_comites },
    Kind { id: "chemins-grille", theme: "combinatoire", notions: &["denombrement"], build: k_chemins_grille },
    Kind { id: "diagonales", theme: "combinatoire", notions: &["denombrement", "geometrie-angles"], build: k_diagonales },
    Kind { id: "anagrammes", theme: "combinatoire", notions: &["denombrement"], build: k_anagrammes },
    Kind { id: "tiroirs-chaussettes", theme: "combinatoire", notions: &["tiroirs-bases"], build: k_tiroirs_chaussettes },
    Kind { id: "tiroirs-valeurs", theme: "combinatoire", notions: &["tiroirs-bases"], build: k_tiroirs_mois },
    Kind { id: "invariant-somme", theme: "combinatoire", notions: &["invariants", "principe-extremal"], build: k_invariant_somme },
    Kind { id: "somme-entiers", theme: "algèbre", notions: &["recurrence-sommes"], build: k_somme_entiers },
    Kind { id: "suite-affine", theme: "algèbre", notions: &["recurrence-sommes", "suites-lineaires"], build: k_suite_affine },
    Kind { id: "recurrence-lineaire", theme: "algèbre", notions: &["suites-lineaires"], build: k_recurrence_lineaire },
    Kind { id: "periode-fibonacci", theme: "arithmétique", notions: &["suites-periodes-sommes"], build: k_periode_fibonacci },
    Kind { id: "amgm-minimum", theme: "algèbre", notions: &["inegalites-moyennes"], build: k_amgm },
    Kind { id: "limite-rationnelle", theme: "analyse", notions: &["suites-convergence"], build: k_limite_rationnelle },
    Kind { id: "derivee", theme: "analyse", notions: &["suites-convergence"], build: k_derivee },
    Kind { id: "integrale", theme: "analyse", notions: &["suites-convergence"], build: k_integrale },
    Kind { id: "angle-polygone", theme: "géométrie", notions: &["geometrie-angles"], build: k_angle_polygone },
    Kind { id: "angle-triangle", theme: "géométrie", notions: &["geometrie-angles"], build: k_angle_triangle },
    Kind { id: "pythagore", theme: "géométrie", notions: &["geometrie-angles"], build: k_pythagore },
];

/// Liste des modèles : [{id, theme, notions}].
pub fn kinds_json() -> String {
    Value::Array(KINDS.iter().map(|k| json!({"id": k.id, "theme": k.theme, "notions": k.notions})).collect()).to_string()
}

/// Construit la question du modèle `kind`, au niveau `level` (1 à 5), avec la graine `seed`. `None` si le modèle est inconnu.
pub fn generate(kind: &str, level: u8, seed: u64) -> Option<Value> {
    let k = KINDS.iter().find(|k| k.id == kind)?;
    let level = level.clamp(1, 5);
    // La graine est mêlée à l'identifiant du modèle : deux modèles de même graine ne tirent pas les mêmes nombres.
    let mix = kind.bytes().fold(0xCBF2_9CE4_8422_2325u64, |h, b| (h ^ b as u64).wrapping_mul(0x0000_0100_0000_01B3));
    let mut rng = Rng::new(seed ^ mix ^ ((level as u64) << 56));
    let o = (k.build)(&mut rng, level);
    let mut q = json!({
        "id": format!("g:{}:{}:{}", k.id, level, seed),
        "generated": true,
        "type": o.typ,
        "difficulte": level,
        "theme": k.theme,
        "notion": k.notions[0],
        "enonce": {"fr": o.fr, "en": o.en},
        "explication": {"fr": o.expl.0, "en": o.expl.1},
    });
    if !o.reponse.is_null() {
        q["reponse"] = o.reponse;
    }
    if let Some(h) = o.hint {
        q["indice"] = json!({"fr": h.0, "en": h.1});
    }
    for (key, v) in o.extra {
        q[key] = v;
    }
    Some(q)
}

/// Même chose, depuis et vers du JSON : `{"kind","niveau","seed"}` → question (ou `{"error"}`).
pub fn generate_json(spec: &str) -> String {
    let Ok(v) = serde_json::from_str::<Value>(spec) else { return json!({"error": "bad_json"}).to_string() };
    let kind = v["kind"].as_str().unwrap_or("");
    let level = v["niveau"].as_u64().unwrap_or(1).min(5) as u8;
    let seed = v["seed"].as_u64().unwrap_or(0);
    generate(kind, level, seed).unwrap_or_else(|| json!({"error": "unknown_kind"})).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::check::check;

    /// Les entiers écrits seuls entre dollars dans un énoncé : « ... $48$ et $18$ ... » → [48, 18].
    fn nums(s: &str) -> Vec<i128> {
        s.split('$').skip(1).step_by(2).filter_map(|t| t.trim().parse::<i128>().ok()).collect()
    }

    /// La réponse attendue, mise sous la forme que saisirait un élève.
    fn good_answer(q: &Value) -> Value {
        match q["type"].as_str().unwrap() {
            "numeric" => q["reponse"].clone(),
            "vrai-faux" => q["reponse"].clone(),
            "qcm" => q["bonnes"].clone(),
            "n-uplet" => json!(format!("({})", q["reponse"].as_array().unwrap().iter().map(|v| v.as_str().unwrap().to_string()).collect::<Vec<_>>().join(", "))),
            "ensemble" => json!(format!("{{{}}}", q["reponse"].as_array().unwrap().iter().map(|v| v.as_str().unwrap().to_string()).collect::<Vec<_>>().join(", "))),
            t => panic!("type inattendu {t}"),
        }
    }

    #[test]
    fn chaque_modele_chaque_niveau_donne_une_question_corrigeable() {
        for k in KINDS {
            for level in 1..=5u8 {
                for seed in 0..120u64 {
                    let q = generate(k.id, level, seed).unwrap();
                    let ctx = format!("{} niveau {level} graine {seed}", k.id);
                    assert_eq!(q["id"], json!(format!("g:{}:{level}:{seed}", k.id)), "{ctx}");
                    assert_eq!(q["generated"], json!(true));
                    for lang in ["fr", "en"] {
                        assert!(!q["enonce"][lang].as_str().unwrap_or("").is_empty(), "{ctx} : énoncé {lang}");
                        assert!(!q["explication"][lang].as_str().unwrap_or("").is_empty(), "{ctx} : explication {lang}");
                    }
                    let v = check(&q, &good_answer(&q));
                    assert_eq!(v["status"], "correct", "{ctx} : la bonne réponse est refusée : {q}");
                }
            }
        }
    }

    /// Typographie : pas de coefficient « 1 » devant une inconnue ($1x$, $1n$), dans aucune langue.
    #[test]
    fn pas_de_coefficient_un_devant_une_inconnue() {
        for k in KINDS {
            for level in 1..=5u8 {
                for seed in 0..200u64 {
                    let q = generate(k.id, level, seed).unwrap();
                    for field in ["enonce", "explication"] {
                        for lang in ["fr", "en"] {
                            let t: Vec<char> = q[field][lang].as_str().unwrap().chars().collect();
                            for i in 0..t.len().saturating_sub(1) {
                                let seul = i == 0 || !(t[i - 1].is_ascii_digit() || t[i - 1] == '.' || t[i - 1] == '^' || t[i - 1] == '_' || t[i - 1] == '{');
                                if t[i] == '1' && seul && matches!(t[i + 1], 'x' | 'n') && t.get(i + 2).map_or(true, |c| !c.is_alphabetic()) {
                                    panic!("{} niveau {level} graine {seed} : coefficient 1 devant une inconnue dans {field} {lang} : {}", k.id, q[field][lang]);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    #[test]
    fn une_mauvaise_reponse_est_refusee() {
        for k in KINDS {
            for seed in 0..40u64 {
                let q = generate(k.id, 3, seed).unwrap();
                let wrong = match q["type"].as_str().unwrap() {
                    "numeric" => {
                        let s = q["reponse"].as_str().unwrap();
                        if s.contains('/') {
                            json!(format!("{s}+1"))
                        } else {
                            json!((s.parse::<i128>().unwrap() + 1).to_string())
                        }
                    }
                    "vrai-faux" => json!(!q["reponse"].as_bool().unwrap()),
                    "qcm" => {
                        let n = q["choix"].as_array().unwrap().len() as i64;
                        let bonnes: Vec<i64> = q["bonnes"].as_array().unwrap().iter().map(|v| v.as_i64().unwrap()).collect();
                        json!((0..n).filter(|i| !bonnes.contains(i)).chain(std::iter::once(-1).filter(|_| false)).collect::<Vec<_>>())
                    }
                    "n-uplet" => json!("(0, 0)"),
                    "ensemble" => json!("{1}"),
                    _ => continue,
                };
                if wrong == json!([]) {
                    continue; // QCM dont toutes les cases sont bonnes : rien de faux à proposer
                }
                let st = check(&q, &wrong)["status"].as_str().unwrap().to_string();
                assert_eq!(st, "incorrect", "{} graine {seed} : une réponse fausse est acceptée : {q}", k.id);
            }
        }
    }

    #[test]
    fn meme_graine_meme_question_et_graines_differentes_questions_differentes() {
        for k in KINDS {
            for level in 1..=5u8 {
                assert_eq!(generate(k.id, level, 7), generate(k.id, level, 7), "{} n'est pas reproductible", k.id);
            }
            // Variété : sur 200 graines au niveau 3, beaucoup d'énoncés différents.
            let distinct: std::collections::HashSet<String> = (0..200u64)
                .map(|s| {
                    let q = generate(k.id, 3, s).unwrap();
                    format!("{}{}", q["enonce"]["fr"], q["choix"])
                })
                .collect();
            assert!(distinct.len() >= 18, "{} : seulement {} énoncés différents sur 200 graines", k.id, distinct.len());
        }
        // Deux modèles de même graine ne tirent pas les mêmes nombres.
        assert_ne!(generate("pgcd", 3, 1).unwrap()["enonce"]["fr"], generate("nb-diviseurs", 3, 1).unwrap()["enonce"]["fr"]);
    }

    #[test]
    fn les_outils_de_calcul_sont_exacts() {
        for a in 1..60i128 {
            for b in 1..60i128 {
                let brute = (1..=a.min(b)).rev().find(|d| a % d == 0 && b % d == 0).unwrap();
                assert_eq!(gcd(a, b), brute);
            }
        }
        for base in 2..12u128 {
            for m in 2..30u128 {
                let mut x = 1u128;
                for e in 0..40u128 {
                    assert_eq!(mod_pow(base, e, m), x % m, "{base}^{e} mod {m}");
                    x = x * base % m;
                }
            }
        }
        let premiers: Vec<u64> = (2..200).filter(|&n| (2..n).all(|d| n % d != 0)).collect();
        for n in 0..200u64 {
            assert_eq!(is_prime(n), premiers.contains(&n), "{n}");
        }
        for n in 2..500u64 {
            assert_eq!(factor(n).iter().map(|&(p, e)| p.pow(e)).product::<u64>(), n);
        }
        // Pascal : C(n, k) = C(n-1, k-1) + C(n-1, k).
        for n in 1..40u64 {
            for k in 1..n {
                assert_eq!(binom(n, k), binom(n - 1, k - 1) + binom(n - 1, k));
            }
        }
        assert_eq!(factorial(20), 2_432_902_008_176_640_000);
    }

    /// Recalcul indépendant, par force brute, à partir des nombres lus dans l'énoncé.
    #[test]
    fn reponses_recalculees_par_force_brute() {
        for level in 1..=5u8 {
            for seed in 0..150u64 {
                let get = |id: &str| generate(id, level, seed).unwrap();
                let ans = |q: &Value| q["reponse"].as_str().unwrap().parse::<i128>().unwrap();

                let q = get("pgcd");
                let n = nums(q["enonce"]["fr"].as_str().unwrap());
                let brute = (1..=n[0].min(n[1])).rev().find(|d| n[0] % d == 0 && n[1] % d == 0).unwrap();
                assert_eq!(ans(&q), brute, "pgcd {n:?}");

                let q = get("nb-diviseurs");
                let n = nums(q["enonce"]["fr"].as_str().unwrap())[0];
                assert_eq!(ans(&q), (1..=n).filter(|d| n % d == 0).count() as i128, "diviseurs de {n}");

                let q = get("premier-suivant");
                let n = nums(q["enonce"]["fr"].as_str().unwrap())[0];
                let mut p = n + 1;
                while !(2..p).take_while(|d| d * d <= p).all(|d| p % d != 0) {
                    p += 1;
                }
                assert_eq!(ans(&q), p, "premier après {n}");

                let q = get("est-premier");
                let n = nums(q["enonce"]["fr"].as_str().unwrap())[0];
                let prime = n > 1 && (2..n).take_while(|d| d * d <= n).all(|d| n % d != 0);
                assert_eq!(q["reponse"].as_bool().unwrap(), prime, "{n} premier ?");

                let q = get("division-euclidienne");
                let n = nums(q["enonce"]["fr"].as_str().unwrap());
                let r = q["reponse"].as_array().unwrap();
                assert_eq!((n[0] / n[1]).to_string(), r[0].as_str().unwrap());
                assert_eq!((n[0] % n[1]).to_string(), r[1].as_str().unwrap());

                let q = get("comites");
                let n = nums(q["enonce"]["fr"].as_str().unwrap());
                // Pascal par programmation dynamique, indépendante de `binom`.
                let mut c = vec![vec![0i128; 45]; 45];
                for i in 0..45 {
                    c[i][0] = 1;
                    for j in 1..=i {
                        c[i][j] = c[i - 1][j - 1] + if j < i { c[i - 1][j] } else { 0 };
                    }
                }
                assert_eq!(ans(&q), c[n[1] as usize][n[0] as usize], "comités {n:?}");

                let q = get("diagonales");
                let n = nums(q["enonce"]["fr"].as_str().unwrap())[0];
                let pairs = n * (n - 1) / 2;
                assert_eq!(ans(&q), pairs - n, "diagonales de {n} côtés");

                let q = get("tiroirs-chaussettes");
                let n = nums(q["enonce"]["fr"].as_str().unwrap());
                let (k, m) = (n[0], n[1]);
                // Plus petit t tel que toute répartition de t objets en k couleurs contient m objets d'une même couleur.
                let t = (1..).find(|&t| (t + k - 1) / k >= m).unwrap();
                assert_eq!(ans(&q), t, "chaussettes {n:?}");

                let q = get("tiroirs-valeurs");
                let n = nums(q["enonce"]["fr"].as_str().unwrap());
                let boxes_text = q["enonce"]["fr"].as_str().unwrap();
                let boxes: i128 = ["7 jours", "12 mois", "10 chiffres", "26 lettres"].iter().find_map(|s| boxes_text.contains(*s).then(|| s.split(' ').next().unwrap().parse().unwrap())).unwrap();
                assert_eq!(ans(&q), (n[0] + boxes - 1) / boxes, "tiroirs {n:?} / {boxes}");

                let q = get("somme-entiers");
                let s = q["enonce"]["fr"].as_str().unwrap();
                let n = nums(&s.replace("^2", "").replace("^3", "").replace("\\dots", "").replace(", ", " "));
                let last = *n.last().unwrap_or(&0);
                let _ = last;

                let q = get("inverse-modulaire");
                let s = q["enonce"]["fr"].as_str().unwrap();
                let x = ans(&q);
                // « a x ≡ 1 (mod m) » : on relit m et a dans le texte.
                let m: i128 = s.split("0 < x < ").nth(1).unwrap().split('$').next().unwrap().parse().unwrap();
                let a: i128 = s.split("vérifie $").nth(1).unwrap().split('x').next().unwrap().parse().unwrap();
                assert_eq!(a * x % m, 1, "inverse de {a} modulo {m}");
                assert!(0 < x && x < m);

                let q = get("periode-fibonacci");
                let txt = q["enonce"]["fr"].as_str().unwrap();
                let k = ans(&q);
                if let Some(rest) = txt.split("Modulo $").nth(1) {
                    let m: i128 = rest.split('$').next().unwrap().parse().unwrap();
                    let fib = |n: i128| {
                        let (mut a, mut b) = (0i128, 1i128);
                        for _ in 0..n {
                            (a, b) = (b, (a + b) % m);
                        }
                        a
                    };
                    assert_eq!((fib(k), fib(k + 1)), (0, 1 % m), "période {k} modulo {m}");
                    assert!((1..k).all(|j| (fib(j), fib(j + 1)) != (0, 1 % m)), "période pas minimale modulo {m}");
                } else {
                    // F_n mod m, n énorme : recalcul par doublement matriciel (exact, indépendant de la période).
                    let n: i128 = txt.split("division de $F_{").nth(1).unwrap().split('}').next().unwrap().parse().unwrap();
                    let m = *nums(txt).last().unwrap();
                    let mul = |x: [[u128; 2]; 2], y: [[u128; 2]; 2], m: u128| {
                        let mut z = [[0u128; 2]; 2];
                        for i in 0..2 {
                            for j in 0..2 {
                                for t in 0..2 {
                                    z[i][j] = (z[i][j] + x[i][t] * y[t][j]) % m;
                                }
                            }
                        }
                        z
                    };
                    let (mut e, mut base, mut acc) = (n as u128, [[1u128, 1], [1, 0]], [[1u128, 0], [0, 1]]);
                    while e > 0 {
                        if e & 1 == 1 {
                            acc = mul(acc, base, m as u128);
                        }
                        base = mul(base, base, m as u128);
                        e >>= 1;
                    }
                    assert_eq!(k as u128, acc[0][1] % m as u128, "F_{n} mod {m}");
                }
            }
        }
    }

    /// Écrit des questions générées dans le fichier `COMIMA_GEN_DUMP` (pour les recalculer avec un autre outil) :
    /// `COMIMA_GEN_DUMP=/tmp/q.json cargo test --release --lib gen::tests::exporter -- --ignored`
    #[test]
    #[ignore]
    fn exporter() {
        let Ok(path) = std::env::var("COMIMA_GEN_DUMP") else { return };
        let mut all = Vec::new();
        for k in KINDS {
            for level in 1..=5u8 {
                for seed in 0..300u64 {
                    all.push(generate(k.id, level, seed).unwrap());
                }
            }
        }
        std::fs::write(path, serde_json::to_string(&all).unwrap()).unwrap();
    }
}
