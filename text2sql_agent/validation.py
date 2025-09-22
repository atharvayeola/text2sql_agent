from __future__ import annotations

from typing import Tuple

import sqlglot


def validate_sql(query: str) -> Tuple[bool, str | None]:
    """Validate SQL syntax using sqlglot."""

    stripped = query.strip()
    if not stripped:
        return False, "The generated SQL query is empty."

    try:
        sqlglot.parse_one(stripped)
        return True, None
    except Exception as exc:  # pragma: no cover - exercised via integration tests
        return False, str(exc)
