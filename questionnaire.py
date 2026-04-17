"""
HealthAI - ML-Powered Questionnaire Generator
Uses scikit-learn (MultiLabelBinarizer + Random Forest) to learn
which follow-up questions are most diagnostically relevant
given a set of detected health observations.
"""

import numpy as np
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.pipeline import Pipeline
import json, os, pickle

# ─────────────────────────────────────────────────
#  QUESTION BANK  (question_id → full question obj)
# ─────────────────────────────────────────────────
QUESTION_BANK = {
    # Cardiovascular
    "q_hr_1":  {"id": "q_hr_1",  "text": "How often do you feel your heart beating unusually fast?",
                "options": ["Never","Occasionally","Frequently","Almost always"], "category": "cardiovascular", "weight": 3},
    "q_hr_2":  {"id": "q_hr_2",  "text": "Do you experience chest tightness or palpitations during rest?",
                "options": ["No","Mild","Moderate","Severe"], "category": "cardiovascular", "weight": 4},
    "q_hr_3":  {"id": "q_hr_3",  "text": "How much caffeine do you consume daily?",
                "options": ["None","1 cup","2–3 cups","4+ cups"], "category": "cardiovascular", "weight": 2},
    "q_hr_4":  {"id": "q_hr_4",  "text": "Do you experience shortness of breath during light activity?",
                "options": ["No","Rarely","Sometimes","Often"], "category": "cardiovascular", "weight": 4},
    "q_hr_5":  {"id": "q_hr_5",  "text": "Have you experienced dizziness or lightheadedness recently?",
                "options": ["No","Once or twice","Weekly","Daily"], "category": "cardiovascular", "weight": 3},

    # Respiratory / SpO2
    "q_spo2_1": {"id": "q_spo2_1", "text": "Do you feel breathless even at rest?",
                 "options": ["No","Mild","Moderate","Severe"], "category": "respiratory", "weight": 5},
    "q_spo2_2": {"id": "q_spo2_2", "text": "Have you been diagnosed with any respiratory condition?",
                 "options": ["No","Asthma","COPD","Other"], "category": "respiratory", "weight": 4},
    "q_spo2_3": {"id": "q_spo2_3", "text": "Do you smoke or are you exposed to smoke regularly?",
                 "options": ["No","Passive","Occasional","Daily smoker"], "category": "respiratory", "weight": 3},

    # Sleep
    "q_sl_1":  {"id": "q_sl_1",  "text": "How many hours of sleep do you typically get per night?",
                "options": ["< 4 hrs","4–5 hrs","6–7 hrs","7+ hrs"], "category": "sleep", "weight": 4},
    "q_sl_2":  {"id": "q_sl_2",  "text": "How long does it take you to fall asleep?",
                "options": ["< 10 min","10–20 min","20–45 min","> 45 min"], "category": "sleep", "weight": 3},
    "q_sl_3":  {"id": "q_sl_3",  "text": "Do you wake up feeling refreshed?",
                "options": ["Always","Usually","Rarely","Never"], "category": "sleep", "weight": 3},
    "q_sl_4":  {"id": "q_sl_4",  "text": "Do you use screens (phone/TV) within 1 hour of sleeping?",
                "options": ["Never","Occasionally","Usually","Always"], "category": "sleep", "weight": 2},
    "q_sl_5":  {"id": "q_sl_5",  "text": "Do you experience daytime drowsiness that affects your work?",
                "options": ["Never","Rarely","Sometimes","Daily"], "category": "sleep", "weight": 4},

    # Eye / Vision
    "q_eye_1": {"id": "q_eye_1", "text": "How many hours per day do you spend looking at screens?",
                "options": ["< 2 hrs","2–4 hrs","4–8 hrs","8+ hrs"], "category": "ocular", "weight": 3},
    "q_eye_2": {"id": "q_eye_2", "text": "Do you experience blurred vision or eye strain?",
                "options": ["No","Occasionally","Frequently","Constantly"], "category": "ocular", "weight": 3},
    "q_eye_3": {"id": "q_eye_3", "text": "Do your eyes feel dry or gritty?",
                "options": ["No","Mild","Moderate","Severe"], "category": "ocular", "weight": 3},
    "q_eye_4": {"id": "q_eye_4", "text": "Do you have any known eye conditions or allergies?",
                "options": ["No","Allergies","Myopia/Hyperopia","Other"], "category": "ocular", "weight": 2},

    # Fatigue / Neurological
    "q_fat_1": {"id": "q_fat_1", "text": "How would you rate your energy levels throughout the day?",
                "options": ["High","Moderate","Low","Very low"], "category": "fatigue", "weight": 4},
    "q_fat_2": {"id": "q_fat_2", "text": "Do you feel mentally foggy or have difficulty concentrating?",
                "options": ["Never","Occasionally","Frequently","Always"], "category": "fatigue", "weight": 4},
    "q_fat_3": {"id": "q_fat_3", "text": "How often do you feel physically exhausted without exertion?",
                "options": ["Never","Rarely","Often","Daily"], "category": "fatigue", "weight": 4},
    "q_fat_4": {"id": "q_fat_4", "text": "Do you experience muscle weakness or heaviness?",
                "options": ["No","Mild","Moderate","Severe"], "category": "fatigue", "weight": 3},

    # Lifestyle / Cross-cutting
    "q_life_1": {"id": "q_life_1", "text": "How many glasses of water do you drink daily?",
                 "options": ["< 4","4–6","6–8","8+"], "category": "lifestyle", "weight": 2},
    "q_life_2": {"id": "q_life_2", "text": "How often do you exercise per week?",
                 "options": ["Never","1–2 times","3–4 times","5+ times"], "category": "lifestyle", "weight": 2},
    "q_life_3": {"id": "q_life_3", "text": "How would you rate your current stress levels?",
                 "options": ["Low","Moderate","High","Overwhelming"], "category": "lifestyle", "weight": 3},
    "q_life_4": {"id": "q_life_4", "text": "Have you noticed any recent changes in your appetite?",
                 "options": ["No change","Slight decrease","Significant decrease","Increased appetite"], "category": "lifestyle", "weight": 2},
}

# ─────────────────────────────────────────────────
#  TRAINING DATA
#  Each row: observations → relevant question ids
# ─────────────────────────────────────────────────
TRAINING_DATA = [
    # Single observations
    (["high_heart_rate_detected"],
     ["q_hr_1","q_hr_2","q_hr_3","q_hr_4","q_hr_5","q_life_3"]),

    (["low_spo2_detected"],
     ["q_spo2_1","q_spo2_2","q_spo2_3","q_hr_4"]),

    (["sleep_deprivation_detected"],
     ["q_sl_1","q_sl_2","q_sl_3","q_sl_4","q_sl_5","q_life_3"]),

    (["eye_redness_detected"],
     ["q_eye_1","q_eye_2","q_eye_3","q_eye_4","q_sl_4"]),

    (["facial_fatigue_detected"],
     ["q_fat_1","q_fat_2","q_fat_3","q_fat_4","q_life_1","q_life_3"]),

    # Combinations — stress + cardiovascular pattern
    (["high_heart_rate_detected","facial_fatigue_detected"],
     ["q_hr_1","q_hr_2","q_hr_4","q_fat_1","q_fat_2","q_fat_3","q_life_3","q_life_2"]),

    (["high_heart_rate_detected","sleep_deprivation_detected"],
     ["q_hr_1","q_hr_3","q_hr_5","q_sl_1","q_sl_2","q_sl_5","q_life_3","q_life_1"]),

    (["sleep_deprivation_detected","facial_fatigue_detected"],
     ["q_sl_1","q_sl_3","q_sl_5","q_fat_1","q_fat_2","q_fat_3","q_fat_4","q_life_1"]),

    (["sleep_deprivation_detected","eye_redness_detected"],
     ["q_sl_1","q_sl_4","q_sl_5","q_eye_1","q_eye_2","q_eye_3","q_fat_2"]),

    (["eye_redness_detected","facial_fatigue_detected"],
     ["q_eye_1","q_eye_2","q_eye_3","q_fat_1","q_fat_2","q_sl_4","q_life_3"]),

    (["eye_redness_detected","high_heart_rate_detected"],
     ["q_eye_1","q_eye_3","q_hr_1","q_hr_3","q_hr_5","q_life_3","q_life_1"]),

    # Triple combinations
    (["high_heart_rate_detected","sleep_deprivation_detected","facial_fatigue_detected"],
     ["q_hr_1","q_hr_2","q_hr_4","q_sl_1","q_sl_5","q_fat_1","q_fat_2","q_fat_3","q_life_3","q_life_2"]),

    (["sleep_deprivation_detected","eye_redness_detected","facial_fatigue_detected"],
     ["q_sl_1","q_sl_3","q_sl_5","q_eye_1","q_eye_3","q_fat_1","q_fat_3","q_life_1","q_life_3"]),

    (["high_heart_rate_detected","eye_redness_detected","facial_fatigue_detected"],
     ["q_hr_1","q_hr_2","q_hr_5","q_eye_1","q_eye_2","q_fat_1","q_fat_3","q_life_3","q_life_2"]),

    (["low_spo2_detected","high_heart_rate_detected"],
     ["q_spo2_1","q_spo2_2","q_spo2_3","q_hr_2","q_hr_4","q_life_2"]),

    (["low_spo2_detected","sleep_deprivation_detected"],
     ["q_spo2_1","q_spo2_3","q_sl_1","q_sl_3","q_sl_5","q_fat_1"]),

    # All four
    (["high_heart_rate_detected","sleep_deprivation_detected",
      "eye_redness_detected","facial_fatigue_detected"],
     ["q_hr_1","q_hr_2","q_hr_4","q_sl_1","q_sl_5",
      "q_eye_1","q_fat_1","q_fat_2","q_life_3","q_life_1"]),

    # No observation (baseline wellness)
    ([],
     ["q_life_1","q_life_2","q_life_3","q_life_4","q_sl_3"]),
]

ALL_OBSERVATION_LABELS = [
    "high_heart_rate_detected",
    "low_spo2_detected",
    "sleep_deprivation_detected",
    "eye_redness_detected",
    "facial_fatigue_detected",
]

ALL_QUESTION_IDS = list(QUESTION_BANK.keys())


class QuestionnaireMLModel:
    def __init__(self):
        self.obs_binarizer  = MultiLabelBinarizer(classes=ALL_OBSERVATION_LABELS)
        self.q_binarizer    = MultiLabelBinarizer(classes=ALL_QUESTION_IDS)

        self.classifier = MultiOutputClassifier(
            RandomForestClassifier(
                n_estimators=120,
                random_state=42,
                min_samples_leaf=1,
                n_jobs=-1   # ✅ Faster + Flask friendly
            )
        )
        self._trained = False

    def train(self):
        X_raw = [obs for obs, _ in TRAINING_DATA]
        y_raw = [qs  for _,  qs in TRAINING_DATA]

        X = self.obs_binarizer.fit_transform(X_raw)
        y = self.q_binarizer.fit_transform(y_raw)

        # ✅ Deterministic augmentation (important for API consistency)
        np.random.seed(42)

        X_aug, y_aug = [], []
        for xi, yi in zip(X, y):
            X_aug.append(xi); y_aug.append(yi)

            xi2 = xi.copy()
            idx = np.random.randint(0, len(xi2))
            xi2[idx] = 1 - xi2[idx]

            X_aug.append(xi2); y_aug.append(yi)

        self.classifier.fit(np.array(X_aug), np.array(y_aug))
        self._trained = True

        print(f"[ML] Model trained on {len(X_aug)} samples")

    def predict_questions(self, observations: list, max_questions: int = 10) -> list:
        if not self._trained:
            self.train()

        X = self.obs_binarizer.transform([observations])

        # ✅ Predict labels
        y_pred = self.classifier.predict(X)[0]
        q_ids  = self.q_binarizer.inverse_transform(y_pred.reshape(1,-1))[0]

        # ✅ SAFE probability extraction
        proba_list = []
        for est in self.classifier.estimators_:
            if hasattr(est, "predict_proba") and len(est.classes_) > 1:
                proba_list.append(est.predict_proba(X)[0][1])
            else:
                proba_list.append(0.5)

        proba_array = np.array(proba_list)

        # ✅ Score
        scored = []
        for qid in q_ids:
            idx = ALL_QUESTION_IDS.index(qid)
            prob = float(proba_array[idx]) if idx < len(proba_array) else 0.5
            weight = QUESTION_BANK[qid]["weight"]

            scored.append((qid, prob * weight))

        scored.sort(key=lambda x: x[1], reverse=True)
        top_ids = [qid for qid, _ in scored[:max_questions]]

        # ✅ Fallback
        if len(top_ids) < 3:
            for qid in ["q_life_3","q_life_1","q_life_2","q_sl_3"]:
                if qid not in top_ids:
                    top_ids.append(qid)
                if len(top_ids) >= 5:
                    break

        return [QUESTION_BANK[qid] for qid in top_ids]

    def save(self, path="model.pkl"):
        with open(path, "wb") as f:
            pickle.dump(self, f)

    @staticmethod
    def load(path="model.pkl"):
        with open(path, "rb") as f:
            return pickle.load(f)


# ─── Train and export on import ───
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "questionnaire_model.pkl")

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "questionnaire_model.pkl")

def get_model() -> QuestionnaireMLModel:
    global _MODEL_PATH

    if os.path.exists(_MODEL_PATH):
        try:
            m = QuestionnaireMLModel.load(_MODEL_PATH)
            if m._trained:
                print("[ML] Loaded trained model")
                return m
        except Exception as e:
            print("[ML] Load failed, retraining:", e)

    print("[ML] Training new model...")
    m = QuestionnaireMLModel()
    m.train()
    m.save(_MODEL_PATH)
    return m

if __name__ == "__main__":
    model = get_model()

    print("\n🧠 HealthAI - ML Questionnaire Generator")
    print("========================================")

    print("\nAvailable observations:")
    for i, obs in enumerate(ALL_OBSERVATION_LABELS, 1):
        print(f"{i}. {obs}")

    print("\n👉 Enter observations as comma-separated values (example: 1,3,5)")
    print("👉 Or press ENTER for no observations\n")

    user_input = input("Your input: ").strip()

    # Parse input
    if user_input == "":
        observations = []
    else:
        try:
            indices = [int(x.strip()) - 1 for x in user_input.split(",")]
            observations = [ALL_OBSERVATION_LABELS[i] for i in indices if 0 <= i < len(ALL_OBSERVATION_LABELS)]
        except Exception:
            print("❌ Invalid input. Please enter numbers like 1,2,3")
            exit()

    # Predict questions
    questions = model.predict_questions(observations, max_questions=8)

    print("\n📋 Generated Questions:")
    print("========================")

    for i, q in enumerate(questions, 1):
        print(f"\n{i}. [{q['category'].upper()}] {q['text']}")
        for j, opt in enumerate(q["options"], 1):
            print(f"   {j}. {opt}")

    print("\n✅ Done.\n")
