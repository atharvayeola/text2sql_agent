from __future__ import annotations

from typing import Tuple

import sqlglot


def validate_sql(query: str) -> Tuple[bool, str | None]:
    """Validate SQL syntax using sqlglot."""

    stripped = query.strip()
    if not stripped:
        return False, "The generated SQL query is empty."

    try:
        parsed = sqlglot.parse_one(stripped)
        if not isinstance(parsed, sqlglot.exp.Select):
            return False, "Only SELECT statements are allowed for security reasons."
        return True, None
    except Exception as exc:
        return False, str(exc)
