from celery import Celery
from celery.schedules import crontab
from app.config import settings

# Initialize the Celery app
celery_app = Celery(
    "worker",
    broker=settings.RABBITMQ_URL,
    backend="rpc://"
)

celery_app.conf.update(
    broker_heartbeat=10,
    broker_connection_timeout=30,
    worker_prefetch_multiplier=1,
    task_track_started=True,
    task_routes={
        "app.worker.tasks.run_scan_task": {"queue": "scans"},
        "app.worker.tasks.sync_threat_intel_task": {"queue": "scans"},
        "app.worker.tasks.sync_exploitdb_task": {"queue": "scans"},
        "app.worker.tasks.sync_cisa_task": {"queue": "scans"},
    },
    task_acks_late=True,
    
    # Schedule Configuration
    beat_schedule={
        # NVD Sync at 2:00 AM
        "sync-nvd-daily": {
            "task": "app.worker.tasks.sync_threat_intel_task",
            "schedule": crontab(hour=2, minute=0),
        },
        # ExploitDB Sync at 3:00 AM
        "sync-exploitdb-daily": {
            "task": "app.worker.tasks.sync_exploitdb_task",
            "schedule": crontab(hour=3, minute=0),
        },
        # Run CISA Sync at 3:30 AM
        "sync-cisa-daily": {
            "task": "app.worker.tasks.sync_cisa_task",
            "schedule": crontab(hour=3, minute=30),
        },
    }
)

celery_app.autodiscover_tasks(['app.worker'])
