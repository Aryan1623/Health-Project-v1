import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Questionnaire, Question, ScoreResponse } from '../../services/questionnaire';
import { Pipeline } from '../../services/pipeline';

type Phase = 'loading' | 'intro' | 'questions' | 'scoring' | 'done';

@Component({
  selector: 'app-questionnaire',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './questionnaire.html',
  styleUrl: './questionnaire.css'
})
export class QuestionnaireComponent implements OnInit, OnDestroy {

  phase: Phase = 'loading';
  showLoader = true;
  questions: Question[]  = [];
  answers:   Record<string, number> = {};
  current    = 0;
  scoreResult: ScoreResponse | null = null;
  modelName  = '';
  errorMsg   = '';
  private loadingTimer: ReturnType<typeof setTimeout> | null = null;

  // For animated progress bar
  progressWidth = 0;

  // Category colour / icon map
  readonly categoryMeta: Record<string, { icon: string; color: string; label: string }> = {
    cardiovascular: { icon: '❤️',  color: '#ef4444', label: 'Cardiovascular' },
    respiratory:    { icon: '🫁',  color: '#06b6d4', label: 'Respiratory'    },
    sleep:          { icon: '🌙',  color: '#8b5cf6', label: 'Sleep'          },
    ocular:         { icon: '👁️',  color: '#0ea5e9', label: 'Ocular'         },
    fatigue:        { icon: '⚡',  color: '#f59e0b', label: 'Fatigue'        },
    lifestyle:      { icon: '🌿',  color: '#10b981', label: 'Lifestyle'      },
  };

  constructor(
    private svc:      Questionnaire,
    private pipeline: Pipeline,
    private router:   Router,
    private cdr:      ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadingTimer = setTimeout(() => {
      this.finishLoading();
    }, 5000);

    const observations = this.pipeline.observations || [];
    this.svc.generateQuestions(observations, 10).subscribe({
      next: (qs) => {
        console.log('Questions received from API:', qs);
        qs.forEach((q, index) => {
          console.log(`${index + 1}. [${q.category.toUpperCase()}] ${q.text}`);
        });

        this.questions = qs;
        this.modelName = 'RandomForest-MultiOutput-v1';
        this.current = 0;
        this.finishLoading();
      },
      error: () => {
        this.errorMsg = 'Failed to load questions. Please refresh.';
        this.finishLoading();
      }
    });
  }

  ngOnDestroy() {
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
    }
  }

  get currentQuestion(): Question | null {
    return this.questions[this.current] ?? null;
  }

  get progress(): number {
    return this.questions.length ? ((this.current) / this.questions.length) * 100 : 0;
  }

  get isAnswered(): boolean {
    return this.currentQuestion ? this.answers[this.currentQuestion.id] !== undefined : false;
  }

  get categoryInfo() {
    const cat = this.currentQuestion?.category ?? 'lifestyle';
    return this.categoryMeta[cat] ?? this.categoryMeta['lifestyle'];
  }

  get answeredCount(): number {
    return Object.keys(this.answers).length;
  }

  getQuestionsForCategory(category: string): Question[] {
    return this.questions.filter((question) => question.category === category);
  }

  private finishLoading() {
    if (this.loadingTimer) {
      clearTimeout(this.loadingTimer);
      this.loadingTimer = null;
    }

    this.showLoader = false;
    this.phase = this.questions.length > 0 ? 'questions' : 'intro';
    this.cdr.detectChanges();
  }

  startQuiz() {
    this.phase   = 'questions';
    this.current = 0;
  }

  selectOption(index: number) {
    if (!this.currentQuestion) return;
    this.answers[this.currentQuestion.id] = index;
  }

  isSelected(index: number): boolean {
    if (!this.currentQuestion) return false;
    return this.answers[this.currentQuestion.id] === index;
  }

  next() {
    if (!this.isAnswered) return;
    if (this.current < this.questions.length - 1) {
      this.current++;
    } else {
      this.submitAnswers();
    }
  }

  prev() {
    if (this.current > 0) this.current--;
  }

  private submitAnswers() {
    this.phase = 'scoring';
    this.svc.scoreAnswers(this.answers).subscribe({
      next: (res) => {
        this.scoreResult = res;
        this.pipeline.questionnaireScore = res.score;
        this.proceedToResult();
      },
      error: () => {
        this.pipeline.questionnaireScore = 70;
        this.proceedToResult();
      }
    });
  }

  proceedToResult() {
    this.router.navigate(['/result']);
  }

  getBreakdownKeys(): string[] {
    return Object.keys(this.scoreResult?.breakdown ?? {});
  }

  getSeverityColor(): string {
    const s = this.scoreResult?.severity;
    if (s === 'LOW')    return '#10b981';
    if (s === 'MEDIUM') return '#f59e0b';
    return '#ef4444';
  }

  getSeverityLabel(): string {
    const s = this.scoreResult?.severity;
    if (s === 'LOW')    return 'Good Health';
    if (s === 'MEDIUM') return 'Fair Health';
    return 'Needs Attention';
  }

  getOptionSeverity(idx: number, total: number): string {
    const ratio = idx / (total - 1);
    if (ratio <= 0.33) return 'opt-good';
    if (ratio <= 0.66) return 'opt-mid';
    return 'opt-bad';
  }
}
