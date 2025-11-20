# Implementation Plan - Robust Text2SQL Agent & Modern UI

## Backend Enhancements (Python)
- [ ] **Security**: Update `validation.py` to strictly enforce `SELECT` only statements using `sqlglot`.
- [ ] **Model**: Add `OpenAIGenerator` to `generator.py` for robust SQL generation (requires API key).
- [ ] **API**: Create `text2sql_agent/server.py` (FastAPI) to expose the agent to the frontend.
- [ ] **Dependencies**: Update `pyproject.toml` with `fastapi`, `uvicorn`, `openai`, `python-dotenv`.

## Frontend (React + Vite)
- [ ] **Setup**: Initialize Vite project in `web/`.
- [ ] **Styling**: Implement "Black & White" theme with Tailwind CSS.
- [ ] **Components**:
    - Chat Input (Rounded, Shadowed).
    - Message History (User vs Agent).
    - SQL Preview (Syntax Highlighted).
    - Data Table (Clean, minimal).
- [ ] **Animations**: Add entrance animations for messages.

## Testing & Robustness
- [ ] **Test Data**: Create a complex SQLite database in `tests/data/complex_sales.db`.
- [ ] **Test Cases**: Create `tests/test_scenarios.py` covering:
    - Simple aggregations.
    - Filtering (WHERE).
    - Joins (Multiple tables).
    - Date/Time logic.
    - Error handling (Invalid columns).
