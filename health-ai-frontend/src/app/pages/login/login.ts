import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  user = {
    email: '',
    password: ''
  };

  loading = false;
  errorMessage = '';

  constructor(private router: Router, private http: HttpClient) {}

  login() {
    this.loading = true;
    this.errorMessage = '';

    this.http.post('http://localhost:8080/api/auth/login', this.user)
      .subscribe({
        next: (res: any) => {
          console.log('Login success:', res);
          this.loading = false;

          // Optional: store user/token
          localStorage.setItem('user', JSON.stringify(res));

          // Navigate to dashboard
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Login failed:', err);
          this.loading = false;

          this.errorMessage = err?.error || 'Invalid credentials';
        }
      });
  }
}