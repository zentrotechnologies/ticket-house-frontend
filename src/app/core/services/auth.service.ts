import { Injectable } from '@angular/core';
import { CommonResponse, LoginRequest, LoginResponse, User } from '../models/auth.model';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.THapibaseurl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // constructor(private http: HttpClient) {
  //   this.loadUserFromStorage();
  // }
  constructor(private http: HttpClient) {
    // Auto-clear auth data in development mode
    if (!environment.production) {
      this.clearAuthData();
    } else {
      this.loadUserFromStorage();
    }
  }

  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    const url = `${this.apiUrl}api/Login/Login`;
    
    return this.http.post<LoginResponse>(url, loginRequest).pipe(
      tap(response => {
        if (response.response.status === 'Success') {
          this.setSession(response);
          this.setCurrentUser(response);
        }
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    localStorage.removeItem(environment.USERDATA_KEY);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('refresh_token');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    // Always return false in development to force login
    if (!environment.production) {
      return false;
    }
    
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired
    const expiry = localStorage.getItem('token_expiry');
    if (expiry) {
      return new Date() < new Date(expiry);
    }
    return false;
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  refreshToken(): Observable<CommonResponse> {
    const refreshToken = this.getRefreshToken();
    const url = `${this.apiUrl}api/Login/RefreshToken`;
    
    return this.http.post<CommonResponse>(url, { refreshToken }).pipe(
      catchError(this.handleError)
    );
  }

  private setSession(authResult: LoginResponse): void {
    localStorage.setItem('jwt_token', authResult.token);
    localStorage.setItem('refresh_token', authResult.refresh_token);
    localStorage.setItem('token_expiry', authResult.token_expiry);
    localStorage.setItem('refresh_token_expiry', authResult.refresh_token_expiry);
    localStorage.setItem(environment.USERDATA_KEY, JSON.stringify(authResult));
  }

  private setCurrentUser(loginResponse: LoginResponse): void {
    const user: User = {
      user_id: loginResponse.user_id,
      first_name: loginResponse.first_name,
      last_name: loginResponse.last_name,
      email: loginResponse.email,
      mobile: loginResponse.mobile,
      country_code: loginResponse.country_code,
      profile_img: loginResponse.profile_img,
      role_id: loginResponse.role_id
    };
    this.currentUserSubject.next(user);
  }

  private loadUserFromStorage(): void {
    const userData = localStorage.getItem(environment.USERDATA_KEY);
    if (userData) {
      try {
        const loginResponse: LoginResponse = JSON.parse(userData);
        this.setCurrentUser(loginResponse);
      } catch (error) {
        console.error('Error parsing user data from storage:', error);
        this.logout();
      }
    }
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.response) {
        errorMessage = error.error.response.message || error.error.message;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  private clearAuthData(): void {
    localStorage.removeItem(environment.USERDATA_KEY);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('refresh_token_expiry');
    sessionStorage.clear();
    
    console.log('🔄 Development Mode: Cleared authentication data');
  }
}
