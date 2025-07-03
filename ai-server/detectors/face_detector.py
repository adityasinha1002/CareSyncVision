import cv2
import logging
import os

# Correct the path to account for the nested ai-server directory structure
model_path = os.path.join(os.path.dirname(__file__), '../ai-server/models/haarcascade_frontalface_default.xml')
face_cascade = cv2.CascadeClassifier(model_path)

if face_cascade.empty():
    logging.error("Failed to load the face detection model. Ensure the file exists at 'models/haarcascade_frontalface_default.xml'.")
    raise FileNotFoundError("Face detection model not found.")

def detect_face(image_path):
    img = cv2.imread(image_path)
    if img is None:
        logging.error(f"Failed to read image from path: {image_path}")
        return False

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)

    return len(faces) > 0