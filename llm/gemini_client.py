import google.generativeai as genai

# 🔑 Use your API key
genai.configure(api_key="AIzaSyBQ_3E31ouYkrk7SDu9u6XqfbJe_z0vdKI")

model = genai.GenerativeModel("gemini-2.5-flash")