from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List

import duckdb
import pandas as pd


@dataclass(frozen=True)
class TableReference:
    """Represents a table that is available to the SQL engine."""

    schema: str
    name: str

    @property
    def fqn(self) -> str:
        """Return the fully qualified name for the table."""
        return f"{self.schema}.{self.name}" if self.schema else self.name


@dataclass
class DatabaseContext:
    """Holds the DuckDB connection and the registered tables."""

    connection: duckdb.DuckDBPyConnection
    tables: List[TableReference]

    def execute_raw_query(self, sql: str) -> list[dict]:
        """Execute a raw SQL query and return results as a list of dictionaries."""
        try:
            # DuckDB's execute returns a relation, fetchall returns list of tuples.
            # We want a list of dicts for JSON serialization.
            # using .df() to get pandas dataframe then to_dict might be easier but let's stick to duckdb api if possible
            # actually .arrow() or .df() is good.
            # Let's use fetchall and description to build dicts.
            cursor = self.connection.execute(sql)
            if not cursor.description:
                return []
            
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            
            result = []
            for row in rows:
                result.append(dict(zip(columns, row)))
            return result
        except Exception as e:
            raise e


def _register_csv(connection: duckdb.DuckDBPyConnection, path: Path) -> List[TableReference]:
    table_name = path.stem
    df = pd.read_csv(path)
    connection.register(table_name, df)
    return [TableReference(schema="main", name=table_name)]


def _register_json(connection: duckdb.DuckDBPyConnection, path: Path) -> List[TableReference]:
    table_name = path.stem
    df = pd.read_json(path)
    connection.register(table_name, df)
    return [TableReference(schema="main", name=table_name)]


def _register_sqlite(connection: duckdb.DuckDBPyConnection, path: Path) -> List[TableReference]:
    schema_name = path.stem.replace("-", "_")
    connection.execute(f"ATTACH '{path.as_posix()}' AS {schema_name} (TYPE SQLITE)")
    table_rows = connection.execute(f"SHOW TABLES FROM {schema_name}").fetchall()
    return [TableReference(schema=schema_name, name=row[0]) for row in table_rows]


def load_database(file_path: str | Path) -> DatabaseContext:
    """Load supported files into DuckDB and return a database context.

    Parameters
    ----------
    file_path:
        Path to a SQLite database, CSV or JSON file.

    Returns
    -------
    DatabaseContext
        The DuckDB connection alongside the registered table metadata.
    """

    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(path)

    connection = duckdb.connect()
    suffix = path.suffix.lower()

    if suffix in {".db", ".sqlite"}:
        tables = _register_sqlite(connection, path)
    elif suffix == ".csv":
        tables = _register_csv(connection, path)
    elif suffix == ".json":
        tables = _register_json(connection, path)
    else:
        raise ValueError(f"Unsupported file extension: {suffix}")

    return DatabaseContext(connection=connection, tables=tables)
