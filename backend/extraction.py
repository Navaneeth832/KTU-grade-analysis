from google import genai
from google.genai import types
import pathlib
from pydantic import BaseModel
import json
from tabulate import tabulate

client = genai.Client()

class Semester_Grade_Sheet(BaseModel):
    subject: str
    subject_code: str
    grade: str
    gpa: float
    subject_type: str
    overall_sgpa: float
    ktu_id: str
    sem_id: int
    
filepath = pathlib.Path('sample3.pdf')
grade_map={
  'S':10,
  'A+':9,
  'A':8.5,
  'B+':8,
  'B':7.5,
  'C+':7,
  'C':6.5,
  'D':6,
  'P':5.5,
  'F':0,
  'I':0,
  'FE':0
}

def display_ast_table(data):
    headers = data[0].keys() if data else []
    table = [item.values() for item in data]
    print(tabulate(table, headers, tablefmt="grid"))

def extract_pdf(filepath,ktuid):
    prompt = "Scan this semester grade sheet and extract the details and provide the structured output."
    response = client.models.generate_content(
      model="gemini-3.1-flash-lite-preview",
      contents=[
          types.Part.from_bytes(
            data=filepath.read_bytes(),
            mime_type='application/pdf',
          ),
          prompt],
          config={
            "response_mime_type": "application/json",
            "response_schema": list[Semester_Grade_Sheet],
          },
      )

    output_text=response.text
    try:
      output=json.loads(output_text)
      for i in output:
        if i['grade'] in grade_map:
          i['gpa']=grade_map[i['grade']]
        else:
          i['gpa']=0
      for item in output:
        item['ktu_id'] = ktuid 
      display_ast_table(output)
      return output
      
    except Exception as e:
      print("Error:", e)
if __name__ == "__main__":
    extract_pdf(filepath)



