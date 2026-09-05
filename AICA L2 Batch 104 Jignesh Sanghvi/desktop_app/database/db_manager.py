"""
Database manager for SQLite offline-first Indian Income-Tax Desktop Application.
Provides transactional safety, versioning, backup & restore, and audit trails.
"""
import os
import sys
import sqlite3
import shutil
import json
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from .seed_demo_rules import seed_database

DEFAULT_DB_FILENAME = "tax_data.db"

class DatabaseManager:
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            if getattr(sys, 'frozen', False):
                user_dir = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
                app_dir = os.path.join(user_dir, "TaxSetu")
                os.makedirs(app_dir, exist_ok=True)
                self.db_path = os.path.join(app_dir, DEFAULT_DB_FILENAME)
            else:
                base_dir = os.path.dirname(os.path.abspath(__file__))
                self.db_path = os.path.join(base_dir, DEFAULT_DB_FILENAME)
        else:
            self.db_path = db_path

        os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        self.init_database()

    def get_connection(self) -> sqlite3.Connection:
        os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def init_database(self) -> None:
        if getattr(sys, 'frozen', False):
            base_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
            schema_path = os.path.join(base_dir, "desktop_app", "database", "schema.sql")
            if not os.path.exists(schema_path):
                schema_path = os.path.join(base_dir, "schema.sql")
        else:
            schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")

        with open(schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.executescript(schema_sql)

            # Check if database has been seeded
            cursor.execute("SELECT COUNT(*) as cnt FROM db_version")
            row = cursor.fetchone()
            if row["cnt"] == 0:
                seed_database(cursor)
                conn.commit()

    def backup_database(self, backup_destination: str) -> bool:
        """Create a local timestamped backup of the SQLite database file."""
        try:
            os.makedirs(os.path.dirname(os.path.abspath(backup_destination)), exist_ok=True)
            with self.get_connection() as conn:
                backup_conn = sqlite3.connect(backup_destination)
                conn.backup(backup_conn)
                backup_conn.close()

            self.log_audit("user", "BACKUP", "DATABASE", None, f"Backed up to {backup_destination}")
            return True
        except Exception as e:
            self.log_audit("user", "BACKUP_FAILED", "DATABASE", None, str(e))
            raise e

    def restore_database(self, source_backup_path: str) -> bool:
        """Restore database from a local SQLite backup file."""
        if not os.path.exists(source_backup_path):
            raise FileNotFoundError(f"Backup file {source_backup_path} does not exist.")

        # Test valid sqlite file
        test_conn = sqlite3.connect(source_backup_path)
        test_cursor = test_conn.cursor()
        test_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='db_version'")
        if not test_cursor.fetchone():
            test_conn.close()
            raise ValueError("The selected file is not a valid Tax Desktop database backup.")
        test_conn.close()

        with self.get_connection() as current_conn:
            restore_conn = sqlite3.connect(source_backup_path)
            restore_conn.backup(current_conn)
            restore_conn.close()

        self.log_audit("admin", "RESTORE", "DATABASE", None, f"Restored from {source_backup_path}")
        return True

    def log_audit(self, user_role: str, action: str, entity_type: str, entity_id: Optional[int], details: str):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO audit_logs (timestamp, user_role, action, entity_type, entity_id, details)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), user_role, action, entity_type, entity_id, details))
            conn.commit()

    def get_setting(self, key: str, default: Optional[str] = None) -> Optional[str]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
            row = cursor.fetchone()
            return row["value"] if row else default

    def set_setting(self, key: str, value: str) -> None:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at
            """, (key, value, now_str))
            conn.commit()

    # Calculation records
    def save_calculation(self, calc_type: str, taxpayer_name: str, pan_masked: str,
                         fy: str, ay: str, regime: str, inputs: dict, results: dict,
                         rules_applied: list, audit_trail: list, tags: str = "") -> int:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO calculations (
                    calculation_type, taxpayer_name, pan_masked, financial_year,
                    assessment_year, regime, inputs_json, results_json,
                    rules_applied_json, audit_trail_json, created_at, tags, is_favourite, is_archived
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
            """, (
                calc_type, taxpayer_name, pan_masked, fy, ay, regime,
                json.dumps(inputs), json.dumps(results),
                json.dumps(rules_applied), json.dumps(audit_trail),
                now_str, tags
            ))
            calc_id = cursor.lastrowid
            conn.commit()
            self.log_audit("user", "SAVE_CALCULATION", "calculation", calc_id, f"Type: {calc_type}, Taxpayer: {taxpayer_name}")
            return calc_id

    def get_calculations(self, query: str = "", calc_type: str = "", fy: str = "", show_archived: bool = False) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            sql = "SELECT * FROM calculations WHERE 1=1"
            params = []
            if not show_archived:
                sql += " AND is_archived = 0"
            if calc_type:
                sql += " AND calculation_type = ?"
                params.append(calc_type)
            if fy:
                sql += " AND financial_year = ?"
                params.append(fy)
            if query:
                sql += " AND (taxpayer_name LIKE ? OR pan_masked LIKE ? OR tags LIKE ?)"
                params.extend([f"%{query}%", f"%{query}%", f"%{query}%"])

            sql += " ORDER BY id DESC"
            cursor.execute(sql, params)
            return [dict(row) for row in cursor.fetchall()]

    def delete_calculation(self, calc_id: int) -> bool:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM calculations WHERE id = ?", (calc_id,))
            conn.commit()
            self.log_audit("user", "DELETE_CALCULATION", "calculation", calc_id, "Deleted calculation record")
            return True
