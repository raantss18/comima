//! Rationnels exacts sur i128 (toute opération qui déborde renvoie None).

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Rat {
    pub n: i128,
    pub d: i128, // > 0, fraction irréductible
}

fn gcd(mut a: u128, mut b: u128) -> u128 {
    while b != 0 {
        let t = a % b;
        a = b;
        b = t;
    }
    a
}

impl Rat {
    pub fn new(n: i128, d: i128) -> Option<Rat> {
        if d == 0 {
            return None;
        }
        let g = gcd(n.unsigned_abs(), d.unsigned_abs()).max(1) as i128;
        let (mut n, mut d) = (n / g, d / g);
        if d < 0 {
            n = n.checked_neg()?;
            d = d.checked_neg()?;
        }
        Some(Rat { n, d })
    }

    pub fn int(n: i128) -> Rat {
        Rat { n, d: 1 }
    }

    pub fn is_int(&self) -> bool {
        self.d == 1
    }

    pub fn add(self, o: Rat) -> Option<Rat> {
        Rat::new(
            self.n.checked_mul(o.d)?.checked_add(o.n.checked_mul(self.d)?)?,
            self.d.checked_mul(o.d)?,
        )
    }

    pub fn neg(self) -> Option<Rat> {
        Some(Rat { n: self.n.checked_neg()?, d: self.d })
    }

    pub fn sub(self, o: Rat) -> Option<Rat> {
        self.add(o.neg()?)
    }

    pub fn mul(self, o: Rat) -> Option<Rat> {
        Rat::new(self.n.checked_mul(o.n)?, self.d.checked_mul(o.d)?)
    }

    pub fn div(self, o: Rat) -> Option<Rat> {
        if o.n == 0 {
            return None;
        }
        Rat::new(self.n.checked_mul(o.d)?, self.d.checked_mul(o.n)?)
    }

    pub fn pow(self, e: i64) -> Option<Rat> {
        let base = if e < 0 { Rat::int(1).div(self)? } else { self };
        let e = u32::try_from(e.unsigned_abs()).ok()?;
        Rat::new(base.n.checked_pow(e)?, base.d.checked_pow(e)?)
    }

    pub fn to_f64(self) -> f64 {
        self.n as f64 / self.d as f64
    }

    /// Valeur modulo un nombre premier p (None si le dénominateur est divisible par p).
    pub fn modp(self, p: u64) -> Option<u64> {
        let pn = p as i128;
        let n = self.n.rem_euclid(pn) as u64;
        let d = self.d.rem_euclid(pn) as u64;
        Some(mulmod(n, inv(d, p)?, p))
    }

    /// « 12 », « 0.125 », « 3. » (point décimal, chiffres seulement).
    pub fn parse_decimal(s: &str) -> Option<Rat> {
        let (ent, frac) = match s.split_once('.') {
            Some((a, b)) => (a, b),
            None => (s, ""),
        };
        if ent.len() + frac.len() == 0 || ent.len() + frac.len() > 36 {
            return None;
        }
        if !ent.bytes().chain(frac.bytes()).all(|c| c.is_ascii_digit()) {
            return None;
        }
        let digits = format!("{ent}{frac}");
        let n: i128 = digits.parse().ok()?;
        let d = 10i128.checked_pow(frac.len() as u32)?;
        Rat::new(n, d)
    }
}

pub fn mulmod(a: u64, b: u64, p: u64) -> u64 {
    ((a as u128 * b as u128) % p as u128) as u64
}

pub fn powmod(mut b: u64, mut e: u64, p: u64) -> u64 {
    let mut r = 1 % p;
    b %= p;
    while e > 0 {
        if e & 1 == 1 {
            r = mulmod(r, b, p);
        }
        b = mulmod(b, b, p);
        e >>= 1;
    }
    r
}

/// Inverse modulo p premier (Fermat).
pub fn inv(a: u64, p: u64) -> Option<u64> {
    if a % p == 0 {
        None
    } else {
        Some(powmod(a, p - 2, p))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn arithmetique() {
        let a = Rat::new(6, -8).unwrap();
        assert_eq!(a, Rat { n: -3, d: 4 });
        assert_eq!(a.add(Rat::int(1)).unwrap(), Rat::new(1, 4).unwrap());
        assert_eq!(Rat::parse_decimal("0.125").unwrap(), Rat::new(1, 8).unwrap());
        assert_eq!(Rat::int(2).pow(-3).unwrap(), Rat::new(1, 8).unwrap());
        assert!(Rat::int(10).pow(60).is_none());
        assert_eq!(Rat::new(1, 2).unwrap().modp(7), Some(4));
    }
}
