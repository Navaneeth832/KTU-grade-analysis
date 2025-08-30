import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Your JSON data as a Python list of dictionaries
data = [{'sl_no': 1, 'subject': 'DISCRETE MATHEMATICAL STRUCTURES', 'subject_code': 'MAT203', 'grade': 'S', 'gpa': 10, 'subject_type': 'Theory', 'overall_sgpa': 9.14}, {'sl_no': 2, 'subject': 'DATA STRUCTURES', 'subject_code': 'CST201', 'grade': 'S', 'gpa': 10, 'subject_type': 'Theory', 'overall_sgpa': 9.14}, {'sl_no': 3, 'subject': 'LOGIC SYSTEM DESIGN', 'subject_code': 'CST203', 'grade': 'A', 'gpa': 8.5, 'subject_type': 'Theory', 'overall_sgpa': 9.14}, {'sl_no': 4, 'subject': 'OBJECT ORIENTED PROGRAMMING USING JAVA', 'subject_code': 'CST205', 'grade': 'A', 'gpa': 8.5, 'subject_type': 'Theory', 'overall_sgpa': 9.14}, {'sl_no': 5, 'subject': 'PROFESSIONAL ETHICS', 'subject_code': 'HUT200', 'grade': 'C', 'gpa': 6.5, 'subject_type': 'Theory', 'overall_sgpa': 9.14}, {'sl_no': 6, 'subject': 'SUSTAINABLE ENGINEERING', 'subject_code': 'MCN201', 'grade': 'B', 'gpa': 7.5, 'subject_type': 'Theory', 'overall_sgpa': 9.14}, {'sl_no': 7, 'subject': 'DATA STRUCTURES LAB', 'subject_code': 'CSL201', 'grade': 'S', 'gpa': 10, 'subject_type': 'Lab', 'overall_sgpa': 9.14}, {'sl_no': 8, 'subject': 'OBJECT ORIENTED PROGRAMMING LAB (IN JAVA)', 'subject_code': 'CSL203', 'grade': 'S', 'gpa': 10, 'subject_type': 'Lab', 'overall_sgpa': 9.14}]

def sql_generate(DB_NAME,sem,data):
    DB_USER = os.getenv("DB_USER")
    DB_PASS = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")

    try:
        # 1. Establish the connection
        conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
        cursor = conn.cursor()

        # 2. Get the column names from the data
        if data:
            columns = data[0].keys()
            columns_str = ', '.join(columns)
            placeholders = ', '.join(['%s'] * len(columns))

            # 3. Construct the query template
            insert_query_template = f"INSERT INTO {sem} ({columns_str}) VALUES ({placeholders});"

            # 4. Prepare a list of tuples with the values
            values_list = [tuple(d.values()) for d in data]

            # 5. Execute the query using executemany for bulk insertion
            cursor.executemany(insert_query_template, values_list)

            # 6. Commit the changes to the database
            conn.commit()

            print("Data inserted successfully! ✅")

    except psycopg2.Error as e:
        print(f"An error occurred: {e}")
        if conn:
            conn.rollback() # Rollback in case of error
    finally:
        if conn:
            cursor.close()
            conn.close()
if __name__ == "__main__":
    sql_generate("student_performance_db","semester2")