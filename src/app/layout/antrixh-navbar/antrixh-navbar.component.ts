import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import {
  GenerateOTPRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
  User,
  VerifyOTPRequest,
} from '../../core/models/auth.model';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

interface AuthModalEventDetail {
  returnUrl?: string;
}

@Component({
  selector: 'app-antrixh-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './antrixh-navbar.component.html',
  styleUrl: './antrixh-navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AntrixhNavbarComponent implements OnInit, OnDestroy {
  // Scroll state
  isScrolled = false;

  // Mobile menu
  showMobileMenu = false;

  // Auth state
  isUserLoggedIn = false;
  currentUserId: string | null = null;
  userFirstName = '';
  showUserDropdown = false;

  // Auth modal
  showAuthModal = false;
  isLoginMode = true;

  // Login
  loginEmail = '';
  loginPassword = '';
  showLoginPassword = false;

  // Signup
  signupStep = 1;
  signupFirstName = '';
  signupLastName = '';
  signupEmail = '';
  signupPassword = '';
  showSignupPassword = false;
  signupPhone = '';
  signupCountryCode = '+91';

  // OTP
  showOTPVerification = false;
  otpDigits: string[] = ['', '', '', ''];
  currentOtpId: number | null = null;
  otpTimer = 0;
  otpInterval: ReturnType<typeof setInterval> | null = null;
  isLoading = false;
  otpRequestInProgress = false;
  otpRequestTimer = 0;
  otpRequestInterval: ReturnType<typeof setInterval> | null = null;

  // Forgot password
  showForgotPassword = false;
  forgotPasswordStep = 1;
  forgotPasswordEmail = '';
  forgotPasswordOtpDigits: string[] = ['', '', '', ''];
  forgotPasswordOtpId: number | null = null;
  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;
  forgotPasswordOtpRequestInProgress = false;
  forgotPasswordOtpRequestTimer = 0;
  forgotPasswordOtpRequestInterval: ReturnType<typeof setInterval> | null = null;

  private userSubscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private apiService: ApiService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();

    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.isUserLoggedIn = true;
        this.currentUserId = user.user_id;
        this.userFirstName = user.first_name;
      } else {
        this.isUserLoggedIn = false;
        this.currentUserId = null;
        this.userFirstName = '';
      }
      this.cdr.markForCheck();
    });

    window.addEventListener('openAuthModal', this.handleOpenAuthModal);
    this.onScroll();
  }

  ngOnDestroy(): void {
    window.removeEventListener('openAuthModal', this.handleOpenAuthModal);
    document.removeEventListener('click', this.closeDropdownOnClickOutside);
    this.clearOtpTimer();
    this.clearOtpRequestTimer();
    this.clearForgotPasswordOtpRequestTimer();
    this.userSubscription.unsubscribe();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 10;
  }

  // ===== MOBILE MENU =====
  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }

  // ===== AUTH STATE =====
  checkAuthStatus(): void {
    this.isUserLoggedIn = this.authService.isLoggedIn();

    if (this.isUserLoggedIn) {
      this.currentUserId = this.authService.getCurrentUserId();
      const user = this.authService.getCurrentUser();
      if (user) {
        this.userFirstName = user.first_name;
      }
    }
  }

  private handleOpenAuthModal = (event: Event): void => {
    const detail = (event as CustomEvent<AuthModalEventDetail>).detail;
    if (detail?.returnUrl) {
      localStorage.setItem('pending_return_url', detail.returnUrl);
    }
    this.showAuthModal = true;
    this.resetAuthForms();
    this.cdr.markForCheck();
  };

  // ===== DROPDOWN =====
  toggleDropdown(): void {
    if (!this.isUserLoggedIn) return;
    this.showUserDropdown = !this.showUserDropdown;

    if (this.showUserDropdown) {
      setTimeout(() => document.addEventListener('click', this.closeDropdownOnClickOutside));
    } else {
      document.removeEventListener('click', this.closeDropdownOnClickOutside);
    }
    this.cdr.markForCheck();
  }

  private closeDropdownOnClickOutside = (event: MouseEvent): void => {
    document.removeEventListener('click', this.closeDropdownOnClickOutside);
    this.showUserDropdown = false;
    this.cdr.markForCheck();
  };

  onViewBookings(): void {
    this.showUserDropdown = false;
    this.closeMobileMenu();
    if (!this.currentUserId) {
      this.toastr.error('User information not found. Please login again.', 'Error');
      this.onSignIn();
      return;
    }
    this.router.navigate(['/my-bookings-antrixh', this.currentUserId]);
  }

  onLogout(): void {
    this.showUserDropdown = false;
    this.authService.logout();
    this.toastr.success('Logged out successfully!', 'Success');

    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
    this.cdr.markForCheck();
  }

  getUserDisplayName(): string {
    return this.userFirstName || 'User';
  }

  getUserEmail(): string {
    const user = this.authService.getCurrentUser();
    return user?.email || '';
  }

  // ===== AUTH MODAL =====
  onSignIn(): void {
    this.showAuthModal = true;
    this.isLoginMode = true;
    this.resetAuthForms();
  }

  onSignUp(): void {
    this.showAuthModal = true;
    this.isLoginMode = false;
    this.signupStep = 1;
    this.resetAuthForms();
    this.isLoginMode = false;
  }

  onCloseAuthModal(): void {
    this.showAuthModal = false;
    this.resetAuthForms();
  }

  resetAuthForms(): void {
    this.signupStep = 1;
    this.showOTPVerification = false;
    this.showForgotPassword = false;
    this.forgotPasswordStep = 1;
    this.loginEmail = '';
    this.loginPassword = '';
    this.showLoginPassword = false;
    this.signupFirstName = '';
    this.signupEmail = '';
    this.signupPassword = '';
    this.showSignupPassword = false;
    this.signupPhone = '';
    this.signupCountryCode = '+91';
    this.otpDigits = ['', '', '', ''];
    this.currentOtpId = null;
    this.clearOtpTimer();
    this.clearOtpRequestTimer();
    this.clearForgotPasswordOtpRequestTimer();
    this.otpRequestInProgress = false;
    this.forgotPasswordOtpRequestInProgress = false;
    this.isLoading = false;
  }

  switchToSignup(): void {
    this.isLoginMode = false;
    this.signupStep = 1;
    this.showOTPVerification = false;
    this.cdr.markForCheck();
  }

  switchToLogin(): void {
    this.isLoginMode = true;
    this.showOTPVerification = false;
    this.cdr.markForCheck();
  }

  // ===== LOGIN =====
  onLogin(): void {
    if (!this.loginEmail || !this.loginPassword) {
      this.toastr.warning('Please enter email and password', 'Validation Error');
      return;
    }

    this.isLoading = true;

    const loginReq = {
      email: this.loginEmail,
      password: this.loginPassword,
    };

    this.apiService.UserLogin(loginReq).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.response) {
          if (response.response.status === 'Success') {
            this.saveUserData(response);
            this.showAuthModal = false;
            this.toastr.success('Logged in successfully!', 'Success');
            this.resetAuthForms();
          } else {
            this.toastr.error(response.response.message || 'Login Failed', 'Login Failed');
          }
        } else {
          this.toastr.error('Invalid response from server', 'Login Failed');
        }
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        this.isLoading = false;
        if (error.error && error.error.response) {
          this.toastr.error(error.error.response.message || 'Login failed', 'Error');
        } else {
          this.toastr.error('Login failed. Please check your credentials and try again.', 'Error');
        }
        this.cdr.markForCheck();
      },
    });
  }

  private saveUserData(loginResponse: LoginResponse): void {
    localStorage.setItem('jwt_token', loginResponse.token);
    localStorage.setItem('refresh_token', loginResponse.refresh_token);
    localStorage.setItem('token_expiry', loginResponse.token_expiry);
    localStorage.setItem('refresh_token_expiry', loginResponse.refresh_token_expiry);

    const userData: User = {
      user_id: loginResponse.user_id,
      first_name: loginResponse.first_name,
      last_name: loginResponse.last_name,
      email: loginResponse.email,
      mobile: loginResponse.mobile,
      country_code: loginResponse.country_code,
      profile_img: loginResponse.profile_img,
      role_id: loginResponse.role_id,
    };
    localStorage.setItem('user_data', JSON.stringify(userData));
    this.authService.setcurrentUser(userData);
  }

  // ===== SIGNUP =====
  isValidSignupStep1(): boolean {
    return (
      this.signupFirstName?.length >= 2 &&
      this.isValidEmail(this.signupEmail) &&
      this.isPasswordValid()
    );
  }

  onSignupStep1(): void {
    if (!this.isValidSignupStep1()) {
      this.toastr.warning('Please fill all required fields correctly', 'Validation Error');
      return;
    }

    this.signupStep = 2;
    this.otpRequestInProgress = true;
    this.startOtpRequestTimer(30);
    this.isLoading = true;

    const otpRequest: GenerateOTPRequest = {
      contact_type: 'email',
      email: this.signupEmail,
      newUser: true,
    };

    this.apiService.GenerateOTP(otpRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.otpRequestInProgress = false;
        this.clearOtpRequestTimer();

        if (response && response.response) {
          if (response.response.status === 'Success') {
            this.currentOtpId = response.validationotp_id;
            this.startOtpTimer(120);
            this.toastr.success('OTP sent to your email', 'Success');
          } else {
            this.toastr.error(response.response.message || 'Failed to send OTP', 'OTP Failed');
          }
        } else {
          this.toastr.error('Invalid response from server', 'OTP Failed');
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.otpRequestInProgress = false;
        this.clearOtpRequestTimer();
        if (error.error && error.error.response) {
          this.toastr.error(error.error.response.message || 'Failed to send OTP', 'Error');
        } else {
          this.toastr.error('Failed to send OTP. Please try again.', 'Error');
        }
        this.cdr.markForCheck();
      },
    });
  }

  startOtpRequestTimer(seconds: number): void {
    this.otpRequestTimer = seconds;
    this.clearOtpRequestTimer();
    this.otpRequestInterval = setInterval(() => {
      this.otpRequestTimer--;
      this.cdr.markForCheck();
      if (this.otpRequestTimer <= 0) {
        this.clearOtpRequestTimer();
        this.otpRequestInProgress = false;
      }
    }, 1000);
  }

  clearOtpRequestTimer(): void {
    if (this.otpRequestInterval) {
      clearInterval(this.otpRequestInterval);
      this.otpRequestInterval = null;
    }
  }

  formatOtpRequestTimer(): string {
    return `${this.otpRequestTimer} sec`;
  }

  // ===== OTP =====
  onOtpInput(event: any, index: number): void {
    const input = event.target;
    const value = input.value;
    if (!/^\d*$/.test(value)) {
      input.value = '';
      this.otpDigits[index] = '';
      return;
    }
    this.otpDigits[index] = value;
    if (value && index < 3) {
      const nextInput = document.querySelectorAll('.otp-digit')[index + 1] as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  onOtpKeyDown(event: any, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = document.querySelectorAll('.otp-digit')[index - 1] as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigits.every((digit) => digit.length === 1);
  }

  getOtpCode(): string {
    return this.otpDigits.join('');
  }

  startOtpTimer(seconds: number): void {
    this.otpTimer = seconds;
    this.clearOtpTimer();
    this.otpInterval = setInterval(() => {
      this.otpTimer--;
      this.cdr.markForCheck();
      if (this.otpTimer <= 0) this.clearOtpTimer();
    }, 1000);
  }

  clearOtpTimer(): void {
    if (this.otpInterval) {
      clearInterval(this.otpInterval);
      this.otpInterval = null;
    }
  }

  formatOtpTimer(): string {
    const minutes = Math.floor(this.otpTimer / 60);
    const seconds = this.otpTimer % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  resendOTP(): void {
    if (this.otpTimer > 30 && !this.otpRequestInProgress) {
      this.toastr.warning('Please wait before resending OTP', 'Warning');
      return;
    }

    this.otpDigits = ['', '', '', ''];
    this.otpRequestInProgress = true;
    this.startOtpRequestTimer(30);
    this.isLoading = true;

    const otpRequest: GenerateOTPRequest = {
      contact_type: 'email',
      email: this.signupEmail,
      newUser: true,
    };

    this.apiService.GenerateOTP(otpRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.otpRequestInProgress = false;
        this.clearOtpRequestTimer();

        if (response && response.response) {
          if (response.response.status === 'Success') {
            this.currentOtpId = response.validationotp_id;
            this.startOtpTimer(120);
            this.toastr.success('New OTP sent to your email', 'Success');
          } else {
            this.toastr.error(response.response.message || 'Failed to resend OTP', 'Resend Failed');
          }
        } else {
          this.toastr.error('Invalid response from server', 'Resend Failed');
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.otpRequestInProgress = false;
        this.clearOtpRequestTimer();
        if (error.error && error.error.response) {
          this.toastr.error(error.error.response.message || 'Failed to resend OTP', 'Error');
        } else {
          this.toastr.error('Failed to resend OTP', 'Error');
        }
        this.cdr.markForCheck();
      },
    });
  }

  verifyOTP(): void {
    if (!this.isOtpComplete() || !this.currentOtpId) {
      this.toastr.warning('Please enter complete OTP', 'Validation Error');
      return;
    }

    this.isLoading = true;

    const verifyRequest: VerifyOTPRequest = {
      otp_id: this.currentOtpId,
      otp: this.getOtpCode(),
      email: this.signupEmail,
      contact_type: 'email',
    };

    this.apiService.VerifyOTP(verifyRequest).subscribe({
      next: (response) => {
        if (response && response.status === 'Success') {
          this.completeSignup();
        } else {
          this.toastr.error(response?.message || 'OTP Verification Failed', 'OTP Verification Failed');
          this.isLoading = false;
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error && error.error.message) {
          this.toastr.error(error.error.message, 'OTP Verification Failed');
        } else {
          this.toastr.error('OTP verification failed', 'Error');
        }
        this.cdr.markForCheck();
      },
    });
  }

  completeSignup(): void {
    const signUpData: SignUpRequest = {
      first_name: this.signupFirstName,
      email: this.signupEmail,
      password: this.signupPassword,
      role_id: 3,
      mobile: this.signupPhone || undefined,
      country_code: this.signupPhone ? this.signupCountryCode : undefined,
    };

    this.apiService.UserSignUp(signUpData).subscribe({
      next: (response: SignUpResponse) => {
        if (response && response.response) {
          if (response.response.status === 'Success') {
            this.autoLoginAfterSignup();
          } else {
            this.toastr.error(response.response.message || 'Signup Failed', 'Signup Failed');
            this.isLoading = false;
          }
        } else {
          this.toastr.error('Invalid response from server', 'Signup Failed');
          this.isLoading = false;
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error && error.error.response) {
          this.toastr.error(error.error.response.message || 'Account creation failed', 'Signup Failed');
        } else {
          this.toastr.error('Account creation failed. Please try again.', 'Error');
        }
        this.cdr.markForCheck();
      },
    });
  }

  private autoLoginAfterSignup(): void {
    const loginReq = {
      email: this.signupEmail,
      password: this.signupPassword,
    };

    this.apiService.UserLogin(loginReq).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.response) {
          if (response.response.status === 'Success') {
            this.saveUserData(response);
            this.showAuthModal = false;
            this.toastr.success('Account created and logged in successfully!', 'Success');
            this.resetAuthForms();
          } else {
            this.toastr.success('Account created successfully! Please login to continue.', 'Success');
            this.switchToLogin();
            this.loginEmail = this.signupEmail;
          }
        } else {
          this.toastr.success('Account created successfully! Please login to continue.', 'Success');
          this.switchToLogin();
          this.loginEmail = this.signupEmail;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.toastr.success('Account created successfully! Please login to continue.', 'Success');
        this.switchToLogin();
        this.loginEmail = this.signupEmail;
        this.cdr.markForCheck();
      },
    });
  }

  goBackToStep1(): void {
    this.signupStep = 1;
    this.clearOtpTimer();
    this.cdr.markForCheck();
  }

  // ===== HELPERS =====
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  hasUpperCase(): boolean {
    return /[A-Z]/.test(this.signupPassword);
  }

  hasLowerCase(): boolean {
    return /[a-z]/.test(this.signupPassword);
  }

  hasNumber(): boolean {
    return /[0-9]/.test(this.signupPassword);
  }

  hasSpecialChar(): boolean {
    return /[@$!%*?&]/.test(this.signupPassword);
  }

  hasMinLength(): boolean {
    return this.signupPassword?.length >= 8;
  }

  isPasswordValid(): boolean {
    return (
      this.hasUpperCase() &&
      this.hasLowerCase() &&
      this.hasNumber() &&
      this.hasSpecialChar() &&
      this.hasMinLength()
    );
  }

  // ===== FORGOT PASSWORD =====
  onForgotPassword(): void {
    this.showForgotPassword = true;
    this.forgotPasswordStep = 1;
    this.forgotPasswordEmail = this.loginEmail;
    this.resetForgotPasswordForms();
  }

  resetForgotPasswordForms(): void {
    this.forgotPasswordOtpDigits = ['', '', '', ''];
    this.forgotPasswordOtpId = null;
    this.newPassword = '';
    this.confirmPassword = '';
    this.clearOtpTimer();
    this.clearForgotPasswordOtpRequestTimer();
    this.forgotPasswordOtpRequestInProgress = false;
  }

  backToLogin(): void {
    this.showForgotPassword = false;
    this.forgotPasswordStep = 1;
    this.resetForgotPasswordForms();
    this.cdr.markForCheck();
  }

  backToForgotStep1(): void {
    this.forgotPasswordStep = 1;
    this.resetForgotPasswordForms();
    this.cdr.markForCheck();
  }

  startForgotPasswordOtpRequestTimer(seconds: number): void {
    this.forgotPasswordOtpRequestTimer = seconds;
    this.clearForgotPasswordOtpRequestTimer();
    this.forgotPasswordOtpRequestInterval = setInterval(() => {
      this.forgotPasswordOtpRequestTimer--;
      this.cdr.markForCheck();
      if (this.forgotPasswordOtpRequestTimer <= 0) {
        this.clearForgotPasswordOtpRequestTimer();
        this.forgotPasswordOtpRequestInProgress = false;
      }
    }, 1000);
  }

  clearForgotPasswordOtpRequestTimer(): void {
    if (this.forgotPasswordOtpRequestInterval) {
      clearInterval(this.forgotPasswordOtpRequestInterval);
      this.forgotPasswordOtpRequestInterval = null;
    }
  }

  formatForgotPasswordOtpRequestTimer(): string {
    return `${this.forgotPasswordOtpRequestTimer} sec`;
  }

  sendForgotPasswordOTP(): void {
    if (!this.forgotPasswordEmail) {
      this.toastr.warning('Please enter your email address', 'Validation Error');
      return;
    }
    if (!this.isValidEmail(this.forgotPasswordEmail)) {
      this.toastr.warning('Please enter a valid email address', 'Validation Error');
      return;
    }

    this.forgotPasswordStep = 2;
    this.forgotPasswordOtpRequestInProgress = true;
    this.startForgotPasswordOtpRequestTimer(30);
    this.isLoading = true;

    const otpRequest: GenerateOTPRequest = {
      contact_type: 'email',
      email: this.forgotPasswordEmail,
      newUser: false,
    };

    this.apiService.GenerateOTP(otpRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.forgotPasswordOtpRequestInProgress = false;
        this.clearForgotPasswordOtpRequestTimer();

        if (response && response.response) {
          if (response.response.status === 'Success') {
            this.forgotPasswordOtpId = response.validationotp_id;
            this.startOtpTimer(120);
            this.toastr.success('OTP sent to your email', 'Success');
          } else {
            this.toastr.error(response.response.message || 'Failed to send OTP', 'Failed');
          }
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.forgotPasswordOtpRequestInProgress = false;
        this.clearForgotPasswordOtpRequestTimer();
        const errorMsg = error.error?.response?.message || 'Failed to send OTP. Please try again.';
        this.toastr.error(errorMsg, 'Error');
        this.cdr.markForCheck();
      },
    });
  }

  resendForgotPasswordOTP(): void {
    if (this.otpTimer > 30 && !this.forgotPasswordOtpRequestInProgress) {
      this.toastr.warning('Please wait before resending OTP', 'Warning');
      return;
    }

    this.forgotPasswordOtpDigits = ['', '', '', ''];
    this.forgotPasswordOtpRequestInProgress = true;
    this.startForgotPasswordOtpRequestTimer(30);
    this.isLoading = true;

    const otpRequest: GenerateOTPRequest = {
      contact_type: 'email',
      email: this.forgotPasswordEmail,
      newUser: false,
    };

    this.apiService.GenerateOTP(otpRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.forgotPasswordOtpRequestInProgress = false;
        this.clearForgotPasswordOtpRequestTimer();

        if (response?.response?.status === 'Success') {
          this.forgotPasswordOtpId = response.validationotp_id;
          this.startOtpTimer(120);
          this.toastr.success('New OTP sent to your email', 'Success');
        } else {
          this.toastr.error(response?.response?.message || 'Failed to resend OTP', 'Failed');
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.forgotPasswordOtpRequestInProgress = false;
        this.clearForgotPasswordOtpRequestTimer();
        this.toastr.error('Failed to resend OTP', 'Error');
        this.cdr.markForCheck();
      },
    });
  }

  onForgotOtpInput(event: any, index: number): void {
    const input = event.target;
    const value = input.value;
    if (!/^\d*$/.test(value)) {
      input.value = '';
      this.forgotPasswordOtpDigits[index] = '';
      return;
    }
    this.forgotPasswordOtpDigits[index] = value;
    if (value && index < 3) {
      const nextInput = document.querySelectorAll('.otp-digit')[index + 1] as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  onForgotOtpKeyDown(event: any, index: number): void {
    if (event.key === 'Backspace' && !this.forgotPasswordOtpDigits[index] && index > 0) {
      const prevInput = document.querySelectorAll('.otp-digit')[index - 1] as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  }

  isForgotOtpComplete(): boolean {
    return this.forgotPasswordOtpDigits.every((digit) => digit.length === 1);
  }

  getForgotOtpCode(): string {
    return this.forgotPasswordOtpDigits.join('');
  }

  verifyForgotPasswordOTP(): void {
    if (!this.isForgotOtpComplete() || !this.forgotPasswordOtpId) {
      this.toastr.warning('Please enter complete OTP', 'Validation Error');
      return;
    }

    this.isLoading = true;

    const verifyRequest: VerifyOTPRequest = {
      otp_id: this.forgotPasswordOtpId,
      otp: this.getForgotOtpCode(),
      email: this.forgotPasswordEmail,
      contact_type: 'email',
    };

    this.apiService.VerifyOTP(verifyRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response?.status === 'Success') {
          this.forgotPasswordStep = 3;
          this.clearOtpTimer();
          this.toastr.success('OTP verified successfully', 'Success');
        } else {
          this.toastr.error(response?.message || 'OTP verification failed', 'Failed');
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        const errorMsg = error.error?.message || 'OTP verification failed';
        this.toastr.error(errorMsg, 'Error');
        this.cdr.markForCheck();
      },
    });
  }

  hasNewUpperCase(): boolean {
    return /[A-Z]/.test(this.newPassword);
  }

  hasNewLowerCase(): boolean {
    return /[a-z]/.test(this.newPassword);
  }

  hasNewNumber(): boolean {
    return /[0-9]/.test(this.newPassword);
  }

  hasNewSpecialChar(): boolean {
    return /[@$!%*?&]/.test(this.newPassword);
  }

  hasNewMinLength(): boolean {
    return this.newPassword?.length >= 8;
  }

  isNewPasswordValid(): boolean {
    return (
      this.hasNewUpperCase() &&
      this.hasNewLowerCase() &&
      this.hasNewNumber() &&
      this.hasNewSpecialChar() &&
      this.hasNewMinLength()
    );
  }

  setNewPassword(): void {
    if (!this.isNewPasswordValid()) {
      this.toastr.warning('Password does not meet requirements', 'Validation Error');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.toastr.warning('Passwords do not match', 'Validation Error');
      return;
    }

    this.isLoading = true;

    const resetPasswordRequest = {
      email: this.forgotPasswordEmail,
      newPassword: this.newPassword,
      otpId: this.forgotPasswordOtpId,
    };

    this.apiService.resetPassword(resetPasswordRequest).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response?.status === 'Success') {
          this.toastr.success(
            'Password updated successfully! Please login with your new password.',
            'Success'
          );
          this.showForgotPassword = false;
          this.forgotPasswordStep = 1;
          this.loginEmail = this.forgotPasswordEmail;
          this.loginPassword = '';
          this.resetForgotPasswordForms();
          this.toastr.info('Please login with your new password', 'Info');
        } else {
          this.toastr.error(response?.message || 'Failed to update password', 'Failed');
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        const errorMsg = error.error?.message || 'Failed to update password. Please try again.';
        this.toastr.error(errorMsg, 'Error');
        this.cdr.markForCheck();
      },
    });
  }
}
