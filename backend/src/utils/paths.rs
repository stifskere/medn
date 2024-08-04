use std::env;
use std::env::var;
use std::path::{Path, PathBuf};

pub fn get_path_on_current(concat: &impl ToString) -> Option<PathBuf> {
    if let Ok(manifest) = var("CARGO_MANIFEST_DIR") {
        Some(
            Path::new(&manifest)
                .parent().unwrap_or(Path::new("../"))
                .join(concat.to_string())
        )
    } else {
        match env::current_exe() {
            Ok(path) => Some(path.join(concat.to_string())),
            Err(_) => None
        }
    }
}