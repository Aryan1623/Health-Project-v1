import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Pipeline } from '../../services/pipeline';
import { Questionnaire } from '../../services/questionnaire';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './questionnaire.html'
})
export class QuestionnaireComponent {

  observations: string[] = [];
  questions: any[] = [];
  answers: number[] = [];
  loading = true;
  score = 0;

  constructor(
    private pipeline: Pipeline,
    private router: Router,
    private gemini: Questionnaire
  ) {
    this.generateObservations();
    this.loadQuestions();
  }

  // =========================
  // 🔥 Generate observations
  // =========================
  generateObservations() {

    const obs: string[] = [];

    const eye = this.pipeline.eyeData;
    const watch = this.pipeline.smartwatchData;

    if (eye?.eye_redness === 1) {
      obs.push("eye_redness_detected");
    }

    if (watch?.heart_rate > 100) {
      obs.push("high_heart_rate_detected");
    }

    if (watch?.sleep_hours < 5) {
      obs.push("sleep_deprivation_detected");
    }

    if (!obs.length) {
      obs.push("no_major_issues");
    }

    this.observations = obs;
    this.pipeline.observations = obs;

    console.log("Observations:", obs);
  }

  // =========================
  // 🔥 Load questions (LOCAL)
  // =========================
  loadQuestions() {

    this.questions = this.gemini.generateQuestions(this.observations);

    this.answers = new Array(this.questions.length).fill(0);

    this.loading = false;

    console.log("Questions loaded:", this.questions);
  }

  // =========================
  // 🔥 Submit answers
  // =========================
  submit() {

    this.score = this.answers.reduce((a, b) => a + b, 0);

    this.pipeline.questionnaireScore = this.score;

    console.log("Final Score:", this.score);

    this.router.navigate(['/result']);
  }
}