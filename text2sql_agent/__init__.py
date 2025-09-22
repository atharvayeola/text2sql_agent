"""Utilities for building a lightweight text-to-SQL agent.

This package exposes helper functions to load structured datasets,
extract schemas and generate SQL queries for natural language
questions.
"""

from .database import DatabaseContext, TableReference, load_database
from .schema import TableSchema, extract_schema
from .generator import TransformersSQLGenerator, format_schema, generate_sql
from .validation import validate_sql
from .execution import execute_sql
from .answers import answer_from_results
from .agent import AgentResponse, agent_loop

__all__ = [
    "DatabaseContext",
    "TableReference",
    "TableSchema",
    "TransformersSQLGenerator",
    "AgentResponse",
    "load_database",
    "extract_schema",
    "format_schema",
    "generate_sql",
    "validate_sql",
    "execute_sql",
    "answer_from_results",
    "agent_loop",
]
