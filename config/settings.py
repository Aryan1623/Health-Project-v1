# config/settings.py
# Central configuration for Health AI MVP

# =========================
# FACE SCAN THRESHOLDS
# =========================

EYE_OPENNESS_THRESHOLD = 0.015   # Lower → drowsy / fatigue
MOUTH_OPENNESS_THRESHOLD = 0.01  # Low → low facial activity / stress


# =========================
# EYE SCAN THRESHOLDS
# =========================

EYE_REDNESS_THRESHOLD = 150      # Red channel intensity


# =========================
# QUESTIONNAIRE SETTINGS
# =========================

MAX_QUESTIONS = 10


# =========================
# RISK WEIGHTS
# =========================

WEIGHT_FATIGUE = 2
WEIGHT_STRESS = 1
WEIGHT_EYE_REDNESS = 2


# =========================
# RISK SCORE THRESHOLDS
# =========================

LOW_RISK_MAX = 5
MODERATE_RISK_MAX = 11


# =========================
# GENERAL SETTINGS
# =========================

CAMERA_INDEX = 0                # Default webcam
WINDOW_NAME_FACE = "Face Scan"
WINDOW_NAME_EYE = "Eye Scan"


# =========================
# DISCLAIMER TEXT
# =========================

DISCLAIMER = (
    "This system does NOT provide medical diagnosis. "
    "It is intended for wellness monitoring only."
)
