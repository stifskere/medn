use crate::routes::auth::{login, logout};
use crate::routes::config::{get_current_theme, get_data, get_logo, post_upload_path};
use crate::utils::config::MednConfig;
use crate::utils::database::get_db_connection;
use crate::routes::session::{profile, reset_api_key};
use actix_web::cookie::time::UtcOffset;
use actix_web::web::scope;
use actix_web::{main, App, HttpServer};
use cron::register_cron::register_crons;
use dotenvy::from_filename;
use regex::Regex;
use routes::session::request_session_time;
use sqlx::query;
use std::env::var;
use std::io::Result;
use std::string::ToString;

mod cron;
mod routes;
mod utils;

#[main]
async fn main() -> Result<()> {
    let medn_mode = var("MEDN_MODE").unwrap().to_lowercase();

    if from_filename("../.env").is_err() {
        panic!("Couldn't read environment variables.");
    }

    MednConfig::fill();

    let db_connection = get_db_connection().await;

    let set_time_zone = query!(
        "SET time_zone = ?",
        Regex::new(r"^([+-]\d{2}:\d{2}):\d{2}$")
            .unwrap()
            .replace(
                &*UtcOffset::from_whole_seconds(chrono::Local::now().offset().local_minus_utc())
                    .unwrap()
                    .to_string(),
                "$1"
            )
            .to_string()
    )
    .execute(&db_connection)
    .await;

    if let Err(error) = set_time_zone {
        eprintln!("There was an error on setting timezone: {error}\nUsing system default.");
    }

    if let Err(err) = register_crons().await {
        eprintln!("There was an error while registering crons: {err}");
    }

    HttpServer::new(move || {
        App::new().service(
            scope(if &medn_mode == "prod" { "/api" } else { "" })
                .service(
                    scope("/auth")
                        .service(login)
                        .service(profile)
                        .service(logout)
                        .service(reset_api_key)
                )
                .service(
                    scope("/session")
                        .service(profile)
                        .service(reset_api_key)
                        .service(request_session_time)
                )
                .service(
                    scope("/config")
                        .service(get_logo)
                        .service(get_current_theme)
                        .service(get_data)
                        .service(post_upload_path)
                ),
        )
    })
    .bind(("127.0.0.1", 3001))?
    .run()
    .await
}
