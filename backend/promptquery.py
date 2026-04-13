from collections import Counter


def _safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _extract_semester_from_prompt(prompt: str):
    words = prompt.replace("-", " ").split()
    for idx, token in enumerate(words):
        if token in {"sem", "semester"} and idx + 1 < len(words):
            if words[idx + 1].isdigit():
                return int(words[idx + 1])
    digits = "".join(ch for ch in prompt if ch.isdigit())
    if digits:
        return int(digits[0])
    return None


def query_maker(prompt, grades, semesters):
    text = (prompt or "").strip().lower()
    if not text:
        return {"query": "Invalid prompt", "headers": [], "data": []}

    sem_sorted = sorted(semesters, key=lambda x: _safe_int(x.get("sem_id", 0)))
    grade_sorted = sorted(grades, key=lambda x: _safe_float(x.get("gpa", 0)), reverse=True)

    if ("top" in text or "best" in text or "highest" in text) and "subject" in text:
        top_n = 5
        rows = [[g.get("subject", ""), g.get("grade", ""), _safe_float(g.get("gpa", 0))] for g in grade_sorted[:top_n]]
        return {"query": "Top Performing Subjects", "headers": ["subject", "grade", "gpa"], "data": rows}

    if ("lowest" in text or "worst" in text) and ("semester" in text or "sgpa" in text):
        if not sem_sorted:
            return {"query": "Lowest GPA Semester", "headers": [], "data": []}
        low = min(sem_sorted, key=lambda s: _safe_float(s.get("sgpa", 0)))
        return {
            "query": "Lowest GPA Semester",
            "headers": ["semester", "sgpa"],
            "data": [[f"Semester {_safe_int(low.get('sem_id', 0))}", _safe_float(low.get("sgpa", 0))]],
        }

    if ("highest" in text or "best" in text) and ("semester" in text or "sgpa" in text):
        if not sem_sorted:
            return {"query": "Highest GPA Semester", "headers": [], "data": []}
        high = max(sem_sorted, key=lambda s: _safe_float(s.get("sgpa", 0)))
        return {
            "query": "Highest GPA Semester",
            "headers": ["semester", "sgpa"],
            "data": [[f"Semester {_safe_int(high.get('sem_id', 0))}", _safe_float(high.get("sgpa", 0))]],
        }

    if "grade distribution" in text or ("count" in text and "grade" in text):
        counter = Counter(str(g.get("grade", "")) for g in grades if g.get("grade"))
        rows = [[grade, count] for grade, count in sorted(counter.items(), key=lambda x: x[1], reverse=True)]
        return {"query": "Grade Distribution", "headers": ["grade", "count"], "data": rows}

    if "credit" in text:
        rows = [[f"Semester {_safe_int(s.get('sem_id', 0))}", _safe_int(s.get("credits", 0))] for s in sem_sorted]
        return {"query": "Credit Analysis", "headers": ["semester", "credits"], "data": rows}

    if "cgpa" in text or ("overall" in text and "gpa" in text):
        total_credits = sum(_safe_int(s.get("credits", 0)) for s in sem_sorted)
        weighted = sum(_safe_float(s.get("sgpa", 0)) * _safe_int(s.get("credits", 0)) for s in sem_sorted)
        cgpa = round(weighted / total_credits, 2) if total_credits else 0.0
        return {
            "query": "Overall CGPA",
            "headers": ["cgpa", "total_credits", "completed_semesters"],
            "data": [[cgpa, total_credits, len(sem_sorted)]],
        }

    if "failed" in text or "backlog" in text:
        fail_grades = {"F", "FE", "I"}
        failed = [g for g in grades if str(g.get("grade", "")).upper() in fail_grades]
        rows = [[g.get("subject", ""), g.get("grade", ""), _safe_int(g.get("sem_id", 0))] for g in failed]
        return {"query": "Failed Subjects", "headers": ["subject", "grade", "semester"], "data": rows}

    if "semester" in text and ("subject" in text or "course" in text):
        sem_id = _extract_semester_from_prompt(text)
        if sem_id is None:
            return {"query": "Semester Subjects", "headers": [], "data": []}
        rows = [
            [g.get("subject", ""), g.get("grade", ""), _safe_float(g.get("gpa", 0))]
            for g in grades
            if _safe_int(g.get("sem_id", 0)) == sem_id
        ]
        return {
            "query": f"Semester {sem_id} Subjects",
            "headers": ["subject", "grade", "gpa"],
            "data": rows,
        }

    if "semester" in text and ("gpa" in text or "sgpa" in text or "trend" in text):
        rows = [[f"Semester {_safe_int(s.get('sem_id', 0))}", _safe_float(s.get("sgpa", 0))] for s in sem_sorted]
        return {"query": "Semester GPA Trend", "headers": ["semester", "sgpa"], "data": rows}

    return {
        "query": "Prompt Not Supported",
        "headers": ["message"],
        "data": [[
            "Try prompts like: top subjects, lowest semester GPA, grade distribution, CGPA, failed subjects, credits."
        ]],
    }

