use base64::Engine;
use rand::{RngCore, rngs::OsRng};
use base64::engine::general_purpose::URL_SAFE_NO_PAD;

pub fn get_session_token() -> String {
    let mut token_bytes = [0u8; 32];
    OsRng.fill_bytes(&mut token_bytes);
    URL_SAFE_NO_PAD.encode(token_bytes)
}