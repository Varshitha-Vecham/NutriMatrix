import re
from pathlib import Path

import pytesseract
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image, ImageOps
import cv2
import numpy as np

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

if Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe").exists():
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def parse_receipt_text(text):
    barcodes = re.findall(r"(?<!\d)\d{8,14}(?!\d)", text)
    products = []
    item_pattern = re.compile(
        r"^(?P<name>.+?)\s+"
        r"(?:\d{6,10}\s+)?"
        r"(?P<quantity>\d+(?:\.\d+)?(?:\s*(?:kgs?|kg|gms?|gm|pkt|pack|pcs?|nos?|ltrs?|ltr|ml|units?))?)\s+"
        r"(?P<rate>\d+(?:\.\d+)?)\s+"
        r"(?P<amount>\d+(?:\.\d+)?)\s*$",
        re.IGNORECASE,
    )

    for line in text.splitlines():
        cleaned = re.sub(r"\s+", " ", line).strip()
        item = item_pattern.match(cleaned)
        if not item:
            continue
        name = item.group("name").strip(" .:-")
        if name.lower() in ("item name", "item no", "total", "gross amt", "net amount"):
            continue
        name = re.sub(r"^\d+\s+", "", name).strip()
        if not name:
            continue
        products.append({
            "id": f"receipt-{len(products) + 1}",
            "name": name,
            "brand": "",
            "barcode": barcodes[len(products)] if len(products) < len(barcodes) else "",
            "quantity": item.group("quantity"),
            "amount": float(item.group("amount")),
            "price": float(item.group("amount")),
            "expiryDate": None,
            "nutrition": None,
            "confidence": "identified",
            "analysis": "Product row identified from receipt",
            "source": "receipt-ocr",
        })

    return products, barcodes


def read_receipt(image):
    image = ImageOps.exif_transpose(image).convert("RGB")
    image = image.resize((image.width * 2, image.height * 2))
    image_array = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
    thresholded = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11
    )

    variants = [
        (image, "--psm 6"),
        (Image.fromarray(thresholded), "--psm 6"),
        (Image.fromarray(thresholded), "--psm 4"),
    ]
    results = []
    for variant, config in variants:
        text = pytesseract.image_to_string(variant, config=config)
        products, barcodes = parse_receipt_text(text)
        results.append((len(products), text, products, barcodes))

    return max(results, key=lambda result: result[0])

@app.get("/")
def home():
    return {"message": "Flask backend is running"}


@app.post("/api/scanner/receipt")
def scan_receipt():
    receipt = request.files.get("receipt")
    if not receipt or not receipt.filename:
        return jsonify({"message": "Please upload a receipt image."}), 400

    if not receipt.mimetype.startswith("image/"):
        return jsonify({"message": "Only receipt images are supported for now."}), 400

    try:
        image = Image.open(receipt.stream)
        _, text, products, barcodes = read_receipt(image)
        if not products:
            return jsonify({"message": "Receipt text was detected, but no product rows were found. Please upload a clearer image."}), 422
        return jsonify({
            "receiptFileName": receipt.filename,
            "text": text,
            "barcodes": barcodes,
            "totalItems": len(products),
            "products": products,
        })
    except Exception as error:
        app.logger.exception("Receipt OCR failed")
        return jsonify({"message": f"Unable to read receipt: {error}"}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)