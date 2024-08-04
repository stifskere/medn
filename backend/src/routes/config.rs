use std::fs::{read, read_dir, read_to_string};
use std::path::PathBuf;
use actix_web::{get, HttpResponse, Responder};
use serde::Serialize;
use crate::utils::config::MednConfig;
use crate::utils::paths::get_path_on_current;
use crate::utils::responses::ResponseWrapper;

#[derive(Serialize)]
struct ConfigStruct {
    name: String,
    language: String
}

#[get("/logo")]
pub async fn get_logo() -> impl Responder {
    let Some(logo) = get_path_on_current(&"logo.png")
    else { return ResponseWrapper::server_error(); };

    let buffer = match read(logo) {
        Ok(data) => data,
        Err(_) => return ResponseWrapper::server_error(),
    };

    HttpResponse::Ok()
        .content_type("image/png")
        .body(buffer)
}

#[get("/data")]
pub async fn get_data() -> impl Responder {
    ResponseWrapper::success_response(
        HttpResponse::Ok(),
        ConfigStruct {
            name: MednConfig::get_from_db::<String>("ui.name").await
                .unwrap_or("MEDN".to_string()),
            language: MednConfig::get_from_db::<String>("ui.language").await
                .unwrap_or("EN".to_string())
        }
    )
}

#[get("/theme")]
pub async fn get_current_theme() -> impl Responder {
    let Some(directory) = get_path_on_current(&"themes")
    else { return ResponseWrapper::server_error(); };

    let mut theme_files: Vec<PathBuf> = Vec::new();

    let entries = match read_dir(&directory) {
        Ok(entries) => entries,
        Err(_) => return ResponseWrapper::server_error()
    };

    let config_entry = MednConfig::get_from_db::<String>("ui.theme").await;

    for entry in entries {
        let entry = match entry {
            Ok(entry) => entry,
            Err(_) => return ResponseWrapper::server_error(),
        };

        if config_entry.is_some()
            && entry.file_name().to_string_lossy()
            == config_entry.clone().unwrap()
        {
            return match read_to_string(entry.path()){
                Ok(content) => HttpResponse::Ok()
                    .content_type("text/css")
                    .body(content),
                Err(_) => ResponseWrapper::server_error()
            }
        } else {
            theme_files.push(entry.path())
        }
    }

    if let Some(first_theme) = theme_files.first() {
        if let Some(first_theme_name) = first_theme.file_name() {
            MednConfig::set_on_db("ui.theme", first_theme_name.to_string_lossy()).await;
        } else {
            return ResponseWrapper::server_error();
        }

        return match read_to_string(first_theme){
            Ok(content) => HttpResponse::Ok()
                .content_type("text/css")
                .body(content),
            Err(_) => ResponseWrapper::server_error()
        }
    }

    ResponseWrapper::error_response(
        HttpResponse::NotFound(),
        "FILE_NOT_FOUND"
    )
}