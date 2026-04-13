# CGPA Analysis and Querying System

A full-stack web application designed to help students analyze their academic performance by parsing PDF grade sheets, providing detailed CGPA/SGPA analysis, and allowing for AI-powered custom queries on their academic data.

## Overview

This project automates the process of calculating and analyzing academic grades from university grade sheets. Users can register, upload their grade sheet in PDF format, and get instant insights into their performance. The system extracts data, stores it in a structured database, and presents it through an intuitive dashboard. A key feature is the ability to ask complex questions about the academic data in natural language, which are then translated into SQL queries by an AI model.

## Features

- **User Authentication**: Secure registration and login system for personalized access.
- **PDF Grade Sheet Parsing**: Automatically extracts subjects, grades, and credits from uploaded PDF grade sheets using the Gemini API.
- **Overall Analysis Dashboard**: Displays key metrics like overall CGPA, total credits earned, and semester completion status.
- **Grade Distribution**: Visualizes the distribution of grades (S, A+, A, etc.) in a clean chart.
- **Semester-wise Performance**: Provides a breakdown of SGPA for each semester, showing academic progression over time.
- **AI-Powered Custom Queries**: Users can ask questions in plain English (e.g., "In which semester did I score the lowest?") which are converted to SQL queries and executed to provide an answer.
- **Pre-defined Queries**: A set of common and useful queries are available for quick insights.

## Tech Stack

| Area    | Technologies                               |
|---------|--------------------------------------------|
| **Frontend**  | React, TypeScript, Vite, Tailwind CSS, Recharts, Axios, React Router |
| **Backend**   | Python, FastAPI, Firebase Admin SDK |
| **AI/ML**     | Google Gemini API                          |
| **Database**  | Firebase Firestore                         |

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Python](https://www.python.org/) (v3.9 or later)
- A Firebase project with Firestore enabled
- A Google AI API Key for the Gemini API. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd cgpa_analysis/backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up Firebase Firestore:**
    - Create a Firebase project.
    - Enable Firestore Database in that project.
    - Create a service account key (JSON file) from Firebase Console -> Project Settings -> Service Accounts.
    - Save that JSON key file on your system.

5.  **Configure environment variables:**
    - Create a `.env` file in the `backend` directory.
    - Add your Firebase and Google API key values to the `.env` file:
      ```
      FIREBASE_CREDENTIALS_PATH=path_to_service_account_json
      GOOGLE_API_KEY=your_google_api_key
      ```
    - If you want to run one-time Postgres -> Firebase migration, also add:
      ```
      DB_USER=postgres
      DB_PASSWORD=your_db_password
      DB_HOST=localhost
      DB_PORT=5432
      PG_AUTH_DB=postgres
      PG_GRADES_DB=btech_grades
      ```

6.  **Run the backend server:**
    ```bash
    uvicorn app:app --reload
    ```
    The backend will be running at `http://127.0.0.1:8000`.

7.  **(Optional) Migrate existing local Postgres data to Firebase:**
    ```bash
    python migrate_postgres_to_firebase.py
    ```
    This copies `students`, `semesters`, and `grade_sheets` rows to Firestore.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend will be running at `http://localhost:5173`.

## Usage

1.  Open your browser and navigate to `http://localhost:5173`.
2.  Register for a new account by providing your KTU ID, name, password, and your latest semester grade sheet PDF.
3.  Once registered, log in with your credentials.
4.  Explore the dashboard to see your overall and semester-wise performance.
5.  Use the "Custom Queries" page to ask questions about your grades or select from pre-defined queries.
6.  Use the Semester Analysis page to delete an uploaded semester if needed.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
