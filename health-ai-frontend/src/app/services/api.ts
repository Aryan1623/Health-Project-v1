import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  signup(data: any) {
    return this.http.post(`${this.baseUrl}/auth/signup`, data);
  }

  login(data: any) {
    return this.http.post(`${this.baseUrl}/auth/login`, data);
  }

  runScan() {
    return this.http.get(`${this.baseUrl}/health/run`);
  }
}