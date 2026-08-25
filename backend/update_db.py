import logging
from sqlmodel import SQLModel, text
from app.database import engine
from app import models  # Ensure all SQLModel schemas are imported

logger = logging.getLogger("cyberrakshak.db_patch")

def add_column_if_not_exists(table: str, column: str, type_def: str):
    with engine.connect() as conn:
        try:
            # Check if table exists first
            check_table_sql = text(
                f"SELECT table_name FROM information_schema.tables WHERE table_name='{table.lower()}'"
            )
            table_exists = conn.execute(check_table_sql).fetchone()
            if not table_exists:
                return

            # Check if column exists
            check_col_sql = text(
                f"SELECT column_name FROM information_schema.columns WHERE table_name='{table.lower()}' AND column_name='{column.lower()}'"
            )
            result = conn.execute(check_col_sql).fetchone()
            if not result:
                print(f"Adding column '{column}' to '{table}'...")
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}"))
                conn.commit()
                print(f"Successfully added '{column}' to '{table}'.")
            else:
                print(f"Column '{column}' already exists in '{table}'.")
        except Exception as e:
            print(f"Error checking/adding {column} to {table}: {e}")

def patch_database_schema():
    print("--- Starting Database Schema Patch & Table Sync ---")
    
    # 1. Create all missing tables defined in models
    try:
        SQLModel.metadata.create_all(engine)
        print("SQLModel metadata tables synchronized.")
    except Exception as e:
        print(f"Error creating SQLModel tables: {e}")

    # 2. Patch audit_logs table
    add_column_if_not_exists("audit_logs", "org_id", "UUID")
    add_column_if_not_exists("audit_logs", "job_id", "UUID")
    add_column_if_not_exists("audit_logs", "event_type", "VARCHAR(255)")
    add_column_if_not_exists("audit_logs", "details", "JSONB DEFAULT '{}'")

    # 3. Patch users table
    add_column_if_not_exists("users", "org_id", "UUID")
    add_column_if_not_exists("users", "role", "VARCHAR(50) DEFAULT 'analyst'")
    add_column_if_not_exists("users", "is_active", "BOOLEAN DEFAULT TRUE")

    # 4. Patch notifications table
    add_column_if_not_exists("notifications", "org_id", "UUID")
    add_column_if_not_exists("notifications", "job_id", "UUID")

    # 5. Patch jobs table
    add_column_if_not_exists("jobs", "org_id", "UUID")
    add_column_if_not_exists("jobs", "asset_id", "UUID")
    add_column_if_not_exists("jobs", "business_unit_id", "UUID")

    # 6. Patch vulnerability_metadata table
    add_column_if_not_exists("vulnerability_metadata", "otx_pulse_count", "INTEGER DEFAULT 0")
    add_column_if_not_exists("vulnerability_metadata", "otx_tags", "JSONB DEFAULT '[]'")
    add_column_if_not_exists("vulnerability_metadata", "otx_references", "JSONB DEFAULT '[]'")
    add_column_if_not_exists("vulnerability_metadata", "otx_last_synced", "TIMESTAMP WITHOUT TIME ZONE")
    add_column_if_not_exists("vulnerability_metadata", "remediation", "TEXT")
    add_column_if_not_exists("vulnerability_metadata", "remediation_source", "VARCHAR(255)")
    add_column_if_not_exists("vulnerability_metadata", "has_exploit", "BOOLEAN DEFAULT FALSE")
    add_column_if_not_exists("vulnerability_metadata", "exploit_ids", "JSONB DEFAULT '[]'")
    add_column_if_not_exists("vulnerability_metadata", "is_cisa_kev", "BOOLEAN DEFAULT FALSE")
    add_column_if_not_exists("vulnerability_metadata", "epss_score", "FLOAT DEFAULT 0.0")
    add_column_if_not_exists("vulnerability_metadata", "epss_percentile", "FLOAT DEFAULT 0.0")
    add_column_if_not_exists("vulnerability_metadata", "epss_last_synced", "TIMESTAMP WITHOUT TIME ZONE")

    # Also check legacy table name "vulnerabilitymetadata" if present
    add_column_if_not_exists("vulnerabilitymetadata", "otx_pulse_count", "INTEGER DEFAULT 0")
    add_column_if_not_exists("vulnerabilitymetadata", "otx_tags", "JSONB DEFAULT '[]'")
    add_column_if_not_exists("vulnerabilitymetadata", "otx_references", "JSONB DEFAULT '[]'")
    add_column_if_not_exists("vulnerabilitymetadata", "otx_last_synced", "TIMESTAMP WITHOUT TIME ZONE")

    # 7. Ensure foreign key constraints on audit_logs and notifications point to 'jobs' table
    try:
        with engine.connect() as conn:
            conn.execute(text("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.table_constraints
                        WHERE constraint_name = 'audit_logs_job_id_fkey' AND table_name = 'audit_logs'
                    ) THEN
                        ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_job_id_fkey;
                    END IF;
                    
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
                        -- Nullify any orphaned references
                        UPDATE audit_logs SET job_id = NULL WHERE job_id IS NOT NULL AND job_id NOT IN (SELECT id FROM jobs);
                        ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL;
                    END IF;
                END $$;
            """))
            conn.commit()
            print("Foreign key constraints on audit_logs validated and cleaned.")
    except Exception as e:
        print(f"Error updating FK constraints: {e}")

    print("--- Database Schema Patch Completed ---")

if __name__ == "__main__":
    patch_database_schema()
