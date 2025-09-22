from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, List, Mapping, Optional

from .answers import answer_from_results
from .database import DatabaseContext
from .execution import execute_sql
from .generator import generate_sql
from .schema import TableSchema
from .validation import validate_sql


@dataclass
class AgentResponse:
    """Container for the agent output."""

    sql: str
    answer: str
    rows: List[dict]
    attempts: int
    error_messages: List[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "sql": self.sql,
            "answer": self.answer,
            "rows": self.rows,
            "attempts": self.attempts,
            "errors": self.error_messages,
        }


def agent_loop(
    question: str,
    schema: Mapping[str, TableSchema],
    context: DatabaseContext,
    generator: Callable[[str], str],
    max_retries: int = 3,
) -> AgentResponse:
    """Generate, validate and execute SQL with retry logic."""

    errors: List[str] = []
    last_error: Optional[str] = None
    for attempt in range(1, max_retries + 1):
        sql = generate_sql(question, schema, generator, error=last_error)
        is_valid, validation_error = validate_sql(sql)
        if not is_valid:
            last_error = f"Validation failed: {validation_error}"
            errors.append(last_error)
            continue
        try:
            results = execute_sql(context.connection, sql)
        except Exception as exc:  # pragma: no cover - exercised in integration tests
            last_error = f"Execution failed: {exc}"
            errors.append(last_error)
            continue

        payload = answer_from_results(sql, results)
        return AgentResponse(
            sql=payload["sql"],
            answer=payload["answer"],
            rows=payload["rows"],
            attempts=attempt,
            error_messages=errors,
        )

    raise RuntimeError(
        "Failed to produce an executable SQL query after "
        f"{max_retries} attempt{'s' if max_retries != 1 else ''}."
    )
