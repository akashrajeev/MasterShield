from __future__ import annotations
import json
import sqlite3
from pathlib import Path
from typing import Any

DB_PATH = Path("ml/results/mastershield.sqlite3")

def connect(path: Path | None = None) -> sqlite3.Connection:
    target = path or DB_PATH
    target.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(target)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(path: Path | None = None) -> None:
    conn = connect(path)
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS simulation_runs (
      simulation_id TEXT PRIMARY KEY,
      seed INTEGER NOT NULL,
      event_count INTEGER NOT NULL,
      attack_count INTEGER NOT NULL,
      fraud_rate REAL NOT NULL,
      difficulty TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS experiment_metrics (
      experiment_id TEXT PRIMARY KEY,
      simulation_id TEXT,
      model_version TEXT NOT NULL,
      threshold REAL NOT NULL,
      metrics_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    """)
    conn.commit(); conn.close()

def save_simulation(record: dict[str, Any], path: Path | None = None) -> None:
    conn = connect(path)
    conn.execute("INSERT OR REPLACE INTO simulation_runs VALUES (?,?,?,?,?,?,?,?)", (
        record["simulation_id"], record["seed"], record["event_count"], record["attack_count"], record["fraud_rate"], record["difficulty"], record["status"], record["created_at"]
    ))
    conn.commit(); conn.close()

def save_metrics(record: dict[str, Any], path: Path | None = None) -> None:
    conn = connect(path)
    conn.execute("INSERT OR REPLACE INTO experiment_metrics VALUES (?,?,?,?,?,?)", (
        record["experiment_id"], record.get("simulation_id"), record["model_version"], record["threshold"], json.dumps(record["metrics"]), record["created_at"]
    ))
    conn.commit(); conn.close()
