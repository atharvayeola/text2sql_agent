from __future__ import annotations

from typing import Dict, List

import pandas as pd


def answer_from_results(
    query: str, results: pd.DataFrame, preview_rows: int = 5
) -> Dict[str, object]:
    """Format the SQL query results into a simple natural language answer."""

    total_rows = len(results)
    if total_rows == 0:
        summary = "The query returned 0 rows."
        preview_records: List[dict] = []
    else:
        preview = results.head(preview_rows)
        preview_records = preview.to_dict(orient="records")
        summary = (
            f"The query returned {total_rows} row{'s' if total_rows != 1 else ''}.\n"
            f"Preview:\n{preview.to_string(index=False)}"
        )

    return {"sql": query, "answer": summary, "rows": preview_records}
