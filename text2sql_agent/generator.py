from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from typing import Callable, Mapping, Optional, Protocol

from .schema import TableSchema


class PromptCallable(Protocol):
    def __call__(self, prompt: str) -> str:  # pragma: no cover - protocol definition
        ...


@dataclass
class TransformersSQLGenerator:
    """Wrapper around a HuggingFace text2text model for SQL generation."""

    model_name: str = "mrm8488/t5-base-finetuned-wikiSQL"
    max_new_tokens: int = 128
    device: Optional[int] = None

    def __post_init__(self) -> None:
        try:
            from transformers import pipeline
        except ImportError as exc:  # pragma: no cover - depends on optional dep
            raise ImportError(
                "TransformersSQLGenerator requires the 'transformers' package. "
                "Install it with `pip install transformers`."
            ) from exc

        self._pipeline = pipeline(
            "text2text-generation",
            model=self.model_name,
            device=self.device,
        )

    def __call__(self, prompt: str) -> str:
        result = self._pipeline(
            prompt,
            max_new_tokens=self.max_new_tokens,
            num_beams=4,
        )[0]["generated_text"]
        return result.strip()


@dataclass
class OpenAIGenerator:
    """Wrapper around OpenAI API for robust SQL generation."""

    model_name: str = "gpt-3.5-turbo"
    api_key: Optional[str] = None
    temperature: float = 0.0

    def __post_init__(self) -> None:
        try:
            import openai
        except ImportError as exc:
            raise ImportError(
                "OpenAIGenerator requires the 'openai' package. "
                "Install it with `pip install openai`."
            ) from exc
        
        self.client = openai.OpenAI(api_key=self.api_key or os.getenv("OPENAI_API_KEY"))

    def __call__(self, prompt: str) -> str:
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": "You are a helpful SQL assistant. Return ONLY the SQL query. Do not use markdown formatting like ```sql."},
                {"role": "user", "content": prompt},
            ],
            temperature=self.temperature,
        )
        return response.choices[0].message.content.strip()
def format_schema(schema: Mapping[str, TableSchema]) -> str:
    """Convert schema metadata into a textual prompt."""

    sections = ["Schema:"]
    for table_name, table_schema in schema.items():
        columns = ", ".join(table_schema.columns)
        section = [f"Table: {table_name}({columns})"]
        if table_schema.sample_rows:
            sample_lines = []
            for row in table_schema.sample_rows[:3]:
                formatted = ", ".join(f"{key}={value}" for key, value in row.items())
                sample_lines.append(f"  - {formatted}")
            section.append("Sample rows:\n" + "\n".join(sample_lines))
        sections.append("\n".join(section))
    return "\n\n".join(sections)


def build_prompt(
    question: str,
    schema: Mapping[str, TableSchema],
    error: Optional[str] = None,
) -> str:
    """Construct the text prompt for the language model."""

    prompt_parts = [format_schema(schema), f"Question: {question.strip()}".strip()]
    if error:
        prompt_parts.append(f"Previous error: {error.strip()}")
    prompt_parts.append("SQL query:")
    return "\n\n".join(part for part in prompt_parts if part)


def _cleanup_sql(generated: str) -> str:
    code_block = re.search(r"```sql\n(.*?)```", generated, flags=re.DOTALL | re.IGNORECASE)
    if code_block:
        return code_block.group(1).strip()
    code_block = re.search(r"```\n(.*?)```", generated, flags=re.DOTALL)
    if code_block:
        return code_block.group(1).strip()
    if generated.lower().startswith("sql:"):
        return generated[4:].strip()
    return generated.strip()


def generate_sql(
    question: str,
    schema: Mapping[str, TableSchema],
    generator: Callable[[str], str],
    error: Optional[str] = None,
) -> str:
    """Generate a SQL query for the provided question and schema."""

    prompt = build_prompt(question, schema, error=error)
    raw_sql = generator(prompt)
    return _cleanup_sql(raw_sql)
