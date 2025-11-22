import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoginRequest } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  returnUrl: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.createForm();
  }

  ngOnInit(): void {
    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';

    // If user is already logged in, redirect based on role
    if (this.authService.isLoggedIn()) {
      this.redirectBasedOnRole();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const loginRequest: LoginRequest = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      };

      this.authService.login(loginRequest).subscribe({
        next: (response) => {
          this.isLoading = false;
          
          if (response.response.status === 'Success') {
            // Handle remember me
            if (this.loginForm.get('rememberMe')?.value) {
              // You can implement remember me logic here
            }

            // Redirect based on user role or returnUrl
            this.handlePostLoginRedirect();
          } else {
            this.errorMessage = response.response.message;
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Login failed. Please try again.';
          console.error('Login error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private handlePostLoginRedirect(): void {
    // If there's a return URL, use it
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    } else {
      // Otherwise redirect based on role
      this.redirectBasedOnRole();
    }
  }

  private redirectBasedOnRole(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
    } else if (this.authService.isAudience()) {
      this.router.navigate(['/user/events']);
    } else {
      // Fallback - should not happen if roles are properly set
      this.router.navigate(['/auth/login']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods for template
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return 'This field is required';
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `Password must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }
}
