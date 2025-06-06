import openai
import json
import random
import time
import sys
import os

# Initialize OpenAI API
openai.api_key = os.getenv('OPENAI_API_KEY')
if not openai.api_key:
    raise RuntimeError("OPENAI_API_KEY environment variable not set")

def simulate_conversation(initial_message):
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "poppy.txt")
    with open(prompt_path, "r", encoding="utf-8") as f:
        system_prompt = f.read().strip()

    conversation = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": initial_message}
    ]

    print(f"User: {initial_message}")

    try:
        for _ in range(10):  # Simulate 10 turns of conversation
            # Get assistant's response
            response = openai.chat.completions.create(
                model="gpt-4o",  # Use the appropriate model
                messages=conversation,
                max_tokens=150,
                temperature=0.7,
                n=1,
                stop=None
            )
            assistant_message = response.choices[0].message.content.strip()
            conversation.append({"role": "assistant", "content": assistant_message})
            print(f"Poppy: {assistant_message}")
            
            # Simulate user's response
            user_prompt = f"I am a student using Poppy, a handheld voice assistant for homework and emotional support. I mostly understand the response, but for more complex information I ask clarifying questions. Respond to Poppy's last message: '{assistant_message}'. Keep your response brief and natural, as if in a real conversation."
            user_response = openai.chat.completions.create(
                model="gpt-4o-mini",  # Use the appropriate model
                messages=[{"role": "system", "content": user_prompt}],
                max_tokens=1000,
                temperature=0.7,
                n=1,
                stop=None
            )
            user_message = user_response.choices[0].message.content.strip()
            conversation.append({"role": "user", "content": user_message})
            print(f"User: {user_message}")
            
            # Add a small delay to simulate a more natural conversation pace
            time.sleep(random.uniform(1, 3))

    except KeyboardInterrupt:
        print("\nConversation interrupted.")
    finally:
        print("Saving conversation...")
        save_conversation(conversation)
        print("Conversation saved.")

    return conversation

def save_conversation(conversation, file_path='./data/conversations.jsonl'):
    with open(file_path, 'a', encoding='utf-8') as f:
        json.dump({"messages": conversation}, f)
        f.write('\n')

if __name__ == "__main__":
    try:
        initial_message = input("Enter the initial message to start the conversation: ")
        simulate_conversation(initial_message)
    except KeyboardInterrupt:
        print("\nScript interrupted. Exiting...")
        sys.exit(0)
