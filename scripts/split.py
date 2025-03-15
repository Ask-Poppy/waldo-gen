import json
import random
import sys
import os
from validate_jsonl import validate_jsonl

def split_dataset(input_file, train_file, validation_file, train_ratio=0.8):
    """
    Split a JSONL dataset into training and validation sets.
    
    Args:
        input_file (str): Path to the input JSONL file
        train_file (str): Path to output training JSONL file
        validation_file (str): Path to output validation JSONL file
        train_ratio (float): Ratio of data to use for training (default: 0.8)
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"Error: The file {input_file} does not exist.")
        return False
    
    if not lines:
        print(f"Error: The file {input_file} is empty.")
        return False
    
    # Shuffle the data for random splitting
    random.shuffle(lines)
    
    # Calculate split point
    split_point = int(len(lines) * train_ratio)
    train_data = lines[:split_point]
    validation_data = lines[split_point:]
    
    # Ensure output directories exist
    os.makedirs(os.path.dirname(train_file), exist_ok=True)
    os.makedirs(os.path.dirname(validation_file), exist_ok=True)
    
    # Write the split data
    with open(train_file, 'w', encoding='utf-8') as f:
        f.writelines(train_data)
    
    with open(validation_file, 'w', encoding='utf-8') as f:
        f.writelines(validation_data)
    
    print(f"Dataset split completed:")
    print(f"  - {len(train_data)} training examples ({train_ratio*100:.0f}%)")
    print(f"  - {len(validation_data)} validation examples ({(1-train_ratio)*100:.0f}%)")
    return True

def main():
    """Main function to split and validate the dataset."""
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        input_file = './data/dataset.jsonl'
    
    train_file = './data/training.jsonl'
    validation_file = './data/validation.jsonl'
    
    # Validate input file first
    print(f"Validating input file {input_file}...")
    if not validate_jsonl(input_file):
        print("Error: Input file validation failed. Please fix the errors before splitting.")
        return 1
    
    # Split the dataset
    print(f"Splitting dataset from {input_file}...")
    if not split_dataset(input_file, train_file, validation_file):
        print("Error: Dataset splitting failed.")
        return 1
    
    # Validate output files
    print("\nValidating output files...")
    train_valid = validate_jsonl(train_file)
    val_valid = validate_jsonl(validation_file)
    
    if train_valid and val_valid:
        print("\nSplit completed successfully. Both output files are valid.")
        return 0
    else:
        print("\nWarning: There may be issues with the output files.")
        return 1

if __name__ == "__main__":
    sys.exit(main())