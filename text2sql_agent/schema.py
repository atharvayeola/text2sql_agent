from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Mapping

import duckdb

from .database import DatabaseContext, TableReference


@dataclass
class TableSchema:
    """Describes a table including column names and sample rows."""

    columns: List[str]
    sample_rows: List[Mapping[str, object]]


def _information_schema_columns(
    connection: duckdb.DuckDBPyConnection, table: TableReference
) -> List[str]:
    # Use DESCRIBE as it works reliably for both native and attached (SQLite) tables
    rows = connection.execute(f"DESCRIBE {table.fqn}").fetchall()
    # row[0] is column_name
    return [row[0] for row in rows]


def extract_schema(
    context: DatabaseContext, sample_rows: int = 5
) -> Dict[str, TableSchema]:
    """Return column metadata and example rows for the registered tables."""

    schema: Dict[str, TableSchema] = {}
    for table in context.tables:
        qualified_name = table.fqn
        columns = _information_schema_columns(context.connection, table)
        preview_df = context.connection.execute(
            f"SELECT * FROM {qualified_name} LIMIT {sample_rows}"
        ).fetchdf()
        schema[qualified_name] = TableSchema(
            columns=columns,
            sample_rows=preview_df.to_dict(orient="records"),
        )
    return schema
