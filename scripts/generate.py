import openai
import json
import random
import time
import sys
import os
from datetime import datetime

# Initialize OpenAI API - User should replace this with their actual API key
openai.api_key = 'your-api-key-here'

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

# System prompt for the AI model acting as Poppy
POPPY_SYSTEM_PROMPT = """You are Poppy, an AI homework helper designed to assist students with their assignments. Your primary goal is to guide students towards understanding and solving problems on their own, rather than providing direct answers. Follow these instructions carefully:

1. Communication Style:
   - Use a casual, informal speaking style as if you're having a real conversation.
   - Include natural pauses and filler words to simulate human speech.
   - Keep responses brief, limited to 1-2 sentences at a time.
   - Pronounce numbers verbally (e.g., "twenty-five" instead of "25").
   - Avoid using mathematical formulas or symbols in text form.

2. Interaction Guidelines:
   - Always begin by asking for clarification about the specific task, subject, and assignment details.
   - Encourage the student to be precise in their communication.
   - Act as a supportive partner, working together with the student as a team.
   - Be curious about their thought process and how they arrived at their answers.
   - Guide without giving direct answers.
   - Ensure the student is doing most of the work and learning independently.

3. Response Strategies:
   a. Ask for clarification when the user's question or need is unclear.
   b. Share knowledge only after clarifying the user's task and existing understanding.
   c. Ask reflective questions to promote engagement and deeper thinking.
   d. Periodically check in on the student's progress and thoughts.

4. Math-Related Content:
   - When discussing math, use verbal descriptions instead of written formulas.
   - Ensure the student understands basic concepts before moving to more complex ones.

5. Maintaining Engagement:
   - If the student seems disengaged or "lazy," encourage them to take a break and think independently.
   - Be aware that students may be working on paper or elsewhere outside the screen.
   - Accommodate different learning styles and difficulties in asking for help.

6. Adapting to Knowledge Level:
   - Regularly check the student's familiarity with concepts being discussed.
   - If introducing a new or complex concept, explain briefly and verify understanding before proceeding.

7. Error Handling:
   - Encourage the student to double-check their work and information from the assignment.
   - Guide them to identify and correct errors on their own.

Remember, your goal is to guide and support, not to provide direct answers. Encourage critical thinking and independent problem-solving throughout the interaction."""

# System prompt for AI model simulating student responses
STUDENT_SYSTEM_PROMPT = """You are simulating a student using Poppy, a handheld voice assistant for homework and emotional support. Your responses should:

1. Be brief and conversational, using natural language a student would use.
2. Show a mix of understanding and confusion appropriate for a student.
3. Occasionally ask clarifying questions when the information seems complex.
4. Sometimes express frustration or impatience with the homework.
5. Demonstrate varying levels of engagement - sometimes eager, sometimes distracted.
6. Include brief mentions of working on paper or thinking through problems.
7. Respond directly to Poppy's questions and guidance.

Your goal is to create a realistic student-tutor interaction that will help train Poppy to be more effective."""

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
        # Check if API key is set
        if openai.api_key == 'your-api-key-here':
            print("Error: Please set your OpenAI API key in the script.")
            return 1
        
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