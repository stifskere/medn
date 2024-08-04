use crate::cron::clear_expired_sessions::clear_expired_sessions;
use crate::routes::auth::{login, profile, logout};
use crate::routes::config::{get_current_theme, get_data, get_logo};
use crate::utils::config::MednConfig;
use crate::utils::database::get_connection;
use actix_web::cookie::time::UtcOffset;
use actix_web::web::scope;
use actix_web::{main, App, HttpServer};
use cron_job::CronJob;
use dotenvy::from_filename;
use regex::Regex;
use sqlx::query;
use std::env::var;
use std::io::Result;
use std::string::ToString;
use std::thread::{sleep, spawn};
use std::time::Duration;

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

    let db_connection = get_connection().await;

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

    spawn(|| {
        let mut cron = CronJob::default();
        cron.new_job("0 0 * * * *", || drop(clear_expired_sessions()));
        let _ = cron.start();

        loop {
            sleep(Duration::from_secs(1));
        }
    });

    HttpServer::new(move || {
        App::new().service(
            scope(if &medn_mode == "prod" { "/api" } else { "" })
                .service(
                    scope("/auth")
                        .service(login)
                        .service(profile)
                        .service(logout)
                )
                .service(
                    scope("/config")
                        .service(get_logo)
                        .service(get_current_theme)
                        .service(get_data),
                ),
        )
    })
    .bind(("127.0.0.1", 3001))?
    .run()
    .await
}
