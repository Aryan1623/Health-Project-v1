# utils/camera.py

import cv2
from config.settings import CAMERA_INDEX

def get_camera():
    """
    Initializes and returns a webcam capture object.
    """
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        raise RuntimeError("Unable to access the camera")
    return cap


def capture_frame(cap, window_name="Camera"):
    """
    Displays camera feed and captures a frame when user presses 'q'.
    """
    print("Press 'q' to capture frame")

    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        cv2.imshow(window_name, frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    return frame


def release_camera(cap):
    """
    Releases camera and closes all windows.
    """
    cap.release()
    cv2.destroyAllWindows()
