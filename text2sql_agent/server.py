from __future__ import annotations

import os
import shutil
from typing import Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .agent import agent_loop
from .database import load_database, DatabaseContext
from .schema import extract_schema
from .generator import OpenAIGenerator, TransformersSQLGenerator

app = FastAPI(title="Text2SQL Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state for the demo
class AgentState:
    context: Optional[DatabaseContext] = None
    schema: Optional[Dict] = None
    generator: Any = None

state = AgentState()

class QueryRequest(BaseModel):
    question: str
    model_type: str = "openai"  # 'openai' or 'local'

class QueryResponse(BaseModel):
    sql: str
    answer: str
    rows: list[dict]
    attempts: int
    error: Optional[str] = None

class ExecuteSQLRequest(BaseModel):
    sql: str

class ExecuteSQLResponse(BaseModel):
    rows: list[dict]
    error: Optional[str] = None

class GenerateSQLRequest(BaseModel):
    question: str
    model_type: str = "openai"

class GenerateSQLResponse(BaseModel):
    sql: str
    error: Optional[str] = None

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Save file to temp location
        file_location = f"/tmp/{file.filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
        
        state.context = load_database(file_location)
        state.schema = extract_schema(state.context)
        
        return {"message": "File uploaded and processed successfully", "schema": state.schema}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse)
async def query_agent(request: QueryRequest):
    if not state.context or not state.schema:
        raise HTTPException(status_code=400, detail="No database loaded. Please upload a file first.")

    # Initialize generator if needed or changed
    if request.model_type == "openai":
        if not os.getenv("OPENAI_API_KEY"):
             # Fallback to local if no key provided, but warn the user in the answer?
             # Or just raise the error. The user needs to know.
             # Let's keep raising the error but make it very clear.
             raise HTTPException(status_code=400, detail="OPENAI_API_KEY not found. Please switch to 'Local' model in the dropdown or set the environment variable.")
        if not isinstance(state.generator, OpenAIGenerator):
            state.generator = OpenAIGenerator()
    else:
        if not isinstance(state.generator, TransformersSQLGenerator):
            state.generator = TransformersSQLGenerator()

    try:
        response = agent_loop(request.question, state.schema, state.context, state.generator)
        return QueryResponse(
            sql=response.sql,
            answer=response.answer,
            rows=response.rows,
            attempts=response.attempts
        )
    except Exception as e:
        # If the agent loop fails completely (e.g. max retries)
        return QueryResponse(
            sql="",
            answer="Failed to generate a valid query.",
            rows=[],
            attempts=0,
            error=str(e)
        )

@app.post("/api/execute_sql", response_model=ExecuteSQLResponse)
async def execute_sql(request: ExecuteSQLRequest):
    if not state.context:
        raise HTTPException(status_code=400, detail="No database loaded. Please upload a file first.")
    
    try:
        rows = state.context.execute_raw_query(request.sql)
        return ExecuteSQLResponse(rows=rows)
    except Exception as e:
        return ExecuteSQLResponse(rows=[], error=str(e))

@app.post("/api/generate_sql", response_model=GenerateSQLResponse)
async def generate_sql(request: GenerateSQLRequest):
    if not state.context or not state.schema:
        raise HTTPException(status_code=400, detail="No database loaded. Please upload a file first.")

    # Initialize generator if needed
    if request.model_type == "openai":
        if not os.getenv("OPENAI_API_KEY"):
             raise HTTPException(status_code=400, detail="OPENAI_API_KEY not found.")
        if not isinstance(state.generator, OpenAIGenerator):
            state.generator = OpenAIGenerator()
    else:
        if not isinstance(state.generator, TransformersSQLGenerator):
            state.generator = TransformersSQLGenerator()

    try:
        # Use the generate_sql function from generator module
        from .generator import generate_sql as gen_sql
        sql = gen_sql(request.question, state.schema, state.generator)
        return GenerateSQLResponse(sql=sql)
    except Exception as e:
        return GenerateSQLResponse(sql="", error=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok"}
