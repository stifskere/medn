use std::env::{set_var, var};

fn main() {
    let mode = var("MEDN_MODE")
        .unwrap_or_else(|_| {
            set_var("MEDN_MODE", "prod");
            "prod".to_string()
        })
        .to_lowercase();

    if mode != "dev" && mode != "prod" {
        panic!("MEDN_MODE must be or either dev or prod.");
    }
}

