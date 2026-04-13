import os
from collections import defaultdict

from dotenv import load_dotenv

from firebase_client import get_firestore_db

try:
    import psycopg2
    import psycopg2.extras
except ImportError as exc:
    raise SystemExit(
        "psycopg2 is required for migration. Install it with: pip install psycopg2-binary"
    ) from exc


def _connect(dbname: str):
    return psycopg2.connect(
        dbname=dbname,
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
    )


def _fetch_all(conn, query: str):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
        cursor.execute(query)
        return [dict(row) for row in cursor.fetchall()]


def _normalize_row(row: dict):
    normalized = {}
    for key, value in row.items():
        if isinstance(value, float):
            normalized[key] = float(value)
        elif value is None:
            normalized[key] = ""
        else:
            normalized[key] = value
    return normalized


def migrate():
    load_dotenv()

    auth_db = os.getenv("PG_AUTH_DB", "postgres")
    grades_db = os.getenv("PG_GRADES_DB", "btech_grades")

    auth_conn = _connect(auth_db)
    grades_conn = _connect(grades_db)

    try:
        students = _fetch_all(
            auth_conn,
            "SELECT ktu_id, name, password FROM students;",
        )
        semesters = _fetch_all(
            grades_conn,
            "SELECT sem_id, credits, sgpa, ktu_id FROM semesters;",
        )
        grades = _fetch_all(
            grades_conn,
            "SELECT subject, subject_code, grade, gpa, subject_type, overall_sgpa, ktu_id, sem_id FROM grade_sheets;",
        )
    finally:
        auth_conn.close()
        grades_conn.close()

    db = get_firestore_db()

    semesters_by_student = defaultdict(list)
    for sem in semesters:
        semesters_by_student[str(sem.get("ktu_id"))].append(_normalize_row(sem))

    grades_by_student = defaultdict(list)
    for grade in grades:
        row = _normalize_row(grade)
        row["sem_id"] = int(row.get("sem_id", 0))
        grades_by_student[str(row.get("ktu_id"))].append(row)

    migrated_students = 0
    migrated_semesters = 0
    migrated_grades = 0

    for student in students:
        ktu_id = str(student.get("ktu_id"))
        if not ktu_id:
            continue

        student_ref = db.collection("students").document(ktu_id)
        student_ref.set(_normalize_row(student), merge=True)
        migrated_students += 1

        batch = db.batch()

        for sem in semesters_by_student.get(ktu_id, []):
            sem_id = int(sem.get("sem_id", 0))
            sem_ref = student_ref.collection("semesters").document(str(sem_id))
            batch.set(sem_ref, sem, merge=True)
            migrated_semesters += 1

        for grade in grades_by_student.get(ktu_id, []):
            sem_id = int(grade.get("sem_id", 0))
            subject_code = str(grade.get("subject_code", "unknown"))
            grade_ref = student_ref.collection("grade_sheets").document(f"{sem_id}_{subject_code}")
            batch.set(grade_ref, grade, merge=True)
            migrated_grades += 1

        batch.commit()

    print("Migration completed.")
    print(f"Students migrated: {migrated_students}")
    print(f"Semesters migrated: {migrated_semesters}")
    print(f"Grade rows migrated: {migrated_grades}")


if __name__ == "__main__":
    migrate()

