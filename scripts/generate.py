import openai
import json
import random
import time
import sys
import os
from datetime import datetime

# Initialize OpenAI API - User should replace this with their actual API key
openai.api_key = os.getenv('OPENAI_API_KEY')

if not openai.api_key:
    raise RuntimeError("OPENAI_API_KEY environment variable not set")
# Sample prompts to generate conversations about
SAMPLE_PROMPTS = [
    "I need help with my algebra homework. Can you help me solve this equation? 2x + 3 = 7",
    "I'm working on a history essay about the Industrial Revolution. What were the main causes?",
    "Can you help me understand photosynthesis for my biology assignment?",
    "I'm struggling with this physics problem about calculating velocity. Can you guide me?",
    "I need to write a poem for my English class. Can you help me with some ideas?",
    "I need to analyze a short story for my literature class. How should I approach this?",
    "I have to create a presentation about renewable energy. What should I include?",
    "Can you help me understand chemical reactions for my chemistry homework?",
    "I'm working on a statistics problem about probability. Can you explain the concept?",
    "I need to write a report on climate change. What are the key points I should cover?"
]
POPPY_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "..", "prompts", "poppy.txt")
STUDENT_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "..", "prompts", "student.txt")
with open(POPPY_PROMPT_PATH, "r", encoding="utf-8") as f:
    POPPY_SYSTEM_PROMPT = f.read().strip()
with open(STUDENT_PROMPT_PATH, "r", encoding="utf-8") as f:
    STUDENT_SYSTEM_PROMPT = f.read().strip()



def generate_conversation(prompt=None, num_turns=5, model="gpt-4o", temperature=0.7):
    """
    Generate a simulated conversation between a student and Poppy.
    
    Args:
        prompt (str): Initial prompt from the student. If None, a random one is selected.
        num_turns (int): Number of conversation turns to generate
        model (str): The OpenAI model to use
        temperature (float): Creativity parameter (0.0-1.0)
        
    Returns:
        list: The generated conversation as a list of message dictionaries
    """
    # Select a random prompt if none provided
    if prompt is None:
        prompt = random.choice(SAMPLE_PROMPTS)
    
    # Initialize conversation with system prompt and student's initial message
    conversation = [
        {"role": "system", "content": POPPY_SYSTEM_PROMPT},
        {"role": "user", "content": prompt}
    ]
    
    print(f"Generating conversation with {num_turns} turns...\n")
    print(f"Student: {prompt}")
    
    try:
        for i in range(num_turns):
            # Get Poppy's response
            poppy_response = openai.chat.completions.create(
                model=model,
                messages=conversation,
                max_tokens=150,
                temperature=temperature,
                n=1
            )
            poppy_message = poppy_response.choices[0].message.content.strip()
            conversation.append({"role": "assistant", "content": poppy_message})
            print(f"Poppy: {poppy_message}")
            
            # If this is the last turn, break here to end with Poppy's message
            if i == num_turns - 1:
                break
            
            # Get student's response
            student_messages = [
                {"role": "system", "content": STUDENT_SYSTEM_PROMPT},
                {"role": "user", "content": f"Respond to Poppy's message: '{poppy_message}'"}
            ]
            student_response = openai.chat.completions.create(
                model=model,
                messages=student_messages,
                max_tokens=100,
                temperature=temperature,
                n=1
            )
            student_message = student_response.choices[0].message.content.strip()
            conversation.append({"role": "user", "content": student_message})
            print(f"Student: {student_message}")
            
            # Add a small delay to avoid rate limits
            time.sleep(0.5)
    
    except Exception as e:
        print(f"Error during conversation generation: {e}")
    
    return conversation

def save_conversation(conversation, output_file='./data/conversations.jsonl'):
    """
    Save a conversation to a JSONL file.
    
    Args:
        conversation (list): List of message dictionaries
        output_file (str): Path to output file
    """
    # Ensure the output directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Create a timestamp for this conversation
    timestamp = datetime.now().isoformat()
    
    # Format for saving
    conversation_data = {
        "timestamp": timestamp,
        "messages": conversation
    }
    
    # Append to the file
    with open(output_file, 'a', encoding='utf-8') as f:
        f.write(json.dumps(conversation_data) + '\n')
    
    print(f"Conversation saved to {output_file}")

def main():
    """Main function to generate and save conversations."""
    try:
        
        # Parse command line arguments
        num_conversations = 1
        output_file = './data/conversations.jsonl'
        
        if len(sys.argv) > 1:
            try:
                num_conversations = int(sys.argv[1])
            except ValueError:
                print(f"Error: Invalid number of conversations specified. Using default: {num_conversations}")
        
        if len(sys.argv) > 2:
            output_file = sys.argv[2]
        
        print(f"Generating {num_conversations} conversations...")
        
        for i in range(num_conversations):
            print(f"\nGenerating conversation {i+1}/{num_conversations}")
            # Generate a random number of turns between 3 and 8
            num_turns = random.randint(3, 8)
            conversation = generate_conversation(num_turns=num_turns)
            save_conversation(conversation, output_file)
            
            # Add a delay between conversations
            if i < num_conversations - 1:
                delay = random.uniform(1, 3)
                print(f"Waiting {delay:.1f} seconds before next conversation...")
                time.sleep(delay)
        
        print(f"\nGeneration complete. {num_conversations} conversations saved to {output_file}")
        return 0
    
    except KeyboardInterrupt:
        print("\nGeneration interrupted by user.")
        return 1
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())