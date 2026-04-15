import {
  Component,
  ElementRef,
  ViewChild,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EyeScan } from '../../services/eye-scan';
import { Router } from '@angular/router';
import { Pipeline } from '../../services/pipeline';

declare const FaceMesh: any;

@Component({
  selector: 'app-eye-scan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eye-scan.html',
  styleUrl: './eye-scan.css'
})
export class EyeScanComponent implements OnInit {

  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  faceMesh: any;

  eyeStartTime: number | null = null;
  requiredSeconds = 5; // change to 15 if needed
  rednessValue = 0;
  result: any = null;

  constructor(
    private eyeService: EyeScan,
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
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7
    });

    this.faceMesh.onResults((res: any) => this.onResults(res));

    this.processFrames();
  }

  async processFrames() {
    const video = this.videoRef.nativeElement;

    const loop = async () => {
      if (video.readyState >= 2) {
        await this.faceMesh.send({ image: video });
      }
      requestAnimationFrame(loop);
    };

    loop();
  }

  onResults(results: any) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    canvas.width = this.videoRef.nativeElement.videoWidth;
    canvas.height = this.videoRef.nativeElement.videoHeight;

    ctx.drawImage(this.videoRef.nativeElement, 0, 0, canvas.width, canvas.height);

    if (!results.multiFaceLandmarks?.length) {
      this.eyeStartTime = null;
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];

    const redness = this.eyeService.sampleRedness(
      ctx,
      canvas.width,
      canvas.height,
      landmarks
    );

    if (redness === null) {
      this.eyeStartTime = null;
      return;
    }

    this.rednessValue = redness;

    // 🔥 SAME LOGIC AS PYTHON
    if (redness > 10) {
      if (!this.eyeStartTime) {
        this.eyeStartTime = Date.now();
      }
    } else {
      this.eyeStartTime = null;
    }

    if (this.eyeStartTime) {
      const elapsed = (Date.now() - this.eyeStartTime) / 1000;
      const remaining = Math.max(0, Math.floor(this.requiredSeconds - elapsed));

      ctx.fillStyle = 'lime';
      ctx.font = '20px Arial';
      ctx.fillText(`Capturing in ${remaining}s`, 20, 40);

      if (elapsed >= this.requiredSeconds && !this.result) {
        const eyeRedness = redness > 20 ? 1 : 0;

        this.result = {
          eye_redness: eyeRedness,
          redness_value: redness
        };

        // ✅ store globally
        this.pipeline.eyeData = this.result;

        console.log('Eye Scan Result:', this.result);

        // ✅ stop camera
        const stream = this.videoRef.nativeElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());

        // ✅ navigate to next step
        this.router.navigate(['/smartwatch']);
      }
    }

    // Draw debug
    ctx.fillStyle = 'yellow';
    ctx.fillText(`Redness: ${redness.toFixed(2)}`, 20, 70);
  }
}