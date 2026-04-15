import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pipeline } from '../../services/pipeline';

export interface HealthObservation {
  key: string;
  label: string;
  detected: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  icon: string;
  description: string;
  insight: string;
  otcRecommendations: OTCRecommendation[];
}

export interface OTCRecommendation {
  name: string;
  type: 'supplement' | 'medication' | 'lifestyle';
  dosage?: string;
  note: string;
}

export interface HealthMetric {
  label: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  normalRange: string;
}

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result.html',
  styleUrl: './result.css'
})
export class ResultComponent implements OnInit, AfterViewInit {

  result: any;
  overallScore: number = 0;
  overallSeverity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  overallConclusion: string = '';
  animatedScore: number = 0;
  observations: HealthObservation[] = [];
  healthMetrics: HealthMetric[] = [];
  reportDate: string = '';
  isLoading: boolean = true;
  showContent: boolean = false;

  private observationConfig: Record<string, Omit<HealthObservation, 'key' | 'detected' | 'severity'>> = {
    eye_redness_detected: {
      label: 'Eye Redness',
      icon: '👁️',
      description: 'Redness or irritation detected in the ocular region.',
      insight: 'Ocular redness can indicate eye strain, allergic conjunctivitis, or dryness caused by prolonged screen exposure.',
      otcRecommendations: [
        { name: 'Artificial Tears', type: 'medication', dosage: '1-2 drops daily', note: 'Soothes eyes.' }
      ]
    },
    high_heart_rate_detected: {
      label: 'Elevated Heart Rate',
      icon: '❤️',
      description: 'Heart rate above normal.',
      insight: 'May indicate stress or dehydration.',
      otcRecommendations: [
        { name: 'Magnesium', type: 'supplement', dosage: '400mg', note: 'Supports heart rhythm.' }
      ]
    },
    sleep_deprivation_detected: {
      label: 'Sleep Deprivation',
      icon: '🌙',
      description: 'Low sleep detected.',
      insight: 'Impacts immunity and energy.',
      otcRecommendations: [
        { name: 'Melatonin', type: 'supplement', dosage: '1mg', note: 'Improves sleep.' }
      ]
    },
    facial_fatigue_detected: {
      label: 'Facial Fatigue',
      icon: '😴',
      description: 'Fatigue signs detected.',
      insight: 'Linked to stress or lack of rest.',
      otcRecommendations: [
        { name: 'Hydration', type: 'lifestyle', note: 'Drink more water.' }
      ]
    }
  };

  constructor(private pipeline: Pipeline) {}

  ngOnInit() {
    this.reportDate = new Date().toLocaleDateString();

    this.result = {
      face: this.pipeline.faceData,
      eye: this.pipeline.eyeData,
      smartwatch: this.pipeline.smartwatchData,
      questionnaire_score: this.pipeline.questionnaireScore,
      observations: this.pipeline.observations
    };

    console.log("PIPELINE:", this.pipeline);
    console.log("RESULT:", this.result);

    this.buildObservations();
    this.buildHealthMetrics();
    this.calculateOverallScore();
    this.generateConclusion();

    // ✅ Loader fix
    setTimeout(() => {
      console.log("🔥 Loader finished");
      this.isLoading = false;
      this.showContent = true;
      this.animateScore();
    }, 1200);
  }

  ngAfterViewInit() {}

  private buildObservations() {
    const detectedObs: string[] = Array.isArray(this.result.observations)
      ? this.result.observations
      : [];

    for (const [key, config] of Object.entries(this.observationConfig)) {
      const detected = detectedObs.includes(key);

      this.observations.push({
        key,
        ...config,
        detected,
        severity: this.getSeverityForObservation(key, detected)
      });
    }

    console.log('✅ Observations:', this.observations);
  }

  private getSeverityForObservation(key: string, detected: boolean): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (!detected) return 'LOW';

    if (['high_heart_rate_detected', 'sleep_deprivation_detected'].includes(key)) {
      return 'HIGH';
    }

    if (['facial_fatigue_detected'].includes(key)) {
      return 'MEDIUM';
    }

    return 'MEDIUM';
  }

  private buildHealthMetrics() {
    const sw = this.result.smartwatch || {};
    const qs = this.result.questionnaire_score || 0;

    this.healthMetrics = [
      {
        label: 'Heart Rate',
        value: sw.heart_rate || 72,
        unit: 'bpm',
        status: (sw.heart_rate > 100) ? 'critical' : (sw.heart_rate > 85) ? 'warning' : 'normal',
        normalRange: '60–100 bpm'
      },
      {
        label: 'Sleep Duration',
        value: sw.sleep_hours || 6.5,
        unit: 'hrs',
        status: (sw.sleep_hours < 5) ? 'critical' : (sw.sleep_hours < 7) ? 'warning' : 'normal',
        normalRange: '7–9 hours'
      },
      {
        label: 'SpO2',
        value: sw.spo2 || 98,
        unit: '%',
        status: (sw.spo2 < 94) ? 'critical' : (sw.spo2 < 96) ? 'warning' : 'normal',
        normalRange: '95–100%'
      },
      {
        label: 'Questionnaire Score',
        value: qs,
        unit: '/100',
        status: (qs < 40) ? 'critical' : (qs < 65) ? 'warning' : 'normal',
        normalRange: '70–100'
      }
    ];
  }

  private calculateOverallScore() {
    let score = 100;

    this.observations.filter(o => o.detected).forEach(o => {
      if (o.severity === 'HIGH') score -= 25;
      else if (o.severity === 'MEDIUM') score -= 15;
      else score -= 8;
    });

    const qs = this.result.questionnaire_score || 100;
    score = score * 0.7 + qs * 0.3;

    this.overallScore = Math.max(0, Math.min(100, Math.round(score)));

    if (this.overallScore >= 75) this.overallSeverity = 'LOW';
    else if (this.overallScore >= 50) this.overallSeverity = 'MEDIUM';
    else this.overallSeverity = 'HIGH';
  }

  private generateConclusion() {
    const detected = this.observations.filter(o => o.detected);

    if (detected.length === 0) {
      this.overallConclusion = 'All indicators are normal.';
    } else {
      this.overallConclusion = `Detected: ${detected.map(d => d.label).join(', ')}`;
    }
  }

  private animateScore() {
    let current = 0;
    const target = this.overallScore;

    const interval = setInterval(() => {
      current += 2;
      this.animatedScore = current;

      if (current >= target) {
        this.animatedScore = target;
        clearInterval(interval);
      }
    }, 20);
  }

  getScoreColor(): string {
    if (this.overallScore >= 75) return '#10b981';
    if (this.overallScore >= 50) return '#f59e0b';
    return '#ef4444';
  }

  getScoreLabel(): string {
    if (this.overallScore >= 75) return 'Good';
    if (this.overallScore >= 50) return 'Moderate';
    return 'Critical';
  }

  getSeverityClass(severity: string): string {
    return `severity-${severity.toLowerCase()}`;
  }

  getMetricBarWidth(metric: HealthMetric): number {
    return Math.min(100, metric.value);
  }

  getDetectedCount(): number {
    return this.observations.filter(o => o.detected).length;
  }

  downloadPDF() {
    window.print();
  }

  getScoreArcPath(): string {
    return '';
  }

  getBackgroundArcPath(): string {
    return '';
  }
}