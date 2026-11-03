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
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
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
# qwen2.5:3b can need more than 40 seconds on a CPU-only laptop, especially
# for its first request after startup.  Do not replace a real model recipe
# with the local fallback just because model warm-up is still in progress.
RECIPE_OLLAMA_TIMEOUT_SECONDS = 90
FOOD_INGREDIENT_TERMS = set("rice wheat flour atta oats barley quinoa millet ragi bajra jowar maida suji pasta noodle vermicelli "
"bread roti chapati bhakri bottlegourd bittergourd snakegourd paratha puri kulcha naan idli dosa appam upma khichdi pulao biryani tomato onion potato milk egg paneer cheese butter ghee yogurt curd cream tofu chicken fish mutton turkey pork beef dal lentil chickpea chana rajma bean pea soybean sprouts moong masoor urad lobia vatana chawli horsegram kulith moth apple banana mango orange grape guava papaya pineapple pear kiwi watermelon pomegranate lemon lime coconut avocado berry strawberry jamun litchi chikoo sitaphal amla carrot cabbage cauliflower broccoli spinach cucumber capsicum pumpkin beetroot corn mushroom garlic ginger coriander mint fenugreek methi okra bhindi brinjal eggplant bottle-gourd ridge-gourd bitter-gourd drumstick zucchini radish turnip colocasia arbi jackfruit plantain oil olive mustard sunflower sesame salt sugar jaggery honey spice turmeric cumin chilli pepper cinnamon cardamom clove masala hing asafoetida ajwain kasuri saffron tamarind vinegar ketchup sauce chutney pickle papad tea coffee peanut almond cashew walnut pistachio raisin date seed chia flax makhana poha cornflakes cereal biscuit chocolate namkeen sev chips wafer snack mixture juice buttermilk coconut water beverage drink squash syrup jam jelly mayonnaise oats muesli granola noodles maggi kurkure lays biscuits cookies rusk cake dal chawal sabzi curry korma kofta sambar rasam thali bhel vada pav pakora samosa chole halwa kheer payasam lassi shrikhand icecream frozen".split())
NON_FOOD_TERMS = set("soap shampoo detergent dishwashing dishwash liquid plastic bag bags utensil utensils cleaner cleaning product products bleach disinfectant sponge scrubber tissue toilet sanitary toothpaste toothbrush lotion perfume candle battery paper foil mop broom clothes cloth shirt tshirt trouser pant saree dress footwear shoe slipper electronics charger cable bulb toy stationery notebook".split())

# Kept deliberately conservative: aliases catch common and hidden ingredient
# names, while an unknown conflict is rejected instead of being called safe.
ALLERGEN_ALIASES = {
    "peanut": ("peanut", "groundnut", "arachis"),
    "milk": ("milk", "dairy", "lactose", "casein", "whey", "butter", "ghee", "cheese", "paneer", "yogurt", "curd", "cream"),
    "egg": ("egg", "albumin", "mayonnaise"),
    "soy": ("soy", "soya", "soybean", "tofu", "tempeh", "edamame"),
    "almond": ("almond",), "wheat": ("wheat", "atta", "maida", "semolina", "suji", "bread", "roti", "chapati", "pasta", "noodle", "vermicelli"),
    "sesame": ("sesame", "til", "tahini"), "fish": ("fish", "anchovy", "tuna", "salmon"),
    "shellfish": ("shellfish", "prawn", "shrimp", "crab", "lobster"), "tree_nut": ("cashew", "walnut", "pistachio", "hazelnut", "pecan", "macadamia"),
}
ALLERGEN_SUBSTITUTES = {"peanut": ("pumpkin seeds", "sunflower seeds"), "milk": ("oat milk", "coconut milk"), "egg": ("flaxseed gel", "mashed banana"), "soy": ("chickpeas", "lentils"), "almond": ("sunflower seeds", "pumpkin seeds"), "wheat": ("rice flour", "millet flour"), "sesame": ("sunflower seeds", "pumpkin seeds"), "fish": ("chickpeas", "lentils"), "shellfish": ("chickpeas", "lentils"), "tree_nut": ("pumpkin seeds", "sunflower seeds")}

def _restriction_list(value):
    values = value if isinstance(value, list) else [value]
    return [item.strip().lower() for value in values for item in re.split(r"[,;\n]", str(value or "")) if item.strip()]

def _restriction_group(value):
    text = str(value or "").lower()
    return next((group for group, aliases in ALLERGEN_ALIASES.items() if any(alias in text for alias in aliases)), text)

def _matches_restriction(ingredient, restrictions):
    text = str(ingredient or "").lower()
    for item in restrictions:
        group = _restriction_group(item)
        aliases = ALLERGEN_ALIASES.get(group, (item,))
        # Plant milks are not dairy; they are still checked against their own
        # source allergen (for example soy or almond) in the same loop.
        if group == "milk" and re.search(r"\b(oat|coconut|rice|soy|almond)\s+milk\b", text):
            aliases = tuple(alias for alias in aliases if alias != "milk")
        if group == "wheat" and re.fullmatch(r"(rice|millet) (noodles|pasta|bread|roti)", text):
            aliases = tuple(alias for alias in aliases if alias not in ("noodle", "bread", "roti", "pasta"))
        if any(alias in text for alias in aliases): return True
    return False

def _substitutes_for_ingredient(name, group):
    ingredient = str(name or "").lower()
    if group == "milk":
        if "butter" in ingredient or "ghee" in ingredient: return ("olive oil", "coconut oil")
        if "cheese" in ingredient: return ("nutritional yeast", "coconut yogurt")
        if "paneer" in ingredient: return ("chickpea tofu", "mushrooms")
        if any(term in ingredient for term in ("yogurt", "curd", "cream")): return ("coconut yogurt", "coconut cream")
    if group == "egg" and any(term in ingredient for term in ("omelet", "bhurji", "scramble")):
        return ("chickpea flour scramble", "tofu scramble")
    if group == "wheat":
        if any(term in ingredient for term in ("pasta", "noodle", "vermicelli")): return ("rice noodles", "rice pasta")
        if any(term in ingredient for term in ("bread", "roti", "chapati", "naan")): return ("millet roti", "rice bread")
    return ALLERGEN_SUBSTITUTES.get(group, ())

def apply_allergy_substitutions(ingredients, allergies, dislikes):
    """Shared generator safety gate; returns None when no verified substitute exists."""
    restrictions = _restriction_list(allergies) + _restriction_list(dislikes)
    result, substitutions = [], []
    for ingredient in ingredients:
        name = ingredient.get("name") if isinstance(ingredient, dict) else ingredient
        if not _matches_restriction(name, restrictions):
            result.append(ingredient); continue
        group = _restriction_group(name)
        replacement = next((candidate for candidate in _substitutes_for_ingredient(name, group) if not _matches_restriction(candidate, restrictions)), None)
        if not replacement: return None, substitutions
        substitutions.append((name, replacement))
        result.append({**ingredient, "name": replacement} if isinstance(ingredient, dict) else replacement)
    return result, substitutions

def _recipe_is_safe(recipe, allergies, dislikes):
    names = list(recipe.get("available_ingredients", [])) + list(recipe.get("additional_ingredients", [])) + [item.get("name", "") for item in recipe.get("ingredients", []) if isinstance(item, dict)]
    return not any(_matches_restriction(name, _restriction_list(allergies) + _restriction_list(dislikes)) for name in names)

def is_food_ingredient(value):
    terms = re.findall(r"[a-z]+", str(value).lower())
    return bool(terms) and not any(term in NON_FOOD_TERMS for term in terms) and any(term in FOOD_INGREDIENT_TERMS for term in terms)


def _clean_recipe_text(value, limit=500):
    return re.sub(r"[\x00-\x1f<>]", "", value).strip()[:limit] if isinstance(value, str) else ""


def _validate_recipe(recipe):
    if not isinstance(recipe, dict): return None
    scalar_fields = ("name", "description", "preparation_time", "difficulty")
    list_fields = ("available_ingredients", "additional_ingredients", "ingredients", "steps", "healthier_swaps")
    if any(not _clean_recipe_text(recipe.get(field), 300) for field in scalar_fields) or any(not isinstance(recipe.get(field), list) for field in list_fields): return None
    ingredients = [{"name": _clean_recipe_text(item.get("name"), 100), "quantity": _clean_recipe_text(item.get("quantity"), 80)} for item in recipe["ingredients"][:5] if isinstance(item, dict) and _clean_recipe_text(item.get("name"), 100) and _clean_recipe_text(item.get("quantity"), 80)]
    # Keep a complete, useful method instead of truncating the model output to
    # three summary steps. Recipes must still include a properly sequenced
    # preparation method, while the upper bound prevents unbounded responses.
    steps = [_clean_recipe_text(step, 500) for step in recipe["steps"][:10] if _clean_recipe_text(step, 500)]
    if not ingredients or len(steps) < 4: return None
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


def _ingredient_key(value):
    return re.sub(r"[^a-z0-9]+", " ", str(value).casefold()).strip()


def _is_user_ingredient(value, user_keys):
    candidate = _ingredient_key(value)
    return any(candidate == user_key or candidate.startswith(user_key + " ") or user_key.startswith(candidate + " ") for user_key in user_keys)


def _apply_ingredient_mode(recipe, user_ingredients, mode):
    """Make the displayed ingredient lists obey the selected mode exactly."""
    user_keys = {_ingredient_key(item) for item in user_ingredients}
    recipe["available_ingredients"] = user_ingredients

    if mode == "only":
        recipe["additional_ingredients"] = []
        recipe["ingredients"] = [
            item for item in recipe["ingredients"]
            if _is_user_ingredient(item["name"], user_keys)
        ]
        return recipe if recipe["ingredients"] else None

    additional = []
    seen = set()
    for item in recipe["additional_ingredients"]:
        key = _ingredient_key(item)
        if key and not _is_user_ingredient(item, user_keys) and key not in seen:
            additional.append(item)
            seen.add(key)
    recipe["additional_ingredients"] = additional[:2]
    return recipe


def _expand_compact_recipe(recipe, difficulty):
    if not isinstance(recipe, dict) or "name" in recipe:
        return recipe
    nutrition = recipe.get("c")
    if not isinstance(nutrition, list) or len(nutrition) != 5:
        return recipe
    nutrition_keys = ("calories", "protein", "carbohydrates", "fat", "fiber")
    nutrition_units = ("kcal", "g", "g", "g", "g")
    return {
        "name": recipe.get("n"),
        "description": recipe.get("d"),
        "available_ingredients": recipe.get("a"),
        "additional_ingredients": recipe.get("x"),
        "preparation_time": recipe.get("t"),
        "difficulty": difficulty,
        "ingredients": [
            {"name": item.get("n"), "quantity": item.get("q")}
            for item in recipe.get("i", [])
            if isinstance(item, dict)
        ] if isinstance(recipe.get("i"), list) else [],
        "steps": recipe.get("s"),
        "nutrition": {
            key: f"{value} {unit}"
            for key, value, unit in zip(nutrition_keys, nutrition, nutrition_units)
        },
        "healthier_swaps": [],
    }


def _offline_recipe(ingredients, preferences):
    """Create an ingredient-specific local recipe only when AI is unavailable."""
    ingredient_keys = {_ingredient_key(item) for item in ingredients}
    used = ingredients[:5]
    ingredient_text = ", ".join(used)
    meal = preferences.get("meal_type", "Any")
    nutrition_data = {
        "pav": (135, 4, 26, 2, 1), "potato": (130, 3, 30, 0, 3), "pea": (80, 5, 14, 0, 5),
        "onion": (40, 1, 9, 0, 2), "tomato": (22, 1, 5, 0, 2), "bottlegourd": (25, 1, 6, 0, 1),
        "bottle gourd": (25, 1, 6, 0, 1), "rice": (205, 4, 45, 0, 1), "paneer": (265, 18, 6, 20, 0),
        "dal": (180, 12, 30, 1, 8), "egg": (78, 6, 1, 5, 0), "chicken": (165, 31, 0, 4, 0),
    }
    totals = [0, 0, 0, 0, 0]
    for item in used:
        values = nutrition_data.get(_ingredient_key(item), (45, 2, 8, 1, 2))
        totals = [current + value for current, value in zip(totals, values)]

    if {"pav", "potato"}.issubset(ingredient_keys):
        name = "Quick Pav Bhaji"
        steps = [
            "Boil the potato until fork-tender, then mash it roughly with the peas.",
            "Cook the onion and tomato in a pan over medium heat until soft and jammy.",
            "Add the mashed potato and peas, then stir until the bhaji is thick and evenly mixed.",
            "Warm the pav in a dry pan until lightly crisp at the edges.",
            "Serve the hot bhaji with the warm pav.",
        ]
    elif "bottlegourd" in ingredient_keys or "bottle gourd" in ingredient_keys:
        name = "Tomato Lauki Sabzi"
        steps = [
            "Peel the bottle gourd and cut it into small, even cubes.",
            "Cook the onion over medium heat until soft, then add tomato and cook until pulpy.",
            "Add the bottle gourd and stir so it is coated with the tomato mixture.",
            "Cover and cook on low heat for 12 to 15 minutes until the bottle gourd is tender.",
            "Stir gently, check that the vegetables are soft, and serve warm.",
        ]
    elif "rice" in ingredient_keys:
        name = "Quick Vegetable Rice"
        steps = [
            "Rinse the rice and cook it until the grains are tender and separate.",
            "Cook the onion and the firmer vegetables in a pan over medium heat until softened.",
            "Add tomato and cook until it breaks down into a light coating.",
            "Fold in the cooked rice and stir gently until heated through.",
            "Rest for two minutes, fluff the rice, and serve warm.",
        ]
    elif "paneer" in ingredient_keys:
        name = "Tomato Paneer Skillet"
        steps = [
            "Cut the paneer into bite-sized cubes and prepare the vegetables.",
            "Cook onion over medium heat until soft, then add tomato until it turns saucy.",
            "Add the paneer and remaining vegetables, stirring gently to avoid breaking the cubes.",
            "Cook for 5 to 7 minutes until the paneer is hot and the vegetables are tender.",
            "Serve warm when the tomato mixture coats the paneer evenly.",
        ]
    else:
        name = f"{'Quick' if meal == 'Any' else meal} {ingredients[0].replace('-', ' ').title()} Skillet"
        steps = [
            f"Wash and prepare the {ingredient_text}; cut larger items into even pieces.",
            "Heat a pan over medium heat and cook the firmest ingredients first until they begin to soften.",
            "Add the remaining ingredients gradually and stir until everything is evenly heated.",
            "Cover and cook on low heat until the vegetables are tender and any liquid has reduced.",
            "Check that the ingredients are cooked through, then serve warm.",
        ]
    return {
        "name": name,
        "description": f"A simple, adaptable dish using {ingredient_text}.",
        "available_ingredients": ingredients,
        "additional_ingredients": [],
        "preparation_time": "20 minutes",
        "difficulty": preferences.get("difficulty") if preferences.get("difficulty") in {"Easy", "Medium"} else "Easy",
        "ingredients": [{"name": item, "quantity": "1 portion" if index == 0 else "As needed"} for index, item in enumerate(used)],
        "steps": steps,
        "nutrition": {"calories": f"{totals[0]} kcal", "protein": f"{totals[1]} g", "carbohydrates": f"{totals[2]} g", "fat": f"{totals[3]} g", "fiber": f"{totals[4]} g"},
        "healthier_swaps": ["Use less oil and add herbs or spices for extra flavour."],
    }


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
        if not is_food_ingredient(clean): return jsonify({"message": f"Remove non-food item before generating a recipe: {clean}."}), 400
        if clean.casefold() not in {existing.casefold() for existing in clean_ingredients}: clean_ingredients.append(clean)
    allergies = _restriction_list(data.get("allergies", []))
    dislikes = _restriction_list(data.get("food_dislikes", []))
    substituted_ingredients, substitutions = apply_allergy_substitutions(clean_ingredients, allergies, dislikes)
    if substituted_ingredients is None:
        return jsonify({"message": "A safe substitute could not be verified for one of your allergies or food dislikes. No recipe was generated."}), 422
    clean_ingredients = substituted_ingredients
    prefs = {}
    for key, allowed in RECIPE_OPTIONS.items():
        value = data.get(key, "Any")
        if not isinstance(value, str) or value not in allowed: return jsonify({"message": f"Please select a valid {key.replace('_', ' ')}."}), 400
        prefs[key] = value
    mode = data.get("mode", "only")
    if mode not in ("only", "additional"): return jsonify({"message": "Please select a valid ingredient mode."}), 400
    excluded = data.get("exclude_names", [])
    excluded = [_clean_recipe_text(name, 120) for name in excluded[:5] if isinstance(name, str)] if isinstance(excluded, list) else []
    missing_instruction = "Use exactly and only the listed ingredients. Do not add, suggest, or list any other ingredient, including salt, oil, water, or spices unless it is in the user's list. additional_ingredients must be an empty array." if mode == "only" else "Use at most two extra ingredients. additional_ingredients must contain only ingredients that are not in the user's list; never repeat a user-provided ingredient there."
    safety_instruction = f"Never use or mention these restricted ingredients or aliases: {json.dumps(allergies + dislikes, ensure_ascii=False)}. Validate every generated ingredient against this restriction list." if (allergies or dislikes) else ""
    prompt = f'''Make one quick, concise recipe from {json.dumps(clean_ingredients, ensure_ascii=False)}. Preferences: {prefs['meal_type']}, {prefs['cuisine']}, {prefs['time']}, {prefs['difficulty']}. {missing_instruction} {safety_instruction}
Do not use these recipe names: {json.dumps(excluded, ensure_ascii=False)}. Return only compact JSON in this shape: {{"recipes":[{{"n":"Tomato rice","d":"A quick, filling meal.","a":["rice","tomato"],"x":[],"t":"15 min","i":[{{"n":"rice","q":"100 g"}}],"s":["Rinse the rice until the water runs mostly clear, then soak it for 10 minutes.","Heat oil in a pan over medium heat and cook the tomato with the spices until soft and jammy, about 4 minutes.","Add the drained rice and stir gently for 1 minute so every grain is coated.","Pour in the measured water, bring it to a boil, then cover and cook on low heat until the rice is tender and the water is absorbed.","Rest the pan, covered, for 5 minutes; fluff with a fork and serve warm."],"c":[300,8,50,8,4]}}]}}. Keys: n=name, d=one-sentence description, a=available ingredients, x=additional ingredients, t=prep time, i=up to 5 ingredient objects with n=name and q=metric quantity, s=5 to 8 clear, non-empty cooking steps. Each step must state the action and, where useful, heat level, timing, texture, or a visual cue. Include preparation, cooking, finishing, and serving; do not combine multiple stages into vague steps. c=numeric estimates [calories kcal, protein g, carbohydrates g, fat g, fiber g]. Keep JSON values concise.'''
    def fallback_response():
        recipe = _apply_ingredient_mode(_offline_recipe(clean_ingredients, prefs), clean_ingredients, mode)
        if recipe and _recipe_is_safe(recipe, allergies, dislikes):
            return jsonify({"recipes": [recipe], "fallback": True})
        return jsonify({"message": "A safe recipe could not be created from these ingredients."}), 422

    try:
        payload = json.dumps({"model": os.getenv("OLLAMA_MODEL", "qwen2.5:3b"), "prompt": prompt, "format": "json", "stream": False, "keep_alive": "15m", "options": {"temperature": 0.2, "num_ctx": 2048, "num_predict": 350}}).encode("utf-8")
        url = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/") + "/api/generate"
        with urlopen(Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST"), timeout=RECIPE_OLLAMA_TIMEOUT_SECONDS) as response: result = json.loads(response.read().decode("utf-8"))
        decoded = json.loads(result.get("response", ""))
        recipes = [_apply_ingredient_mode(validated, clean_ingredients, mode) for recipe in decoded.get("recipes", [])[:1] if (validated := _validate_recipe(_expand_compact_recipe(recipe, prefs["difficulty"] if prefs["difficulty"] != "Any" else "Easy")))] if isinstance(decoded, dict) else []
        recipes = [recipe for recipe in recipes if recipe and _recipe_is_safe(recipe, allergies, dislikes)]
        if not recipes:
            app.logger.warning("Ollama returned incomplete recipe details; using recipe fallback")
            return fallback_response()
        return jsonify({"recipes": recipes})
    except HTTPError as error:
        app.logger.warning("Ollama returned HTTP %s; using recipe fallback", error.code)
        return fallback_response()
    except TimeoutError:
        app.logger.warning("Ollama recipe generation exceeded %s seconds; using recipe fallback", RECIPE_OLLAMA_TIMEOUT_SECONDS)
        return fallback_response()
    except (URLError, ConnectionError):
        app.logger.warning("Ollama is unavailable at %s; using recipe fallback", url)
        return fallback_response()
    except (json.JSONDecodeError, KeyError, TypeError, ValueError):
        app.logger.warning("Ollama returned an invalid recipe; using recipe fallback")
        return fallback_response()
    except Exception:
        app.logger.exception("Recipe generation failed; using recipe fallback")
        return fallback_response()

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


@app.post("/api/scan-product")
def scan_product():
    uploaded = request.files.get("image")
    if not uploaded or not uploaded.filename:
        return jsonify({"message": "Product image is required."}), 400
    if not uploaded.mimetype or not uploaded.mimetype.startswith("image/"):
        return jsonify({"message": "Only product images are supported."}), 400

    try:
        image = ImageOps.exif_transpose(Image.open(uploaded.stream)).convert("RGB")
        image = image.resize((image.width * 2, image.height * 2))
        texts = [
            pytesseract.image_to_string(image, config="--psm 6"),
            pytesseract.image_to_string(image, config="--psm 11"),
        ]
        detected_text = max(texts, key=len).strip()
        if not detected_text:
            return jsonify({"message": "Product text could not be detected. Try a clearer package-front image."}), 422

        quantity_match = re.search(
            r"\b(\d+(?:\.\d+)?)\s*(kg|g|mg|l|ml|cl|oz|lb)\b",
            detected_text,
            flags=re.IGNORECASE,
        )
        quantity = f"{quantity_match.group(1)} {quantity_match.group(2).lower()}" if quantity_match else ""
        return jsonify({"success": True, "detected_text": detected_text, "quantity": quantity})
    except Exception as error:
        app.logger.exception("Product OCR failed")
        return jsonify({"message": f"Unable to read the product image: {error}"}), 500


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
        products = [product for product in products if is_food_ingredient(product.get("name"))]
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


@app.post("/api/scanner/read-barcode")
def read_barcode_image():
    uploaded = request.files.get("image")
    if not uploaded or not uploaded.filename:
        return jsonify({"message": "Please upload a barcode image."}), 400
    if not uploaded.mimetype or not uploaded.mimetype.startswith("image/"):
        return jsonify({"message": "Only barcode images are supported."}), 400
    try:
        image = ImageOps.exif_transpose(Image.open(uploaded.stream)).convert("RGB")
        image_array = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        barcode = ""
        if hasattr(cv2, "barcode_BarcodeDetector"):
            detector = cv2.barcode_BarcodeDetector()
            decoded = detector.detectAndDecode(image_array)
            if isinstance(decoded, tuple):
                barcode = str(decoded[0] or "")
        if not re.fullmatch(r"\d{8,14}", barcode):
            # A final OCR fallback is helpful for crisp EAN labels when the
            # installed OpenCV build does not include the barcode module.
            enlarged = image.resize((image.width * 2, image.height * 2))
            text = pytesseract.image_to_string(enlarged, config="--psm 11 -c tessedit_char_whitelist=0123456789")
            matches = re.findall(r"(?<!\d)\d{8,14}(?!\d)", text)
            barcode = matches[0] if matches else ""
        if not re.fullmatch(r"\d{8,14}", barcode):
            return jsonify({"message": "No EAN, UPC, or supported barcode could be read from this image."}), 422
        return jsonify({"barcode": barcode})
    except Exception as error:
        app.logger.exception("Barcode image decoding failed")
        return jsonify({"message": f"Unable to read barcode image: {error}"}), 500


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
    # Port 5000 is reserved by Windows on some systems (including Hyper-V
    # configurations), which prevents Waitress from starting.  Use 5001 for
    # the local OCR service and keep the frontend default in sync.
    serve(app, host="127.0.0.1", port=5001)
