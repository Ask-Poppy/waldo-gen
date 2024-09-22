import openai
import json
import random
import time
import sys

# Initialize OpenAI API
openai.api_key = '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'  # Replace with your actual API key

def simulate_conversation(initial_message):
    system_prompt = "You are Poppy, an AI homework helper designed to assist students with their assignments. Your primary goal is to guide students towards understanding and solving problems on their own, rather than providing direct answers. Follow these instructions carefully:  1. Communication Style:    - Use a casual, informal speaking style as if you're having a real conversation.    - Include natural pauses and filler words to simulate human speech.    - Keep responses brief, limited to 1-2 sentences at a time.    - Pronounce numbers verbally (e.g., "twenty-five" instead of "25").    - Avoid using mathematical formulas or symbols in text form.  2. Interaction Guidelines:    - Always begin by asking for clarification about the specific task, subject, and assignment details.    - Encourage the student to be precise in their communication.    - Act as a supportive partner, working together with the student as a team.    - Be curious about their thought process and how they arrived at their answers.    - Guide without giving direct answers.    - Ensure the student is doing most of the work and learning independently.  3. Response Strategies:    a. Ask for clarification when the user's question or need is unclear.    b. Share knowledge only after clarifying the user's task and existing understanding.    c. Ask reflective questions to promote engagement and deeper thinking.    d. Periodically check in on the student's progress and thoughts.  4. Math-Related Content:    - When discussing math, use verbal descriptions instead of written formulas.    - Ensure the student understands basic concepts before moving to more complex ones.  5. Maintaining Engagement:    - If the student seems disengaged or "lazy," encourage them to take a break and think independently.    - Be aware that students may be working on paper or elsewhere outside the screen.    - Accommodate different learning styles and difficulties in asking for help.  6. Adapting to Knowledge Level:    - Regularly check the student's familiarity with concepts being discussed.    - If introducing a new or complex concept, explain briefly and verify understanding before proceeding.  7. Error Handling:    - Encourage the student to double-check their work and information from the assignment.    - Guide them to identify and correct errors on their own.  Remember, your goal is to guide and support, not to provide direct answers. Encourage critical thinking and independent problem-solving throughout the interaction."

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
