import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Questionnaire {

  // 🔥 MAIN FUNCTION
  generateQuestions(observations: string[]): any[] {

    let questions: any[] = [];

    // =========================
    // 👁️ EYE RELATED
    // =========================
    if (observations.includes('eye_redness_detected')) {
      questions.push(
        this.createQ("When did you first notice redness in your eye?"),
        this.createQ("Do you feel irritation or burning in your eyes?"),
        this.createQ("Is your vision blurry or sensitive to light?")
      );
    }

    // =========================
    // 😴 FATIGUE / FACE
    // =========================
    if (observations.includes('facial_fatigue_detected')) {
      questions.push(
        this.createQ("Do you feel unusually tired during the day?"),
        this.createQ("Do you experience difficulty concentrating?"),
        this.createQ("Do you feel low energy even after rest?")
      );
    }

    // =========================
    // ❤️ HEART RATE
    // =========================
    if (observations.includes('high_heart_rate_detected')) {
      questions.push(
        this.createQ("Do you feel your heart racing even at rest?"),
        this.createQ("Do you experience anxiety or restlessness?"),
        this.createQ("Do you consume caffeine frequently?")
      );
    }

    // =========================
    // 🌙 SLEEP
    // =========================
    if (observations.includes('sleep_deprivation_detected')) {
      questions.push(
        this.createQ("How many hours do you sleep daily?"),
        this.createQ("Do you wake up feeling refreshed?"),
        this.createQ("Do you have trouble falling asleep?")
      );
    }

    // =========================
    // 🔥 FILL REMAINING TO 10
    // =========================
    const genericQuestions = [
      "Do you feel stressed frequently?",
      "Do you drink enough water daily?",
      "Do you exercise regularly?",
      "Do you have headaches often?",
      "Do you feel mentally fatigued?",
      "Do you take breaks from screen usage?",
      "Do you feel physically exhausted?",
      "Do you maintain a healthy diet?"
    ];

    let i = 0;
    while (questions.length < 10 && i < genericQuestions.length) {
      questions.push(this.createQ(genericQuestions[i]));
      i++;
    }

    // Ensure EXACTLY 10
    return questions.slice(0, 10);
  }

  // =========================
  // 🧠 QUESTION FORMAT
  // =========================
  private createQ(questionText: string) {
    return {
      question: questionText,
      options: [
        "Not at all",
        "Sometimes",
        "Frequently",
        "None"
      ]
    };
  }
}