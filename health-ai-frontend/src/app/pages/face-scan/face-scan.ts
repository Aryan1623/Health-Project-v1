import {
  Component,
  ElementRef,
  ViewChild,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaceScan } from '../../services/face-scan';
import { Router } from '@angular/router';
import { Pipeline } from '../../services/pipeline';

declare const FaceMesh: any;

// ─── MediaPipe landmark indices ───────────────────────────────────────────────
const LANDMARKS = {
  // Forehead band (fever flush zone)
  FOREHEAD: [10, 67, 69, 104, 108, 151, 337, 338, 297, 299],

  // Left & right under-eye (dark circles → fatigue/weakness)
  LEFT_UNDER_EYE:  [160, 144, 145, 153, 154, 155],
  RIGHT_UNDER_EYE: [385, 380, 374, 373, 390, 388],

  // Left & right upper eyelid (droopiness → lethargy)
  LEFT_UPPER_LID:  [246, 161, 160, 159, 158, 157],
  RIGHT_UPPER_LID: [466, 388, 387, 386, 385, 384],

  // Lips — outer contour (pallor → anemia, dryness → dehydration)
  LIPS: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291,
         375, 321, 405, 314, 17, 84, 181, 91, 146],

  // Left & right cheeks (flush → fever, pallor → nausea)
  LEFT_CHEEK:  [116, 123, 147, 187, 207, 213, 192],
  RIGHT_CHEEK: [345, 352, 376, 411, 427, 433, 416],

  // Nose tip (redness → rhinitis/cold)
  NOSE_TIP: [1, 2, 98, 327, 4],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sample average RGBA of a polygon region on the canvas */
function sampleRegionColor(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[]
): { r: number; g: number; b: number } {
  if (!points.length) return { r: 0, g: 0, b: 0 };

  // Bounding box
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const x0 = Math.floor(Math.min(...xs));
  const y0 = Math.floor(Math.min(...ys));
  const x1 = Math.ceil(Math.max(...xs));
  const y1 = Math.ceil(Math.max(...ys));
  const w  = Math.max(1, x1 - x0);
  const h  = Math.max(1, y1 - y0);

  const data = ctx.getImageData(x0, y0, w, h).data;
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
  }
  if (!count) return { r: 0, g: 0, b: 0 };
  return { r: r / count, g: g / count, b: b / count };
}

/** Convert RGB → rough "redness ratio" (0–1) */
function rednessRatio(c: { r: number; g: number; b: number }): number {
  const total = c.r + c.g + c.b;
  return total ? c.r / total : 0;
}

/** Convert RGB → rough "paleness score" (0–1, higher = paler) */
function palenessScore(c: { r: number; g: number; b: number }): number {
  // High brightness + low saturation = pale
  const max = Math.max(c.r, c.g, c.b);
  const min = Math.min(c.r, c.g, c.b);
  const brightness  = (c.r + c.g + c.b) / (3 * 255);
  const saturation  = max ? (max - min) / max : 0;
  return brightness * (1 - saturation);
}

/** Convert RGB → "darkness score" (0–1, higher = darker circles) */
function darknessScore(c: { r: number; g: number; b: number }): number {
  return 1 - (c.r + c.g + c.b) / (3 * 255);
}

/** Measure vertical eye-opening ratio (EAR proxy) */
function eyeOpenRatio(
  landmarks: any[],
  upperIds: number[],
  lowerIds: number[],
  canvasH: number
): number {
  const upperY = upperIds.map(i => landmarks[i].y * canvasH);
  const lowerY = lowerIds.map(i => landmarks[i].y * canvasH);
  const avgUpper = upperY.reduce((a, b) => a + b, 0) / upperY.length;
  const avgLower = lowerY.reduce((a, b) => a + b, 0) / lowerY.length;
  return Math.abs(avgLower - avgUpper); // pixels
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface HealthFaceResult {
  // Fever indicators
  foreheadRedness:   number;   // 0–1
  cheekFlush:        number;   // 0–1  (avg left+right)
  noseRedness:       number;   // 0–1

  // Weakness / fatigue indicators
  darkCircleScore:   number;   // 0–1
  leftEyeOpenPx:     number;   // pixels — low = droopy
  rightEyeOpenPx:    number;

  // Dehydration / nausea / vomiting indicators
  lipPaleness:       number;   // 0–1
  cheekPaleness:     number;   // 0–1

  // Derived flags (thresholded)
  feverSuspected:       boolean;
  weaknessSuspected:    boolean;
  dehydrationSuspected: boolean;
  nauseaSuspected:      boolean;

  // Raw averages for backend scoring
  rawColors: {
    forehead:   { r: number; g: number; b: number };
    leftCheek:  { r: number; g: number; b: number };
    rightCheek: { r: number; g: number; b: number };
    lips:       { r: number; g: number; b: number };
    leftEye:    { r: number; g: number; b: number };
    rightEye:   { r: number; g: number; b: number };
    noseTip:    { r: number; g: number; b: number };
  };
}

@Component({
  selector: 'app-face-scan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './face-scan.html',
  styleUrl: './face-scan.css',
})
export class FaceScanComponent implements OnInit {
  @ViewChild('video')  videoRef!:  ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  faceMesh: any;
  captureStartTime: number | null = null;
  requiredSeconds = 5;
  result: HealthFaceResult | null = null;

  // Live preview values shown in the UI while scanning
  liveIndicators = {
    feverRisk:       0,
    fatigueRisk:     0,
    dehydrationRisk: 0,
    nauseaRisk:      0,
  };

  constructor(
    private faceService: FaceScan,
    private pipeline: Pipeline,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.startCamera();
    this.initFaceMesh();
  }

  async startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    this.videoRef.nativeElement.srcObject = stream;
  }

  initFaceMesh() {
    this.faceMesh = new FaceMesh({
      locateFile: (file: any) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    this.faceMesh.setOptions({
      maxNumFaces:            1,
      refineLandmarks:        true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence:  0.7
    });
    this.faceMesh.onResults((results: any) => this.onResults(results));
    this.processFrames();
  }
  // add inside FaceScanComponent

get countdown(): number {
  if (!this.captureStartTime) return this.requiredSeconds;
  return Math.max(0, Math.ceil(this.requiredSeconds - (Date.now() - this.captureStartTime) / 1000));
}

get scanProgress(): number {
  if (!this.captureStartTime) return 0;
  return Math.min(100, Math.round(((Date.now() - this.captureStartTime) / 1000 / this.requiredSeconds) * 100));
}
  async processFrames() {
    const video = this.videoRef.nativeElement;
    const loop  = async () => {
      if (video.readyState >= 2) {
        await this.faceMesh.send({ image: video });
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  // ── Core analysis ────────────────────────────────────────────────────────────

  private analyzeHealthIndicators(
    landmarks: any[],
    ctx: CanvasRenderingContext2D,
    canvasW: number,
    canvasH: number
  ): HealthFaceResult {

    /** Convert normalized landmark → canvas pixel coords */
    const px = (ids: number[]) =>
      ids.map(i => ({
        x: landmarks[i].x * canvasW,
        y: landmarks[i].y * canvasH,
      }));

    // ── Sample colors from each region ──────────────────────────────────────
    const foreheadColor   = sampleRegionColor(ctx, px(LANDMARKS.FOREHEAD));
    const leftCheekColor  = sampleRegionColor(ctx, px(LANDMARKS.LEFT_CHEEK));
    const rightCheekColor = sampleRegionColor(ctx, px(LANDMARKS.RIGHT_CHEEK));
    const lipsColor       = sampleRegionColor(ctx, px(LANDMARKS.LIPS));
    const leftEyeColor    = sampleRegionColor(ctx, px(LANDMARKS.LEFT_UNDER_EYE));
    const rightEyeColor   = sampleRegionColor(ctx, px(LANDMARKS.RIGHT_UNDER_EYE));
    const noseTipColor    = sampleRegionColor(ctx, px(LANDMARKS.NOSE_TIP));

    // ── Metrics ─────────────────────────────────────────────────────────────
    const foreheadRedness  = rednessRatio(foreheadColor);
    const cheekFlush       = (rednessRatio(leftCheekColor) + rednessRatio(rightCheekColor)) / 2;
    const noseRedness      = rednessRatio(noseTipColor);

    const darkCircleScore  = (darknessScore(leftEyeColor) + darknessScore(rightEyeColor)) / 2;

    // Eye-open pixels: upper lid row vs lower lid row
    const LEFT_LOWER_LID  = [163, 144, 145, 153, 154, 155];
    const RIGHT_LOWER_LID = [384, 385, 380, 374, 373, 390];
    const leftEyeOpenPx   = eyeOpenRatio(landmarks, LANDMARKS.LEFT_UPPER_LID,  LEFT_LOWER_LID,  canvasH);
    const rightEyeOpenPx  = eyeOpenRatio(landmarks, LANDMARKS.RIGHT_UPPER_LID, RIGHT_LOWER_LID, canvasH);

    const lipPaleness      = palenessScore(lipsColor);
    const cheekPaleness    = (palenessScore(leftCheekColor) + palenessScore(rightCheekColor)) / 2;

    // ── Thresholded flags ────────────────────────────────────────────────────
    // Tweak thresholds after calibration with real data
    const feverSuspected       = foreheadRedness > 0.40 || cheekFlush > 0.42;
    const weaknessSuspected    = darkCircleScore > 0.45 || leftEyeOpenPx < 8 || rightEyeOpenPx < 8;
    const dehydrationSuspected = lipPaleness > 0.72;
    const nauseaSuspected      = cheekPaleness > 0.68 && lipPaleness > 0.65;

    return {
      foreheadRedness,
      cheekFlush,
      noseRedness,
      darkCircleScore,
      leftEyeOpenPx,
      rightEyeOpenPx,
      lipPaleness,
      cheekPaleness,
      feverSuspected,
      weaknessSuspected,
      dehydrationSuspected,
      nauseaSuspected,
      rawColors: {
        forehead:   foreheadColor,
        leftCheek:  leftCheekColor,
        rightCheek: rightCheekColor,
        lips:       lipsColor,
        leftEye:    leftEyeColor,
        rightEye:   rightEyeColor,
        noseTip:    noseTipColor,
      }
    };
  }

  // ── Draw overlays ─────────────────────────────────────────────────────────

  private drawRegionOverlay(
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    ids: number[],
    color: string,
    canvasW: number,
    canvasH: number,
    label: string
  ) {
    if (!ids.length) return;
    ctx.beginPath();
    ctx.moveTo(landmarks[ids[0]].x * canvasW, landmarks[ids[0]].y * canvasH);
    for (let i = 1; i < ids.length; i++) {
      ctx.lineTo(landmarks[ids[i]].x * canvasW, landmarks[ids[i]].y * canvasH);
    }
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.fillStyle   = color.replace(')', ', 0.12)').replace('rgb', 'rgba');
    ctx.fill();

    // Label near first point
    ctx.fillStyle  = color;
    ctx.font       = '11px Arial';
    ctx.fillText(label,
      landmarks[ids[0]].x * canvasW,
      landmarks[ids[0]].y * canvasH - 4
    );
  }

  // ── onResults ─────────────────────────────────────────────────────────────

  onResults(results: any) {
    const canvas  = this.canvasRef.nativeElement;
    const ctx     = canvas.getContext('2d')!;
    const video   = this.videoRef.nativeElement;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame first so we can sample pixel colors from it
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks?.length) {
      const landmarks = results.multiFaceLandmarks[0];
      const W = canvas.width, H = canvas.height;

      // ── Live analysis on every frame ──────────────────────────────────────
      const analysis = this.analyzeHealthIndicators(landmarks, ctx, W, H);

      // Update live UI indicators (normalized 0–100)
      this.liveIndicators = {
        feverRisk:       Math.round(((analysis.foreheadRedness + analysis.cheekFlush) / 2) * 200),
        fatigueRisk:     Math.round(analysis.darkCircleScore * 100),
        dehydrationRisk: Math.round(analysis.lipPaleness * 100),
        nauseaRisk:      Math.round(analysis.cheekPaleness * 100),
      };

      // ── Draw labelled region overlays ────────────────────────────────────
      this.drawRegionOverlay(ctx, landmarks, LANDMARKS.FOREHEAD,       'rgb(255,100,100)', W, H, 'Fever Zone');
      this.drawRegionOverlay(ctx, landmarks, LANDMARKS.LEFT_CHEEK,     'rgb(255,165,0)',   W, H, 'Cheek L');
      this.drawRegionOverlay(ctx, landmarks, LANDMARKS.RIGHT_CHEEK,    'rgb(255,165,0)',   W, H, 'Cheek R');
      this.drawRegionOverlay(ctx, landmarks, LANDMARKS.LIPS,           'rgb(200,80,200)',  W, H, 'Lips');
      this.drawRegionOverlay(ctx, landmarks, LANDMARKS.LEFT_UNDER_EYE, 'rgb(100,180,255)', W, H, 'Eye L');
      this.drawRegionOverlay(ctx, landmarks, LANDMARKS.RIGHT_UNDER_EYE,'rgb(100,180,255)', W, H, 'Eye R');
      this.drawRegionOverlay(ctx, landmarks, LANDMARKS.NOSE_TIP,       'rgb(100,220,100)', W, H, 'Nose');

      // ── Countdown HUD ────────────────────────────────────────────────────
      if (!this.captureStartTime) this.captureStartTime = Date.now();
      const elapsed   = (Date.now() - this.captureStartTime) / 1000;
      const remaining = Math.max(0, Math.ceil(this.requiredSeconds - elapsed));

      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(10, 10, 200, 30);
      ctx.fillStyle = 'lime';
      ctx.font      = '16px Arial';
      ctx.fillText(`Analyzing face… ${remaining}s`, 16, 30);

      // ── Capture & navigate ───────────────────────────────────────────────
      if (elapsed >= this.requiredSeconds && !this.result) {
        this.result           = analysis;
        this.pipeline.faceData = this.result;
        console.log('Health Face Scan Result:', this.result);

        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());

        this.router.navigate(['/eye-scan']);
      }

    } else {
      // No face — reset timer
      this.captureStartTime = null;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(10, 10, 200, 30);
      ctx.fillStyle = 'red';
      ctx.font      = '16px Arial';
      ctx.fillText('No face detected', 16, 30);
    }
  }
}