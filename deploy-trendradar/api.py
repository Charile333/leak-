# TrendRadar API Adapter
# 这是一个轻量级的 FastAPI 服务，用于将 TrendRadar 的 SQLite 数据暴露为 JSON API

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os
from pydantic import BaseModel
from typing import List, Optional
import json
import glob
import datetime
import sys

app = FastAPI(title="TrendRadar API", version="1.1.0")

# 允许跨域 (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库目录路径 (Docker volume 映射路径)
DB_DIR = "/app/output/news"

def get_latest_db():
    """
    获取最新的数据库文件路径
    """
    if not os.path.exists(DB_DIR):
        print(f"DB directory not found: {DB_DIR}")
        return None
        
    # 查找所有 .db 文件
    db_files = glob.glob(os.path.join(DB_DIR, "*.db"))
    if not db_files:
        print(f"No .db files found in {DB_DIR}")
        return None
        
    # 按文件名排序（日期格式）
    db_files.sort(reverse=True)
    print(f"Found DB files: {db_files}, using: {db_files[0]}")
    return db_files[0]

def get_db_connection():
    db_path = get_latest_db()
    if not db_path:
        return None
        
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"Failed to connect to DB {db_path}: {e}")
        return None

@app.get("/")
def read_root():
    return {
        "status": "online", 
        "service": "TrendRadar API Wrapper", 
        "version": "1.1.0",
        "db": get_latest_db()
    }

@app.get("/api/health")
def check_health():
    """
    健康检查接口
    """
    db_path = get_latest_db()
    status = "online" if db_path else "db_missing"
    return {"status": status, "db": db_path}

@app.get("/api/debug")
def debug_db():
    """
    调试接口：显示数据库状态、表结构、记录数和第一条数据
    """
    conn = get_db_connection()
    if not conn:
        return {"error": "No connection", "db_dir_exists": os.path.exists(DB_DIR), "db_files": glob.glob(os.path.join(DB_DIR, "*.db"))}
    
    cursor = conn.cursor()
    result = {
        "db_path": get_latest_db(),
        "tables": [],
        "counts": {},
        "first_row_news": None,
        "schema_news": []
    }
    
    try:
        # 1. 查表名
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        result["tables"] = tables
        
        # 2. 查每个表的记录数
        for table in tables:
            try:
                cursor.execute(f"SELECT count(*) FROM {table}")
                count = cursor.fetchone()[0]
                result["counts"][table] = count
            except:
                result["counts"][table] = "error"

        # 3. 查 news_items 表结构
        if "news_items" in tables:
            cursor.execute("PRAGMA table_info(news_items)")
            columns = [dict(row) for row in cursor.fetchall()]
            result["schema_news"] = columns
            
            # 4. 查第一条数据
            cursor.execute("SELECT * FROM news_items LIMIT 1")
            row = cursor.fetchone()
            result["first_row_news"] = dict(row) if row else None
            
        return result
    except Exception as e:
        return {"error": str(e), "trace": str(sys.exc_info())}
    finally:
        conn.close()

@app.get("/api/trends")
def get_trends(limit: int = 50, source: Optional[str] = None):
    """
    获取最新舆情列表
    """
    print(f"Requesting trends: limit={limit}, source={source}")
    conn = get_db_connection()
    if not conn:
        print("No DB connection")
        return []

    cursor = conn.cursor()
    
    try:
        # 检查表是否存在
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='news_items'")
        if not cursor.fetchone():
            print("Table 'news_items' not found")
            return []
            
        # 构建查询
        # 注意：这里去掉了 24 小时的时间过滤，直接按时间倒序返回最新数据
        query = """
            SELECT 
                id, 
                title, 
                url, 
                platform_id as source, 
                created_at as publish_time 
            FROM news_items 
            WHERE 1=1
        """
        params = []
        
        if source:
            query += " AND platform_id = ?"
            params.append(source)
            
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        print(f"Query returned {len(rows)} rows")
        
        # 转换结果
        results = [dict(row) for row in rows]
        return results
        
    except Exception as e:
        print(f"Error querying database: {e}")
        return []
    finally:
        if conn: conn.close()

@app.get("/api/analysis")
def get_analysis(limit: int = 20):
    """
    获取 AI 分析结果
    """
    conn = get_db_connection()
    if not conn:
        return []

    cursor = conn.cursor()
    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_analysis'")
        if not cursor.fetchone():
            return []

        cursor.execute("SELECT * FROM ai_analysis ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except Exception:
        return []
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
