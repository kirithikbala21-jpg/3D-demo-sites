#!/usr/bin/env python3
"""Decode a QR code from a PNG with OpenCV and print the text. Prints SKIP if OpenCV is not installed (pip install opencv-python-headless)."""
import sys
try:
    import cv2
except ImportError:
    print("SKIP"); sys.exit(0)
img = cv2.imread(sys.argv[1])
val, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
print(val)
