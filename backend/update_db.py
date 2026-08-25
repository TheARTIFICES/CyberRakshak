from sqlmodel import text
from app.database import engine

def add_column_if_not_exists(table, column, type_def):
    with engine.connect() as conn:
        try:
            # Check if column exists
            check_sql = text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' AND column_name='{column}'")
            result = conn.execute(check_sql).fetchone()
            if not result:
                print(f"Adding column '{column}' to '{table}'...")
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}"))
                conn.commit()
            else:
                print(f"Column '{column}' already exists in '{table}'.")
        except Exception as e:
            print(f"Error checking/adding {column}: {e}")

if __name__ == "__main__":
    print("--- Starting Database Schema Patch ---")
    
    # Add AlienVault OTX fields
    add_column_if_not_exists("vulnerabilitymetadata", "otx_pulse_count", "INTEGER DEFAULT 0")
    # Use TEXT for JSON content to be safe and compatible, or JSONB if strictly Postgres
    add_column_if_not_exists("vulnerabilitymetadata", "otx_tags", "JSONB DEFAULT '[]'")
    add_column_if_not_exists("vulnerabilitymetadata", "otx_references", "JSONB DEFAULT '[]'")
    add_column_if_not_exists("vulnerabilitymetadata", "otx_last_synced", "TIMESTAMP WITHOUT TIME ZONE")
    
    print("--- Database Schema Patch Completed ---")
