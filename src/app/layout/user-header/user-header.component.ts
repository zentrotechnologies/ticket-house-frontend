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
  isScrolled = false;
  private scrollSubscription: any;
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
  showLoginPassword = false; // Add this

  // Signup properties
  signupStep = 1;
  signupFirstName: string = '';
  signupLastName: string = '';
  signupEmail: string = '';
  signupPassword: string = '';
  showSignupPassword = false; // Add this
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

  // Forgot Password Properties
  showForgotPassword = false;
  forgotPasswordStep = 1; // 1: Email, 2: OTP Verification, 3: Set Password
  forgotPasswordEmail: string = '';
  forgotPasswordOtpDigits: string[] = ['', '', '', ''];
  forgotPasswordOtpId: number | null = null;

  // New Password Properties
  newPassword: string = '';
  confirmPassword: string = '';
  showNewPassword = false;
  showConfirmPassword = false;
  otpRequestInProgress = false; // To track if OTP is being sent
  otpRequestTimer = 0; // Timer for OTP request (shows until OTP is sent)
  otpRequestInterval: any; // Interval for OTP request timer
  forgotPasswordOtpRequestInProgress = false; // To track if OTP is being sent for forgot password
  forgotPasswordOtpRequestTimer = 0; // Timer for OTP request
  forgotPasswordOtpRequestInterval: any; // Interval for OTP request timer

  private routerSubscription: Subscription = new Subscription();
  private userSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private apiService: ApiService,
    private toastr: ToastrService
  ) { }

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

        // Check if we have pending booking after login
        this.checkPendingBookingAfterLogin();
      } else {
        this.isUserLoggedIn = false;
        this.currentUserId = null;
        this.userFirstName = '';
      }
    });

    // Also check immediately after a short delay to ensure localStorage is read
    setTimeout(() => {
      this.checkAuthStatus();
    }, 0);

    // Subscribe to route changes
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
        this.extractRouteParams();
      });

    // Initial route extraction
    this.currentRoute = this.router.url;
    this.extractRouteParams();

    // Listen for custom event to open auth modal
    window.addEventListener('openAuthModal', () => {
      console.log('Opening auth modal');
      this.showAuthModal = true;
      this.resetAuthForms();
    });

    // Listen to scroll events
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', this.onScroll.bind(this));
    }
  }

  // Add this new method to handle the custom event
  private handleOpenAuthModal(event: any): void {
    console.log('Received openAuthModal event', event.detail);

    // Store return URL if provided
    if (event.detail?.returnUrl) {
      localStorage.setItem('pending_return_url', event.detail.returnUrl);
    }

    // Open the auth modal
    this.showAuthModal = true;
    this.resetAuthForms();
  }

  // Add this new method to check for pending booking after login
  private checkPendingBookingAfterLogin(): void {
    // Check if we have temp data in sessionStorage
    const tempSelections = sessionStorage.getItem('temp_seat_selections');
    const tempEventId = sessionStorage.getItem('temp_event_id');
    const tempEventName = sessionStorage.getItem('temp_event_name');

    console.log('Checking pending booking:', { tempSelections: !!tempSelections, tempEventId, tempEventName });

    if (tempSelections && tempEventId && tempEventName) {
      // We have a pending booking - redirect to payment
      console.log('Redirecting to payment page');
      this.router.navigate([`/event-payment/${tempEventId}/${tempEventName}`]);

      // Clear sessionStorage after navigation (payment page will use it)
      // Don't clear here - payment page will clear after using
    }
  }

  checkAuthStatus(): void {
    // First check via AuthService
    this.isUserLoggedIn = this.authService.isLoggedIn();

    if (this.isUserLoggedIn) {
      this.currentUserId = this.authService.getCurrentUserId();
      const user = this.authService.getCurrentUser();
      if (user) {
        this.userFirstName = user.first_name;
      }
    } else {
      // Double-check localStorage directly as a fallback
      const token = localStorage.getItem('jwt_token');
      const userData = localStorage.getItem('user_data');

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          this.isUserLoggedIn = true;
          this.currentUserId = user.user_id;
          this.userFirstName = user.first_name;

          // Also update the AuthService
          this.authService.setcurrentUser(user);
        } catch (e) {
          console.error('Error parsing user data', e);
        }
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
        this.router.navigate(['/event-booking', this.eventId, this.eventNameSlug]);
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
    // Show signup first when clicking Sign In button
    this.isLoginMode = false; // <--- CHANGE THIS LINE
    this.resetAuthForms();
  }

  onCloseAuthModal(): void {
    this.showAuthModal = false;
    this.resetAuthForms();
  }

  resetAuthForms(): void {
    this.isLoginMode = false;
    this.signupStep = 1;
    this.showOTPVerification = false;
    this.loginEmail = '';
    this.loginPassword = '';
    this.showLoginPassword = false; // Add this
    this.signupFirstName = '';
    // this.signupLastName = '';
    this.signupEmail = '';
    this.signupPassword = '';
    this.showSignupPassword = false; // Add this
    this.signupPhone = '';
    this.signupCountryCode = '+91';
    this.otpDigits = ['', '', '', ''];
    this.currentOtpId = null;
    this.clearOtpTimer();
    this.clearOtpRequestTimer(); // Add this
    this.otpRequestInProgress = false; // Add this
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
        // Check the nested response structure
        if (response && response.response) {
          if (response.response.status === 'Success') {
            this.saveUserData(response);
            this.showAuthModal = false;
            this.toastr.success('Logged in successfully!', 'Success');
            this.resetAuthForms();
          } else {
            // Show error message from API
            this.toastr.error(response.response.message || 'Login Failed', 'Login Failed');
          }
        } else {
          this.toastr.error('Invalid response from server', 'Login Failed');
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        // Handle HTTP errors
        if (error.error && error.error.response) {
          this.toastr.error(error.error.response.message || 'Login failed', 'Error');
        } else {
          this.toastr.error('Login failed. Please check your credentials and try again.', 'Error');
        }
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
      this.signupFirstName?.length >= 2 &&
      // this.signupLastName?.length >= 2 &&
      this.isValidEmail(this.signupEmail) &&
      this.isPasswordValid() // Use the new comprehensive validation
    );
  }

  // onSignupStep1(): void {
  //   if (!this.isValidSignupStep1()) {
  //     this.toastr.warning('Please fill all required fields correctly', 'Validation Error');
  //     return;
  //   }

  //   this.isLoading = true;

  //   const otpRequest: GenerateOTPRequest = {
  //     contact_type: 'email',
  //     email: this.signupEmail,
  //     newUser: true,
  //   };

  //   this.apiService.GenerateOTP(otpRequest).subscribe({
  //     next: (response) => {
  //       this.isLoading = false;
  //       if (response && response.response) {
  //         if (response.response.status === 'Success') {
  //           this.currentOtpId = response.validationotp_id;
  //           this.signupStep = 2;
  //           this.startOtpTimer(120);
  //           this.toastr.success('OTP sent to your email', 'Success');
  //         } else {
  //           this.toastr.error(response.response.message || 'Failed to send OTP', 'OTP Failed');
  //         }
  //       } else {
  //         this.toastr.error('Invalid response from server', 'OTP Failed');
  //       }
  //     },
  //     error: (error) => {
  //       this.isLoading = false;
  //       // Handle HTTP errors
  //       if (error.error && error.error.response) {
  //         this.toastr.error(error.error.response.message || 'Failed to send OTP', 'Error');
  //       } else {
  //         this.toastr.error('Failed to send OTP. Please try again.', 'Error');
  //       }
  //       console.error('OTP error:', error);
  //     },
  //   });
  // }

  onSignupStep1(): void {
    if (!this.isValidSignupStep1()) {
      this.toastr.warning('Please fill all required fields correctly', 'Validation Error');
      return;
    }

    // Immediately redirect to OTP page and start request timer
    this.signupStep = 2;
    this.otpRequestInProgress = true;
    this.startOtpRequestTimer(30); // Show 30 seconds countdown for OTP request

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
            // Start the OTP expiry timer after successful send
            this.startOtpTimer(120);
            this.toastr.success('OTP sent to your email', 'Success');
          } else {
            this.toastr.error(response.response.message || 'Failed to send OTP', 'OTP Failed');
            // Optionally go back to step 1 if OTP fails
            // this.signupStep = 1;
          }
        } else {
          this.toastr.error('Invalid response from server', 'OTP Failed');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.otpRequestInProgress = false;
        this.clearOtpRequestTimer();

        // Handle HTTP errors
        if (error.error && error.error.response) {
          this.toastr.error(error.error.response.message || 'Failed to send OTP', 'Error');
        } else {
          this.toastr.error('Failed to send OTP. Please try again.', 'Error');
        }
        console.error('OTP error:', error);

        // Optionally go back to step 1 if OTP fails
        // this.signupStep = 1;
      },
    });
  }

  // New method to start OTP request timer
  startOtpRequestTimer(seconds: number): void {
    this.otpRequestTimer = seconds;
    this.clearOtpRequestTimer();
    this.otpRequestInterval = setInterval(() => {
      this.otpRequestTimer--;
      if (this.otpRequestTimer <= 0) {
        this.clearOtpRequestTimer();
        // If timer expires and OTP still not received, show option to retry
        if (this.otpRequestInProgress) {
          this.otpRequestInProgress = false;
          // You can show a message here
        }
      }
    }, 1000);
  }

  // New method to clear OTP request timer
  clearOtpRequestTimer(): void {
    if (this.otpRequestInterval) {
      clearInterval(this.otpRequestInterval);
      this.otpRequestInterval = null;
    }
  }

  // New method to format OTP request timer
  formatOtpRequestTimer(): string {
    const seconds = this.otpRequestTimer;
    return `${seconds} sec`;
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

  // resendOTP(): void {
  //   if (this.otpTimer > 30) {
  //     this.toastr.warning('Please wait before resending OTP', 'Warning');
  //     return;
  //   }
  //   this.isLoading = true;
  //   const otpRequest: GenerateOTPRequest = {
  //     contact_type: 'email',
  //     email: this.signupEmail,
  //     newUser: true,
  //   };
  //   this.apiService.GenerateOTP(otpRequest).subscribe({
  //     next: (response) => {
  //       this.isLoading = false;
  //       if (response && response.response) {
  //         if (response.response.status === 'Success') {
  //           this.currentOtpId = response.validationotp_id;
  //           this.startOtpTimer(120);
  //           this.toastr.success('New OTP sent to your email', 'Success');
  //         } else {
  //           this.toastr.error(response.response.message || 'Failed to resend OTP', 'Resend Failed');
  //         }
  //       } else {
  //         this.toastr.error('Invalid response from server', 'Resend Failed');
  //       }
  //     },
  //     error: (error) => {
  //       this.isLoading = false;
  //       if (error.error && error.error.response) {
  //         this.toastr.error(error.error.response.message || 'Failed to resend OTP', 'Error');
  //       } else {
  //         this.toastr.error('Failed to resend OTP', 'Error');
  //       }
  //       console.error('Resend OTP error:', error);
  //     },
  //   });
  // }

  resendOTP(): void {
    if (this.otpTimer > 30 && !this.otpRequestInProgress) {
      this.toastr.warning('Please wait before resending OTP', 'Warning');
      return;
    }

    // Reset OTP digits
    this.otpDigits = ['', '', '', ''];

    // Show request in progress
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
            this.startOtpTimer(120); // Start 2-minute expiry timer
            this.toastr.success('New OTP sent to your email', 'Success');
          } else {
            this.toastr.error(response.response.message || 'Failed to resend OTP', 'Resend Failed');
          }
        } else {
          this.toastr.error('Invalid response from server', 'Resend Failed');
        }
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
        if (response && response.status === 'Success') {
          this.completeSignup();
        } else {
          this.toastr.error(response?.message || 'OTP Verification Failed', 'OTP Verification Failed');
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error && error.error.message) {
          this.toastr.error(error.error.message, 'OTP Verification Failed');
        } else {
          this.toastr.error('OTP verification failed', 'Error');
        }
        console.error('Verify OTP error:', error);
      },
    });
  }

  completeSignup(): void {
    const signUpData: SignUpRequest = {
      first_name: this.signupFirstName,
      // last_name: this.signupLastName,
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
            // Show the specific error message from API (like "Email already registered")
            this.toastr.error(response.response.message || 'Signup Failed', 'Signup Failed');
            this.isLoading = false;
          }
        } else {
          this.toastr.error('Invalid response from server', 'Signup Failed');
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.isLoading = false;
        // Handle HTTP errors and show API error messages
        if (error.error && error.error.response) {
          this.toastr.error(error.error.response.message || 'Account creation failed', 'Signup Failed');
        } else {
          this.toastr.error('Account creation failed. Please try again.', 'Error');
        }
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
    this.clearOtpRequestTimer(); // Add this
    this.clearForgotPasswordOtpRequestTimer(); // Add this
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }

    // Remove custom event listener
    window.removeEventListener('openAuthModal', this.handleOpenAuthModal.bind(this));

    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onScroll.bind(this));
    }
  }

  onScroll() {
    this.isScrolled = window.scrollY > 10;
  }

  // Password validation methods
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
    return this.hasUpperCase() &&
      this.hasLowerCase() &&
      this.hasNumber() &&
      this.hasSpecialChar() &&
      this.hasMinLength();
  }

  getUserEmail(): string {
    const user = this.authService.getCurrentUser();
    return user?.email || '';
  }

  // ===========================================
  // FORGOT PASSWORD METHODS
  // ===========================================

  onForgotPassword(): void {
    this.showForgotPassword = true;
    this.forgotPasswordStep = 1;
    this.forgotPasswordEmail = this.loginEmail; // Pre-fill with login email if available
    this.resetForgotPasswordForms();
  }

  resetForgotPasswordForms(): void {
    this.forgotPasswordOtpDigits = ['', '', '', ''];
    this.forgotPasswordOtpId = null;
    this.newPassword = '';
    this.confirmPassword = '';
    this.clearOtpTimer();
    this.clearForgotPasswordOtpRequestTimer(); // Add this
    this.forgotPasswordOtpRequestInProgress = false; // Add this
  }

  backToLogin(): void {
    this.showForgotPassword = false;
    this.forgotPasswordStep = 1;
    this.resetForgotPasswordForms();
  }

  backToForgotStep1(): void {
    this.forgotPasswordStep = 1;
    this.resetForgotPasswordForms();
  }

  // Add these new methods for forgot password request timer
  startForgotPasswordOtpRequestTimer(seconds: number): void {
    this.forgotPasswordOtpRequestTimer = seconds;
    this.clearForgotPasswordOtpRequestTimer();
    this.forgotPasswordOtpRequestInterval = setInterval(() => {
      this.forgotPasswordOtpRequestTimer--;
      if (this.forgotPasswordOtpRequestTimer <= 0) {
        this.clearForgotPasswordOtpRequestTimer();
        // If timer expires and OTP still not received, show option to retry
        if (this.forgotPasswordOtpRequestInProgress) {
          this.forgotPasswordOtpRequestInProgress = false;
        }
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
    const seconds = this.forgotPasswordOtpRequestTimer;
    return `${seconds} sec`;
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

    // Show request in progress and move to step 2 immediately
    this.forgotPasswordStep = 2;
    this.forgotPasswordOtpRequestInProgress = true;
    this.startForgotPasswordOtpRequestTimer(30);
    this.isLoading = true;

    const otpRequest: GenerateOTPRequest = {
      contact_type: 'email',
      email: this.forgotPasswordEmail,
      newUser: false // Important: Set to false for existing user
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
      },
      error: (error) => {
        this.isLoading = false;
        this.forgotPasswordOtpRequestInProgress = false;
        this.clearForgotPasswordOtpRequestTimer();

        const errorMsg = error.error?.response?.message || 'Failed to send OTP. Please try again.';
        this.toastr.error(errorMsg, 'Error');
        console.error('Forgot password OTP error:', error);
      }
    });
  }

  resendForgotPasswordOTP(): void {
    if (this.otpTimer > 30 && !this.forgotPasswordOtpRequestInProgress) {
      this.toastr.warning('Please wait before resending OTP', 'Warning');
      return;
    }

    // Reset OTP digits
    this.forgotPasswordOtpDigits = ['', '', '', ''];

    // Show request in progress
    this.forgotPasswordOtpRequestInProgress = true;
    this.startForgotPasswordOtpRequestTimer(30);
    this.isLoading = true;

    const otpRequest: GenerateOTPRequest = {
      contact_type: 'email',
      email: this.forgotPasswordEmail,
      newUser: false
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
      },
      error: (error) => {
        this.isLoading = false;
        this.forgotPasswordOtpRequestInProgress = false;
        this.clearForgotPasswordOtpRequestTimer();

        this.toastr.error('Failed to resend OTP', 'Error');
        console.error('Resend OTP error:', error);
      }
    });
  }

  // Send OTP for forgot password
  // sendForgotPasswordOTP(): void {
  //   if (!this.forgotPasswordEmail) {
  //     this.toastr.warning('Please enter your email address', 'Validation Error');
  //     return;
  //   }

  //   if (!this.isValidEmail(this.forgotPasswordEmail)) {
  //     this.toastr.warning('Please enter a valid email address', 'Validation Error');
  //     return;
  //   }

  //   this.isLoading = true;

  //   const otpRequest: GenerateOTPRequest = {
  //     contact_type: 'email',
  //     email: this.forgotPasswordEmail,
  //     newUser: false // Important: Set to false for existing user
  //   };

  //   this.apiService.GenerateOTP(otpRequest).subscribe({
  //     next: (response) => {
  //       this.isLoading = false;
  //       if (response && response.response) {
  //         if (response.response.status === 'Success') {
  //           this.forgotPasswordOtpId = response.validationotp_id;
  //           this.forgotPasswordStep = 2;
  //           this.startOtpTimer(120);
  //           this.toastr.success('OTP sent to your email', 'Success');
  //         } else {
  //           this.toastr.error(response.response.message || 'Failed to send OTP', 'Failed');
  //         }
  //       }
  //     },
  //     error: (error) => {
  //       this.isLoading = false;
  //       const errorMsg = error.error?.response?.message || 'Failed to send OTP. Please try again.';
  //       this.toastr.error(errorMsg, 'Error');
  //       console.error('Forgot password OTP error:', error);
  //     }
  //   });
  // }

  // Resend OTP for forgot password
  // resendForgotPasswordOTP(): void {
  //   if (this.otpTimer > 30) {
  //     this.toastr.warning('Please wait before resending OTP', 'Warning');
  //     return;
  //   }

  //   this.forgotPasswordOtpDigits = ['', '', '', ''];
  //   this.isLoading = true;

  //   const otpRequest: GenerateOTPRequest = {
  //     contact_type: 'email',
  //     email: this.forgotPasswordEmail,
  //     newUser: false
  //   };

  //   this.apiService.GenerateOTP(otpRequest).subscribe({
  //     next: (response) => {
  //       this.isLoading = false;
  //       if (response?.response?.status === 'Success') {
  //         this.forgotPasswordOtpId = response.validationotp_id;
  //         this.startOtpTimer(120);
  //         this.toastr.success('New OTP sent to your email', 'Success');
  //       } else {
  //         this.toastr.error(response?.response?.message || 'Failed to resend OTP', 'Failed');
  //       }
  //     },
  //     error: (error) => {
  //       this.isLoading = false;
  //       this.toastr.error('Failed to resend OTP', 'Error');
  //       console.error('Resend OTP error:', error);
  //     }
  //   });
  // }

  // OTP Input Handlers for Forgot Password
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
    return this.forgotPasswordOtpDigits.every(digit => digit.length === 1);
  }

  getForgotOtpCode(): string {
    return this.forgotPasswordOtpDigits.join('');
  }

  // Verify OTP for forgot password
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
      contact_type: 'email'
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
      },
      error: (error) => {
        this.isLoading = false;
        const errorMsg = error.error?.message || 'OTP verification failed';
        this.toastr.error(errorMsg, 'Error');
        console.error('Verify OTP error:', error);
      }
    });
  }

  // Password validation for new password
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
    return this.hasNewUpperCase() &&
      this.hasNewLowerCase() &&
      this.hasNewNumber() &&
      this.hasNewSpecialChar() &&
      this.hasNewMinLength();
  }

  // Set new password
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
      otpId: this.forgotPasswordOtpId
    };

    this.apiService.resetPassword(resetPasswordRequest).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response?.status === 'Success') {
          this.toastr.success('Password updated successfully! Please login with your new password.', 'Success');

          // Redirect to login
          this.showForgotPassword = false;
          this.forgotPasswordStep = 1;
          this.loginEmail = this.forgotPasswordEmail;
          this.loginPassword = ''; // Clear password field

          // Reset forms
          this.resetForgotPasswordForms();

          // Optional: Auto-fill email for login
          this.toastr.info('Please login with your new password', 'Info');
        } else {
          this.toastr.error(response?.message || 'Failed to update password', 'Failed');
        }
      },
      error: (error) => {
        this.isLoading = false;
        const errorMsg = error.error?.message || 'Failed to update password. Please try again.';
        this.toastr.error(errorMsg, 'Error');
        console.error('Reset password error:', error);
      }
    });
  }
}
