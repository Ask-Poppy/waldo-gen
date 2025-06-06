import sys
import os
import json
import argparse
import openai
from validate_jsonl import validate_jsonl

# Initialize OpenAI API - User should replace this with their actual API key
openai.api_key = os.getenv('OPENAI_API_KEY')
if not openai.api_key:
    raise RuntimeError("OPENAI_API_KEY environment variable not set")

def count_tokens_in_file(file_path):
    """
    Estimate the token count in a JSONL file.
    
    This is a rough estimation and may not perfectly match OpenAI's actual token count.
    For more accurate token counting, consider using tiktoken or a similar library.
    
    Args:
        file_path (str): Path to the JSONL file
        
    Returns:
        int: Estimated token count
    """
    token_count = 0
    message_count = 0
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    messages = data.get('messages', [])
                    message_count += len(messages)
                    
                    # Rough token estimation: 1 token H 4 characters
                    for message in messages:
                        content = message.get('content', '')
                        token_count += len(content) // 4
                        
                except json.JSONDecodeError:
                    continue
    except FileNotFoundError:
        print(f"Error: File {file_path} not found.")
        return 0, 0
    
    return token_count, message_count

def upload_file(file_path, purpose='fine-tune'):
    """
    Upload a file to OpenAI.
    
    Args:
        file_path (str): Path to the file to upload
        purpose (str): Purpose of the file (default: fine-tune)
        
    Returns:
        str: File ID if successful, None otherwise
    """
    try:
        print(f"Uploading {file_path}...")
        response = openai.files.create(
            file=open(file_path, 'rb'),
            purpose=purpose
        )
        file_id = response.id
        print(f"Upload successful. File ID: {file_id}")
        return file_id
    except Exception as e:
        print(f"Error uploading file: {e}")
        return None

def create_fine_tuning_job(training_file_id, validation_file_id=None, model="gpt-3.5-turbo"):
    """
    Create a fine-tuning job on OpenAI.
    
    Args:
        training_file_id (str): ID of the training file
        validation_file_id (str): ID of the validation file (optional)
        model (str): Base model to use for fine-tuning
        
    Returns:
        str: Job ID if successful, None otherwise
    """
    try:
        print(f"Creating fine-tuning job with {model}...")
        job_params = {
            "training_file": training_file_id,
            "model": model
        }
        
        if validation_file_id:
            job_params["validation_file"] = validation_file_id
        
        response = openai.fine_tuning.jobs.create(**job_params)
        job_id = response.id
        print(f"Fine-tuning job created. Job ID: {job_id}")
        return job_id
    except Exception as e:
        print(f"Error creating fine-tuning job: {e}")
        return None

def main():
    """Main function to upload datasets and create a fine-tuning job."""
    parser = argparse.ArgumentParser(description='Upload dataset files and create a fine-tuning job.')
    parser.add_argument('--training', '-t', default='./data/training.jsonl', help='Path to the training dataset')
    parser.add_argument('--validation', '-v', default='./data/validation.jsonl', help='Path to the validation dataset')
    parser.add_argument('--model', '-m', default='gpt-3.5-turbo', help='Base model to fine-tune')
    parser.add_argument('--upload-only', action='store_true', help='Only upload files, don\'t create a fine-tuning job')
    
    args = parser.parse_args()
    
    # Check if API key is set
    
    # Validate files before uploading
    print("Validating files before upload...")
    if not validate_jsonl(args.training):
        print("Error: Training file validation failed.")
        return 1
    
    if args.validation and not validate_jsonl(args.validation):
        print("Error: Validation file validation failed.")
        return 1
    
    # Get token counts
    training_tokens, training_msgs = count_tokens_in_file(args.training)
    print(f"Training file: ~{training_tokens} tokens, {training_msgs} messages")
    
    if args.validation:
        validation_tokens, validation_msgs = count_tokens_in_file(args.validation)
        print(f"Validation file: ~{validation_tokens} tokens, {validation_msgs} messages")
    
    # Upload files
    training_file_id = upload_file(args.training)
    if not training_file_id:
        print("Failed to upload training file.")
        return 1
    
    validation_file_id = None
    if args.validation:
        validation_file_id = upload_file(args.validation)
        if not validation_file_id:
            print("Failed to upload validation file.")
            return 1
    
    # Create fine-tuning job if not upload-only
    if not args.upload_only:
        job_id = create_fine_tuning_job(training_file_id, validation_file_id, args.model)
        if not job_id:
            print("Failed to create fine-tuning job.")
            return 1
        
        print("\nNext steps:")
        print(f"1. Check job status: openai api fine_tunes.get -i {job_id}")
        print("2. Once complete, the fine-tuned model will be available in your OpenAI account.")
    else:
        print("\nFiles uploaded successfully. To create a fine-tuning job later, run:")
        print(f"openai api fine_tunes.create -t {training_file_id} -v {validation_file_id} -m {args.model}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())