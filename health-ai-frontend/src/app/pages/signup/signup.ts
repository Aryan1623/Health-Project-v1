import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class SignupComponent {

  user = {
    name: '',
    email: '',
    password: ''
  };

  loading = false;
  errorMessage = '';

  constructor(private router: Router, private http: HttpClient) {}

  signup() {
    this.loading = true;
    this.errorMessage = '';

    this.http.post('http://localhost:8080/api/auth/signup', this.user)
      .subscribe({
        next: (res: any) => {
          console.log('Signup success:', res);
          this.loading = false;

          // Redirect after successful signup
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Signup failed:', err);
          this.loading = false;

          this.errorMessage = err?.error?.message || 'Signup failed. Try again.';
        }
      });
  }
}