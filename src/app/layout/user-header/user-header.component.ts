import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { filter, Subscription } from 'rxjs';
import { LoginResponse, User, GenerateOTPRequest, VerifyOTPRequest, SignUpRequest, SignUpResponse } from '../../core/models/auth.model';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-header.component.html',
  styleUrl: './user-header.component.css',
})
export class UserHeaderComponent implements OnInit, OnDestroy {
  // Auth properties
  isUserLoggedIn = false;
  currentUserId: string | null = null;
  userFirstName: string = '';
  showUserDropdown = false;
  
  // Auth Modal properties
  showAuthModal = false;
  isLoginMode = true;
  
  // Login properties
  loginEmail: string = '';
  loginPassword: string = '';
  
  // Signup properties
  signupStep = 1;
  signupFirstName: string = '';
  signupLastName: string = '';
  signupEmail: string = '';
  signupPassword: string = '';
  signupPhone: string = '';
  signupCountryCode: string = '+91';
  
  // OTP properties
  showOTPVerification = false;
  otpDigits: string[] = ['', '', '', ''];
  currentOtpId: number | null = null;
  otpTimer = 0;
  otpInterval: any;
  isLoading = false;
  
  // City selection
  selectedCity: string = 'Pune';
  
  // ========== NEW: Breadcrumb Properties ==========
  currentRoute: string = '';
  eventId: number | null = null;
  eventNameSlug: string | null = null;
  eventTitle: string = '';
  
  private routerSubscription: Subscription = new Subscription();
  private userSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private apiService: ApiService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Check initial auth status
    this.checkAuthStatus();
    
    // Subscribe to auth changes
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      console.log('User header - auth state changed:', user);
      if (user) {
        this.isUserLoggedIn = true;
        this.currentUserId = user.user_id;
        this.userFirstName = user.first_name;
      } else {
        this.isUserLoggedIn = false;
        this.currentUserId = null;
        this.userFirstName = '';
      }
    });
    
    // ========== NEW: Subscribe to route changes ==========
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
        this.extractRouteParams();
      });
    
    // Initial route extraction
    this.currentRoute = this.router.url;
    this.extractRouteParams();
  }

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

  // ========== NEW: Route Detection Methods ==========
  
  /**
   * Determine whether to show search section or breadcrumbs
   */
  showSearchSection(): boolean {
    // Show search on home, events, and my-bookings pages
    // Hide search on seat-booking and event-payment pages
    return !this.isSeatBookingPage() && !this.isPaymentPage();
  }

  /**
   * Check if current page is seat booking page
   */
  isSeatBookingPage(): boolean {
    return this.currentRoute?.includes('/seats-booking/');
  }

  /**
   * Check if current page is payment page
   */
  isPaymentPage(): boolean {
    return this.currentRoute?.includes('/event-payment/');
  }

  /**
   * Extract event ID and name from URL parameters
   */
  private extractRouteParams(): void {
    // Reset params
    this.eventId = null;
    this.eventNameSlug = null;
    this.eventTitle = '';
    
    // Extract from seats-booking route
    const seatsMatch = this.currentRoute.match(/\/seats-booking\/(\d+)\/([^\/?#]+)/);
    if (seatsMatch) {
      this.eventId = parseInt(seatsMatch[1], 10);
      this.eventNameSlug = seatsMatch[2];
      this.eventTitle = this.formatEventTitle(this.eventNameSlug);
      return;
    }
    
    // Extract from event-payment route
    const paymentMatch = this.currentRoute.match(/\/event-payment\/(\d+)\/([^\/?#]+)/);
    if (paymentMatch) {
      this.eventId = parseInt(paymentMatch[1], 10);
      this.eventNameSlug = paymentMatch[2];
      this.eventTitle = this.formatEventTitle(this.eventNameSlug);
      return;
    }
    
    // Extract from event-booking route (if needed for future)
    const bookingMatch = this.currentRoute.match(/\/event-booking\/(\d+)\/([^\/?#]+)/);
    if (bookingMatch) {
      this.eventId = parseInt(bookingMatch[1], 10);
      this.eventNameSlug = bookingMatch[2];
      this.eventTitle = this.formatEventTitle(this.eventNameSlug);
    }
  }

  /**
   * Format event title from slug
   */
  private formatEventTitle(slug: string): string {
    return slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get current page name for breadcrumb
   */
  getCurrentPageName(): string {
    if (this.isSeatBookingPage()) {
      return 'Select Seats';
    }
    if (this.isPaymentPage()) {
      return 'Review & Pay';
    }
    return '';
  }

  // ========== NEW: Navigation Methods ==========

  /**
   * Navigate back to previous page
   */
  navigateBack(): void {
    if (this.isSeatBookingPage()) {
      // Navigate back to event booking page
      if (this.eventId && this.eventNameSlug) {
        this.router.navigate(['/event-booking', this.eventId, this.eventNameSlug]);
      } else {
        this.router.navigate(['/events']);
      }
    } else if (this.isPaymentPage()) {
      // Navigate back to seat booking page
      if (this.eventId && this.eventNameSlug) {
        this.router.navigate(['/seats-booking', this.eventId, this.eventNameSlug]);
      } else {
        this.router.navigate(['/events']);
      }
    } else {
      this.router.navigate(['/events']);
    }
  }

  /**
   * Navigate to event booking page
   */
  navigateToEventBooking(): void {
    if (this.eventId && this.eventNameSlug) {
      this.router.navigate(['/event-booking', this.eventId, this.eventNameSlug]);
    }
  }

  // ===========================================
  // SEARCH METHODS
  // ===========================================
  
  onSearch(event: any): void {
    const searchTerm = event.target.value;
    console.log('Searching for:', searchTerm);
    // Implement search logic here
  }

  onCityChange(city: string): void {
    this.selectedCity = city;
    console.log('City changed to:', city);
    // Implement city change logic
  }

  // ===========================================
  // DROPDOWN METHODS
  // ===========================================

  toggleDropdown(): void {
    if (this.isUserLoggedIn) {
      this.showUserDropdown = !this.showUserDropdown;
      if (this.showUserDropdown) {
        setTimeout(() => {
          document.addEventListener('click', this.closeDropdownOnClickOutside.bind(this));
        });
      }
    }
  }

  closeDropdownOnClickOutside(event: MouseEvent): void {
    const dropdown = document.querySelector('.user-welcome-dropdown');
    if (dropdown && !dropdown.contains(event.target as Node)) {
      this.showUserDropdown = false;
      document.removeEventListener('click', this.closeDropdownOnClickOutside.bind(this));
    }
  }

  onViewProfile(): void {
    this.showUserDropdown = false;
    this.toastr.info('Profile page coming soon!', 'Info');
  }

  onViewBookings(): void {
    this.showUserDropdown = false;
    if (!this.currentUserId) {
      this.toastr.error('User information not found. Please login again.', 'Error');
      this.onSignIn();
      return;
    }
    this.router.navigate(['/my-bookings', this.currentUserId]);
  }

  onLogout(): void {
    this.showUserDropdown = false;
    this.authService.logout();
    this.toastr.success('Logged out successfully!', 'Success');
    
    // Refresh the current page
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/events', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  // ===========================================
  // AUTH MODAL METHODS
  // ===========================================

  onSignIn(): void {
    this.showAuthModal = true;
    this.resetAuthForms();
  }

  onCloseAuthModal(): void {
    this.showAuthModal = false;
    this.resetAuthForms();
  }

  resetAuthForms(): void {
    this.isLoginMode = true;
    this.signupStep = 1;
    this.showOTPVerification = false;
    this.loginEmail = '';
    this.loginPassword = '';
    this.signupFirstName = '';
    this.signupLastName = '';
    this.signupEmail = '';
    this.signupPassword = '';
    this.signupPhone = '';
    this.signupCountryCode = '+91';
    this.otpDigits = ['', '', '', ''];
    this.currentOtpId = null;
    this.clearOtpTimer();
    this.isLoading = false;
  }

  switchToSignup(): void {
    this.isLoginMode = false;
    this.signupStep = 1;
    this.showOTPVerification = false;
  }

  switchToLogin(): void {
    this.isLoginMode = true;
    this.showOTPVerification = false;
  }

  // ===========================================
  // LOGIN METHODS
  // ===========================================

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
        if (response.response?.status === 'Success') {
          this.saveUserData(response);
          this.showAuthModal = false;
          this.toastr.success('Logged in successfully!', 'Success');
          this.resetAuthForms();
        } else {
          this.toastr.error(response.response?.message || 'Login Failed', 'Login Failed');
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.toastr.error('Login failed. Please check your credentials and try again.', 'Error');
        console.error('Login error:', error);
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

  // ===========================================
  // SIGNUP METHODS
  // ===========================================

  isValidSignupStep1(): boolean {
    return (
      this.signupFirstName.length >= 2 &&
      this.signupLastName.length >= 2 &&
      this.isValidEmail(this.signupEmail) &&
      this.signupPassword.length >= 8
    );
  }

  onSignupStep1(): void {
    if (!this.isValidSignupStep1()) {
      this.toastr.warning('Please fill all required fields correctly', 'Validation Error');
      return;
    }

    this.isLoading = true;

    const otpRequest: GenerateOTPRequest = {
      contact_type: 'email',
      email: this.signupEmail,
      newUser: true,
    };

    this.apiService.GenerateOTP(otpRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.response?.status === 'Success') {
          this.currentOtpId = response.validationotp_id;
          this.signupStep = 2;
          this.startOtpTimer(120);
          this.toastr.success('OTP sent to your email', 'Success');
        } else {
          this.toastr.error(response.response?.message || 'Failed to send OTP', 'OTP Failed');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Failed to send OTP. Please try again.', 'Error');
        console.error('OTP error:', error);
      },
    });
  }

  // ===========================================
  // OTP METHODS
  // ===========================================

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
    if (this.otpTimer > 30) {
      this.toastr.warning('Please wait before resending OTP', 'Warning');
      return;
    }
    this.isLoading = true;
    const otpRequest: GenerateOTPRequest = {
      contact_type: 'email',
      email: this.signupEmail,
      newUser: true,
    };
    this.apiService.GenerateOTP(otpRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.response?.status === 'Success') {
          this.currentOtpId = response.validationotp_id;
          this.startOtpTimer(120);
          this.toastr.success('New OTP sent to your email', 'Success');
        } else {
          this.toastr.error(response.response?.message || 'Failed to resend OTP', 'Resend Failed');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Failed to resend OTP', 'Error');
        console.error('Resend OTP error:', error);
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
        if (response.status === 'Success') {
          this.completeSignup();
        } else {
          this.toastr.error(response.message, 'OTP Verification Failed');
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.toastr.error('OTP verification failed', 'Error');
        this.isLoading = false;
        console.error('Verify OTP error:', error);
      },
    });
  }

  completeSignup(): void {
    const signUpData: SignUpRequest = {
      first_name: this.signupFirstName,
      last_name: this.signupLastName,
      email: this.signupEmail,
      password: this.signupPassword,
      role_id: 3,
      mobile: this.signupPhone || undefined,
      country_code: this.signupPhone ? this.signupCountryCode : undefined,
    };

    this.apiService.UserSignUp(signUpData).subscribe({
      next: (response: SignUpResponse) => {
        if (response.response?.status === 'Success') {
          this.autoLoginAfterSignup();
        } else {
          this.toastr.error(response.response?.message || 'Signup Failed', 'Signup Failed');
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.toastr.error('Account creation failed. Please try again.', 'Error');
        this.isLoading = false;
        console.error('Signup error:', error);
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
        if (response.response?.status === 'Success') {
          this.saveUserData(response);
          this.showAuthModal = false;
          this.toastr.success('Account created and logged in successfully!', 'Success');
          this.resetAuthForms();
        } else {
          this.toastr.success('Account created successfully! Please login to continue.', 'Success');
          this.switchToLogin();
          this.loginEmail = this.signupEmail;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.success('Account created successfully! Please login to continue.', 'Success');
        this.switchToLogin();
        this.loginEmail = this.signupEmail;
        console.error('Auto login error:', error);
      },
    });
  }

  goBackToStep1(): void {
    this.signupStep = 1;
    this.clearOtpTimer();
  }

  // ===========================================
  // HELPER METHODS
  // ===========================================

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getUserDisplayName(): string {
    return this.userFirstName || 'User';
  }

  navigateToSignUp(): void {
    this.router.navigate(['/auth/sign-up']);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.closeDropdownOnClickOutside.bind(this));
    this.clearOtpTimer();
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
