# backend/main.py (FastAPI)
from fastapi import FastAPI, HTTPException, Query, File, UploadFile, Form
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
import shutil

load_dotenv()

app = FastAPI()

class User(BaseModel):
    ktuId: str
    password: str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
def run_dml(query, params=None, db="postgres"):
    try:
        conn = psycopg2.connect(
            dbname=db,
            user="postgres",
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        cur = conn.cursor()
        cur.execute(query, params)  # safe parameterized query
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "success"}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}
def run_query(query, db="btech_grades"):
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
    sem_ids = run_query("SELECT sem_id FROM semesters;")

    try:
        token = request.headers.get("Authorization")
        if not token or not token.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid or missing Authorization header")

        ktuid = token.split("Bearer ")[1].strip()
        print("KTU ID:", ktuid)
        query = "select grade,count(*) from grade_sheets where ktu_id='" + ktuid + "' group by grade order by count desc;"
        query2 = "select sem_id,sgpa as overall_sgpa from semesters where ktu_id='" + ktuid + "' order by sem_id;"
        query3 = "select subject,gpa from grade_sheets order by gpa desc limit 5;"
        query4 = f"""SELECT
            ROUND((SUM(sgpa * credits) / SUM(credits))::numeric, 2) AS cgpa,
            SUM(credits) AS total_credits,
            COUNT(*) AS total_sems
            FROM semesters where ktu_id='{ktuid}';"""

        rows = run_query(query)
        rows2 = run_query(query2)
        rows3 = run_query(query3)
        rows4 = run_query(query4)
        returndata = {
            "cgpa": rows4[0]["cgpa"],
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
def custom_queries(queryId: str, request: Request, prompt: Optional[str] = Query(None)):
    try:
        token = request.headers.get("Authorization")
        if not token or not token.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid or missing Authorization header")

        ktuid = token.split("Bearer ")[1].strip()
        query_map = {
            "1": {
                "name": "Top Performing Subjects",
                "query": "select subject,grade from grade_sheets where ktu_id='" + ktuid + "' order by gpa desc limit 5;"
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
                "query": "select grade,count(*) from grade_sheets where ktu_id='" + ktuid + "' group by grade order by count desc;"
            },
            "4": {
                "name": "Credit Analysis",
                "query": "SELECT CONCAT('Semester ', sem_id) AS semester, credits FROM semesters where ktu_id='" + ktuid + "' ORDER BY sem_id;"
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
            query = query_maker(prompt)
            print(query)
            if query == 'Not a query':
                raise HTTPException(status_code=400, detail="The prompt does not correspond to a valid SQL query.")
            rows = run_query(query)
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
        query = f"SELECT subject, grade, gpa, overall_sgpa FROM grade_sheets WHERE sem_id = {semester_id} and ktu_id='{ktuid}';"
        rows = run_query(query)

        if not rows:
            raise HTTPException(status_code=404, detail="No data found for this semester")

        semester_data = {
            "semester": semester_id,
            "sgpa": rows[0]["overall_sgpa"],
            "totalCredits": len(rows),
            "grades": [
                {
                    "subject": row["subject"],
                    "grade": row["grade"],
                    "points": row["gpa"],
                    "credits": 4
                }
                for row in rows
            ]
        }

        return semester_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/semesters")
def get_semesters(request: Request):
    try:
        token = request.headers.get("Authorization")
        if not token or not token.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid or missing Authorization header")

        ktuid = token.split("Bearer ")[1].strip()
        query = f"select distinct sem_id from grade_sheets where ktu_id='{ktuid}';"
        rows = run_query(query)
        return [row['sem_id'] for row in rows]

    except Exception as e:
        print(f"❌ Error in /semesters:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/register")
async def register(
    ktuId: str = Form(...),
    name: str = Form(...),
    password: str = Form(...),
    gradeSheet: UploadFile = File(...)
):
    try:
        # Save the uploaded file temporarily
        temp_dir = "temp_files"
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, gradeSheet.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(gradeSheet.file, buffer)

        # Extract data from the PDF
        extracted_data = extract_pdf(Path(file_path), ktuId)
        if not extracted_data:
            raise HTTPException(status_code=400, detail="Could not extract data from the provided PDF. Please ensure it is a valid grade sheet.")

        # Generate and execute SQL
        sql_generate(ktuId, extracted_data)

        # Clean up the temporary file
        os.remove(file_path)

        result = run_dml(
            "INSERT INTO students (ktu_id, name, password) VALUES (%s, %s, %s)",
            (ktuId, name, password)
        )
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=f"Failed to register user: {result.get('message')}")

        print("✅ User registered successfully:", ktuId)
        return {"message": "User registered successfully"}
    except Exception as e:
        print("❌ Error in /register:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
def login(user: User):
    print(user)
    prompt = "select * from students where ktu_id='" + user.ktuId + "' and password='" + user.password + "';"
    try:
        rows = run_query(prompt, "postgres")
        if len(rows) == 0:
            raise HTTPException(status_code=401, detail="Incorrect credentials")
        else:
            print("✅ Login successful for user:", user.ktuId)
            return {"token": user.ktuId}
    except Exception as e:
        print("❌ Error in /login:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    


