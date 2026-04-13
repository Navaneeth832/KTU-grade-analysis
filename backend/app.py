from collections import Counter
from pathlib import Path
import os
import shutil
import traceback
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from extraction import extract_pdf
from firebase_client import delete_semester_data, get_firestore_db
from promptquery import query_maker
from sql_generator import sql_generate

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class User(BaseModel):
    ktuId: str
    password: str


def get_ktu_id_from_request(request: Request) -> str:
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing Authorization header")
    return token.split("Bearer ")[1].strip()


def _get_student_ref(ktu_id: str):
    db = get_firestore_db()
    return db.collection("students").document(ktu_id)


def _get_semesters(ktu_id: str):
    student_ref = _get_student_ref(ktu_id)
    docs = student_ref.collection("semesters").stream()
    semesters = [doc.to_dict() for doc in docs if doc.exists]
    semesters.sort(key=lambda x: int(x.get("sem_id", 0)))
    return semesters


def _get_grades(ktu_id: str, sem_id: Optional[int] = None, limit: Optional[int] = None):
    student_ref = _get_student_ref(ktu_id)
    query = student_ref.collection("grade_sheets")
    if sem_id is not None:
        query = query.where("sem_id", "==", sem_id)
    if limit is not None:
        query = query.limit(limit)
    docs = query.stream()
    grades = [doc.to_dict() for doc in docs if doc.exists]
    grades.sort(key=lambda x: (int(x.get("sem_id", 0)), str(x.get("subject", ""))))
    return grades


@app.get("/overall/sgpa")
def overall_sgpa(request: Request):
    ktu_id = get_ktu_id_from_request(request)
    semesters = _get_semesters(ktu_id)
    return [{"semester": f"semester{row['sem_id']}", "sgpa": row.get("sgpa", 0)} for row in semesters]


@app.post("/overall-stats")
def overall_stats(request: Request):
    try:
        ktu_id = get_ktu_id_from_request(request)
        # Cap grade reads to keep the endpoint responsive even for large datasets.
        grades = _get_grades(ktu_id, limit=1200)
        semesters = _get_semesters(ktu_id)

        grade_counter = Counter(str(row.get("grade", "")) for row in grades if row.get("grade"))
        grade_distribution = [{"grade": grade, "count": count} for grade, count in grade_counter.items()]
        grade_distribution.sort(key=lambda x: x["count"], reverse=True)

        subject_performance = sorted(
            [
                {"subject": row.get("subject", ""), "averageGrade": float(row.get("gpa", 0))}
                for row in grades
            ],
            key=lambda x: x["averageGrade"],
            reverse=True,
        )[:5]

        semester_gpas = [
            {"semester": str(row.get("sem_id", "")), "gpa": float(row.get("sgpa", 0))}
            for row in semesters
        ]

        total_credits = sum(int(row.get("credits", 0)) for row in semesters)
        weighted_sum = sum(float(row.get("sgpa", 0)) * int(row.get("credits", 0)) for row in semesters)
        cgpa = round((weighted_sum / total_credits), 2) if total_credits else 0

        return {
            "cgpa": cgpa,
            "totalCredits": total_credits,
            "completedSemesters": len(semesters),
            "gradeDistribution": grade_distribution,
            "semesterGpas": semester_gpas,
            "subjectPerformance": subject_performance,
        }
    except Exception as e:
        print("Error in /overall-stats:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/custom-query/{queryId}")
def custom_queries(queryId: str, request: Request, prompt: Optional[str] = Query(None)):
    try:
        ktu_id = get_ktu_id_from_request(request)
        grades = _get_grades(ktu_id, limit=1200)
        semesters = _get_semesters(ktu_id)

        if queryId == "1":
            rows = sorted(grades, key=lambda x: float(x.get("gpa", 0)), reverse=True)[:5]
            return {
                "query": "Top Performing Subjects",
                "headers": ["subject", "grade"],
                "data": [[row.get("subject", ""), row.get("grade", "")] for row in rows],
            }

        if queryId == "2":
            if not semesters:
                return {"query": "Lowest GPA Semester", "headers": [], "data": []}
            lowest = min(semesters, key=lambda x: float(x.get("sgpa", 0)))
            return {
                "query": "Lowest GPA Semester",
                "headers": ["semester", "sgpa"],
                "data": [[f"Semester {lowest.get('sem_id', '')}", float(lowest.get("sgpa", 0))]],
            }

        if queryId == "3":
            grade_counter = Counter(str(row.get("grade", "")) for row in grades if row.get("grade"))
            data = [[grade, count] for grade, count in sorted(grade_counter.items(), key=lambda item: item[1], reverse=True)]
            return {"query": "Grade Distribution Analysis", "headers": ["grade", "count"], "data": data}

        if queryId == "4":
            data = [[f"Semester {row.get('sem_id', '')}", int(row.get("credits", 0))] for row in semesters]
            return {"query": "Credit Analysis", "headers": ["semester", "credits"], "data": data}

        if queryId == "5":
            if not prompt:
                raise HTTPException(status_code=400, detail="Prompt is required for queryId 5")
            result = query_maker(prompt, grades, semesters)
            if not isinstance(result, dict):
                return {"query": "Invalid prompt", "headers": [], "data": []}
            if not isinstance(result.get("headers"), list) or not isinstance(result.get("data"), list):
                return {"query": "Invalid prompt", "headers": [], "data": []}
            return result

        raise HTTPException(status_code=400, detail="Invalid queryId")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /custom-query/{queryId}:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/semester/{semester_id}")
def semester_analysis(semester_id: int, request: Request):
    try:
        ktu_id = get_ktu_id_from_request(request)
        grades = _get_grades(ktu_id, sem_id=semester_id)
        if not grades:
            raise HTTPException(status_code=404, detail="No data found for this semester")

        semester_doc = next((row for row in _get_semesters(ktu_id) if int(row.get("sem_id", 0)) == semester_id), None)
        sgpa = float(semester_doc.get("sgpa", 0)) if semester_doc else float(grades[0].get("overall_sgpa", 0))

        return {
            "semester": semester_id,
            "sgpa": sgpa,
            "totalCredits": len(grades),
            "grades": [
                {
                    "subject": row.get("subject", ""),
                    "grade": row.get("grade", ""),
                    "points": float(row.get("gpa", 0)),
                    "credits": 4,
                }
                for row in grades
            ],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/semesters")
def get_semesters(request: Request):
    try:
        ktu_id = get_ktu_id_from_request(request)
        return [int(row.get("sem_id", 0)) for row in _get_semesters(ktu_id)]
    except Exception as e:
        print("Error in /semesters:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/semester/{semester_id}")
def delete_semester(semester_id: int, request: Request):
    try:
        ktu_id = get_ktu_id_from_request(request)
        student_ref = _get_student_ref(ktu_id)
        if not student_ref.get().exists:
            raise HTTPException(status_code=404, detail="Student account not found")

        semester_doc = student_ref.collection("semesters").document(str(semester_id)).get()
        if not semester_doc.exists:
            raise HTTPException(status_code=404, detail="Semester not found")

        deleted_courses = delete_semester_data(ktu_id, semester_id)
        return {
            "message": f"Semester {semester_id} deleted successfully",
            "deletedCourses": deleted_courses,
        }
    except HTTPException:
        raise
    except Exception as e:
        print("Error in DELETE /semester/{semester_id}:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/register")
async def register(
    ktuId: str = Form(...),
    name: str = Form(...),
    password: str = Form(...),
    gradeSheet: UploadFile = File(...),
):
    file_path = None
    try:
        student_ref = _get_student_ref(ktuId)
        if student_ref.get().exists:
            raise HTTPException(status_code=409, detail="User already exists")

        temp_dir = "temp_files"
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, gradeSheet.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(gradeSheet.file, buffer)

        extracted_data = extract_pdf(Path(file_path), ktuId)
        if not extracted_data:
            raise HTTPException(
                status_code=400,
                detail="Could not extract data from the provided PDF. Please ensure it is a valid grade sheet.",
            )

        student_ref.set({"ktu_id": ktuId, "name": name, "password": password}, merge=True)
        sql_generate(ktuId, extracted_data)
        return {"message": "User registered successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print("Error in /register:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)


@app.post("/add-semester")
async def add_semester(request: Request, gradeSheet: UploadFile = File(...)):
    file_path = None
    try:
        ktu_id = get_ktu_id_from_request(request)
        student_ref = _get_student_ref(ktu_id)
        if not student_ref.get().exists:
            raise HTTPException(status_code=404, detail="Student account not found")

        temp_dir = "temp_files"
        os.makedirs(temp_dir, exist_ok=True)
        safe_filename = f"{ktu_id}_{gradeSheet.filename}"
        file_path = os.path.join(temp_dir, safe_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(gradeSheet.file, buffer)

        extracted_data = extract_pdf(Path(file_path), ktu_id)
        if not extracted_data:
            raise HTTPException(
                status_code=400,
                detail="Could not extract data from the provided PDF. Please ensure it is a valid grade sheet.",
            )

        sql_generate(ktu_id, extracted_data)
        return {"message": "Semester marksheet added successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print("Error in /add-semester:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)


@app.post("/login")
def login(user: User):
    try:
        student_doc = _get_student_ref(user.ktuId).get()
        if not student_doc.exists:
            raise HTTPException(status_code=401, detail="Incorrect credentials")

        student = student_doc.to_dict() or {}
        if student.get("password") != user.password:
            raise HTTPException(status_code=401, detail="Incorrect credentials")

        return {"token": user.ktuId}
    except HTTPException:
        raise
    except Exception as e:
        print("Error in /login:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
