"""
Face Detector - Detects faces in images
Part of the CareSyncVision sensor event processing
"""

import logging
import os
import cv2
import numpy as np
from typing import Dict, Any

logger = logging.getLogger(__name__)


class FaceDetector:
    """
    Face Detection using Haar Cascades
    Processes sensor events (images) from ESP32-CAM
    """
    
    def __init__(self, model_path: str = None):
        """
        Initialize the face detector
        
        Args:
            model_path: Path to the Haar cascade model file
        """
        if model_path is None:
            # Use default model location
            model_path = os.path.join(
                os.path.dirname(__file__),
                '../ai-server/models/haarcascade_frontalface_default.xml'
            )
        
        self.cascade = cv2.CascadeClassifier(model_path)
        
        if self.cascade.empty():
            logger.warning(f"Failed to load cascade from {model_path}")
            logger.info("Using alternative model path...")
            # Try alternative path
            alt_path = "ai-server/models/haarcascade_frontalface_default.xml"
            self.cascade = cv2.CascadeClassifier(alt_path)
        
        if not self.cascade.empty():
            logger.info(f"Face detector loaded successfully")
        else:
            logger.error("Failed to load face detection model!")
    
    def detect(self, image_path: str) -> Dict[str, Any]:
        """
        Detect faces in an image
        
        Args:
            image_path: Path to the image file
        
        Returns:
            Dictionary containing detection results
        """
        logger.info(f"Processing image: {image_path}")
        
        result = {
            'success': False,
            'face_count': 0,
            'faces': [],
            'avg_confidence': 0,
            'image_shape': None,
            'processing_time': 0
        }
        
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                logger.error(f"Failed to read image: {image_path}")
                return result
            
            result['image_shape'] = img.shape
            
            # Convert to grayscale for detection
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Enhance contrast
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            gray = clahe.apply(gray)
            
            # Detect faces
            faces = self.cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30),
                maxSize=(300, 300),
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            
            logger.info(f"Detected {len(faces)} face(s)")
            
            if len(faces) > 0:
                result['success'] = True
                result['face_count'] = len(faces)
                
                # Store face information
                confidences = []
                for i, (x, y, w, h) in enumerate(faces):
                    face_info = {
                        'id': i,
                        'x': int(x),
                        'y': int(y),
                        'width': int(w),
                        'height': int(h),
                        'area': int(w * h),
                        'confidence': 0.85  # Placeholder confidence
                    }
                    result['faces'].append(face_info)
                    confidences.append(face_info['confidence'])
                    
                    logger.info(f"Face {i}: Position=({x},{y}), Size=({w}x{h})")
                
                # Calculate average confidence
                if confidences:
                    result['avg_confidence'] = sum(confidences) / len(confidences)
                
                logger.info(f"Average confidence: {result['avg_confidence']:.2f}")
            else:
                logger.info("No faces detected in image")
        
        except Exception as e:
            logger.error(f"Error during face detection: {str(e)}")
            result['error'] = str(e)
        
        return result