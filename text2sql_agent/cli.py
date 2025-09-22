from __future__ import annotations

import argparse
from pathlib import Path
from typing import Optional

from .agent import agent_loop
from .database import load_database
from .generator import TransformersSQLGenerator
from .schema import extract_schema


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="SQL Question Answering Agent")
    parser.add_argument("path", type=Path, help="Path to a .db, .csv or .json file")
    parser.add_argument("--question", type=str, help="Run a single question and exit")
    parser.add_argument(
        "--model",
        type=str,
        default="mrm8488/t5-base-finetuned-wikiSQL",
        help="HuggingFace model name to use",
    )
    return parser


def interactive_loop(generator, schema, context) -> None:
    print("Type 'exit' to stop querying.")
    while True:
        question = input("Ask a question: ").strip()
        if not question:
            continue
        if question.lower() in {"exit", "quit"}:
            break
        response = agent_loop(question, schema, context, generator)
        print("SQL query:\n", response.sql)
        print("\nAnswer:\n", response.answer)


def main(argv: Optional[list[str]] = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)

    context = load_database(args.path)
    schema = extract_schema(context)
    try:
        generator = TransformersSQLGenerator(model_name=args.model)
    except ImportError as exc:
        parser.error(str(exc))

    if args.question:
        response = agent_loop(args.question, schema, context, generator)
        print("SQL query:\n", response.sql)
        print("\nAnswer:\n", response.answer)
    else:
        interactive_loop(generator, schema, context)


if __name__ == "__main__":  # pragma: no cover - entry point
    main()
