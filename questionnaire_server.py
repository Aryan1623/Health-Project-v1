"""
HealthAI - Questionnaire ML API Server
Spring Boot proxies /api/questionnaire/generate → this Flask server
Run: python server.py  (default port 5050)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from questionnaire import get_model

app = Flask(__name__)
CORS(app)                     # Allow Angular dev server on :4200

_model = None

def model():
    global _model
    if _model is None:
        _model = get_model()
    return _model


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_trained": model()._trained})


@app.route("/api/questionnaire/generate", methods=["POST"])
def generate_questions():
    """
    POST body:
    {
      "observations": ["high_heart_rate_detected", "sleep_deprivation_detected"],
      "max_questions": 8
    }

    Response:
    {
      "questions": [
        {
          "id": "q_hr_1",
          "text": "How often do you feel your heart beating unusually fast?",
          "options": ["Never","Occasionally","Frequently","Almost always"],
          "category": "cardiovascular",
          "weight": 3
        }, ...
      ],
      "observation_count": 2,
      "model": "RandomForest-MultiOutput-v1"
    }
    """
    try:
        body          = request.get_json(force=True) or {}
        observations  = body.get("observations", [])
        max_questions = int(body.get("max_questions", 10))

        if not isinstance(observations, list):
            return jsonify({"error": "observations must be an array"}), 400

        questions = model().predict_questions(observations, max_questions=max_questions)

        return jsonify({
            "questions":          questions,
            "observation_count":  len(observations),
            "model":              "RandomForest-MultiOutput-v1"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/questionnaire/score", methods=["POST"])
def score_answers():
    """
    POST body:
    {
      "answers": { "q_hr_1": 2, "q_sl_1": 0, ... }   // option index (0-based)
    }

    Response:
    {
      "score": 74,
      "severity": "MEDIUM",
      "breakdown": { "cardiovascular": 60, "sleep": 80, ... }
    }
    """
    try:
        body    = request.get_json(force=True) or {}
        answers = body.get("answers", {})   # { question_id: option_index }

        from model import QUESTION_BANK

        category_scores: dict = {}
        category_counts: dict = {}

        for qid, opt_idx in answers.items():
            q = QUESTION_BANK.get(qid)
            if not q:
                continue
            cat     = q["category"]
            n_opts  = len(q["options"])
            # 0 = best, n-1 = worst → invert to 0–100
            raw_score = (1 - opt_idx / (n_opts - 1)) * 100
            weighted  = raw_score * q["weight"]
            category_scores[cat] = category_scores.get(cat, 0) + weighted
            category_counts[cat] = category_counts.get(cat, 0) + q["weight"]

        breakdown = {}
        total_w, total_s = 0, 0
        for cat in category_scores:
            pct = category_scores[cat] / category_counts[cat]
            breakdown[cat] = round(pct)
            total_s += category_scores[cat]
            total_w += category_counts[cat]

        overall = round(total_s / total_w) if total_w else 70
        severity = "LOW" if overall >= 75 else ("MEDIUM" if overall >= 50 else "HIGH")

        return jsonify({
            "score":     overall,
            "severity":  severity,
            "breakdown": breakdown
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("[HealthAI] Starting Questionnaire ML API on http://localhost:5050")
    app.run(host="0.0.0.0", port=5050, debug=False)
