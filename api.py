from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import numpy as np

import cv2

from vision.face_scan import analyze_face_from_frame

app = FastAPI(title="Health AI API")

# 🔓 DEV MODE: allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
def analyze(image: UploadFile = File(...)):
    """
    Receives a single webcam frame from Angular
    """

    # ---- Convert uploaded image to OpenCV frame ----
    contents = image.file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if frame is None:
        return {"error": "Invalid image data"}

    # ---- Run HEALTH analysis on the frame ----
    result = analyze_face_from_frame(frame)

    return result
