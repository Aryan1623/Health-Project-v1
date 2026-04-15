import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

  constructor(private router: Router) {}

  // 🔥 Start full pipeline
  startPipeline() {
    this.router.navigate(['/face-scan']);
  }
}