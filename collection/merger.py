import json

# List of JSON file paths
json_files = ['all_urls_part1.json', 'all_urls_part2.json', 'all_urls_part2.json', 'all_urls_part3.json', 'all_urls_part4.json', 'all_urls_part5.json', 'all_urls_part6.json', 'all_urls_part7.json', 'all_urls_part8.json']  # replace with your actual file paths

# Initialize an empty list to store all courses
all_courses = []

# Iterate over each JSON file and load the data
for file in json_files:
    with open(file, 'r', encoding='utf-8') as f:
        data = json.load(f)  # Load JSON data
        all_courses.extend(data)  # Append courses from each file

# Save the combined list of courses to a new JSON file
with open('combined_courses.json', 'w', encoding='utf-8') as f:
    json.dump(all_courses, f, ensure_ascii=False, indent=4)

print("JSON files have been successfully concatenated into combined_courses.json.")
