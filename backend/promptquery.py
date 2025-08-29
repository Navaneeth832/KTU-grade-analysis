from google import genai
from google.genai import types

client = genai.Client()

def query_maker(prompt):
    with open("instructions.txt", "r") as file:
        table_structures = file.read()
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        config=types.GenerateContentConfig(
            system_instruction=table_structures),
        contents=prompt
    )

    return response.text