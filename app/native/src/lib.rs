//! Cœur de l'application COMIMa (Rust) : correction des réponses et vérification des paquets.
//! Interface C minimale (chaînes JSON UTF-8) appelée depuis Dart par `dart:ffi`.
//! Le même code pourra être compilé en WebAssembly pour la recorrection côté serveur.

pub mod check;
pub mod expr;
pub mod num;

use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::ffi::{c_char, CStr, CString};
use std::panic::{catch_unwind, AssertUnwindSafe};

pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Corrige `answer` pour `question` (deux objets JSON) ; renvoie le verdict en JSON.
pub fn check_json(question: &str, answer: &str) -> String {
    let parsed = serde_json::from_str::<Value>(question).and_then(|q| Ok((q, serde_json::from_str::<Value>(answer)?)));
    match parsed {
        Ok((q, a)) => check::check(&q, &a).to_string(),
        Err(_) => check::verdict("invalid", Some("bad_json".into())).to_string(),
    }
}

/// Aperçu LaTeX de ce que l'élève tape : {"ok":true,"latex":…} ou {"ok":false,"code":…}.
pub fn preview_json(input: &str, vars: &str) -> String {
    let vars: Vec<String> = serde_json::from_str(vars).unwrap_or_default();
    match expr::parse(input, &vars) {
        Ok(e) => json!({ "ok": true, "latex": expr::to_latex(&e, &vars) }),
        Err(e) => json!({ "ok": false, "code": e.code() }),
    }
    .to_string()
}

/// Clé publique Ed25519 des mises à jour (clé privée dans release-keys/, ignoré par Git, voir
/// app/RELEASING.md). Toute version de l'application vérifie `release.json` avec elle.
pub const UPDATE_KEY: [u8; 32] = [
    0xce, 0x10, 0xc3, 0x1f, 0xde, 0xab, 0xd7, 0xaf, 0xf1, 0xcf, 0x43, 0x2d, 0x7a, 0xaf, 0xdd, 0xfc,
    0x0e, 0xca, 0x03, 0xbb, 0x98, 0x2d, 0xac, 0x13, 0x97, 0xa4, 0x81, 0x94, 0xfc, 0x13, 0xf9, 0x17,
];

/// Vrai si `sig_hex` (64 octets en hexadécimal) est une signature Ed25519 valide de `data`.
pub fn verify_signature(data: &[u8], sig_hex: &str, key: &[u8; 32]) -> bool {
    let hex = sig_hex.trim();
    if hex.len() != 128 || !hex.is_ascii() {
        return false;
    }
    let mut sig = [0u8; 64];
    for (i, b) in sig.iter_mut().enumerate() {
        match u8::from_str_radix(&hex[2 * i..2 * i + 2], 16) {
            Ok(v) => *b = v,
            Err(_) => return false,
        }
    }
    let Ok(vk) = ed25519_dalek::VerifyingKey::from_bytes(key) else { return false };
    vk.verify_strict(data, &ed25519_dalek::Signature::from_bytes(&sig)).is_ok()
}

pub fn sha256_hex(data: &[u8]) -> String {
    Sha256::digest(data).iter().map(|b| format!("{b:02x}")).collect()
}

// ---------------------------------------------------------------- interface C

fn guarded(f: impl FnOnce() -> String) -> *mut c_char {
    let s = catch_unwind(AssertUnwindSafe(f))
        .unwrap_or_else(|_| check::verdict("invalid", Some("internal".into())).to_string());
    CString::new(s).unwrap_or_default().into_raw()
}

unsafe fn arg<'a>(p: *const c_char) -> &'a str {
    if p.is_null() {
        ""
    } else {
        CStr::from_ptr(p).to_str().unwrap_or("")
    }
}

/// # Safety
/// `question` et `answer` : chaînes C UTF-8 valides ; libérer le résultat avec `comima_free`.
#[no_mangle]
pub unsafe extern "C" fn comima_check(question: *const c_char, answer: *const c_char) -> *mut c_char {
    let (q, a) = (arg(question), arg(answer));
    guarded(|| check_json(q, a))
}

/// # Safety
/// Chaînes C UTF-8 valides ; libérer le résultat avec `comima_free`.
#[no_mangle]
pub unsafe extern "C" fn comima_preview(input: *const c_char, vars: *const c_char) -> *mut c_char {
    let (i, v) = (arg(input), arg(vars));
    guarded(|| preview_json(i, v))
}

/// # Safety
/// `data` doit pointer vers `len` octets lisibles.
#[no_mangle]
pub unsafe extern "C" fn comima_sha256(data: *const u8, len: usize) -> *mut c_char {
    let bytes = if data.is_null() { &[][..] } else { std::slice::from_raw_parts(data, len) };
    guarded(|| sha256_hex(bytes))
}

/// # Safety
/// `data` doit pointer vers `len` octets lisibles ; `sig_hex` : chaîne C. Renvoie 1 si valide.
#[no_mangle]
pub unsafe extern "C" fn comima_verify_release(data: *const u8, len: usize, sig_hex: *const c_char) -> i32 {
    let bytes = if data.is_null() { &[][..] } else { std::slice::from_raw_parts(data, len) };
    let sig = arg(sig_hex);
    catch_unwind(AssertUnwindSafe(|| verify_signature(bytes, sig, &UPDATE_KEY) as i32)).unwrap_or(0)
}

#[no_mangle]
pub extern "C" fn comima_version() -> *mut c_char {
    guarded(|| VERSION.to_string())
}

/// # Safety
/// `s` doit venir d'une fonction `comima_*` et n'être libéré qu'une fois.
#[no_mangle]
pub unsafe extern "C" fn comima_free(s: *mut c_char) {
    if !s.is_null() {
        drop(CString::from_raw(s));
    }
}
