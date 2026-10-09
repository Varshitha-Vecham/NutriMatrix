import json
import os
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from pathlib import Path
from urllib import parse, request

import pytesseract
from waitress import serve
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image, ImageOps
import cv2
import numpy as np

from smart_scanner import smart_scanner

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:5174"], supports_credentials=True)
app.register_blueprint(smart_scanner)

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


RECIPE_OPTIONS = {
    "meal_type": {"Breakfast", "Lunch", "Dinner", "Snack", "Any"},
    "cuisine": {"Indian", "South Indian", "North Indian", "Any"},
    "time": {"Under 15 minutes", "15–30 minutes", "30–60 minutes", "Any"},
    "difficulty": {"Easy", "Medium", "Any"},
}


def _clean_recipe_text(value, limit=500):
    return re.sub(r"[\x00-\x1f<>]", "", value).strip()[:limit] if isinstance(value, str) else ""


def _validate_recipe(recipe):
    if not isinstance(recipe, dict): return None
    scalar_fields = ("name", "description", "preparation_time", "difficulty")
    list_fields = ("available_ingredients", "additional_ingredients", "ingredients", "steps", "healthier_swaps")
    if any(not _clean_recipe_text(recipe.get(field), 300) for field in scalar_fields) or any(not isinstance(recipe.get(field), list) for field in list_fields): return None
    ingredients = [{"name": _clean_recipe_text(item.get("name"), 100), "quantity": _clean_recipe_text(item.get("quantity"), 80)} for item in recipe["ingredients"][:5] if isinstance(item, dict) and _clean_recipe_text(item.get("name"), 100) and _clean_recipe_text(item.get("quantity"), 80)]
    steps = [_clean_recipe_text(step, 500) for step in recipe["steps"][:3] if _clean_recipe_text(step, 500)]
    if not ingredients or not steps: return None
    nutrition = recipe.get("nutrition")
    if not isinstance(nutrition, dict) or not nutrition:
        nutrition = recipe.get("estimated_nutrition")
    nutrition = nutrition if isinstance(nutrition, dict) else {}
    nutrition_values = {}
    for key in ("calories", "protein", "carbohydrates", "fat", "fiber"):
        value = nutrition.get(key)
        value = _clean_recipe_text(str(value), 50) if isinstance(value, (str, int, float)) else ""
        if not re.search(r"\d", value):
            return None
        nutrition_values[key] = value
    return {"name": _clean_recipe_text(recipe["name"], 120), "description": _clean_recipe_text(recipe["description"], 500), "available_ingredients": [_clean_recipe_text(x, 100) for x in recipe["available_ingredients"][:30] if isinstance(x, str)], "additional_ingredients": [_clean_recipe_text(x, 100) for x in recipe["additional_ingredients"][:2] if isinstance(x, str)], "preparation_time": _clean_recipe_text(recipe["preparation_time"], 80), "difficulty": _clean_recipe_text(recipe["difficulty"], 30), "ingredients": ingredients, "steps": steps, "nutrition": nutrition_values, "healthier_swaps": [_clean_recipe_text(x, 180) for x in recipe["healthier_swaps"][:8] if isinstance(x, str)]}


@app.post("/api/generate-recipes")
def generate_recipes():
    data = request.get_json(silent=True)
    if not isinstance(data, dict): return jsonify({"message": "Please provide recipe details."}), 400
    ingredients = data.get("ingredients")
    if not isinstance(ingredients, list) or not ingredients or len(ingredients) > 30: return jsonify({"message": "Please enter between 1 and 30 ingredients to generate a recipe."}), 400
    clean_ingredients = []
    for item in ingredients:
        clean = _clean_recipe_text(item, 80)
        if not clean: return jsonify({"message": "Each ingredient must be a valid name under 80 characters."}), 400
        if clean.casefold() not in {existing.casefold() for existing in clean_ingredients}: clean_ingredients.append(clean)
    prefs = {}
    for key, allowed in RECIPE_OPTIONS.items():
        value = data.get(key, "Any")
        if not isinstance(value, str) or value not in allowed: return jsonify({"message": f"Please select a valid {key.replace('_', ' ')}."}), 400
        prefs[key] = value
    mode = data.get("mode", "only")
    if mode not in ("only", "additional"): return jsonify({"message": "Please select a valid ingredient mode."}), 400
    excluded = data.get("exclude_names", [])
    excluded = [_clean_recipe_text(name, 120) for name in excluded[:5] if isinstance(name, str)] if isinstance(excluded, list) else []
    missing_instruction = "Use only the listed ingredients plus basic essentials (salt, water, oil and common spices). If that is not enough for a complete dish, say so clearly in the description and do not invent ingredients." if mode == "only" else "You may use one or two extra ingredients only; list them in additional_ingredients."
    prompt = f'''Create one practical recipe using the listed ingredients as the main ingredients. Use no more than 5 ingredients, give exactly 3 short steps, and use metric quantities (g, ml, tsp or tbsp) for every ingredient. {missing_instruction}
Ingredients: {json.dumps(clean_ingredients, ensure_ascii=False)}
Meal type: {prefs['meal_type']}; Cuisine: {prefs['cuisine']}; Maximum time: {prefs['time']}; Difficulty: {prefs['difficulty']}
Do not repeat these recipe names: {json.dumps(excluded, ensure_ascii=False)}
Return JSON only: {{"recipes":[{{"name":"...","description":"...","available_ingredients":["..."],"additional_ingredients":[],"preparation_time":"...","difficulty":"Easy","ingredients":[{{"name":"...","quantity":"100 g"}}],"steps":["..."],"nutrition":{{"calories":"450 kcal","protein":"20 g","carbohydrates":"55 g","fat":"14 g","fiber":"8 g"}},"healthier_swaps":[]}}]}}. Estimate numeric nutrition values for the complete recipe using the stated ingredient quantities; never return the word "Estimated" in place of a value.'''
    try:
        payload = json.dumps({"model": os.getenv("OLLAMA_MODEL", "qwen2.5:3b"), "prompt": prompt, "format": "json", "stream": False, "keep_alive": "15m", "options": {"temperature": 0.2, "num_ctx": 2048, "num_predict": 600}}).encode("utf-8")
        url = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/") + "/api/generate"
        with urlopen(Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST"), timeout=180) as response: result = json.loads(response.read().decode("utf-8"))
        decoded = json.loads(result.get("response", ""))
        recipes = [_validate_recipe(recipe) for recipe in decoded.get("recipes", [])[:1]] if isinstance(decoded, dict) else []
        recipes = [recipe for recipe in recipes if recipe]
        if not recipes: return jsonify({"message": "The recipe model returned incomplete details. Please try again; if this continues, check that your selected Ollama model is available."}), 502
        return jsonify({"recipes": recipes})
    except HTTPError as error:
        if error.code == 404: return jsonify({"message": "The selected recipe model is unavailable. Please check your Ollama model installation."}), 503
        return jsonify({"message": "Recipe generation is temporarily unavailable. Please make sure Ollama is running and try again."}), 503
    except (URLError, TimeoutError, ConnectionError):
        return jsonify({"message": "Recipe generation is temporarily unavailable. Please make sure Ollama is running and try again."}), 503
    except (json.JSONDecodeError, KeyError, TypeError, ValueError):
        return jsonify({"message": "The recipe model returned an invalid response. Please try again; if this continues, check that your selected Ollama model is available."}), 502
    except Exception:
        app.logger.exception("Recipe generation failed")
        return jsonify({"message": "Recipe generation is temporarily unavailable. Please try again."}), 502

def normalize_country(country):
    value = (country or "India").strip()
    return value or "India"


def clean_barcode(value):
    return re.sub(r"\D", "", str(value or ""))


def valid_date_string(value):
    if not value or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return False
    try:
        from datetime import date
        date(int(value[0:4]), int(value[5:7]), int(value[8:10]))
        return True
    except ValueError:
        return False


def extract_expiry_date_from_text(text):
    text = re.sub(r"\s+", " ", str(text or "")).strip()
    if not text:
        return ""

    patterns = [
        r"(?:EXP(?:IRY)?\s*[:\-]?\s*|USE\s*BY\s*|BEST\s*BEFORE\s*|SELL\s*BY\s*)(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{2,4})",
        r"(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{2,4})",
    ]

    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for raw_match in matches:
            normalized = re.sub(r"\s+", "", str(raw_match)).replace('.', '/').strip()
            if re.fullmatch(r"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}", normalized):
                parts = re.split(r"[./-]", normalized)
                if len(parts) != 3:
                    continue
                if int(parts[0]) > 31:
                    year, month, day = parts
                else:
                    day, month, year = parts
                if int(year) < 100:
                    year = str(int(year) + 2000)
                iso = f"{year.zfill(4)}-{month.zfill(2)}-{day.zfill(2)}"
                if valid_date_string(iso):
                    return iso
            elif re.fullmatch(r"\d{1,2}[./-]\d{2,4}", normalized):
                month, year = re.split(r"[./-]", normalized)
                if int(month) <= 12:
                    iso = f"{int(year) + 2000 if int(year) < 100 else int(year):04d}-{int(month):02d}-01"
                    if valid_date_string(iso):
                        return iso
    return ""


def fetch_open_food_facts(path, params=None):
    api_url = f"https://world.openfoodfacts.org{path}"
    if params:
        api_url = f"{api_url}?{parse.urlencode(params)}"

    req = request.Request(api_url, headers={"User-Agent": "NutriMatrix/1.0 (contact: support@nutrimatrix.local)", "Accept": "application/json"})
    with request.urlopen(req, timeout=15) as response:
        payload = response.read()
    return json.loads(payload.decode('utf-8'))


def map_open_food_facts_product(product):
    if not product:
        return None
    name = product.get("product_name") or product.get("product_name_en") or product.get("generic_name") or "Unknown product"
    image = product.get("image_url") or product.get("image_front_url") or product.get("image_front_small_url") or ""
    nutriments = product.get("nutriments") or {}
    return {
        "id": product.get("_id") or product.get("code") or "off-product",
        "name": name,
        "brand": product.get("brands") or "",
        "category": product.get("categories") or product.get("category") or "",
        "barcode": product.get("code") or product.get("barcode") or "",
        "image": image,
        "nutrition": {
            "calories": nutriments.get("energy-kcal_100g") or nutriments.get("energy_100g"),
            "protein": nutriments.get("proteins_100g"),
            "carbs": nutriments.get("carbohydrates_100g"),
            "fat": nutriments.get("fat_100g"),
            "fiber": nutriments.get("fiber_100g"),
        },
        "description": product.get("generic_name") or name,
    }


@app.get("/")
def home():
    return {"message": "Flask backend is running"}


@app.post("/api/product/barcode")
def product_by_barcode():
    barcode = clean_barcode(request.json.get("barcode") if request.is_json else request.form.get("barcode"))
    if not re.fullmatch(r"\d{8,14}", barcode):
        return jsonify({"message": "Please provide a valid barcode."}), 400

    try:
        payload = fetch_open_food_facts(f"/api/v2/product/{barcode}.json")
        if not payload.get("product"):
            return jsonify({"message": "This barcode was not found in Open Food Facts. Try searching by product name."}), 404
        return jsonify({"product": map_open_food_facts_product(payload["product"]), "source": "open-food-facts"})
    except Exception:
        return jsonify({"message": "Unable to connect to Open Food Facts. Please check your internet connection and try again."}), 503


@app.get("/api/product/search")
@app.post("/api/product/search")
def product_search():
    query = request.args.get("query") or (request.json or {}).get("query") or request.form.get("query") or ""
    country = normalize_country(request.args.get("country") or (request.json or {}).get("country") or request.form.get("country") or "India")
    query = query.strip()
    if not query:
        return jsonify({"message": "Please enter a product name to search."}), 400

    try:
        payload = fetch_open_food_facts("/cgi/search.pl", {
            "search_terms": query,
            "search_simple": 1,
            "action": "process",
            "json": 1,
            "countries_tags_en": country.lower(),
        })
        products = [map_open_food_facts_product(product) for product in payload.get("products", [])]
        products = [product for product in products if product and product.get("name")]
        if not products:
            return jsonify({"message": "No matching product was found. Try another product name."}), 404
        return jsonify({"query": query, "country": country, "products": products, "source": "open-food-facts"})
    except Exception:
        return jsonify({"message": "Unable to connect to Open Food Facts. Please check your internet connection and try again."}), 503


@app.post("/api/expiry/detect")
def expiry_detect():
    uploaded = request.files.get("image")
    if not uploaded or not uploaded.filename:
        return jsonify({"message": "Expiry date image is required."}), 400
    if not uploaded.mimetype or not uploaded.mimetype.startswith("image/"):
        return jsonify({"message": "Only JPG, JPEG, and PNG images are supported."}), 400

    try:
        image = ImageOps.exif_transpose(Image.open(uploaded.stream)).convert("RGB")
        image = image.resize((image.width * 2, image.height * 2))
        text = pytesseract.image_to_string(image, config="--psm 6")
        expiry_date = extract_expiry_date_from_text(text)
        if not expiry_date:
            return jsonify({"message": "Expiry date could not be detected clearly. Please scan again or upload a clearer image."}), 422
        return jsonify({"success": True, "expiry_date": expiry_date, "detected_text": text})
    except Exception as error:
        app.logger.exception("Expiry OCR failed")
        return jsonify({"message": f"Unable to read the expiry image: {error}"}), 500


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
    serve(app, host="127.0.0.1", port=5000)
