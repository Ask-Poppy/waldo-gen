import json
import random

def split_dataset(input_file, train_file, validation_file, train_ratio=0.8):
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"The file {input_file} does not exist.")
        return

    random.shuffle(lines)
    split_point = int(len(lines) * train_ratio)
    train = lines[:split_point]
    validation = lines[split_point:]

    with open(train_file, 'w', encoding='utf-8') as f:
        f.writelines(train)

    with open(validation_file, 'w', encoding='utf-8') as f:
        f.writelines(validation)

    print(f"Dataset split into {len(train)} training and {len(validation)} validation examples.")

def validate_jsonl(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            try:
                json.loads(line)
            except json.JSONDecodeError as e:
                print(f"Error in line {i}: {e}")
                return False
    print(f"All lines in {file_path} are valid JSON.")
    return True

def main():
    input_file = 'poppy_initial.jsonl'
    train_file = 'poppy_training.jsonl'
    validation_file = 'poppy_validation.jsonl'

    split_dataset(input_file, train_file, validation_file)

    if validate_jsonl(train_file) and validate_jsonl(validation_file):
        print("Both training and validation files are valid.")
    else:
        print("There are errors in the dataset files.")

if __name__ == "__main__":
    main()