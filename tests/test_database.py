from __future__ import annotations

from pathlib import Path

import pandas as pd

from text2sql_agent.database import load_database
from text2sql_agent.schema import extract_schema


def test_load_csv(tmp_path: Path) -> None:
    df = pd.DataFrame(
        {
            "customer_id": [1, 2, 3],
            "name": ["Alice", "Bob", "Charlie"],
        }
    )
    csv_path = tmp_path / "customers.csv"
    df.to_csv(csv_path, index=False)

    context = load_database(csv_path)
    assert context.tables[0].name == "customers"

    schema = extract_schema(context)
    assert "main.customers" in schema
    assert schema["main.customers"].columns == ["customer_id", "name"]
    assert len(schema["main.customers"].sample_rows) == 3
