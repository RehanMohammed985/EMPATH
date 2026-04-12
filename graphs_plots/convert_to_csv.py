import os
import json
import csv

DATA_FOLDER = 'conversations'
OUTPUT_CSV = 'opinion_chart_data_with_info.csv'

rows = []

categories = {
    "Highy rigid": ["INTJ", "ENTJ", "ISTJ", "ESTJ"],
    "Moderately Rigid": ["ENFJ", "ISFJ", "ISTP", "ESTP"],
    "Moderately Flexible" : ["INFJ", "INTP", "ESFJ", "ISFP"],
    "Highly Flexible": ["ENFP", "ENTP", "INFP", "ESFP"],
}

def getCategory(personality):
    for category, types in categories.items():
        if personality in types:
            return category
    return "Unknown"

for idx, filename in enumerate(sorted(os.listdir(DATA_FOLDER))):
    if filename.endswith('.json'):
        with open(os.path.join(DATA_FOLDER, filename), 'r', encoding='utf-8') as f:
            data = json.load(f)

        conversation_id = f"conversation_{idx}"
        
        topic = data.get("topic", "")

        # Build a lookup from character name to personality & profession
        char_info = {}
        for char in data.get("characters", []):
            name = char.get("name", "")
            char_info[name] = {
                "personality": char.get("personality", ""),
                "profession": char.get("profession", "")
            }

        chart_data = data.get("chartData", {})

        for character, points in chart_data.items():
            personality = char_info.get(character, {}).get("personality", "")
            profession = char_info.get(character, {}).get("profession", "")

            for point in points:
                row = {
                    "conversation": conversation_id,
                    "character": character,
                    "personality": personality,
                    "category": getCategory(personality),
                    "profession": profession,
                    "turn": point["x"],
                    "opinion": point["y"],
                    "topic": topic
                }
                rows.append(row)

with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = ["conversation", "character", "personality", "category", "profession", "turn", "opinion", "topic"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"CSV file '{OUTPUT_CSV}' created with {len(rows)} rows.")
