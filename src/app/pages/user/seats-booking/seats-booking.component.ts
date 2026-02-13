import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  EventDetailsModel,
  EventSeatTypeInventoryModel,
  GenerateOTPRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
  User,
  VerifyOTPRequest,
} from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-seats-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './seats-booking.component.html',
  styleUrl: './seats-booking.component.css',
})
export class SeatsBookingComponent implements OnInit {
  eventId!: number;
  eventNameSlug!: string;
  eventDetails: EventDetailsModel | null = null;
  seatTypes: EventSeatTypeInventoryModel[] = [];
  selectedSeats: { [key: number]: number } = {}; // seatTypeId -> quantity
  totalAmount: number = 0;
  isLoading = false;
  isSeatLoading = false;

  // Auth properties
  isUserLoggedIn = false;
  showAuthModal = false;
  userFirstName: string = '';
  currentUserId: string | null = null;

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

  showUserDropdown = false;
  dropdownClickInside = false;

  // Store seat selection for later use
  private pendingSeatSelections: any[] = [];
  private pendingTotalAmount: number = 0;
  private isProceedClicked = false; // Track if Proceed was clicked

  // Store seat selection for later use
  private authSubscription: Subscription = new Subscription()

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();

    this.route.params.subscribe((params) => {
      this.eventId = +params['event_id'] || 0;
      this.eventNameSlug = params['event_name'] || '';

      if (this.eventId > 0) {
        this.loadEventSeats();
      } else {
        this.router.navigate(['/events']);
      }
    });
  }

  checkAuthStatus(): void {
    this.isUserLoggedIn = this.authService.isLoggedIn();
    if (this.isUserLoggedIn) {
      this.currentUserId = this.authService.getCurrentUserId();
      this.authService.currentUser$.subscribe((user) => {
        if (user) {
          this.userFirstName = user.first_name;
        }
      });
    }
  }

  loadEventSeats(): void {
    this.isSeatLoading = true;

    this.apiService.getEventSeatTypes(this.eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.seatTypes = response.data;

          // Initialize selected seats with 0
          this.seatTypes.forEach((seat) => {
            this.selectedSeats[seat.event_seat_type_inventory_id] = 0;
          });
        } else {
          console.error('Error loading seat types:', response.message);
          this.toastr.error('Failed to load seat types', 'Error');
        }
      },
      error: (error) => {
        console.error('Error loading event seats:', error);
        this.toastr.error('Error loading seat information', 'Error');
        this.isSeatLoading = false;
      },
      complete: () => {
        this.isSeatLoading = false;
      },
    });
  }

  increaseSeats(seatTypeId: number): void {
    const seatType = this.seatTypes.find((s) => s.event_seat_type_inventory_id === seatTypeId);
    if (!seatType) return;

    if (this.selectedSeats[seatTypeId] < seatType.available_seats) {
      this.selectedSeats[seatTypeId]++;
      this.calculateTotalAmount();
    } else {
      this.toastr.warning(`Only ${seatType.available_seats} seats available`, 'Limit Reached');
    }
  }

  decreaseSeats(seatTypeId: number): void {
    if (this.selectedSeats[seatTypeId] > 0) {
      this.selectedSeats[seatTypeId]--;
      this.calculateTotalAmount();
    }
  }

  calculateTotalAmount(): void {
    this.totalAmount = 0;

    for (const [seatTypeId, quantity] of Object.entries(this.selectedSeats)) {
      if (quantity > 0) {
        const seatType = this.seatTypes.find(
          (s) => s.event_seat_type_inventory_id === parseInt(seatTypeId)
        );
        if (seatType) {
          this.totalAmount += seatType.price * quantity;
        }
      }
    }
  }

  getSelectedSeatCount(): number {
    return Object.values(this.selectedSeats).reduce((sum, quantity) => sum + quantity, 0);
  }

  getSelectedSeatsList(): { seatType: EventSeatTypeInventoryModel; quantity: number }[] {
    const selectedList = [];

    for (const [seatTypeId, quantity] of Object.entries(this.selectedSeats)) {
      if (quantity > 0) {
        const seatType = this.seatTypes.find(
          (s) => s.event_seat_type_inventory_id === parseInt(seatTypeId)
        );
        if (seatType) {
          selectedList.push({ seatType, quantity });
        }
      }
    }

    return selectedList;
  }

  // FIXED: onProceed method with proper auth handling
  onProceed(): void {
    const selectedSeatCount = this.getSelectedSeatCount();

    if (selectedSeatCount === 0) {
      this.toastr.warning('Please select at least one seat', 'Selection Required');
      return;
    }

    if (selectedSeatCount > 10) {
      this.toastr.warning('You can select maximum 10 tickets only', 'Limit Exceeded');
      return;
    }

    // Save seat selections first
    this.savePendingSeatSelections();
    
    // Set flag to indicate Proceed was clicked
    this.isProceedClicked = true;

    // if (this.isUserLoggedIn) {
    //   // User is logged in, proceed directly to payment
    //   this.navigateToPayment();
    // } else {
    //   // User not logged in, show auth modal
    //   this.showAuthModal = true;
    //   this.resetAuthForms();
      
    //   // Pre-fill email from seat selections if available
    //   if (this.loginEmail) {
    //     this.signupEmail = this.loginEmail;
    //   }
    // }

    // CRITICAL FIX: Always check the CURRENT auth state from the service
    const isLoggedIn = this.authService.isLoggedIn();
    
    if (isLoggedIn) {
      // User is logged in, proceed to payment
      this.navigateToPayment();
    } else {
      // User is NOT logged in - show toast and let header handle login
      this.toastr.warning('Please sign in to continue with booking', 'Authentication Required');
      
      // Store the fact that user wants to proceed after login
      localStorage.setItem('pending_booking_action', 'proceed_to_payment');
      localStorage.setItem('pending_event_id', this.eventId.toString());
      localStorage.setItem('pending_event_name', this.eventNameSlug);
      
      // Trigger the header's sign-in modal by emitting an event or using a service
      // For now, we'll just show the toast and let user click Sign In button in header
    }
  }

  // Save seat selections for later use
  private savePendingSeatSelections(): void {
    this.pendingSeatSelections = this.getSelectedSeatsList().map((item) => ({
      SeatTypeId: item.seatType.event_seat_type_inventory_id,
      Quantity: item.quantity,
      SeatName: item.seatType.seat_name,
      Price: item.seatType.price
    }));
    this.pendingTotalAmount = this.totalAmount;
    
    // Also save to localStorage as backup
    localStorage.setItem('pending_seat_selections', JSON.stringify(this.pendingSeatSelections));
    localStorage.setItem('pending_total_amount', this.pendingTotalAmount.toString());
    localStorage.setItem('pending_event_id', this.eventId.toString());
    localStorage.setItem('pending_event_name', this.eventNameSlug);
  }

  // Navigate to payment page with seat selections
  private navigateToPayment(): void {
    const seatSelections = this.getSelectedSeatsList().map((item) => ({
      SeatTypeId: item.seatType.event_seat_type_inventory_id,
      Quantity: item.quantity,
      SeatName: item.seatType.seat_name,
      Price: item.seatType.price
    }));

    // Get current user ID
    const userId = this.authService.getCurrentUserId();

    // Navigate to payment page with seat selections and user ID
    this.router.navigate(['/event-payment', this.eventId, this.eventNameSlug], {
      state: {
        seatSelections: seatSelections,
        totalAmount: this.totalAmount,
        userId: userId,
        eventTitle: this.getEventTitle()
      },
    });
  }

  // ===========================================
  // AUTHENTICATION METHODS (WITHIN COMPONENT)
  // ===========================================

  onCloseAuthModal(): void {
    this.showAuthModal = false;
    this.resetAuthForms();
    this.isProceedClicked = false;
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

  // Login Method - UPDATED to redirect after login
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
          this.currentUserId = response.user_id;

          // Close modal
          this.showAuthModal = false;
          this.toastr.success('Logged in successfully!', 'Success');

          // If Proceed was clicked before login, navigate to payment
          if (this.isProceedClicked) {
            setTimeout(() => {
              this.navigateToPayment();
            }, 500);
          }

          // Reset auth forms
          this.resetAuthForms();
          this.isProceedClicked = false;
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

  // Verify OTP and Complete Signup - FIXED to redirect
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

  // Complete Signup - Create user account - UPDATED to redirect
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

  // Auto login after successful signup - UPDATED to redirect
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
          this.currentUserId = response.user_id;

          // Close modal
          this.showAuthModal = false;
          this.toastr.success('Account created and logged in successfully!', 'Success');

          // If Proceed was clicked, navigate to payment
          if (this.isProceedClicked) {
            setTimeout(() => {
              this.navigateToPayment();
            }, 500);
          }

          // Reset auth forms
          this.resetAuthForms();
          this.isProceedClicked = false;
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

  // Handle header sign in button
  onSignIn(): void {
    this.showAuthModal = true;
    this.resetAuthForms();
    this.isProceedClicked = false;
  }

  getEventTitle(): string {
    return this.eventNameSlug
      ? this.eventNameSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      : 'Event Details';
  }

  hasSelectedSeats(): boolean {
    return this.getSelectedSeatCount() > 0;
  }

  // Get current user name for display
  getUserDisplayName(): string {
    return this.userFirstName || 'User';
  }

  // Add these methods to your component
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
    // Navigate to profile page
    // this.router.navigate(['/profile']);
    this.toastr.info('Profile page coming soon!', 'Info');
  }

  onViewBookings(): void {
    this.showUserDropdown = false;
    // Navigate to bookings page
    // this.router.navigate(['/my-bookings']);
    this.toastr.info('My bookings page coming soon!', 'Info');
  }

  onLogout(): void {
    this.showUserDropdown = false;

    // Clear any pending selections
    this.clearPendingSelections();

    // Call auth service logout
    this.authService.logout();

    // Update component state
    this.isUserLoggedIn = false;
    this.userFirstName = '';
    this.currentUserId = null;

    // Show success message
    this.toastr.success('Logged out successfully!', 'Success');

    // Reset selected seats
    this.selectedSeats = {};
    this.totalAmount = 0;
  }

  // Clear pending selections from localStorage
  private clearPendingSelections(): void {
    localStorage.removeItem('pending_seat_selections');
    localStorage.removeItem('pending_total_amount');
    localStorage.removeItem('pending_event_id');
    localStorage.removeItem('pending_event_name');
  }

  // Clean up event listener when component is destroyed
  // ngOnDestroy(): void {
  //   document.removeEventListener('click', this.closeDropdownOnClickOutside.bind(this));
  //   this.clearOtpTimer();
  // }

  // Clean up
  ngOnDestroy(): void {
    // Don't clear pending selections here - they're needed after login
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
