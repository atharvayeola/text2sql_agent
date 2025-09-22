from __future__ import annotations

import duckdb
import pandas as pd


def execute_sql(connection: duckdb.DuckDBPyConnection, query: str) -> pd.DataFrame:
    """Execute the SQL query against DuckDB and return a DataFrame."""

    return connection.execute(query).fetchdf()
