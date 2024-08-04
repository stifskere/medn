use std::env::var;
use std::fmt::Debug;
use std::fs::create_dir_all;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::OnceLock;
use sqlx::query;
use whoami::username;
use crate::utils::database::get_connection;

#[derive(Debug)]
pub struct MednConfig {
    pub mysql_host: String,
    pub mysql_user: String,
    pub mysql_password: Option<String>,
    pub mysql_database: String
}

static CONFIG_INSTANCE: OnceLock<MednConfig> = OnceLock::new();

impl MednConfig {
    pub fn fill() {
        CONFIG_INSTANCE.set(MednConfig {
            mysql_host: var("MYSQL_HOST").expect("MYSQL_HOST is required."),
            mysql_user: var("MYSQL_USERNAME").expect("MYSQL_USERNAME is required."),
            mysql_password: match var("MYSQL_PASSWORD") {
                Ok(value) => Some(value),
                Err(_) => None
            },
            mysql_database: var("MYSQL_DATABASE").expect("MYSQL_DATABASE is required.")
        }).expect("Error while setting configuration.");
    }

    pub fn get<'r>() -> &'r MednConfig {
        CONFIG_INSTANCE.get()
            .expect("Can't retrieve a config that's not set.")
    }
    
    pub async fn get_from_db<TResult>(namespace: impl ToString)
    -> Option<TResult> where TResult: FromStr {
        let connection = get_connection().await;
        
        let query = query!(
            "SELECT value FROM configuration WHERE LOWER(name) = LOWER(?)",
            namespace.to_string()
        )
        .fetch_one(&connection)
        .await;
        
        match query {
            Ok(result) => {
                if let Ok(result) = TResult::from_str(result.value.as_ref()?) {
                    Some(result)
                } else {
                    None
                }
            },
            Err(_) => None
        }
    }
    
    pub async fn set_on_db(namespace: impl ToString, value: impl ToString) -> bool {
        let connection = get_connection().await;
        
        query!(
            "REPLACE INTO configuration(name, value) VALUE(?, ?)",
            namespace.to_string(),
            value.to_string()
        ).execute(&connection)
        .await
        .is_ok()
    }

    pub async fn get_storage_path() -> Option<PathBuf> {
        let path = if let Some(path) = MednConfig::get_from_db("storage.path").await {
            path
        } else {
            let default_path = format!(
                "/home/{}/Pictures/medn",
                username()
            );
            MednConfig::set_on_db("storage.path", &default_path).await;
            default_path
        };

        let buffer = PathBuf::from(path);

        if !buffer.exists() {
            if let Err(creation_err) = create_dir_all(&buffer) {
                eprintln!("There was an error while creating a default folder: {creation_err}");
                return None;
            }
        }

        Some(buffer)
    }
}
