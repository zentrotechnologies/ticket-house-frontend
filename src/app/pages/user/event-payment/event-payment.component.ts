import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginResponse, User, GenerateOTPRequest, VerifyOTPRequest, SignUpRequest, SignUpResponse } from '../../../core/models/auth.model';

@Component({
  selector: 'app-event-payment',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './event-payment.component.html',
  styleUrl: './event-payment.component.css',
})
export class EventPaymentComponent implements OnInit {
  eventId!: number;
  eventNameSlug!: string;
  seatSelections: any[] = [];
  totalAmount: number = 0;
  bookingFee: number = 0;
  finalAmount: number = 0;
  isLoading = false;
  isProcessing = false;
  selectedState: string = 'Maharashtra';
  userId: string | null = null;
  eventTitle: string = '';
  eventDate: string = '';
  eventTime: string = '';
  eventLocation: string = '';

  // Auth properties (from seats-booking)
  isUserLoggedIn = false;
  showAuthModal = false;
  userFirstName: string = '';
  showUserDropdown = false;

  // Login properties
  isLoginMode = true;
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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    public authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.toastr.warning('Please sign in to complete booking', 'Authentication Required');
      this.route.params.subscribe(params => {
        this.eventId = +params['event_id'] || 0;
        this.eventNameSlug = params['event_name'] || '';
        this.router.navigate(['/seats-booking', this.eventId, this.eventNameSlug]);
      });
      return;
    }

    this.userId = this.authService.getCurrentUserId();
    
    this.route.params.subscribe(params => {
      this.eventId = +params['event_id'] || 0;
      this.eventNameSlug = params['event_name'] || '';
      
      // Get data from navigation state
      const navigation = this.router.getCurrentNavigation();
      if (navigation?.extras.state) {
        this.seatSelections = navigation.extras.state['seatSelections'] || [];
        this.totalAmount = navigation.extras.state['totalAmount'] || 0;
        this.userId = navigation.extras.state['userId'] || this.userId;
        this.eventTitle = navigation.extras.state['eventTitle'] || '';
        this.calculateBookingFee();
        
        // Load event details for display
        this.loadEventDetails();
      } else {
        // Try to get data from localStorage if state is missing
        this.restoreFromLocalStorage();
      }
    });
  }

  // Restore seat selections from localStorage if navigation state is lost
  restoreFromLocalStorage(): void {
    const pendingSelections = localStorage.getItem('pending_seat_selections');
    const pendingAmount = localStorage.getItem('pending_total_amount');
    const pendingEventId = localStorage.getItem('pending_event_id');
    const pendingEventName = localStorage.getItem('pending_event_name');
    
    if (pendingSelections && pendingAmount && pendingEventId === this.eventId.toString()) {
      this.seatSelections = JSON.parse(pendingSelections);
      this.totalAmount = parseFloat(pendingAmount);
      this.eventTitle = pendingEventName 
        ? pendingEventName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : '';
      this.calculateBookingFee();
      this.loadEventDetails();
      
      // Clear localStorage after restoring
      this.clearLocalStorage();
    } else {
      // If no state or localStorage data, redirect back to seat selection
      this.toastr.warning('Please select seats first', 'Selection Required');
      this.router.navigate(['/seats-booking', this.eventId, this.eventNameSlug]);
    }
  }

  clearLocalStorage(): void {
    localStorage.removeItem('pending_seat_selections');
    localStorage.removeItem('pending_total_amount');
    localStorage.removeItem('pending_event_id');
    localStorage.removeItem('pending_event_name');
  }

  loadEventDetails(): void {
    this.apiService.getEventDetailsById(this.eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.eventTitle = response.data.event_name || this.eventTitle;
          this.eventDate = response.data.event_date.toString();
          this.eventTime = `${response.data.start_time} - ${response.data.end_time}`;
          this.eventLocation = response.data.location;
        }
      },
      error: (error) => {
        console.error('Error loading event details:', error);
      }
    });
  }

  calculateBookingFee(): void {
    // Calculate 8.26% booking fee
    this.bookingFee = parseFloat((this.totalAmount * 0.0826).toFixed(2));
    this.finalAmount = parseFloat((this.totalAmount + this.bookingFee).toFixed(2));
  }

  getTotalTickets(): number {
    return this.seatSelections.reduce((total, seat) => total + seat.Quantity, 0);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  onProceedToPay(): void {
    if (!this.authService.isLoggedIn()) {
      this.toastr.warning('Please sign in to complete booking', 'Authentication Required');
      this.router.navigate(['/seats-booking', this.eventId, this.eventNameSlug]);
      return;
    }

    if (!this.userId) {
      this.toastr.error('User information not found', 'Error');
      return;
    }

    if (this.seatSelections.length === 0) {
      this.toastr.error('No seats selected', 'Error');
      return;
    }

    this.isProcessing = true;

    const bookingRequest = {
      EventId: this.eventId,
      SeatSelections: this.seatSelections.map(seat => ({
        SeatTypeId: seat.SeatTypeId,
        Quantity: seat.Quantity
      })),
      UserId: this.userId // Include user ID in booking request
    };

    console.log('Creating booking with:', bookingRequest);

    this.apiService.createBooking(bookingRequest).subscribe({
      next: (response) => {
        this.isProcessing = false;
        if (response.status === 'Success' && response.data) {
          // Show success message
          this.toastr.success('Booking created successfully! Redirecting to events...', 'Booking Created');
          
          // Clear all local storage
          this.clearAllLocalStorage();
          
          // Redirect to events listing page after 1.5 seconds (to show toast message)
          setTimeout(() => {
            this.router.navigate(['/events']);
          }, 1500);
          
        } else {
          this.toastr.error(response.message || 'Failed to create booking', 'Error');
        }
      },
      error: (error) => {
        this.isProcessing = false;
        console.error('Booking error:', error);
        this.toastr.error('Error creating booking. Please try again.', 'Error');
      }
    });
  }

  clearAllLocalStorage(): void {
    localStorage.removeItem('pending_seat_selections');
    localStorage.removeItem('pending_total_amount');
    localStorage.removeItem('pending_event_id');
    localStorage.removeItem('pending_event_name');
    localStorage.removeItem('pending_booking_id');
    localStorage.removeItem('pending_booking_user');
  }

  // Helper method to format the event title for display
  getFormattedEventTitle(): string {
    return this.eventNameSlug
      ? this.eventNameSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : 'Event Details';
  }

  // ===========================================
  // HEADER AUTH METHODS (From seats-booking)
  // ===========================================

  // Get current user name for display
  getUserDisplayName(): string {
    return this.userFirstName || 'User';
  }

  toggleDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;

    if (this.showUserDropdown) {
      // Close dropdown when clicking outside
      setTimeout(() => {
        document.addEventListener('click', this.closeDropdownOnClickOutside.bind(this));
      });
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
    this.toastr.info('My bookings page coming soon!', 'Info');
  }

  onLogout(): void {
    this.showUserDropdown = false;

    // Clear any pending selections
    this.clearAllLocalStorage();

    // Call auth service logout
    this.authService.logout();

    // Update component state
    this.isUserLoggedIn = false;
    this.userFirstName = '';
    this.userId = null;

    // Show success message
    this.toastr.success('Logged out successfully!', 'Success');

    // Reset selected seats
    this.seatSelections = [];
    this.totalAmount = 0;
    this.bookingFee = 0;
    this.finalAmount = 0;

    // Redirect to events page
    this.router.navigate(['/events']);
  }

  onSignIn(): void {
    this.showAuthModal = true;
    this.resetAuthForms();
  }

  // ===========================================
  // AUTH MODAL METHODS (From seats-booking)
  // ===========================================

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

  // Login Method
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

        if (response.response.status === 'Success') {
          // Save user data
          this.saveUserData(response);

          // Update auth status
          this.isUserLoggedIn = true;
          this.userFirstName = response.first_name;
          this.userId = response.user_id;

          // Close modal
          this.showAuthModal = false;
          this.toastr.success('Logged in successfully!', 'Success');

          // Reset auth forms
          this.resetAuthForms();
        } else {
          this.toastr.error(response.response.message, 'Login Failed');
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.toastr.error('Login failed. Please check your credentials and try again.', 'Error');
      },
    });
  }

  // Save user data to localStorage and AuthService
  private saveUserData(loginResponse: LoginResponse): void {
    localStorage.setItem('jwt_token', loginResponse.token);
    localStorage.setItem('refresh_token', loginResponse.refresh_token);
    localStorage.setItem('token_expiry', loginResponse.token_expiry);
    localStorage.setItem('refresh_token_expiry', loginResponse.refresh_token_expiry);

    // Save user info
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

    // Update auth service
    this.authService.setcurrentUser(userData);
  }

  // Signup Step 1: Account Details
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

    // Generate OTP for email verification
    const otpRequest: GenerateOTPRequest = {
      contact_type: 'email',
      email: this.signupEmail,
      newUser: true,
    };

    this.apiService.GenerateOTP(otpRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.response.status === 'Success') {
          this.currentOtpId = response.validationotp_id;
          this.signupStep = 2;
          this.startOtpTimer(120); // 2 minutes
          this.toastr.success('OTP sent to your email', 'Success');
        } else {
          this.toastr.error(response.response.message, 'OTP Failed');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Failed to send OTP. Please try again.', 'Error');
      },
    });
  }

  // OTP Methods
  onOtpInput(event: any, index: number): void {
    const input = event.target;
    const value = input.value;

    // Only allow digits
    if (!/^\d*$/.test(value)) {
      input.value = '';
      this.otpDigits[index] = '';
      return;
    }

    this.otpDigits[index] = value;

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.querySelectorAll('.otp-digit')[index + 1] as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onOtpKeyDown(event: any, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = document.querySelectorAll('.otp-digit')[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
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
      if (this.otpTimer <= 0) {
        this.clearOtpTimer();
      }
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
        if (response.response.status === 'Success') {
          this.currentOtpId = response.validationotp_id;
          this.startOtpTimer(120);
          this.toastr.success('New OTP sent to your email', 'Success');
        } else {
          this.toastr.error(response.response.message, 'Resend Failed');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Failed to resend OTP', 'Error');
      },
    });
  }

  // Verify OTP and Complete Signup
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
          // OTP verified, now create the user account
          this.completeSignup();
        } else {
          this.toastr.error(response.message, 'OTP Verification Failed');
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.toastr.error('OTP verification failed', 'Error');
        this.isLoading = false;
      },
    });
  }

  // Complete Signup - Create user account
  completeSignup(): void {
    // Prepare signup data
    const signUpData: SignUpRequest = {
      first_name: this.signupFirstName,
      last_name: this.signupLastName,
      email: this.signupEmail,
      password: this.signupPassword,
      role_id: 3, // Always set role_id = 3 for audience

      // Optional fields
      mobile: this.signupPhone || undefined,
      country_code: this.signupPhone ? this.signupCountryCode : undefined,
    };

    this.apiService.UserSignUp(signUpData).subscribe({
      next: (response: SignUpResponse) => {
        if (response.response.status === 'Success') {
          // Auto-login after successful signup
          this.autoLoginAfterSignup();
        } else {
          this.toastr.error(response.response.message, 'Signup Failed');
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.toastr.error('Account creation failed. Please try again.', 'Error');
        this.isLoading = false;
      },
    });
  }

  // Auto login after successful signup
  private autoLoginAfterSignup(): void {
    const loginReq = {
      email: this.signupEmail,
      password: this.signupPassword,
    };

    this.apiService.UserLogin(loginReq).subscribe({
      next: (response: any) => {
        this.isLoading = false;

        if (response.response.status === 'Success') {
          // Save user data
          this.saveUserData(response);

          // Update auth status
          this.isUserLoggedIn = true;
          this.userFirstName = response.first_name;
          this.userId = response.user_id;

          // Close modal
          this.showAuthModal = false;
          this.toastr.success('Account created and logged in successfully!', 'Success');

          // Reset auth forms
          this.resetAuthForms();
        } else {
          // If auto-login fails, show success message and switch to login
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
      },
    });
  }

  goBackToStep1(): void {
    this.signupStep = 1;
    this.clearOtpTimer();
  }

  // Helper Methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  ngOnDestroy(): void {
    // Clean up localStorage when leaving page
    this.clearAllLocalStorage();
  }
}
