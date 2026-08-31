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
      adaptation TEXT NOT NULL DEFAULT 'static',
      noise TEXT NOT NULL DEFAULT 'medium',
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
    CREATE TABLE IF NOT EXISTS closed_loop_rounds (
      round_id TEXT PRIMARY KEY,
      simulation_id TEXT,
      round_number INTEGER NOT NULL,
      attack_ids_json TEXT NOT NULL,
      metrics_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    """)
    cols = {row[1] for row in conn.execute("PRAGMA table_info(simulation_runs)").fetchall()}
    for name, ddl in [("adaptation", "TEXT NOT NULL DEFAULT 'static'"), ("noise", "TEXT NOT NULL DEFAULT 'medium'")]:
        if name not in cols:
            conn.execute(f"ALTER TABLE simulation_runs ADD COLUMN {name} {ddl}")
    conn.commit(); conn.close()


def save_simulation(record: dict[str, Any], path: Path | None = None) -> None:
    conn = connect(path)
    conn.execute("""INSERT OR REPLACE INTO simulation_runs
      (simulation_id,seed,event_count,attack_count,fraud_rate,difficulty,adaptation,noise,status,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)""", (
        record["simulation_id"], record["seed"], record["event_count"], record["attack_count"],
        record["fraud_rate"], record["difficulty"], record.get("adaptation", "static"),
        record.get("noise", "medium"), record["status"], record["created_at"],
    ))
    conn.commit(); conn.close()


def save_metrics(record: dict[str, Any], path: Path | None = None) -> None:
    conn = connect(path)
    conn.execute("INSERT OR REPLACE INTO experiment_metrics VALUES (?,?,?,?,?,?)", (
        record["experiment_id"], record.get("simulation_id"), record["model_version"],
        record["threshold"], json.dumps(record["metrics"]), record["created_at"],
    ))
    conn.commit(); conn.close()


def save_round(record: dict[str, Any], path: Path | None = None) -> None:
    conn = connect(path)
    conn.execute("INSERT OR REPLACE INTO closed_loop_rounds VALUES (?,?,?,?,?,?)", (
        record["round_id"], record.get("simulation_id"), record["round_number"],
        json.dumps(record["attack_ids"]), json.dumps(record["metrics"]), record["created_at"],
    ))
    conn.commit(); conn.close()


def get_simulation(simulation_id: str, path: Path | None = None) -> dict[str, Any] | None:
    conn = connect(path)
    row = conn.execute("SELECT * FROM simulation_runs WHERE simulation_id=?", (simulation_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_experiment(experiment_id: str, path: Path | None = None) -> dict[str, Any] | None:
    conn = connect(path)
    row = conn.execute("SELECT * FROM experiment_metrics WHERE experiment_id=?", (experiment_id,)).fetchone()
    conn.close()
    if not row:
        return None
    result = dict(row)
    result["metrics"] = json.loads(result.pop("metrics_json"))
    return result


def get_latest_metrics(simulation_id: str, path: Path | None = None) -> dict[str, Any] | None:
    conn = connect(path)
    row = conn.execute(
        "SELECT * FROM experiment_metrics WHERE simulation_id=? ORDER BY created_at DESC LIMIT 1",
        (simulation_id,),
    ).fetchone()
    conn.close()
    if not row:
        return None
    result = dict(row)
    result["metrics"] = json.loads(result.pop("metrics_json"))
    return result


def get_rounds(simulation_id: str, path: Path | None = None) -> list[dict[str, Any]]:
    conn = connect(path)
    rows = conn.execute(
        "SELECT * FROM closed_loop_rounds WHERE simulation_id=? ORDER BY round_number",
        (simulation_id,),
    ).fetchall()
    conn.close()
    return [
        {
            **dict(row),
            "attack_ids": json.loads(row["attack_ids_json"]),
            "metrics": json.loads(row["metrics_json"]),
        }
        for row in rows
    ]
