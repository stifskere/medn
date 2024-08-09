use actix_web::{HttpRequest, HttpResponse, Responder};
use bcrypt::verify;
use chrono::Utc;
use num_traits::ToPrimitive;
use serde::Serialize;
use sqlx::{Error, query};
use crate::utils::authorization::SessionResponse::{Authorized, Unauthorized};
use crate::utils::database::get_db_connection;
use crate::utils::responses::ResponseWrapper;

use super::config::MednConfig;
use super::storage::get_path_storage;

#[derive(Serialize)]
pub struct Session {
    #[serde(skip)]
    pub token: String,
    pub expires_in_seconds: i64
}

#[derive(Serialize)]
pub struct User {
    #[serde(skip)]
    pub id: i32,
    pub email: String,
    pub name: String,
    pub max_storage: Option<u64>,
    used_storage: Option<u64>,
    pub ui_language: String,
    pub upload_path: String,
    pub session: Option<Session>
}

impl User {
    pub fn used_storage(s: &Self) -> u64 {
        s.used_storage.unwrap()
    }
}

pub enum SessionResponse<T> where T: Responder {
    Authorized(User),
    Unauthorized(T)
}

pub async fn get_user(req: &HttpRequest) -> SessionResponse<HttpResponse> {
    let db_connection = get_db_connection().await;

    let api_key = req.headers().get("X-MEDN-AUTH");
    let mut retrieved_user: User;

    let default_language = MednConfig::get_from_db::<String>("ui.default_language")
        .await
        .unwrap_or("EN".to_string());

    if let Some(api_key) = api_key {
        let user = query!("SELECT * FROM users")
            .fetch_all(&db_connection)
            .await
            .map(|res| {
                res.into_iter()
                    .find_map(|user| {
                        verify(api_key.to_str().unwrap(), &user.api_key)
                            .map(|valid| if valid { Some(user) } else { None })
                            .unwrap_or(None)
                    })
                    .ok_or(sqlx::Error::RowNotFound)
            })
            .unwrap_or_else(Err);

        if let Ok(user) = user {
            retrieved_user = User {
                id: user.id,
                email: user.email,
                name: user.name,
                max_storage: user.max_storage
                    .map(|ms| ms as u64),
                used_storage: None,
                ui_language: user.ui_language.unwrap_or(default_language),
                upload_path: user.upload_path,
                session: None
            };
        } else {
            return match user {
                Err(Error::RowNotFound) => Unauthorized(
                    ResponseWrapper::error_response(
                        HttpResponse::Unauthorized(),
                        "INVALID_AUTH"
                    )
                ),
                _ => Unauthorized(ResponseWrapper::server_error())
            };
        }
    } else if let Some(cookie) = req.cookie("medn-session") {
        let user = query!(
            r#"SELECT users.*, sessions.expires_at, sessions.token
            FROM sessions JOIN users ON sessions.user_id = users.id
            WHERE sessions.token = ? AND sessions.expires_at > NOW()"#,
            cookie.value()
        )
            .fetch_one(&db_connection)
            .await;

        if let Ok(user) = user {
            retrieved_user = User {
                id: user.id,
                email: user.email,
                name: user.name,
                max_storage: user.max_storage
                    .map(|ms| ms as u64),
                used_storage: None,
                ui_language: user.ui_language.unwrap_or(default_language),
                upload_path: user.upload_path,
                session: Some(Session {
                    expires_in_seconds: user.expires_at.signed_duration_since(Utc::now()).num_seconds(),
                    token: user.token
                })
            }
        } else {
            return match user {
                Err(Error::RowNotFound) => Unauthorized(
                    ResponseWrapper::error_response(
                        HttpResponse::Unauthorized(),
                        "INVALID_AUTH"
                    )
                ),
                _ => Unauthorized(ResponseWrapper::server_error())
            }
        }
    } else {
        return Unauthorized(
            ResponseWrapper::error_response(
                HttpResponse::Unauthorized(),
                "INVALID_AUTH"
            )
        );
    }

    let used_space = query!(
        r#"SELECT COALESCE(SUM(size), 0)
        AS total_size FROM metadata
        WHERE user_id = ?"#,
        retrieved_user.id
    )
        .fetch_one(&db_connection)
        .await
        .unwrap();

    retrieved_user.used_storage = Some(used_space.total_size.to_u64().unwrap());

    let error_response = Unauthorized(
        ResponseWrapper::error_response(
            HttpResponse::InternalServerError(),
            "ERROR_GETTING_MAX_STORAGE"
        )
    );

    let storage_path = match MednConfig::get_storage_path().await {
        Some(path) => path,
        None => return error_response
    };

    let remaining_disk = match get_path_storage(storage_path) {
        Some(remaining_disk) => remaining_disk,
        None => return error_response
    };

    if 
        retrieved_user.max_storage.is_none() 
        || retrieved_user.max_storage.unwrap() > remaining_disk {
        retrieved_user.max_storage = Some(remaining_disk);
    }

    Authorized(retrieved_user)
}

#[macro_export]
macro_rules! require_user {
    ($x:expr) => {
        match $crate::utils::authorization::get_user(&$x).await {
            $crate::utils::authorization::SessionResponse::Authorized(user) => user,
            $crate::utils::authorization::SessionResponse::Unauthorized(mut error) => {
                if let Some(cookie) = &$x.cookie("medn-session") {
                    let connection = $crate::utils::database::get_db_connection().await;
                    let _ = sqlx::query!("DELETE FROM sessions WHERE token = ?", cookie.value())
                        .execute(&connection)
                        .await;
                    let _ = &error.add_removal_cookie(&cookie);
                }

                return error;
            }
        }
    };
}
