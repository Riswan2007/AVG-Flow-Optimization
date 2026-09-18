import sqlite3
import json
import os
import datetime
from typing import List, Dict, Optional, Tuple, Any
from backend.models.schemas import AGV, Task, AGVStatus, TaskPriority, TaskStatus, ActivityLog, BeforeAfterDiff, SimulationMetrics

import tempfile

# Support Vercel serverless environment and read-only filesystems
if os.environ.get("VERCEL") or not os.access(os.path.dirname(__file__), os.W_OK):
    DB_PATH = os.path.join(tempfile.gettempdir(), "smartagv.db")
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), "smartagv.db")

class Database:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.init_db()
        self.seed_initial_data()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # AGVs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS agvs (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    location TEXT NOT NULL,
                    battery REAL NOT NULL,
                    status TEXT NOT NULL,
                    action_state TEXT DEFAULT 'IDLE',
                    speed REAL NOT NULL,
                    capacity REAL NOT NULL,
                    current_task TEXT,
                    current_route TEXT,
                    route_index INTEGER DEFAULT 0,
                    sub_progress REAL DEFAULT 0.0,
                    estimated_completion_time REAL
                )
            """)

            # Tasks table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    source TEXT NOT NULL,
                    destination TEXT NOT NULL,
                    material TEXT NOT NULL,
                    quantity REAL NOT NULL,
                    priority TEXT NOT NULL,
                    status TEXT NOT NULL,
                    progress_percent REAL DEFAULT 0.0,
                    assigned_agv TEXT,
                    assigned_route TEXT,
                    created_at TEXT NOT NULL,
                    estimated_time REAL,
                    reason TEXT
                )
            """)

            # Activity Logs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    level TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    message TEXT NOT NULL,
                    details TEXT
                )
            """)

            # Before vs After Optimization Diffs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS optimization_diffs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    previous_agv TEXT,
                    new_agv TEXT,
                    previous_route TEXT,
                    new_route TEXT,
                    previous_distance REAL,
                    new_distance REAL,
                    previous_congestion REAL,
                    new_congestion REAL
                )
            """)

            conn.commit()

    def seed_initial_data(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as count FROM agvs")
            if cursor.fetchone()["count"] > 0:
                return  # Database already seeded

            # Seed AGVs
            initial_agvs = [
                ("AGV-01", "Titan AGV-01", "Storage-A", 92.0, "available", "IDLE", 1.5, 500.0, None, "[]", 0, 0.0, None),
                ("AGV-02", "Falcon AGV-02", "Machine-01", 76.0, "available", "IDLE", 1.5, 500.0, None, "[]", 0, 0.0, None),
                ("AGV-03", "Atlas AGV-03", "Storage-B", 48.0, "available", "IDLE", 1.5, 600.0, None, "[]", 0, 0.0, None),
                ("AGV-04", "Spark AGV-04", "Charging-01", 31.0, "charging", "CHARGING", 1.2, 400.0, None, "[]", 0, 0.0, None),
                ("AGV-05", "Goliath AGV-05", "Storage-C", 85.0, "available", "IDLE", 1.5, 700.0, None, "[]", 0, 0.0, None),
                ("AGV-06", "Vortex AGV-06", "Machine-03", 67.0, "available", "IDLE", 1.5, 500.0, None, "[]", 0, 0.0, None),
            ]
            cursor.executemany("""
                INSERT INTO agvs (id, name, location, battery, status, action_state, speed, capacity, current_task, current_route, route_index, sub_progress, estimated_completion_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, initial_agvs)

            now_str = datetime.datetime.now().strftime("%H:%M:%S")
            # Seed 10 Tasks
            initial_tasks = [
                ("TASK-001", "Storage-A", "Machine-01", "Steel Sheets", 150.0, "NORMAL", "pending", 0.0, None, "[]", now_str, None, None),
                ("TASK-002", "Storage-B", "Machine-02", "Aluminum Bars", 200.0, "HIGH", "pending", 0.0, None, "[]", now_str, None, None),
                ("TASK-003", "Storage-C", "Machine-03", "Copper Coils", 100.0, "HIGH", "pending", 0.0, None, "[]", now_str, None, None),
                ("TASK-004", "Machine-01", "Prod-01", "Processed Assemblies", 120.0, "URGENT", "pending", 0.0, None, "[]", now_str, None, None),
                ("TASK-005", "Storage-A", "Machine-03", "Plastic Resin", 80.0, "NORMAL", "pending", 0.0, None, "[]", now_str, None, None),
                ("TASK-006", "Storage-B", "Machine-01", "Fasteners", 50.0, "NORMAL", "pending", 0.0, None, "[]", now_str, None, None),
                ("TASK-007", "Machine-02", "Prod-02", "Sub-Assemblies", 180.0, "HIGH", "pending", 0.0, None, "[]", now_str, None, None),
                ("TASK-008", "Storage-C", "Machine-02", "Electronic Components", 90.0, "NORMAL", "pending", 0.0, None, "[]", now_str, None, None),
                ("TASK-009", "Machine-03", "Prod-02", "Heavy Castings", 400.0, "NORMAL", "pending", 0.0, None, "[]", now_str, None, None),
                ("TASK-010", "Storage-A", "Prod-01", "Packaging Material", 100.0, "NORMAL", "pending", 0.0, None, "[]", now_str, None, None),
            ]
            cursor.executemany("""
                INSERT INTO tasks (id, source, destination, material, quantity, priority, status, progress_percent, assigned_agv, assigned_route, created_at, estimated_time, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, initial_tasks)

            # Seed initial activity logs
            cursor.execute("""
                INSERT INTO activity_logs (id, timestamp, level, event_type, message, details)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (f"LOG-001", now_str, "info", "system", "SmartAGV Factory System Initialized. Seed data loaded.", "{}"))

            conn.commit()

    def get_all_agvs(self) -> List[AGV]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM agvs")
            rows = cursor.fetchall()
            result = []
            for r in rows:
                agv_dict = dict(r)
                agv_dict['current_route'] = json.loads(agv_dict['current_route'] or "[]")
                result.append(AGV(**agv_dict))
            return result

    def update_agv(self, agv: AGV):
        status_val = agv.status.value if hasattr(agv.status, 'value') else str(agv.status)
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE agvs
                SET name=?, location=?, battery=?, status=?, action_state=?, speed=?, capacity=?, current_task=?, current_route=?, route_index=?, sub_progress=?, estimated_completion_time=?
                WHERE id=?
            """, (
                agv.name, agv.location, agv.battery, status_val, agv.action_state, agv.speed, agv.capacity,
                agv.current_task, json.dumps(agv.current_route), agv.route_index, agv.sub_progress,
                agv.estimated_completion_time, agv.id
            ))
            conn.commit()

    def get_all_tasks(self) -> List[Task]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM tasks")
            rows = cursor.fetchall()
            result = []
            for r in rows:
                t_dict = dict(r)
                t_dict['assigned_route'] = json.loads(t_dict['assigned_route'] or "[]")
                result.append(Task(**t_dict))
            return result

    def add_task(self, task: Task):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO tasks (id, source, destination, material, quantity, priority, status, progress_percent, assigned_agv, assigned_route, created_at, estimated_time, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                task.id, task.source, task.destination, task.material, task.quantity,
                task.priority.value, task.status.value, task.progress_percent, task.assigned_agv,
                json.dumps(task.assigned_route), task.created_at, task.estimated_time, task.reason
            ))
            conn.commit()

    def update_task(self, task: Task):
        prio_val = task.priority.value if hasattr(task.priority, 'value') else str(task.priority)
        status_val = task.status.value if hasattr(task.status, 'value') else str(task.status)
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE tasks
                SET source=?, destination=?, material=?, quantity=?, priority=?, status=?, progress_percent=?, assigned_agv=?, assigned_route=?, estimated_time=?, reason=?
                WHERE id=?
            """, (
                task.source, task.destination, task.material, task.quantity,
                prio_val, status_val, task.progress_percent, task.assigned_agv,
                json.dumps(task.assigned_route), task.estimated_time, task.reason, task.id
            ))
            conn.commit()

    def add_activity_log(self, log: ActivityLog):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO activity_logs (id, timestamp, level, event_type, message, details)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (log.id, log.timestamp, log.level, log.event_type, log.message, json.dumps(log.details or {})))
            conn.commit()

    def get_activity_logs(self, limit: int = 50) -> List[ActivityLog]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM activity_logs ORDER BY ROWID DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            result = []
            for r in rows:
                l_dict = dict(r)
                l_dict['details'] = json.loads(l_dict['details'] or "{}")
                result.append(ActivityLog(**l_dict))
            return result

    def add_optimization_diff(self, diff: BeforeAfterDiff):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO optimization_diffs (task_id, timestamp, reason, previous_agv, new_agv, previous_route, new_route, previous_distance, new_distance, previous_congestion, new_congestion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                diff.task_id, diff.timestamp, diff.reason, diff.previous_agv, diff.new_agv,
                json.dumps(diff.previous_route), json.dumps(diff.new_route),
                diff.previous_distance, diff.new_distance, diff.previous_congestion, diff.new_congestion
            ))
            conn.commit()

    def get_optimization_diffs(self, limit: int = 20) -> List[BeforeAfterDiff]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM optimization_diffs ORDER BY id DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            result = []
            for r in rows:
                d_dict = dict(r)
                d_dict['previous_route'] = json.loads(d_dict['previous_route'] or "[]")
                d_dict['new_route'] = json.loads(d_dict['new_route'] or "[]")
                d_dict.pop('id', None)
                result.append(BeforeAfterDiff(**d_dict))
            return result

    def reset_database(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DROP TABLE IF EXISTS agvs")
            cursor.execute("DROP TABLE IF EXISTS tasks")
            cursor.execute("DROP TABLE IF EXISTS activity_logs")
            cursor.execute("DROP TABLE IF EXISTS optimization_diffs")
            conn.commit()
        self.init_db()
        self.seed_initial_data()
