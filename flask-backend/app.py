import re
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from pathlib import Path

import pytesseract
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image, ImageOps
import cv2
import numpy as np

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024
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


RECIPE_OPTIONS = {
    "meal_type": {"Breakfast", "Lunch", "Dinner", "Snack", "Any"},
    "cuisine": {"Indian", "South Indian", "North Indian", "Any"},
    "time": {"Under 15 minutes", "15–30 minutes", "30–60 minutes", "Any"},
    "difficulty": {"Easy", "Medium", "Any"},
}


def _clean_recipe_text(value, limit=500):
    if not isinstance(value, str):
        return ""
    return re.sub(r"[\x00-\x1f<>]", "", value).strip()[:limit]


def _validate_recipe(recipe):
    if not isinstance(recipe, dict):
        return None
    scalar_fields = ("name", "description", "preparation_time", "difficulty")
    if any(not _clean_recipe_text(recipe.get(field), 300) for field in scalar_fields):
        return None
    list_fields = ("available_ingredients", "additional_ingredients", "ingredients", "steps", "healthier_swaps")
    if any(not isinstance(recipe.get(field), list) for field in list_fields):
        return None
    ingredients = []
    for item in recipe["ingredients"][:30]:
        if not isinstance(item, dict):
            return None
        name, quantity = _clean_recipe_text(item.get("name"), 100), _clean_recipe_text(item.get("quantity"), 80)
        if name and quantity:
            ingredients.append({"name": name, "quantity": quantity})
    steps = [_clean_recipe_text(step, 500) for step in recipe["steps"][:12]]
    if not ingredients or not any(steps):
        return None
    nutrition = recipe.get("estimated_nutrition")
    keys = ("calories", "protein", "carbohydrates", "fat", "fiber")
    if not isinstance(nutrition, dict):
        nutrition = {}
    return {
        "name": _clean_recipe_text(recipe["name"], 120),
        "description": _clean_recipe_text(recipe["description"], 500),
        "available_ingredients": [_clean_recipe_text(x, 100) for x in recipe["available_ingredients"][:30] if isinstance(x, str)],
        "additional_ingredients": [_clean_recipe_text(x, 100) for x in recipe["additional_ingredients"][:10] if isinstance(x, str)],
        "preparation_time": _clean_recipe_text(recipe["preparation_time"], 80),
        "difficulty": _clean_recipe_text(recipe["difficulty"], 30),
        "ingredients": ingredients,
        "steps": [step for step in steps if step],
        "estimated_nutrition": {key: _clean_recipe_text(str(nutrition.get(key, "Not estimated")), 50) or "Not estimated" for key in keys},
        "healthier_swaps": [_clean_recipe_text(x, 180) for x in recipe["healthier_swaps"][:8] if isinstance(x, str)],
    }


@app.post("/api/generate-recipes")
def generate_recipes():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"message": "Please provide recipe details."}), 400
    ingredients = data.get("ingredients")
    if not isinstance(ingredients, list) or not ingredients or len(ingredients) > 30:
        return jsonify({"message": "Please enter between 1 and 30 ingredients to generate a recipe."}), 400
    clean_ingredients = []
    for item in ingredients:
        clean = _clean_recipe_text(item, 80) if isinstance(item, str) else ""
        if not clean or len(clean) > 80:
            return jsonify({"message": "Each ingredient must be a valid name under 80 characters."}), 400
        if clean.casefold() not in {existing.casefold() for existing in clean_ingredients}:
            clean_ingredients.append(clean)
    prefs = {}
    for key, allowed in RECIPE_OPTIONS.items():
        value = data.get(key, "Any")
        if not isinstance(value, str) or value not in allowed:
            return jsonify({"message": f"Please select a valid {key.replace('_', ' ')}."}), 400
        prefs[key] = value
    mode = data.get("mode", "only")
    if mode not in ("only", "additional"):
        return jsonify({"message": "Please select a valid ingredient mode."}), 400
    excluded = data.get("exclude_names", [])
    if not isinstance(excluded, list) or len(excluded) > 5:
        excluded = []
    excluded = [_clean_recipe_text(name, 120) for name in excluded if isinstance(name, str)]
    missing_instruction = "Use only the listed ingredients plus basic essentials (salt, water, oil and common spices). If that is not enough for a complete dish, say so clearly in the description and do not invent ingredients." if mode == "only" else "You may use one or two extra ingredients only; list them in additional_ingredients."
    prompt = f"""You are NutriMatrix's recipe generator. Create exactly one practical recipe using the user's ingredients as the main ingredients. Keep the description to one short sentence, use no more than 5 ingredients, and give exactly 3 brief steps. Prioritize the user's available ingredients and avoid unrelated items. {missing_instruction}
Ingredients: {json.dumps(clean_ingredients, ensure_ascii=False)}
Meal type: {prefs['meal_type']}
Cuisine: {prefs['cuisine']}
Maximum time: {prefs['time']}
Difficulty: {prefs['difficulty']}
Do not repeat these recipe names: {json.dumps(excluded, ensure_ascii=False)}
Return only valid JSON in this shape: {{"recipes":[{{"name":"...","description":"...","available_ingredients":["..."],"additional_ingredients":[],"preparation_time":"...","difficulty":"Easy","ingredients":[{{"name":"...","quantity":"..."}}],"steps":["..."],"estimated_nutrition":{{"calories":"Estimated","protein":"Estimated","carbohydrates":"Estimated","fat":"Estimated","fiber":"Estimated"}},"healthier_swaps":[]}}]}}.
Do not include servings. Nutrition must remain explicitly estimated, never medically authoritative. Do not provide medical advice."""
    ollama_url = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/") + "/api/generate"
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    payload = json.dumps({"model": model, "prompt": prompt, "format": "json", "stream": False, "options": {"temperature": 0.7, "num_predict": 500}}).encode("utf-8")
    try:
        req = Request(ollama_url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(req, timeout=180) as response:
            result = json.loads(response.read().decode("utf-8"))
        response_text = result.get("response", "")
        if not response_text.strip():
            return jsonify({"message": "We couldn't generate a recipe this time. Please try again with a few more ingredients."}), 502
        decoded = json.loads(response_text)
        raw_recipes = decoded.get("recipes") if isinstance(decoded, dict) else None
        recipes = [_validate_recipe(recipe) for recipe in raw_recipes[:5]] if isinstance(raw_recipes, list) else []
        unique_recipes = []
        seen_names = set()
        for recipe in recipes:
            if recipe and recipe["name"].casefold() not in seen_names:
                available_keys = {item.casefold().rstrip("s") for item in clean_ingredients}
                recipe["available_ingredients"] = [item for item in recipe["available_ingredients"] if item.casefold().rstrip("s") in available_keys]
                if mode == "only":
                    recipe["additional_ingredients"] = []
                else:
                    recipe["additional_ingredients"] = [item for item in recipe["additional_ingredients"] if item.casefold().rstrip("s") not in available_keys][:2]
                unique_recipes.append(recipe)
                seen_names.add(recipe["name"].casefold())
        recipes = unique_recipes
        if not recipes:
            return jsonify({"message": "We couldn't generate a recipe this time. Please try again with a few more ingredients."}), 502
        return jsonify({"recipes": recipes})
    except HTTPError as error:
        if error.code == 404:
            return jsonify({"message": "The selected recipe model is unavailable. Please check your Ollama model installation."}), 503
        app.logger.warning("Ollama request returned HTTP %s", error.code)
        return jsonify({"message": "Recipe generation is temporarily unavailable. Please make sure Ollama is running and try again."}), 503
    except (URLError, TimeoutError, ConnectionError):
        return jsonify({"message": "Recipe generation is temporarily unavailable. Please make sure Ollama is running and try again."}), 503
    except (json.JSONDecodeError, KeyError, TypeError, ValueError):
        app.logger.warning("Ollama returned an invalid recipe response")
        return jsonify({"message": "We couldn't generate a recipe this time. Please try again with a few more ingredients."}), 502
    except Exception:
        app.logger.exception("Recipe generation failed")
        return jsonify({"message": "Recipe generation is temporarily unavailable. Please try again."}), 502

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
