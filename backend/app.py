# backend/main.py (FastAPI)
from fastapi import FastAPI, HTTPException,Query
from typing import Optional
import psycopg2
import pandas as pd
import traceback
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from promptquery import query_maker

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_methods=["*"],
    allow_headers=["*"],
)

def run_query(query):
    conn = psycopg2.connect(
        dbname="postgres",
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
    SELECT 'Semester 1' AS semester, MAX(overall_sgpa) AS sgpa FROM semester1
    UNION
    SELECT 'Semester 2', MAX(overall_sgpa) FROM semester2
    UNION
    SELECT 'Semester 3', MAX(overall_sgpa) FROM semester3
    UNION
    SELECT 'Semester 4', MAX(overall_sgpa) FROM semester4;
    """
    return run_query(query)

@app.get("/overall-stats")
def overall_stats():
    query = """SELECT grade, COUNT(*) as count FROM (
        SELECT grade FROM semester1
        UNION ALL
        SELECT grade FROM semester2
        UNION ALL
        SELECT grade FROM semester3
        UNION ALL
        SELECT grade FROM semester4
    ) as all_grades
    GROUP BY grade
    ORDER BY grade;"""

    query2 = """
        SELECT 1 as semester, overall_sgpa 
        FROM semester1
        GROUP BY overall_sgpa

        UNION ALL

        SELECT 2, overall_sgpa
        FROM semester2
        GROUP BY overall_sgpa

        UNION ALL

        SELECT 3, overall_sgpa
        FROM semester3
        GROUP BY overall_sgpa

        UNION ALL

        SELECT 4, overall_sgpa
        FROM semester4
        GROUP BY overall_sgpa;

    """

    query3 = """
        SELECT subject, gpa
        FROM (
            SELECT 'Semester 1' AS semester, * FROM semester1
            UNION ALL
            SELECT 'Semester 2', * FROM semester2
            UNION ALL
            SELECT 'Semester 3', * FROM semester3
            UNION ALL
            SELECT 'Semester 4', * FROM semester4
        ) AS all_subjects
        ORDER BY gpa DESC
        LIMIT 5;
    """
    query4="""SELECT 
        ROUND((SUM(sgpa * credits) / SUM(credits))::numeric, 2) AS cgpa,
        SUM(credits) AS total_credits,
        COUNT(*) AS total_sems
        FROM semesters;"""

    try:
        rows = run_query(query)   # list of dicts
        rows2 = run_query(query2) # list of dicts
        rows3 = run_query(query3) # list of dicts
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
                {"semester": row["semester"], "gpa": row["overall_sgpa"]}
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
def custom_queries(queryId: str,prompt: Optional[str] = Query(None)):
    try:
        query_map = {
            "1": {
                "name": "Top Performing Subjects",
                "query": """
                    SELECT subject, gpa as "average grade"
                    FROM (
                        SELECT 'Semester 1' AS semester, * FROM semester1
                        UNION ALL
                        SELECT 'Semester 2', * FROM semester2
                        UNION ALL
                        SELECT 'Semester 3', * FROM semester3
                        UNION ALL
                        SELECT 'Semester 4', * FROM semester4
                    ) AS all_subjects
                    ORDER BY gpa DESC
                    LIMIT 5;
                """
            },
            "2": {
                "name": "Lowest GPA Semester",
                "query": """SELECT CONCAT('Semester ', sem_id) AS semester, sgpa
                            FROM semesters
                            ORDER BY sgpa ASC
                            LIMIT 1;"""
            },
            "3": {
                "name": "Grade Distribution Analysis",
                "query": """SELECT grade, COUNT(*) as count FROM (
                        SELECT grade FROM semester1
                        UNION ALL
                        SELECT grade FROM semester2
                        UNION ALL
                        SELECT grade FROM semester3
                        UNION ALL
                        SELECT grade FROM semester4
                    ) as all_grades
                    GROUP BY grade
                    ORDER BY count desc;"""
            },
            "4": {
                "name": "Credit Analysis",
                "query": "SELECT CONCAT('Semester ', sem_id) AS semester, credits FROM semesters;"
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
def semester_analysis(semester_id: int):
    """
    This returns structured semester data instead of raw table rows
    """
    try:
        query = f"SELECT subject, grade, gpa, overall_sgpa FROM semester{semester_id};"
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


