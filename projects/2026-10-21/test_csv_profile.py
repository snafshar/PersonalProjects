import csv
import tempfile
import unittest
from pathlib import Path
from csv_profile import profile_csv

class CsvProfileTests(unittest.TestCase):
    def test_counts_rows_blanks_and_duplicates(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.csv"
            path.write_text("name,city\nAda,Rome\n,Paris\nAda,Rome\n", encoding="utf-8")
            result = profile_csv(path)
        self.assertEqual(result["rows"], 3)
        self.assertEqual(result["blank_counts"]["name"], 1)
        self.assertEqual(result["duplicate_rows"], 1)

if __name__ == "__main__": unittest.main()