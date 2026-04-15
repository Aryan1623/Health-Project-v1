import cv2
import mediapipe as mp
import numpy as np
import time
from config.settings import (
    CAMERA_INDEX,
    WINDOW_NAME_EYE,
    EYE_REDNESS_THRESHOLD
)

mp_face_mesh = mp.solutions.face_mesh


LEFT_EYE = [33, 133, 160, 159, 158, 144, 145, 153]
RIGHT_EYE = [362, 263, 387, 386, 385, 373, 374, 380]


def eye_scan():
    cap = cv2.VideoCapture(CAMERA_INDEX)
    face_mesh = mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.7
    )

    print("Eye scan started. Eyes will be detected automatically...")

    EYE_REQUIRED_SECONDS = 15
    eye_start_time = None
    captured_frame = None

    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = face_mesh.process(rgb)

        if not result.multi_face_landmarks:
            eye_start_time = None
            cv2.putText(
                frame,
                "No eyes detected",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (0, 0, 255),
                2
            )
            cv2.imshow(WINDOW_NAME_EYE, frame)
            if cv2.waitKey(1) & 0xFF == 27:
                break
            continue

        landmarks = result.multi_face_landmarks[0].landmark

        red_values = []

        # 🔵 DRAW EYE LANDMARKS + SAMPLE POINTS
        for eye_idxs, color in [(LEFT_EYE, (255, 0, 0)), (RIGHT_EYE, (0, 255, 0))]:
            eye_pts = []

            for idx in eye_idxs:
                x = int(landmarks[idx].x * w)
                y = int(landmarks[idx].y * h)
                eye_pts.append((x, y))

                # draw landmark point
                cv2.circle(frame, (x, y), 4, color, -1)

            # Create eye mask
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.fillConvexPoly(mask, np.array(eye_pts), 255)

            # Sample pixels INSIDE the eye
            ys, xs = np.where(mask == 255)
            for i in range(0, len(xs), 15):  # visible sampling
                x, y = xs[i], ys[i]
                red_values.append(frame[y, x, 2])

                # 🔴 sampled pixel
                cv2.circle(frame, (x, y), 2, (0, 0, 255), -1)

        if not red_values:
            eye_start_time = None
            continue

        redness_value = float(np.mean(red_values))

        # ⏱ Time-based stability
        if redness_value > 10:
            if eye_start_time is None:
                eye_start_time = time.time()
        else:
            eye_start_time = None

        if eye_start_time:
            elapsed = time.time() - eye_start_time
            remaining = max(0, int(EYE_REQUIRED_SECONDS - elapsed))

            cv2.putText(
                frame,
                f"Capturing in {remaining}s",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (0, 255, 0),
                2
            )

            if elapsed >= EYE_REQUIRED_SECONDS:
                captured_frame = frame.copy()
                break

        cv2.imshow(WINDOW_NAME_EYE, frame)

        if cv2.waitKey(1) & 0xFF == 27:
            break

    cap.release()
    cv2.destroyAllWindows()

    if captured_frame is None:
        return None

    eye_redness = 1 if redness_value > EYE_REDNESS_THRESHOLD else 0

    return {
        "eye_redness": eye_redness,
        "redness_value": redness_value
    }
