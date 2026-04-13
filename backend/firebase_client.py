import os
from typing import Any

import firebase_admin
from firebase_admin import credentials, firestore

credit_mapping = {1: 17, 2: 21, 3: 22, 4: 22, 5: 23, 6: 23, 7: 15, 8: 17}


def get_firestore_db():
    if not firebase_admin._apps:
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
        if cred_path:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
    return firestore.client()


def upsert_semester_data(ktu_id: str, data: list[dict[str, Any]]) -> None:
    if not data:
        return

    db = get_firestore_db()
    student_ref = db.collection("students").document(ktu_id)

    sem_id = int(data[0].get("sem_id", 0))
    sgpa = float(data[0].get("overall_sgpa", 0))
    credits = credit_mapping.get(sem_id, 0)

    batch = db.batch()
    semester_ref = student_ref.collection("semesters").document(str(sem_id))
    batch.set(
        semester_ref,
        {"sem_id": sem_id, "credits": credits, "sgpa": sgpa, "ktu_id": ktu_id},
        merge=True,
    )

    for item in data:
        row = dict(item)
        row["ktu_id"] = ktu_id
        row["sem_id"] = int(row.get("sem_id", sem_id))
        subject_code = str(row.get("subject_code", "unknown"))
        grade_ref = student_ref.collection("grade_sheets").document(
            f"{row['sem_id']}_{subject_code}"
        )
        batch.set(grade_ref, row, merge=True)

    batch.commit()


def delete_semester_data(ktu_id: str, sem_id: int) -> int:
    db = get_firestore_db()
    student_ref = db.collection("students").document(ktu_id)

    deleted = 0
    batch = db.batch()

    semester_ref = student_ref.collection("semesters").document(str(sem_id))
    batch.delete(semester_ref)

    grade_docs = (
        student_ref.collection("grade_sheets")
        .where("sem_id", "==", sem_id)
        .stream()
    )
    for doc in grade_docs:
        batch.delete(doc.reference)
        deleted += 1

    batch.commit()
    return deleted
