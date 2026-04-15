import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EyeScan {

  LEFT_EYE = [33, 133, 160, 159, 158, 144, 145, 153];
  RIGHT_EYE = [362, 263, 387, 386, 385, 373, 374, 380];

  sampleRedness(ctx: CanvasRenderingContext2D, width: number, height: number, landmarks: any[]) {
    const redValues: number[] = [];

    const sampleEye = (indices: number[]) => {
      const points = indices.map(i => ({
        x: Math.floor(landmarks[i].x * width),
        y: Math.floor(landmarks[i].y * height)
      }));

      // Bounding box sampling (approximation of mask)
      const minX = Math.min(...points.map(p => p.x));
      const maxX = Math.max(...points.map(p => p.x));
      const minY = Math.min(...points.map(p => p.y));
      const maxY = Math.max(...points.map(p => p.y));

      for (let y = minY; y < maxY; y += 3) {
        for (let x = minX; x < maxX; x += 3) {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          redValues.push(pixel[0]); // R channel
        }
      }
    };

    sampleEye(this.LEFT_EYE);
    sampleEye(this.RIGHT_EYE);

    if (!redValues.length) return null;

    const avg = redValues.reduce((a, b) => a + b, 0) / redValues.length;

    return avg;
  }
}