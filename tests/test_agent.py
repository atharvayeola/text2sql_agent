from __future__ import annotations

from pathlib import Path

import pandas as pd
import pytest

from text2sql_agent.agent import AgentResponse, agent_loop
from text2sql_agent.database import load_database
from text2sql_agent.schema import extract_schema


class DummyGenerator:
    def __init__(self, outputs: list[str]):
        self.outputs = outputs
        self.index = 0

    def __call__(self, prompt: str) -> str:
        result = self.outputs[self.index]
        if self.index < len(self.outputs) - 1:
            self.index += 1
        return result


def _prepare_orders(tmp_path: Path) -> Path:
    df = pd.DataFrame(
        {
            "order_id": [1, 2, 3],
            "customer_id": [1, 1, 2],
            "amount": [100.0, 200.0, 50.0],
        }
    )
    csv_path = tmp_path / "orders.csv"
    df.to_csv(csv_path, index=False)
    return csv_path


def test_agent_loop_success(tmp_path: Path) -> None:
    path = _prepare_orders(tmp_path)
    context = load_database(path)
    schema = extract_schema(context)

    generator = DummyGenerator([
        "SELECT COUNT(*) AS total_orders FROM orders",
    ])
    response = agent_loop("How many orders are there?", schema, context, generator)

    assert isinstance(response, AgentResponse)
    assert response.sql.lower().startswith("select count(*)")
    assert "returned 1 row" in response.answer.lower()
    assert response.rows == [{"total_orders": 3}]
    assert response.attempts == 1


def test_agent_loop_retries_on_error(tmp_path: Path) -> None:
    path = _prepare_orders(tmp_path)
    context = load_database(path)
    schema = extract_schema(context)

    generator = DummyGenerator(
        [
            "SELECT FROM orders",  # invalid SQL
            "SELECT AVG(amount) AS avg_amount FROM orders",
        ]
    )

    response = agent_loop("Average amount?", schema, context, generator)

    assert response.attempts == 2
    assert any("failed" in err.lower() for err in response.error_messages)
    assert len(response.rows) == 1
    assert response.rows[0]["avg_amount"] == pytest.approx(116.6666666, rel=1e-6)
