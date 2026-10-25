//! Chaque réponse attendue de la banque (content/app/notions) doit être acceptée par le moteur,
//! et quelques réponses fausses évidentes refusées.
use serde_json::{json, Value};
use std::path::Path;

fn notions() -> Vec<Value> {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../content/app/notions");
    let mut out = vec![];
    for f in std::fs::read_dir(dir).unwrap() {
        let p = f.unwrap().path();
        if p.extension().is_some_and(|e| e == "yaml") {
            let y: serde_yaml::Value = serde_yaml::from_str(&std::fs::read_to_string(&p).unwrap()).unwrap();
            out.push(serde_json::to_value(y).unwrap());
        }
    }
    out
}

fn bonne_reponse(q: &Value) -> Option<Value> {
    Some(match q["type"].as_str()? {
        "qcm" => q["bonnes"].clone(),
        "vrai-faux" => q["reponse"].clone(),
        "numeric" | "expression" | "intervalle" => json!(q["reponse"].to_string().trim_matches('"')),
        "ensemble" | "n-uplet" => {
            let l: Vec<String> = q["reponse"].as_array()?.iter().map(|v| v.to_string().trim_matches('"').to_string()).collect();
            json!(l.join("; "))
        }
        "ordre" => json!((0..q["etapes"].as_array()?.len()).collect::<Vec<_>>()),
        "trous" => Value::Array(q["trous"].as_array()?.iter().map(|t| bonne_reponse(t).unwrap()).collect()),
        _ => return None,
    })
}

#[test]
fn reponses_attendues_acceptees() {
    let mut n = 0;
    for notion in notions() {
        for q in notion["questions"].as_array().unwrap() {
            if let Some(a) = bonne_reponse(q) {
                let v = comima_core::check::check(q, &a);
                assert_eq!(v["status"], "correct", "{} : {a} → {v}", q["id"]);
                n += 1;
            }
        }
    }
    assert!(n > 10);
}

#[test]
fn ffi() {
    use std::ffi::{CStr, CString};
    let q = CString::new(r#"{"type":"expression","reponse":"n*(n+1)/2","variables":["n"]}"#).unwrap();
    let a = CString::new(r#""(n²+n)/2""#).unwrap();
    unsafe {
        let r = comima_core::comima_check(q.as_ptr(), a.as_ptr());
        assert!(CStr::from_ptr(r).to_str().unwrap().contains("correct"));
        comima_core::comima_free(r);
    }
    assert_eq!(
        comima_core::sha256_hex(b"abc"),
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
}

#[test]
fn signature_des_mises_a_jour() {
    // Signature produite par `openssl pkeyutl -sign -rawin` avec une clé de test.
    let key: [u8; 32] = std::array::from_fn(|i| u8::from_str_radix(&TEST_PUB[2 * i..2 * i + 2], 16).unwrap());
    assert!(comima_core::verify_signature(b"comima", TEST_SIG, &key));
    assert!(!comima_core::verify_signature(b"comimA", TEST_SIG, &key));
    assert!(!comima_core::verify_signature(b"comima", &TEST_SIG[..120], &key));
    assert!(!comima_core::verify_signature(b"comima", TEST_SIG, &comima_core::UPDATE_KEY));
}

const TEST_PUB: &str = "3eee7d23f1d1163ebc327740bd7084143488299dd808ab4cef72329f66873a4a";
const TEST_SIG: &str = "d0d02ce9dfa0dadf729ff94bfbdfca59a789f370303fe4622bcf7384f2fbea47f06afe6b10bbe090b3a00a995496798583b59776dd0de4c71dfe68840e5f3407";
