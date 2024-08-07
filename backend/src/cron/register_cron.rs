use tokio_cron_scheduler::{Job, JobScheduler, JobSchedulerError};

use super::clear_expired_sessions::clear_expired_sessions;


pub async fn register_crons() -> Result<(), JobSchedulerError> {
    let job_scheduler = JobScheduler::new().await?;

    job_scheduler.add(
        Job::new_async("0 0,30 * * * *", |_, _| Box::pin(clear_expired_sessions()))?
    ).await?;

    job_scheduler.start().await?;

    Ok(())
}
