# decision/health_assessment.py

from config.settings import (
    WEIGHT_FATIGUE,
    WEIGHT_STRESS,
    WEIGHT_EYE_REDNESS,
    LOW_RISK_MAX,
    MODERATE_RISK_MAX
)

def assess_health(face_data, eye_data, question_score, smartwatch_data=None):
    """
    Input:
        face_data = { "fatigue": 0/1, "stress": 0/1 }
        eye_data  = { "eye_redness": 0/1 }
        question_score = int
        smartwatch_data = {
            "heart_rate": int,
            "spo2": float,
            "stress_level": str,
            "sleep_hours": float
        }

    Output:
        status   = string
        severity = string
    """

    # -------------------------
    # Base risk score (existing logic)
    # -------------------------
    risk_score = (
        face_data.get("fatigue", 0) * WEIGHT_FATIGUE +
        face_data.get("stress", 0) * WEIGHT_STRESS +
        eye_data.get("eye_redness", 0) * WEIGHT_EYE_REDNESS +
        question_score
    )

    # -------------------------
    # Smartwatch contribution (NEW)
    # -------------------------
    if smartwatch_data:

        # Heart Rate
        hr = smartwatch_data.get("heart_rate")
        if hr is not None:
            try:
                hr = int(hr)
                if hr > 100 or hr < 60:
                    risk_score += 2
            except:
                pass

        # SpO2
        spo2 = smartwatch_data.get("spo2")
        if spo2 is not None:
            try:
                spo2 = float(spo2)
                if spo2 < 95:
                    risk_score += 3
            except:
                pass

        # Stress level
        stress = smartwatch_data.get("stress_level")
        if stress and str(stress).lower() == "high":
            risk_score += 2

        # Sleep
        sleep = smartwatch_data.get("sleep_hours")
        if sleep is not None:
            try:
                sleep = float(sleep)
                if sleep < 5:
                    risk_score += 2
            except:
                pass

    # -------------------------
    # Final Classification
    # -------------------------
    if risk_score <= LOW_RISK_MAX:
        return "NOT SICK", "LOW"

    elif risk_score <= MODERATE_RISK_MAX:
        return "MILD COLD / FEVER-LIKE", "MODERATE"

    else:
        return "POSSIBLE FEVER / INFECTION", "HIGH"