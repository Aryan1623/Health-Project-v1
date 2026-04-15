import cv2
import time
import mediapipe as mp


# 🔑 DISEASE-RELEVANT LANDMARK GROUPS (STORE ONLY THESE)
IMPORTANT_REGIONS = {
    "left_eye": [33, 133, 159, 145],
    "right_eye": [362, 263, 386, 374],
    "nose": [1, 2, 98, 327],
    "left_cheek": [50, 101, 118, 119],
    "right_cheek": [280, 330, 347, 348],
    "mouth": [13, 14]
}


# =========================
# CORE ANALYSIS (API SAFE)
# =========================

def analyze_face_from_frame(frame):
    """
    Analyze a SINGLE image frame.
    No webcam, no imshow, API-safe.
    """

    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(
        static_image_mode=True,   # IMPORTANT for single frame
        max_num_faces=1,
        min_detection_confidence=0.7
    )

    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)

    if not result.multi_face_landmarks:
        face_mesh.close()
        return None

    face_landmarks = result.multi_face_landmarks[0]

    # 🧠 STORE ONLY IMPORTANT REGIONS
    face_data = {
        "regions": list(IMPORTANT_REGIONS.keys()),
        "landmarks": {
            region: [
                (
                    face_landmarks.landmark[i].x,
                    face_landmarks.landmark[i].y,
                    face_landmarks.landmark[i].z
                )
                for i in indices
            ]
            for region, indices in IMPORTANT_REGIONS.items()
        }
    }

    face_mesh.close()
    return face_data


# =========================
# CLI MODE (UNCHANGED UX)
# =========================

def face_scan():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Camera not accessible")
        return None

    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.7
    )

    print("Face scan started. Please stay still...")

    FACE_REQUIRED_SECONDS = 15
    face_start_time = None
    captured_landmarks = None

    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = face_mesh.process(rgb)

        if result.multi_face_landmarks:
            face_landmarks = result.multi_face_landmarks[0]

            # 👁️ DRAW ALL 468 LANDMARKS (VISUAL FEEDBACK)
            for lm in face_landmarks.landmark:
                x = int(lm.x * w)
                y = int(lm.y * h)
                cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)

            if face_start_time is None:
                face_start_time = time.time()

            elapsed = time.time() - face_start_time
            remaining = max(0, int(FACE_REQUIRED_SECONDS - elapsed))

            cv2.putText(
                frame,
                f"Capturing in {remaining}s",
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2
            )

            if elapsed >= FACE_REQUIRED_SECONDS:
                captured_landmarks = face_landmarks
                break
        else:
            face_start_time = None
            cv2.putText(
                frame,
                "No face detected",
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255),
                2
            )

        cv2.imshow("Face Scan – Full Mesh (Capture Selective)", frame)

        if cv2.waitKey(1) & 0xFF == 27:
            break

    cap.release()
    cv2.destroyAllWindows()
    face_mesh.close()

    if captured_landmarks is None:
        print("Face scan failed")
        return None

    print("Face captured successfully")

    # Reuse SAME extraction logic for CLI
    return {
        "regions": list(IMPORTANT_REGIONS.keys()),
        "landmarks": {
            region: [
                (
                    captured_landmarks.landmark[i].x,
                    captured_landmarks.landmark[i].y,
                    captured_landmarks.landmark[i].z
                )
                for i in indices
            ]
            for region, indices in IMPORTANT_REGIONS.items()
        }
    }
if __name__ == "__main__":
    data = face_scan()
    print(data)
