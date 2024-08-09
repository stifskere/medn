use actix_web::{get, post, HttpRequest, HttpResponse, Responder};
use actix_web::cookie::Cookie;
use actix_web::web::Form;
use bcrypt::verify;
use serde::Deserialize;
use sqlx::{Error, query};
use crate::require_user;
use crate::utils::database::get_db_connection;
use crate::utils::responses::ResponseWrapper;
use crate::utils::tokens::create_session_token;


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
                            None::<i8>
                        );

                        let mut cookie = Cookie::new("medn-session", token);

                        cookie.set_path("/");

                        response.add_cookie(&cookie).ok();

                        response
                    },
                    Err(_) => ResponseWrapper::server_error()
                }
            } else {
                ResponseWrapper::server_error()
            }
        }
    }
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
