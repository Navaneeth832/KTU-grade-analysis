import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def create_database_and_tables(db_name):
    try:
        # Connect to the default 'postgres' database to create a new database
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_DEFAULT"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        conn.autocommit = True
        cur = conn.cursor()

        # Create the new database
        cur.execute(f"CREATE DATABASE {db_name}")
        print(f"Database '{db_name}' created successfully.")

        cur.close()
        conn.close()

       

    except psycopg2.Error as e:
        print(f"Error: {e}")
    try:
         # Connect to the newly created database
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=db_name,
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        cur = conn.cursor()

        # Create 'semesters' table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS semesters (
                sem_id SERIAL PRIMARY KEY,
                sgpa NUMERIC(4, 2),
                credits INTEGER
            );
        """)
        print("Table 'semesters' created successfully.")

        # Create tables for semester1 to semester8
        for i in range(1, 9):
            table_name = f"semester{i}"
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    sl_no SERIAL PRIMARY KEY,
                    subject VARCHAR(255),
                    subject_code VARCHAR(50),
                    grade VARCHAR(10),
                    gpa NUMERIC(4, 2),
                    subject_type VARCHAR(50),
                    overall_sgpa NUMERIC(4, 2)
                );
            """)
            print(f"Table '{table_name}' created successfully.")

        conn.commit()
        cur.close()
        conn.close()
    except psycopg2.Error as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_database_and_tables("skibidi")