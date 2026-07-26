# KTU Grade Analysis

KTU Grade Analysis is a full-stack application that lets KTU students upload semester grade sheets, stores parsed results, and provides overall analytics, semester analytics, and prompt-based custom insights.

## What the project does

- User registration and login using KTU ID + password
- Upload and parse semester grade-sheet PDFs
- Persist semester and subject-level data in Firestore
- Show dashboard analytics (CGPA, SGPA trend, grade distribution)
- Run predefined and prompt-based custom queries on student data
- Add new semesters and delete uploaded semester data

---

## Tech stack

### Frontend
- React + TypeScript + Vite
- Tailwind CSS
- Recharts (visualizations)
- Axios (API layer)
- React Router

### Backend
- FastAPI
- Firebase Admin SDK (Firestore)
- Google GenAI SDK (PDF extraction)
- Python dotenv

### Data store
- Firebase Firestore

---

## Repository structure

```text
KTU-grade-analysis/
├── backend/
│   ├── app.py                         # FastAPI routes and request handling
│   ├── extraction.py                  # PDF-to-structured-grade extraction via Gemini
│   ├── firebase_client.py             # Firestore init + upsert/delete helpers
│   ├── sql_generator.py               # Compatibility wrapper for persistence call
│   ├── promptquery.py                 # Rule-based custom query engine
│   ├── migrate_postgres_to_firebase.py# One-time migration utility
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # Route map and layout shell
│   │   ├── config/api.ts              # Axios instance + endpoint definitions
│   │   ├── services/api.ts            # API service wrapper used by pages
│   │   ├── pages/                     # Login/Register/Home/Analysis pages
│   │   └── components/                # Navbar, Sidebar, ProtectedRoute, UI pieces
│   └── package.json
└── README.md
```

---

## Architecture

## 1) High-level flow

1. User interacts with React frontend.
2. Frontend calls FastAPI endpoints.
3. FastAPI reads/writes student data in Firestore.
4. During registration/add-semester, backend sends uploaded PDF to Gemini for structured extraction.
5. Extracted records are normalized and saved into Firestore subcollections.
6. Analytics/query endpoints aggregate Firestore data and return chart/table-ready payloads.

## 2) Backend architecture

### API layer (`backend/app.py`)
Main responsibilities:
- Authentication token extraction from the `Authorization` header
- Data retrieval helpers (`_get_semesters`, `_get_grades`)
- Analytics endpoints (`/overall-stats`, `/overall/sgpa`, `/semester/{id}`)
- Query endpoint (`/custom-query/{queryId}`)
- Lifecycle endpoints (`/register`, `/login`, `/add-semester`, delete semester)

### Extraction layer (`backend/extraction.py`)
- Sends PDF bytes to Gemini model
- Requests JSON response using a schema
- Maps grade letters to GPA points (`grade_map`)
- Attaches `ktu_id` and returns normalized records

### Persistence layer (`backend/firebase_client.py`)
- Initializes Firestore client
- Upserts semester summary into `students/{ktu_id}/semesters/{sem_id}`
- Upserts each subject row into `students/{ktu_id}/grade_sheets/{sem_subject}`
- Deletes semester summary and all semester-linked grade rows

### Query layer (`backend/promptquery.py`)
- Rule-based natural-language interpretation for common prompts
- Supports top subjects, lowest/highest semester, grade distribution, credits, CGPA, failed subjects, semester-specific views
- Returns uniform payload: `query`, `headers`, `data`

## 3) Frontend architecture

### Routing and guard
- `App.tsx` defines public routes (`/`, `/login`, `/register`) and protected routes for analysis pages
- `ProtectedRoute` allows access only when `authToken` exists in localStorage

### API integration
- `config/api.ts`: Axios client, base URL, auth header injection interceptor
- `services/api.ts`: typed wrappers used by pages

### Presentation layer
- Pages fetch data from `apiService`, then render cards/charts/tables
- `OverallAnalysis` renders CGPA summary + distribution/trend charts
- `SemesterAnalysis` fetches selected semester data and supports deletion
- `CustomQueries` executes predefined query IDs and prompt-based query ID `5`

## 4) Firestore data model

```text
students (collection)
└── {ktu_id} (document)
    ├── ktu_id, name, password
    ├── semesters (subcollection)
    │   └── {sem_id}
    │       ├── sem_id
    │       ├── credits
    │       ├── sgpa
    │       └── ktu_id
    └── grade_sheets (subcollection)
        └── {sem_id}_{subject_code}
            ├── subject
            ├── subject_code
            ├── grade
            ├── gpa
            ├── subject_type
            ├── overall_sgpa
            ├── sem_id
            └── ktu_id
```

---

## API summary (backend)

- `POST /register` — create student, parse first PDF, persist data
- `POST /login` — validate credentials, return token (= KTU ID)
- `POST /add-semester` — parse new PDF and append semester data
- `POST /overall-stats` — CGPA, credits, grade distribution, trends
- `GET /overall/sgpa` — semester-wise SGPA list
- `GET /semesters` — available semester IDs
- `GET /semester/{semester_id}` — detailed semester grade payload
- `DELETE /semester/{semester_id}` — remove one semester and linked grade rows
- `GET /custom-query/{queryId}?prompt=...` — predefined/custom query execution

---

## Local setup

## Prerequisites

- Node.js 18+
- Python 3.9+
- Firebase project with Firestore enabled
- Firebase service account JSON
- Google AI key for Gemini

## Backend

```bash
cd /home/runner/work/KTU-grade-analysis/KTU-grade-analysis/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
FIREBASE_CREDENTIALS_PATH=/absolute/path/to/firebase-service-account.json
GOOGLE_API_KEY=your_google_api_key
```

Run backend:

```bash
uvicorn app:app --reload
```

Backend URL: `http://127.0.0.1:8000`

## Frontend

```bash
cd /home/runner/work/KTU-grade-analysis/KTU-grade-analysis/frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

---

## Implementation notes

- Authentication is lightweight: the backend returns KTU ID as token and expects it in `Authorization` header.
- Passwords are currently stored as plain text in Firestore.
- Most analytics are computed on demand by reading the student’s semester and grade documents.
- Upload processing uses temporary files under `backend/temp_files` and removes them after request completion.
