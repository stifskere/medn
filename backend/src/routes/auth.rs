use actix_web::{get, HttpRequest, HttpResponse, post, Responder};
use actix_web::cookie::Cookie;
use actix_web::web::Form;
use bcrypt::{hash, verify, DEFAULT_COST};
use serde::Deserialize;
use sqlx::{Error, query};
use crate::require_user;
use crate::utils::database::get_db_connection;
use crate::utils::responses::ResponseWrapper;
use crate::utils::tokens::{create_api_key, create_session_token};


#[derive(Deserialize)]
struct UserLogin {
    email: String,
    password: String
}

#[post("/login")]
pub async fn login(req: Form<UserLogin>) -> impl Responder {
    let db_connection = get_db_connection().await;

    let email = req.email.clone();
    let password = req.password.clone();

    let user_query = query!(
        "SELECT id, email, name, password, max_storage FROM users WHERE email = ?",
        email
    )
    .fetch_one(&db_connection)
    .await;

    match user_query {
        Err(Error::RowNotFound) => {
            ResponseWrapper::error_response(
                HttpResponse::Unauthorized(),
                "USER_NOT_FOUND"
            )
        }
        Err(_) => ResponseWrapper::server_error(),
        Ok(record) => {
            if let Ok(result) = verify(password, &record.password) {
                if !result {
                    return ResponseWrapper::error_response(
                        HttpResponse::Unauthorized(),
                        "INCORRECT_PASSWORD"
                    );
                }
                
                let token = create_session_token();
                
                let session = query!(
                    "INSERT INTO sessions(user_id, token) VALUE(?, ?)",
                    record.id,
                    &token,
                )
                .execute(&db_connection)
                .await;

                match session {
                    Ok(_) => {
                        let mut response = ResponseWrapper::success_response(
                            HttpResponse::Ok(),
                            None::<String>
                        );

                        let mut cookie = Cookie::new("medn-session", token);

                        cookie.set_path("/");

                        response.add_cookie(&cookie).ok();

                        response
                    },
                    Err(_) => ResponseWrapper::<String>::server_error()
                }
            } else {
                ResponseWrapper::server_error()
            }
        }
    }
}

#[get("/profile")]
pub async fn profile(req: HttpRequest) -> impl Responder {
    ResponseWrapper::success_response(
        HttpResponse::Ok(),
        require_user!(req)
    )
}

#[get("/logout")]
pub async fn logout(req: HttpRequest) -> impl Responder {
    let _ = require_user!(req);

    let mut response = ResponseWrapper::<Option<i8>>::success_response(
        HttpResponse::Ok(),
        None
    );

    if let Some(cookie) = req.cookie("medn-session") {
        let _ = response.add_removal_cookie(&cookie);

        let _ = query!("DELETE FROM sessions WHERE token = ?", cookie.value())
            .execute(&get_db_connection().await)
            .await;
    }

    response
}

#[get("/api-key")]
pub async fn reset_api_key(req: HttpRequest) -> impl Responder {
    let user = require_user!(req);
    let token = create_api_key();

    let Ok(hashed_token) = hash(&token, DEFAULT_COST)
    else { return ResponseWrapper::server_error(); };

    let result = query!(
        "UPDATE users SET api_key = ? WHERE id = ?",
        hashed_token,
        user.id
    )
    .execute(&get_db_connection().await)
    .await;

    match result {
        Err(_) => ResponseWrapper::server_error(),
        Ok(_) => {
            ResponseWrapper::success_response(
                HttpResponse::Ok(),
                token
            )
        }
    }
}
