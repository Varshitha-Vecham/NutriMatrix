import re
from pathlib import Path

import pytesseract
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image, ImageOps
import cv2
import numpy as np

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:5174"], supports_credentials=True)

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
        # Retail receipts often prefix product rows with a line number. OCR can
        # read that marker as `1.`, `2)`, `3-`, or simply `4 `, so remove only
        # a short number at the beginning of the item name.
        name = re.sub(r"^\d{1,3}(?:\s*[.)\-:]\s*|\s+)", "", name).strip()
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


def normalize_package_date(value):
    parts = [int(part) for part in re.split(r"[./-]", value)]
    if len(parts) != 3:
        if len(parts) == 2:
            month, year = parts
            if year < 100:
                year += 2000
            if 1 <= month <= 12:
                return f"{year:04d}-{month:02d}"
        return ""
    if parts[0] >= 2000:
        year, month, day = parts
    else:
        day, month, year = parts
    if year < 100:
        year += 2000
    try:
        from datetime import date
        date(year, month, day)
    except ValueError:
        return ""
    return f"{year:04d}-{month:02d}-{day:02d}"


def parse_package_details(text):
    text = re.sub(r"(?i)\bM\s*F\s*G\b", "MFG", text)
    text = re.sub(r"(?i)\bM\s*F\s*D\b", "MFD", text)
    text = re.sub(r"(?i)\bE\s*X\s*P\b", "EXP", text)
    text = re.sub(r"(?i)\bB\s*A\s*T\s*C\s*H\b", "BATCH", text)
    date_pattern = r"(?:\d{1,2}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{2,4}|20\d{2}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{1,2}|\d{1,2}\s*[./-]\s*\d{2,4})"
    expiry = ""
    manufacturing = ""
    all_dates = []
    for line in text.splitlines():
        cleaned = re.sub(r"\s+", " ", line).strip()
        for raw_date in re.findall(date_pattern, cleaned):
            normalized = normalize_package_date(raw_date)
            if normalized and normalized not in all_dates:
                all_dates.append(normalized)
        for label, date_value in re.findall(
            rf"\b(exp|expiry|use\s*by|best\s*before|mfg|mfd|pkd|manufactured|production)\b[^\d\n]*({date_pattern})",
            cleaned,
            re.IGNORECASE,
        ):
            normalized = normalize_package_date(date_value)
            if not normalized:
                continue
            if re.match(r"exp|expiry|use|best", label, re.IGNORECASE):
                expiry = expiry or normalized
            else:
                manufacturing = manufacturing or normalized

    if not manufacturing and len(all_dates) >= 2:
        manufacturing = all_dates[0]
    if not expiry and all_dates:
        expiry = all_dates[-1]

    batch_match = re.search(
        r"(?:batch|lot)(?:\s*(?:no|number))?\s*[:#-]?\s*([A-Z0-9][A-Z0-9./-]{2,})",
        text,
        re.IGNORECASE,
    )
    return {
        "expiryDate": expiry,
        "manufacturingDate": manufacturing,
        "batchNumber": batch_match.group(1) if batch_match else "",
    }

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


@app.post("/api/scanner/barcode-details")
def scan_barcode_details():
    package = request.files.get("image")
    if not package or not package.filename:
        return jsonify({"message": "Please provide a product package image."}), 400
    if not package.mimetype.startswith("image/"):
        return jsonify({"message": "Only product package images are supported."}), 400

    try:
        image = ImageOps.exif_transpose(Image.open(package.stream)).convert("RGB")
        image = image.resize((image.width * 3, image.height * 3))
        image_array = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
        contrast = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
        thresholded = cv2.adaptiveThreshold(contrast, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11)
        variants = [
            (image, "--psm 6"),
            (Image.fromarray(contrast), "--psm 6"),
            (Image.fromarray(thresholded), "--psm 6"),
            (Image.fromarray(thresholded), "--psm 11"),
            (Image.fromarray(thresholded), "--psm 12"),
        ]
        texts = [pytesseract.image_to_string(variant, config=config) for variant, config in variants]
        details = {"expiryDate": "", "manufacturingDate": "", "batchNumber": ""}
        for text in texts:
            parsed = parse_package_details(text)
            for key in details:
                details[key] = details[key] or parsed[key]
        return jsonify({"details": details, "text": "\n".join(texts)})
    except Exception as error:
        app.logger.exception("Barcode package OCR failed")
        return jsonify({"message": f"Unable to read package details: {error}"}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
