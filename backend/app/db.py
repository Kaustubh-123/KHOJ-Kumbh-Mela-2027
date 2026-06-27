"""SQLite persistence for KHOJ cases.

Replaces the in-memory dict so cases survive restarts and both
the backend and Kho-Ya-Paya bridge can read the same data.
Cases are stored as JSON blobs; CaseResponse is the schema.
"""
from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "runtime" / "cases.db"


def _init(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            case_id TEXT PRIMARY KEY,
            status  TEXT NOT NULL,
            data    TEXT NOT NULL
        )
    """)
    conn.commit()


@contextmanager
def _conn():
    DB_PATH.parent.mkdir(exist_ok=True)
    c = sqlite3.connect(str(DB_PATH))
    _init(c)
    try:
        yield c
    finally:
        c.close()


def save(case) -> None:
    with _conn() as c:
        c.execute(
            "INSERT OR REPLACE INTO cases (case_id, status, data) VALUES (?, ?, ?)",
            (case.case_id, case.status.value, case.model_dump_json()),
        )
        c.commit()


def get(case_id: str):
    from .models import CaseResponse
    with _conn() as c:
        row = c.execute("SELECT data FROM cases WHERE case_id = ?", (case_id,)).fetchone()
    return CaseResponse.model_validate_json(row[0]) if row else None


def exists(case_id: str) -> bool:
    with _conn() as c:
        return bool(c.execute("SELECT 1 FROM cases WHERE case_id = ?", (case_id,)).fetchone())


def list_all(status: str | None = None) -> list:
    from .models import CaseResponse
    with _conn() as c:
        if status:
            rows = c.execute("SELECT data FROM cases WHERE status = ?", (status,)).fetchall()
        else:
            rows = c.execute("SELECT data FROM cases").fetchall()
    return [CaseResponse.model_validate_json(r[0]) for r in rows]


def update_status(case_id: str, new_status: str) -> object | None:
    from .models import CaseResponse, CaseStatus
    with _conn() as c:
        row = c.execute("SELECT data FROM cases WHERE case_id = ?", (case_id,)).fetchone()
        if not row:
            return None
        case = CaseResponse.model_validate_json(row[0])
        updated = case.model_copy(update={"status": CaseStatus(new_status)})
        c.execute(
            "UPDATE cases SET status = ?, data = ? WHERE case_id = ?",
            (new_status, updated.model_dump_json(), case_id),
        )
        c.commit()
    return updated


def count_by_status() -> dict[str, int]:
    with _conn() as c:
        rows = c.execute("SELECT status, COUNT(*) FROM cases GROUP BY status").fetchall()
    return {r[0]: r[1] for r in rows}
