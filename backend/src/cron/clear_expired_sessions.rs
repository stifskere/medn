use sqlx::query;
use crate::utils::database::get_db_connection;

pub async fn clear_expired_sessions() {
    let db_connection = get_db_connection().await;
    
    let result = query!("DELETE FROM sessions WHERE expires_at < NOW()")
        .execute(&db_connection)
        .await;
    
    match result {
        Ok(result) => println!(
            "Deleted {} expired sessions", 
            result.rows_affected()
        ),
        Err(_) => println!("Error deleting expired sessions.")
    };
}
