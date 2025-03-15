import json
import sys

def validate_jsonl(file_path):
    """Validate a JSONL file by checking if each line is valid JSON."""
    valid = True
    line_count = 0
    error_count = 0
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                line_count += 1
                try:
                    json_obj = json.loads(line)
                    # Additional validation: check for required fields (adjust as needed)
                    if isinstance(json_obj, dict) and "messages" not in json_obj:
                        print(f"Warning in line {i}: Missing 'messages' field")
                except json.JSONDecodeError as e:
                    valid = False
                    error_count += 1
                    print(f"Error in line {i}: {e}")
    except FileNotFoundError:
        print(f"Error: The file {file_path} does not exist.")
        return False
                    
    if valid:
        print(f"All {line_count} lines in {file_path} are valid JSON.")
    else:
        print(f"Found {error_count} errors in {file_path}.")
    
    return valid

def main():
    """Main function to validate JSONL files."""
    if len(sys.argv) > 1:
        file_paths = sys.argv[1:]
    else:
        # Default files to validate
        file_paths = [
            './data/conversations.jsonl',
            './data/dataset.jsonl',
            './data/initial.jsonl',
            './data/training.jsonl',
            './data/validation.jsonl'
        ]
    
    all_valid = True
    for file_path in file_paths:
        print(f"Validating {file_path}...")
        if not validate_jsonl(file_path):
            all_valid = False
    
    if all_valid:
        print("All files are valid.")
        return 0
    else:
        print("Some files contain errors.")
        return 1

if __name__ == "__main__":
    sys.exit(main())