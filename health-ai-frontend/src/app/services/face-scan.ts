import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FaceScan {

  IMPORTANT_REGIONS: any = {
    left_eye: [33, 133, 159, 145],
    right_eye: [362, 263, 386, 374],
    nose: [1, 2, 98, 327],
    left_cheek: [50, 101, 118, 119],
    right_cheek: [280, 330, 347, 348],
    mouth: [13, 14]
  };

  extractRegions(landmarks: any[]) {
    return {
      regions: Object.keys(this.IMPORTANT_REGIONS),
      landmarks: Object.fromEntries(
        Object.entries(this.IMPORTANT_REGIONS).map(([region, indices]: any) => [
          region,
          indices.map((i: number) => {
            const lm = landmarks[i];
            return [lm.x, lm.y, lm.z];
          })
        ])
      )
    };
  }
}