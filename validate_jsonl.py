import json

def validate_jsonl(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            try:
                json.loads(line)
            except json.JSONDecodeError as e:
                print(f"Error in line {i}: {e}")
                return False
    print("All lines are valid JSON.")
    return True

# Usage
if __name__ == "__main__":
    file_path = 'poppy_initial.jsonl'
    try:
        if validate_jsonl(file_path):
            print("Validation successful!")
        else:
            print("Validation failed.")
    except FileNotFoundError:
        print(f"The file {file_path} does not exist.")