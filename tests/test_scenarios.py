import pytest
import os
from text2sql_agent.agent import agent_loop
from text2sql_agent.database import load_database
from text2sql_agent.schema import extract_schema
from text2sql_agent.generator import OpenAIGenerator, TransformersSQLGenerator

# Skip if no OpenAI Key
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
pytestmark = pytest.mark.skipif(not OPENAI_KEY, reason="OpenAI API Key not found")

@pytest.fixture(scope="module")
def complex_db_context():
    db_path = "tests/data/complex_sales.db"
    if not os.path.exists(db_path):
        # Generate it if it doesn't exist
        from tests.create_complex_db import create_complex_db
        create_complex_db()
    return load_database(db_path)

@pytest.fixture(scope="module")
def schema(complex_db_context):
    return extract_schema(complex_db_context)

@pytest.fixture(scope="module")
def generator():
    return OpenAIGenerator(api_key=OPENAI_KEY)

def test_scenario_simple_aggregation(complex_db_context, schema, generator):
    """Scenario 1: Simple Aggregation"""
    question = "How many customers are there?"
    response = agent_loop(question, schema, complex_db_context, generator)
    
    assert response.attempts > 0
    assert len(response.rows) == 1
    # We know we created 50 customers
    assert list(response.rows[0].values())[0] == 50

def test_scenario_filtering(complex_db_context, schema, generator):
    """Scenario 2: Filtering with WHERE"""
    question = "List the names of products in the 'Electronics' category."
    response = agent_loop(question, schema, complex_db_context, generator)
    
    assert len(response.rows) > 0
    # Check that we got names (strings)
    assert isinstance(list(response.rows[0].values())[0], str)

def test_scenario_join_multiple_tables(complex_db_context, schema, generator):
    """Scenario 3: Complex Join (Customers -> Orders -> Order Items)"""
    question = "What is the total revenue generated from customers in the USA?"
    response = agent_loop(question, schema, complex_db_context, generator)
    
    assert len(response.rows) == 1
    # Revenue should be a number
    val = list(response.rows[0].values())[0]
    assert isinstance(val, (int, float))
    assert val > 0

def test_scenario_date_logic(complex_db_context, schema, generator):
    """Scenario 4: Date/Time Logic"""
    # This is tricky because data is random, but we can ask for order count
    question = "How many orders were placed in the last 30 days?"
    response = agent_loop(question, schema, complex_db_context, generator)
    
    assert len(response.rows) == 1
    assert isinstance(list(response.rows[0].values())[0], (int, float))

def test_scenario_error_handling_invalid_column(complex_db_context, schema, generator):
    """Scenario 5: Robustness against hallucinated columns"""
    # We force a tricky question that might lead to a wrong column guess initially
    question = "Show me the 'loyalty_points' for each customer." 
    # There is no loyalty_points column. The model should ideally realize this or fail gracefully.
    # However, GPT-4 might refuse or hallucinate. 
    # If it hallucinates, the SQL execution will fail, and the agent loop should catch it and retry.
    # Eventually it might say "I can't do that" or return an empty result or a best-guess.
    
    # For this test, we just want to ensure the agent doesn't CRASH.
    try:
        response = agent_loop(question, schema, complex_db_context, generator)
        # It's okay if it fails to produce a valid SQL after retries, but it shouldn't raise an unhandled exception
    except RuntimeError:
        # This is also an acceptable outcome if it can't find the column
        pass
