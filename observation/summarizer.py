def summarize_observations(face_data, eye_data, smartwatch_data=None):
    observations = []

    # ---- Guard: missing face scan ----
    if not face_data or "landmarks" not in face_data:
        observations.append("insufficient_facial_data")
        
        # Even if face is missing, still check smartwatch data
        if smartwatch_data:
            observations.extend(process_smartwatch_data(smartwatch_data))
        
        return observations

    landmarks = face_data["landmarks"]

    # =========================
    # 1. Eye fatigue (eye openness)
    # =========================
    try:
        left_eye = landmarks["left_eye"]
        right_eye = landmarks["right_eye"]

        left_eye_open = abs(left_eye[2][1] - left_eye[3][1])
        right_eye_open = abs(right_eye[2][1] - right_eye[3][1])

        avg_eye_open = (left_eye_open + right_eye_open) / 2

        if avg_eye_open < 0.015:
            observations.append("facial_fatigue_detected")
    except KeyError:
        pass

    # =========================
    # 2. Nasal irritation proxy
    # =========================
    try:
        nose = landmarks["nose"]

        nose_motion = abs(nose[0][1] - nose[-1][1])
        if nose_motion > 0.02:
            observations.append("nasal_irritation_detected")
    except KeyError:
        pass

    # =========================
    # 3. Fever-like pattern
    # =========================
    try:
        mouth = landmarks["mouth"]
        mouth_open = abs(mouth[0][1] - mouth[1][1])

        if mouth_open < 0.01:
            observations.append("fever_like_pattern")
    except KeyError:
        pass

    # =========================
    # 4. Eye scan fusion
    # =========================
    if eye_data and eye_data.get("eye_redness") == 1:
        observations.append("eye_redness_detected")

    # =========================
    # 5. Smartwatch fusion (NEW)
    # =========================
    if smartwatch_data:
        observations.extend(process_smartwatch_data(smartwatch_data))

    # ---- Fallback ----
    if not observations:
        observations.append("no_visible_facial_anomalies")

    return observations


# =========================
# Smartwatch Processing Logic (NEW)
# =========================

def process_smartwatch_data(data):
    obs = []

    try:
        hr = data.get("heart_rate")
        spo2 = data.get("spo2")
        stress = data.get("stress_level")
        sleep = data.get("sleep_hours")

        # Heart Rate
        if hr is not None:
            hr = int(hr)
            if hr > 100:
                obs.append("high_heart_rate_detected")
            elif hr < 60:
                obs.append("low_heart_rate_detected")

        # SpO2
        if spo2 is not None:
            try:
                spo2 = float(spo2)
                if spo2 < 95:
                    obs.append("low_spo2_detected")
            except:
                pass

        # Stress
        if stress:
            if str(stress).lower() == "high":
                obs.append("high_stress_detected")

        # Sleep
        if sleep is not None:
            try:
                sleep = float(sleep)
                if sleep < 5:
                    obs.append("sleep_deprivation_detected")
            except:
                pass

    except Exception:
        pass

    return obs