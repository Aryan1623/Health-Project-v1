from llm.gemini_client import model
import json
import re


def clean_llm_response(text):
    """
    Cleans Gemini output to extract valid JSON
    """
    try:
        # Remove markdown blocks
        text = re.sub(r"```json|```", "", text).strip()

        # Extract JSON array
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            return match.group(0)

        return text
    except:
        return text


def validate_questions(data):
    """
    Ensures structure is usable by questionnaire.py
    """
    if not isinstance(data, list):
        return False

    for q in data:
        if not isinstance(q, dict):
            return False
        if "question" not in q or "options" not in q:
            return False
        if not isinstance(q["options"], list) or len(q["options"]) < 2:
            return False

    return True


def generate_questions(observations, max_questions=10):
    """
    Generates MCQs safely for CLI questionnaire
    """

    prompt = f"""
You are an experienced medical doctor conducting an initial patient assessment.

Based on the following observations:
{observations}

Your goal is to ask relevant, symptom-focused questions to understand the patient’s condition better.

Generate EXACTLY {max_questions} multiple-choice questions that:
- Help assess severity, duration, and impact of symptoms
- Are appropriate for a sick patient
- Use simple, patient-friendly language
- Reflect real clinical questioning style

STRICT RULES:
- ONLY return a JSON array
- NO explanation
- NO markdown
- Each question must have EXACTLY 4 options
- The LAST option MUST ALWAYS be: "None"
- First 3 options should represent meaningful choices (e.g., severity, duration, frequency)
- Questions should sound like a doctor speaking to a patient

FORMAT:
[
  {{
    "question": "string",
    "options": ["opt1", "opt2", "opt3", "None"]
  }}
]
"""

    try:
        response = model.generate_content(prompt)
        raw_text = response.text.strip()

        # DEBUG (optional)
        # print("RAW LLM:", raw_text)

        cleaned = clean_llm_response(raw_text)

        data = json.loads(cleaned)

        if validate_questions(data):
            return data

    except Exception as e:
        print("⚠️ LLM parsing error:", e)

    # 🔁 ALWAYS SAFE FALLBACK
    return fallback_questions(observations, max_questions)


# =========================
# 🔁 FALLBACK (CRITICAL)
# =========================

def fallback_questions(observations, max_questions):
    questions = []

    if "high_heart_rate_detected" in observations:
        questions.append({
            "question": "Do you feel your heart beating fast?",
            "options": ["No", "Sometimes", "Yes"]
        })

    if "low_spo2_detected" in observations:
        questions.append({
            "question": "Are you experiencing breathing difficulty?",
            "options": ["No", "Mild", "Severe"]
        })

    if "sleep_deprivation_detected" in observations:
        questions.append({
            "question": "How well did you sleep?",
            "options": ["Good", "Average", "Poor"]
        })

    if "eye_redness_detected" in observations:
        questions.append({
            "question": "Do your eyes feel irritated?",
            "options": ["No", "Sometimes", "Yes"]
        })

    if "facial_fatigue_detected" in observations:
        questions.append({
            "question": "Do you feel fatigued?",
            "options": ["No", "A little", "Very tired"]
        })

    # Default fallback
    if not questions:
        questions.append({
            "question": "How are you feeling today?",
            "options": ["Good", "Okay", "Unwell"]
        })

    return questions[:max_questions]