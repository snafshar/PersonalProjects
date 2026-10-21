"""Create a simple profile of a CSV file using only the standard library."""
import csv
from collections import Counter
from pathlib import Path


def profile_csv(path: str | Path) -> dict[str, object]:
    with open(path, newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError("CSV must contain a header row")
        rows = list(reader)
    return {
        "rows": len(rows),
        "columns": list(reader.fieldnames),
        "blank_counts": {name: sum(not (row.get(name) or "").strip() for row in rows) for name in reader.fieldnames},
        "duplicate_rows": len(rows) - len({tuple((row.get(name) or "") for name in reader.fieldnames) for row in rows}),
    }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_file")
    args = parser.parse_args()
    print(profile_csv(args.csv_file))