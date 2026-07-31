import json
import logging
import sqlite3
import os
import time
from typing import Dict, Any, Optional, List
from app.config import settings

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "qcms.db")

class DualPersistenceService:
    def __init__(self):
        self.url = settings.SUPABASE_URL
        self.key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        self.supabase_client = None

        if self.url and "mock.supabase.co" not in self.url and self.key and "mock_key" not in self.key:
            try:
                from supabase import create_client
                self.supabase_client = create_client(self.url, self.key)
                logger.info("Initialized live Supabase PostgreSQL client.")
            except Exception as e:
                logger.warning(f"Supabase client init failed: {e}")

        # Initialize local persistent SQLite database
        self._init_sqlite()

    def _init_sqlite(self):
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS complaints (
                id TEXT PRIMARY KEY,
                complaint_number TEXT UNIQUE,
                lifecycle_status TEXT,
                form_state TEXT,
                complaint_source TEXT,
                customer_name TEXT,
                product_name TEXT,
                product_strength TEXT,
                batch_lot_number TEXT,
                manufacturing_date TEXT,
                expiry_date TEXT,
                quantity_affected TEXT,
                complaint_type TEXT,
                complaint_date TEXT,
                description TEXT,
                initial_severity TEXT,
                priority TEXT,
                risk_assessment TEXT,
                completeness TEXT,
                created_at TEXT,
                updated_at TEXT
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS activity_logs (
                id TEXT PRIMARY KEY,
                complaint_id TEXT,
                timestamp TEXT,
                title TEXT,
                description TEXT,
                type TEXT,
                actor TEXT,
                created_at TEXT
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_history (
                id TEXT PRIMARY KEY,
                complaint_id TEXT,
                role TEXT,
                content TEXT,
                timestamp TEXT,
                created_at TEXT
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS uploaded_documents (
                id TEXT PRIMARY KEY,
                complaint_id TEXT,
                filename TEXT,
                file_size INTEGER,
                mime_type TEXT,
                page_count INTEGER,
                uploaded_at TEXT
            );
            """)
            conn.commit()
            conn.close()
            logger.info("Initialized local persistent SQLite database (qcms.db).")
        except Exception as e:
            logger.error(f"SQLite init error: {e}")

    def save_complaint(self, record: Dict[str, Any]) -> Dict[str, Any]:
        cid = record.get("id") or f"cmp_{int(time.time())}"
        cnum = record.get("complaint_number") or f"QCM-2026-{int(time.time() % 10000)}"
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ")

        risk_json = json.dumps(record.get("risk_assessment", {}))
        comp_json = json.dumps(record.get("completeness", {}))

        # 1. Supabase write
        if self.supabase_client:
            try:
                self.supabase_client.table("complaints").upsert(record).execute()
            except Exception as e:
                logger.error(f"Supabase upsert error: {e}")

        # 2. SQLite persistent write
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
        INSERT OR REPLACE INTO complaints (
            id, complaint_number, lifecycle_status, form_state, complaint_source, customer_name,
            product_name, product_strength, batch_lot_number, manufacturing_date, expiry_date,
            quantity_affected, complaint_type, complaint_date, description, initial_severity,
            priority, risk_assessment, completeness, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            cid, cnum,
            record.get("lifecycle_status", "pending_triage"),
            record.get("form_state", "saved"),
            record.get("complaint_source", ""),
            record.get("customer_name", ""),
            record.get("product_name", ""),
            record.get("product_strength", ""),
            record.get("batch_lot_number", ""),
            record.get("manufacturing_date", ""),
            record.get("expiry_date", ""),
            record.get("quantity_affected", ""),
            record.get("complaint_type", ""),
            record.get("complaint_date", ""),
            record.get("description", ""),
            record.get("initial_severity", ""),
            record.get("priority", ""),
            risk_json, comp_json, now_iso, now_iso
        ))
        conn.commit()
        conn.close()

        logger.info(f"✓ Persistent record saved for complaint {cnum} (ID: {cid})")
        return {"id": cid, "complaint_number": cnum, "saved_at": now_iso}

    def list_complaints(self) -> List[Dict[str, Any]]:
        if self.supabase_client:
            try:
                res = self.supabase_client.table("complaints").select("*").execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.warning(f"Supabase list_complaints error: {e}")

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM complaints ORDER BY created_at DESC;")
        rows = cursor.fetchall()
        conn.close()

        results = []
        for r in rows:
            d = dict(r)
            try:
                d["risk_assessment"] = json.loads(d.get("risk_assessment") or "{}")
                d["completeness"] = json.loads(d.get("completeness") or "{}")
            except Exception:
                pass
            results.append(d)
        return results

    def get_complaint(self, complaint_id: str) -> Optional[Dict[str, Any]]:
        if self.supabase_client:
            try:
                res = self.supabase_client.table("complaints").select("*").eq("id", complaint_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.warning(f"Supabase get_complaint error: {e}")

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM complaints WHERE id = ? OR complaint_number = ?;", (complaint_id, complaint_id))
        row = cursor.fetchone()
        conn.close()

        if row:
            d = dict(row)
            try:
                d["risk_assessment"] = json.loads(d.get("risk_assessment") or "{}")
                d["completeness"] = json.loads(d.get("completeness") or "{}")
            except Exception:
                pass
            return d
        return None

    def log_activity(self, complaint_id: str, title: str, description: str, act_type: str, actor: str):
        aid = f"act_{int(time.time() * 1000)}"
        now_time = time.strftime("%H:%M:%S")
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ")

        if self.supabase_client:
            try:
                self.supabase_client.table("activity_logs").insert({
                    "id": aid,
                    "complaint_id": complaint_id,
                    "timestamp": now_time,
                    "title": title,
                    "description": description,
                    "type": act_type,
                    "actor": actor
                }).execute()
            except Exception as e:
                logger.warning(f"Supabase log_activity error: {e}")

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO activity_logs (id, complaint_id, timestamp, title, description, type, actor, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, (aid, complaint_id, now_time, title, description, act_type, actor, now_iso))
        conn.commit()
        conn.close()

    def save_chat_message(self, complaint_id: str, role: str, content: str):
        mid = f"msg_{int(time.time() * 1000)}"
        now_time = time.strftime("%H:%M:%S")
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ")

        if self.supabase_client:
            try:
                self.supabase_client.table("chat_history").insert({
                    "id": mid,
                    "complaint_id": complaint_id,
                    "role": role,
                    "content": content,
                    "timestamp": now_time
                }).execute()
            except Exception as e:
                logger.warning(f"Supabase save_chat_message error: {e}")

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO chat_history (id, complaint_id, role, content, timestamp, created_at)
        VALUES (?, ?, ?, ?, ?, ?);
        """, (mid, complaint_id, role, content, now_time, now_iso))
        conn.commit()
        conn.close()

supabase_service = DualPersistenceService()
