import logging
from flask import Flask, request, jsonify
import os
import uuid
import cv2

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Flask app setup
app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Load the Haar cascade model
face_cascade = cv2.CascadeClassifier("models/haarcascade_frontalface_default.xml")

def detect_face(image_path):
    try:
        img = cv2.imread(image_path)
        if img is None:
            logging.warning(f"Failed to read image at {image_path}")
            return False

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

        if len(faces) > 0:
            logging.info(f"Detected {len(faces)} face(s).")
            return True
        else:
            logging.info("No faces detected.")
            return False

    except Exception as e:
        logging.error(f"Error during face detection: {e}")
        return False

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        logging.warning("No file part in the request.")
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        logging.warning("No selected file.")
        return jsonify({"error": "No selected file"}), 400

    if not file.filename.lower().endswith(('png', 'jpg', 'jpeg')):
        logging.warning("Invalid file type.")
        return jsonify({"error": "Invalid file type"}), 400

    try:
        filename = f"{uuid.uuid4().hex}_{file.filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        face_detected = detect_face(filepath)

        return jsonify({"face_detected": face_detected}), 200

    except Exception as e:
        logging.error(f"Error during file upload: {e}")
        return jsonify({"error": "Internal server error"}), 500

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)