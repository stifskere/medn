use actix_web::{HttpResponse, HttpResponseBuilder};
use actix_web::body::BoxBody;
use actix_web::http::header::ContentType;
use serde::Serialize;
use serde_json::to_string;

#[derive(Serialize)]
pub struct ResponseWrapper<TResult> where TResult: Serialize {
    is_error: bool,
    reason: Option<String>,
    result: Option<TResult>
}

impl<TResult> ResponseWrapper<TResult> where TResult: Serialize {
    pub fn success_response(mut code: HttpResponseBuilder, result: TResult) -> HttpResponse<BoxBody> {
        let body = to_string(&Self {
            is_error: false,
            reason: None,
            result: Some(result)
        });
        
        match body {
            Ok(body) => code.content_type(ContentType::json()).body(body),
            Err(_) => HttpResponse::InternalServerError().body("Couldn't parse response.")
        }
    }
}

impl ResponseWrapper<String> {
    pub fn error_response(mut code: HttpResponseBuilder, reason: impl ToString) -> HttpResponse<BoxBody> {
        code.content_type(ContentType::json())
            .body(to_string(&Self {
                is_error: true,
                reason: Some(reason.to_string()),
                result: None
            }).unwrap())
    }
    
    pub fn server_error() -> HttpResponse<BoxBody> {
        HttpResponse::InternalServerError().content_type(ContentType::json())
            .body(to_string(&Self {
                is_error: true,
                reason: Some("SERVER_ERROR".to_string()),
                result: None
            }).unwrap())
    }
}