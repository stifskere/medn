use actix_web::{get, post, HttpRequest, HttpResponse, Responder};
use bcrypt::{hash, DEFAULT_COST};
use sqlx::query;
use crate::{require_user, utils::{database::get_db_connection, responses::ResponseWrapper, tokens::create_api_key}};


#[get("/profile")]
pub async fn profile(req: HttpRequest) -> impl Responder {
    ResponseWrapper::success_response(
        HttpResponse::Ok(),
        require_user!(req)
    )
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

#[post("/request-time")]
pub async fn request_session_time(req: HttpRequest) -> impl Responder {
    let Some(session) = require_user!(req).session
    else {
        return ResponseWrapper::error_response(
            HttpResponse::BadRequest(),
            "NOT_IN_SESSION"
        );
    };

    if session.expires_in_seconds > 3600 {
        return ResponseWrapper::error_response(
            HttpResponse::Forbidden(),
            "NOT_ABOUT_TO_EXPIRE"
        )
    }

    let result = query!(
        r#"
            UPDATE sessions SET 
            expires_at = expires_at + INTERVAL 1 HOUR
            where token = ?
        "#,
        session.token
    )
    .execute(&get_db_connection().await)
    .await;

    match result {
        Ok(_) => ResponseWrapper::success_response(
            HttpResponse::Ok(),
            None::<i8>
        ),
        Err(_) => ResponseWrapper::server_error()
    }
}
