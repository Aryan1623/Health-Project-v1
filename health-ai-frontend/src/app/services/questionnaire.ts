import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

export interface Question {
  id: string;
  text: string;
  options: string[];
  category: 'cardiovascular' | 'respiratory' | 'sleep' | 'ocular' | 'fatigue' | 'lifestyle';
  weight: number;
}

export interface GenerateResponse {
  questions: Question[];
  observation_count: number;
  model: string;
}

export interface ScoreResponse {
  score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  breakdown: Record<string, number>;
}

// Inline fallback — used when Flask ML server is unreachable
const FALLBACK_QUESTIONS: Record<string, Question[]> = {
  high_heart_rate_detected: [
    { id: 'q_hr_1', text: 'How often do you feel your heart beating unusually fast?',
      options: ['Never','Occasionally','Frequently','Almost always'], category: 'cardiovascular', weight: 3 },
    { id: 'q_hr_2', text: 'Do you experience chest tightness or palpitations at rest?',
      options: ['No','Mild','Moderate','Severe'], category: 'cardiovascular', weight: 4 },
    { id: 'q_hr_3', text: 'How much caffeine do you consume daily?',
      options: ['None','1 cup','2–3 cups','4+ cups'], category: 'cardiovascular', weight: 2 },
  ],
  sleep_deprivation_detected: [
    { id: 'q_sl_1', text: 'How many hours of sleep do you get per night?',
      options: ['< 4 hrs','4–5 hrs','6–7 hrs','7+ hrs'], category: 'sleep', weight: 4 },
    { id: 'q_sl_5', text: 'Do you experience daytime drowsiness that affects your work?',
      options: ['Never','Rarely','Sometimes','Daily'], category: 'sleep', weight: 4 },
  ],
  eye_redness_detected: [
    { id: 'q_eye_1', text: 'How many hours per day do you spend looking at screens?',
      options: ['< 2 hrs','2–4 hrs','4–8 hrs','8+ hrs'], category: 'ocular', weight: 3 },
    { id: 'q_eye_3', text: 'Do your eyes feel dry or gritty?',
      options: ['No','Mild','Moderate','Severe'], category: 'ocular', weight: 3 },
  ],
  facial_fatigue_detected: [
    { id: 'q_fat_1', text: 'How would you rate your energy levels throughout the day?',
      options: ['High','Moderate','Low','Very low'], category: 'fatigue', weight: 4 },
    { id: 'q_fat_2', text: 'Do you feel mentally foggy or have difficulty concentrating?',
      options: ['Never','Occasionally','Frequently','Always'], category: 'fatigue', weight: 4 },
  ],
};

const DEFAULT_FALLBACK: Question[] = [
  { id: 'q_life_3', text: 'How would you rate your current stress levels?',
    options: ['Low','Moderate','High','Overwhelming'], category: 'lifestyle', weight: 3 },
  { id: 'q_life_1', text: 'How many glasses of water do you drink daily?',
    options: ['< 4','4–6','6–8','8+'], category: 'lifestyle', weight: 2 },
  { id: 'q_sl_3',   text: 'Do you wake up feeling refreshed?',
    options: ['Always','Usually','Rarely','Never'], category: 'sleep', weight: 3 },
];

@Injectable({ providedIn: 'root' })
export class Questionnaire {

  // Flask ML server — update if hosted elsewhere
  private readonly ML_API = 'http://localhost:5050/api/questionnaire';

  constructor(private http: HttpClient) {}

  /**
   * Generate ML-driven questions from observations.
   * Falls back to rule-based questions if API is unreachable.
   */
  generateQuestions(observations: string[], maxQuestions = 10): Observable<Question[]> {
    return this.http.post<GenerateResponse>(`${this.ML_API}/generate`, {
      observations,
      max_questions: maxQuestions
    }).pipe(
      timeout(5000),
      map(res => res.questions),
      catchError((err: unknown) => {
        console.warn('[Questionnaire] ML API unreachable — using fallback', this.getErrorMessage(err));
        return of(this.fallbackQuestions(observations, maxQuestions));
      })
    );
  }

  /**
   * Score answers via the ML scoring endpoint.
   */
  scoreAnswers(answers: Record<string, number>): Observable<ScoreResponse> {
    return this.http.post<ScoreResponse>(`${this.ML_API}/score`, { answers }).pipe(
      timeout(5000),
      catchError((err: unknown) => {
        console.warn('[Questionnaire] Score API unreachable — using fallback', this.getErrorMessage(err));
        return of(this.fallbackScore(answers));
      })
    );
  }

  // ─── Fallback helpers ───────────────────────────────────────────────────────

  private fallbackQuestions(observations: string[], max: number): Question[] {
    const seen = new Set<string>();
    const result: Question[] = [];

    for (const obs of observations) {
      const qs = FALLBACK_QUESTIONS[obs] || [];
      for (const q of qs) {
        if (!seen.has(q.id)) { seen.add(q.id); result.push(q); }
      }
    }

    if (result.length === 0) {
      return DEFAULT_FALLBACK.slice(0, max);
    }

    for (const q of DEFAULT_FALLBACK) {
      if (!seen.has(q.id)) result.push(q);
    }

    return result.slice(0, max);
  }

  private fallbackScore(answers: Record<string, number>): ScoreResponse {
    const vals = Object.values(answers);
    const avg  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 1;
    const score = Math.round((1 - avg / 3) * 100);
    return {
      score,
      severity: score >= 75 ? 'LOW' : score >= 50 ? 'MEDIUM' : 'HIGH',
      breakdown: {}
    };
  }

  private getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : 'Unknown error';
  }
}
