from firebase_client import upsert_semester_data


def sql_generate(ktu_id, data):
    # Kept function name for backward compatibility with existing app imports.
    upsert_semester_data(ktu_id, data)

