use std::sync::OnceLock;
use sqlx::{MySql, Pool};
use sqlx::mysql::MySqlPoolOptions;
use crate::utils::config::MednConfig;

static CONNECTION: OnceLock<Pool<MySql>> = OnceLock::new();

pub async fn get_connection() -> Pool<MySql> {
    if let Some(connection) = CONNECTION.get() {
        return connection
            .clone();
    }

    let config: &MednConfig = MednConfig::get();

    let mut connection_string = format!(
        "mysql://{}",
        &config.mysql_user
    ).to_string();

    let password = if let Some(pass) = &config.mysql_password {
        format!(":{pass}@")
    } else {
        "@".to_string()
    };

    connection_string.push_str(&password);

    connection_string.push_str(
        &format!(
            "{}/{}",
            config.mysql_host,
            config.mysql_database
        )
    );

    let connection = MySqlPoolOptions::new()
        .max_connections(5)
        .connect(connection_string.as_str())
        .await
        .unwrap();

    CONNECTION.get_or_init(|| connection).clone()
}