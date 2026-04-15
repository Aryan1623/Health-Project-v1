from questionnaire.generator import generate_questions
from config.settings import MAX_QUESTIONS


def questionnaire(observations):
    """
    LLM-based dynamic questionnaire
    """

    print("\n🤖 Generating personalized questions...\n")

    questions = generate_questions(observations, MAX_QUESTIONS)

    # ---- FALLBACK (important) ----
    if not questions:
        print("⚠️ Using fallback questions.\n")
        questions = [
            {
                "question": "Do you feel feverish?",
                "options": ["No", "Mild", "High"]
            },
            {
                "question": "Do you feel tired?",
                "options": ["No", "Yes"]
            }
        ]

    total_score = 0

    print("\nPlease answer the following questions:\n")

    for idx, q in enumerate(questions, 1):
        print(f"{idx}. {q['question']}")

        for i, opt in enumerate(q["options"]):
            print(f"   {i}. {opt}")

        while True:
            try:
                choice = int(input("Select option: "))
                if 0 <= choice < len(q["options"]):
                    total_score += choice
                    break
                else:
                    print("Invalid option. Try again.")
            except ValueError:
                print("Please enter a number.")

        print()

    return total_score