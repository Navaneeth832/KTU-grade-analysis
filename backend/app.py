# backend/main.py (FastAPI)
from fastapi import FastAPI, HTTPException,Query
from typing import Optional
import psycopg2
import pandas as pd
import traceback
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from promptquery import query_maker
from sql_generator import sql_generate
from extraction import extract_pdf
from pathlib import Path
import requests
from fastapi import Request


load_dotenv()

app = FastAPI()

class User(BaseModel):
    ktuId: str
    password: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

def run_query(query,db="btech_grades"):
    conn = psycopg2.connect(
        dbname=db,
        user="postgres",
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT")
    )
    df = pd.read_sql(query, conn)
    conn.close()
    return df.to_dict(orient="records")




@app.get("/overall/sgpa")
def overall_sgpa():
    query = """
    SELECT CONCAT('semester', sem_id) AS semester, sgpa
    FROM semesters;
    """
    return run_query(query)

@app.post("/overall-stats")
def overall_stats(request: Request):
    sem_ids=run_query("SELECT sem_id FROM semesters;")
   

    try:
        token = request.headers.get("Authorization")
        if not token or not token.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid or missing Authorization header")
        
        ktuid = token.split("Bearer ")[1].strip()
        print("KTU ID:", ktuid)
        query = "select grade,count(*) from grade_sheets where ktu_id='"+ktuid+"' group by grade order by count desc;"

        query2 = "select sem_id,sgpa as overall_sgpa from semesters where ktu_id='"+ktuid+"' order by sem_id;"
        
        query3 = "select subject,gpa from grade_sheets order by gpa desc limit 5;"
        query4=f"""SELECT 
            ROUND((SUM(sgpa * credits) / SUM(credits))::numeric, 2) AS cgpa,
            SUM(credits) AS total_credits,
            COUNT(*) AS total_sems
            FROM semesters where ktu_id='{ktuid}';"""
        
        
        rows = run_query(query)
        rows2 = run_query(query2)
        rows3 = run_query(query3)
        rows4 = run_query(query4) 
        returndata = {
            "cgpa": rows4[0]["cgpa"],  # placeholder, you can compute later if needed
            "totalCredits": rows4[0]["total_credits"],
            "completedSemesters": rows4[0]["total_sems"],
            "gradeDistribution": [
                {"grade": row["grade"], "count": row["count"]}
                for row in rows
            ],
            "semesterGpas": [
                {"semester": str(row["sem_id"]), "gpa": float(row["overall_sgpa"])}
                for row in rows2
            ],
            "subjectPerformance": [
                {"subject": row["subject"], "averageGrade": row["gpa"]}
                for row in rows3
            ]
        }
        return returndata

    except Exception as e:
        print("❌ Error in /overall-stats:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/custom-query/{queryId}")
def custom_queries(queryId: str,request: Request,prompt: Optional[str] = Query(None)):
    try:
        token = request.headers.get("Authorization")
        if not token or not token.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid or missing Authorization header")
        
        ktuid = token.split("Bearer ")[1].strip()
        query_map = {
            "1": {
                "name": "Top Performing Subjects",
                "query": "select subject,grade from grade_sheets where ktu_id='"+ktuid+"' order by gpa desc limit 5;"
            },
            "2": {
                "name": "Lowest GPA Semester",
                "query": f"""SELECT CONCAT('Semester ', sem_id) AS semester, sgpa
                            FROM semesters where ktu_id='{ktuid}'
                            ORDER BY sgpa ASC
                            LIMIT 1;"""
            },
            "3": {
                "name": "Grade Distribution Analysis",
                "query": "select grade,count(*) from grade_sheets where ktu_id='"+ktuid+"' group by grade order by count desc;"
            },
            "4": {
                "name": "Credit Analysis",
                "query": "SELECT CONCAT('Semester ', sem_id) AS semester, credits FROM semesters where ktu_id='"+ktuid+"' ORDER BY sem_id;"
            },
            "5": {
                "name": "Custom query with AI",
                "query": ""
            }
        }

        if queryId not in query_map:
            raise HTTPException(status_code=400, detail="Invalid queryId")
        query_info = query_map[queryId]
        if queryId == "5":
            print("Generating query for prompt:", prompt)
            query= query_maker(prompt)
            print(query)
            if query=='Not a query':
                raise HTTPException(status_code=400, detail="The prompt does not correspond to a valid SQL query.")
            rows=run_query(query)
        else:
            
            rows = run_query(query_info["query"])

        if not rows:
            return {
                "query": query_info["name"],
                "headers": [],
                "data": []
            }

        headers = list(rows[0].keys())
        data = [list(row.values()) for row in rows]

        return {
            "query": query_info["name"],
            "headers": headers,
            "data": data
        }

    except Exception as e:
        print(f"❌ Error in /custom-query/{queryId}:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/semester/{semester_id}")
def semester_analysis(semester_id: int, request: Request):
    """
    This returns structured semester data instead of raw table rows
    """
    try:
        token = request.headers.get("Authorization")
        if not token or not token.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid or missing Authorization header")
        
        ktuid = token.split("Bearer ")[1].strip()
        query = f"SELECT subject, grade, gpa, overall_sgpa FROM grade_sheets WHERE sem_id = {semester_id};"
        rows = run_query(query)

        if not rows:
            raise HTTPException(status_code=404, detail="No data found for this semester")

        # Transform to custom format
        semester_data = {
            "semester": semester_id,
            "sgpa": rows[0]["overall_sgpa"],   # assuming same SGPA for all rows
            "totalCredits": len(rows),         # OR compute properly if you have credits column
            "grades": [
                {
                    "subject": row["subject"],
                    "grade": row["grade"],
                    "points": row["gpa"],
                    "credits":4
                }
                for row in rows
            ]
        }

        return semester_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/database-creation")
def create_database(db_name: str,sem: str,filepath):
    try:
        data=extract_pdf(Path(filepath))
        sql_generate(db_name,sem,data)
        return {"message": f"Database '{db_name}' and tables created successfully with data inserted."}
    except Exception as e:
        print("❌ Error in /database-creation:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/login")
def login(user: User):
    prompt="select * from students where ktu_id='"+user.ktuId+"' and password='"+user.password+"';"
    try:
        rows=run_query(prompt,"postgres")
        if len(rows)==0:
            print("❌ Incorrect credentials:", e)
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=str(e))
        else:
            print("✅ Login successful for user:", user.ktuId)
            return {"token": user.ktuId}
    except Exception as e:
        print("❌ Error in /login:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    


