import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login';
import { SignupComponent } from './pages/signup/signup';
import { Dashboard } from './pages/dashboard/dashboard';
import { ResultComponent } from './pages/result/result';
import { FaceScanComponent } from './pages/face-scan/face-scan';
import { EyeScanComponent } from './pages/eye-scan/eye-scan';
import { SmartwatchComponent } from './pages/smartwatch/smartwatch';
import { QuestionnaireComponent } from './pages/questionnaire/questionnaire';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  // 🔥 Pipeline Flow
  { path: 'dashboard', component: Dashboard },

  // Step 1
  { path: 'face-scan', component: FaceScanComponent },

  // Step 2 (receives faceData)
  { path: 'eye-scan', component: EyeScanComponent },

  // Step 3 (receives face + eye)
  { path: 'smartwatch', component: SmartwatchComponent },

  // Step 4 (receives face + eye + smartwatch)
  { path: 'questionnaire', component: QuestionnaireComponent },

  // Final Step (receives everything)
  { path: 'result', component: ResultComponent }
];