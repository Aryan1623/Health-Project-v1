import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Pipeline {
  faceData: any = null;
  eyeData: any = null;
  smartwatchData: any = null;
  questionnaireScore: number = 0;
  observations: string[] = [];
}