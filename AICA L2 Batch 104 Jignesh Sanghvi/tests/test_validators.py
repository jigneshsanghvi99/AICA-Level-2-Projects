"""
Unit tests for input validation and database operations (including backup & restore).
"""
import unittest
import os
import tempfile
from decimal import Decimal
from desktop_app.validation.validators import (
    validate_pan, validate_fy_ay_consistency, validate_positive_amount
)
from desktop_app.database.db_manager import DatabaseManager

class TestValidatorsAndDB(unittest.TestCase):
    def setUp(self):
        self.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.temp_db.close()
        self.db_mgr = DatabaseManager(db_path=self.temp_db.name)

    def tearDown(self):
        if os.path.exists(self.temp_db.name):
            try:
                os.remove(self.temp_db.name)
            except OSError:
                pass

    def test_pan_valid(self):
        ok, msg = validate_pan("ABCDE1234F")
        self.assertTrue(ok)
        self.assertEqual(msg, "")

    def test_pan_invalid(self):
        ok, msg = validate_pan("INVALID_PAN")
        self.assertFalse(ok)
        self.assertIn("Invalid PAN format", msg)

    def test_fy_ay_consistency(self):
        ok, msg = validate_fy_ay_consistency("2024-25", "2025-26")
        self.assertTrue(ok)
        ok_bad, msg_bad = validate_fy_ay_consistency("2024-25", "2024-25")
        self.assertFalse(ok_bad)

    def test_database_backup_and_restore(self):
        backup_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        backup_file.close()
        try:
            # Test backup
            success_backup = self.db_mgr.backup_database(backup_file.name)
            self.assertTrue(success_backup)
            self.assertTrue(os.path.exists(backup_file.name))

            # Test restore
            success_restore = self.db_mgr.restore_database(backup_file.name)
            self.assertTrue(success_restore)
        finally:
            if os.path.exists(backup_file.name):
                os.remove(backup_file.name)

if __name__ == "__main__":
    unittest.main()
