# SQL Question Answering Agent

This repository implements a lightweight SQL question answering agent that
follows the end-to-end roadmap provided in the prompt. The code loads
structured data files, extracts schema information, generates SQL from natural
language questions and executes validated queries.

## Features

- Works with SQLite databases (`.db`/`.sqlite`), CSV and JSON files
- Uses DuckDB as the execution engine for a unified interface
- Extracts table schemas and sample rows to build language model prompts
- Integrates with HuggingFace text-to-SQL models (defaults to
  `mrm8488/t5-base-finetuned-wikiSQL`)
- Validates generated SQL with `sqlglot`
- Retries on validation/execution errors before failing gracefully
- Produces concise natural language answers with SQL previews
- Includes a CLI and automated tests

## Installation

Create a virtual environment (optional) and install the core dependencies:

```bash
pip install -e .[dev]
```

This installs runtime requirements together with the development dependency
`pytest` for running the test suite. To enable the full LLM agent and optional
components install the extras defined in the roadmap:

```bash
pip install -e .[dev,llm,embeddings,ui]
```

## Usage

### Python API

```python
from text2sql_agent import (
    TransformersSQLGenerator,
    agent_loop,
    answer_from_results,
    extract_schema,
    load_database,
)

context = load_database("/path/to/data.csv")
schema = extract_schema(context)
generator = TransformersSQLGenerator()

response = agent_loop("How many rows are in the dataset?", schema, context, generator)
print(response.sql)
print(response.answer)
```

### Command Line Interface

```bash
python -m text2sql_agent.cli /path/to/data.csv --question "How many rows are there?"
```

Run the command without `--question` to start an interactive prompt.

## Development

Run the tests with:

```bash
pytest
```

The codebase is intentionally modular so that each building block (database
loading, schema extraction, SQL generation, validation, execution, answering)
can be swapped or extended independently.
