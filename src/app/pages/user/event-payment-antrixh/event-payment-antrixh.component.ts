import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  LoginResponse,
  User,
  GenerateOTPRequest,
  VerifyOTPRequest,
  SignUpRequest,
  SignUpResponse,
} from '../../../core/models/auth.model';
import { BookingSuccessModalComponent } from '../booking-success-modal/booking-success-modal.component';
import { AntrixhLoaderComponent } from '../../../layout/antrixh-loader/antrixh-loader.component';

interface SeatSelection {
  SeatTypeId: number;
  SeatName?: string;
  Price?: number;
  Quantity: number;
}

interface CouponResult {
  is_applied: boolean;
  coupon_code: string;
  coupon_name?: string;
  discount_value: number;
  message: string;
}

interface PersistedPaymentData {
  seatSelections: SeatSelection[];
  totalAmount: number;
  eventId: number;
  eventNameSlug?: string;
  eventName?: string;
  eventTitle?: string;
  timestamp: number;
}

interface RazorpayOrderData {
  keyId?: string;
  KeyId?: string;
  amount: number;
  currency?: string;
  companyName?: string;
  orderId: string;
  bookingId: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: Record<string, string>;
}

@Component({
  selector: 'app-event-payment-antrixh',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BookingSuccessModalComponent, AntrixhLoaderComponent],
  templateUrl: './event-payment-antrixh.component.html',
  styleUrl: './event-payment-antrixh.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventPaymentAntrixhComponent implements OnInit {
  eventId!: number;
  eventNameSlug!: string;
  seatSelections: SeatSelection[] = [];
  totalAmount: number = 0;
  finalAmount: number = 0;
  isLoading = false;
  isProcessing = false;
  isPageLoading = true;
  selectedState: string = 'Maharashtra';
  userId: string | null = null;
  eventTitle: string = '';
  eventDate: string = '';
  eventTime: string = '';
  eventLocation: string = '';
  convenienceFee: number = 0;
  cgstAmount: number = 0;
  sgstAmount: number = 0;
  gstTotal: number = 0;
  bookingId: number | null = null;

  // Auth properties (from seats-booking)
  isUserLoggedIn = false;
  showAuthModal = false;
  userFirstName: string = '';

  // Login properties
  isLoginMode = true;
  loginEmail: string = '';
  loginPassword: string = '';

  // Signup properties
  signupStep = 1;
  signupFirstName: string = '';
  signupEmail: string = '';
  signupPassword: string = '';
  signupPhone: string = '';
  signupCountryCode: string = '+91';

  // OTP properties
  showOTPVerification = false;
  otpDigits: string[] = ['', '', '', ''];
  currentOtpId: number | null = null;
  otpTimer = 0;
  otpInterval: ReturnType<typeof setInterval> | null = null;

  // QR Code Success Modal Properties
  showSuccessModal = false;
  qrCodeBase64: string = '';
  thankYouMessage: string = '';
  bookingDetails: unknown = null;
  bookingCode: string = '';
  showProcessingModal = false;
  convenienceFeePercentage: number = 0;
  couponResult: CouponResult | null = null;
  isCheckingCoupon = false;
  showFeeBreakup: boolean = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    public authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.eventId = +params['event_id'] || 0;
      this.eventNameSlug = params['event_name'] || '';

      // FIRST: Check sessionStorage for persisted data (this will survive refresh)
      const persistedData = this.loadFromSessionStorage();

      if (persistedData) {
        this.seatSelections = persistedData.seatSelections;
        this.totalAmount = persistedData.totalAmount;
        this.eventTitle = persistedData.eventTitle || '';

        this.calculateBookingFee();
        this.loadEventDetails();
        this.checkForBestCoupon();
      }
      // SECOND: Try to get data from navigation state (new navigation)
      else {
        const navigation = this.router.getCurrentNavigation();
        if (navigation?.extras.state) {
          this.seatSelections = navigation.extras.state['seatSelections'] || [];
          this.totalAmount = navigation.extras.state['totalAmount'] || 0;
          this.userId = navigation.extras.state['userId'] || this.userId;
          this.eventTitle = navigation.extras.state['eventTitle'] || '';

          if (this.seatSelections.length > 0) {
            // Save to sessionStorage for refresh persistence
            this.persistToSessionStorage();
            this.calculateBookingFee();
            this.loadEventDetails();
            // Call coupon check after loading event details
            setTimeout(() => {
              this.checkForBestCoupon();
            }, 500);

            this.clearSessionStorage();
          }
        }
      }

      // If still no selections, try other storage methods
      if (!this.seatSelections.length) {
        this.restoreFromSessionStorage();
      }

      this.cdr.markForCheck();
    });

    // Check if we have pending booking data after login
    this.checkPendingBookingAfterLogin();
  }

  private persistToSessionStorage(): void {
    const dataToPersist: PersistedPaymentData = {
      seatSelections: this.seatSelections,
      totalAmount: this.totalAmount,
      eventId: this.eventId,
      eventNameSlug: this.eventNameSlug,
      eventTitle: this.eventTitle,
      timestamp: new Date().getTime()
    };

    sessionStorage.setItem('payment_page_data', JSON.stringify(dataToPersist));
  }

  private loadFromSessionStorage(): PersistedPaymentData | null {
    const persistedData = sessionStorage.getItem('payment_page_data');

    if (persistedData) {
      try {
        const data: PersistedPaymentData = JSON.parse(persistedData);

        // Check if data is for this event (within last 30 minutes)
        const now = new Date().getTime();
        const THIRTY_MINUTES = 30 * 60 * 1000;

        if (data.eventId === this.eventId && (now - data.timestamp) < THIRTY_MINUTES) {
          return data;
        } else {
          sessionStorage.removeItem('payment_page_data');
        }
      } catch {
        sessionStorage.removeItem('payment_page_data');
      }
    }

    return null;
  }

  private checkPendingBookingAfterLogin(): void {
    const pendingData = sessionStorage.getItem('pending_payment_booking');

    if (pendingData) {
      try {
        const bookingData: PersistedPaymentData = JSON.parse(pendingData);

        // Check if data is for this event
        if (bookingData.eventId === this.eventId) {
          this.seatSelections = bookingData.seatSelections;
          this.totalAmount = bookingData.totalAmount;
          this.eventTitle = bookingData.eventTitle || this.eventTitle;

          this.calculateBookingFee();
          this.loadEventDetails();

          // Clear after restoring
          sessionStorage.removeItem('pending_payment_booking');

          // Show success message
          this.toastr.success('Welcome back! You can now complete your booking.', 'Logged In');
        }
      } catch {
        sessionStorage.removeItem('pending_payment_booking');
      }
    }
  }

  restoreFromSessionStorage(): void {
    // First check for persisted payment page data
    const persistedData = this.loadFromSessionStorage();

    if (persistedData) {
      this.seatSelections = persistedData.seatSelections;
      this.totalAmount = persistedData.totalAmount;
      this.eventTitle = persistedData.eventTitle || '';

      this.calculateBookingFee();
      this.loadEventDetails();
      return;
    }

    // Check for temp_booking_data (from seat selection)
    const tempData = sessionStorage.getItem('temp_booking_data');

    if (tempData) {
      try {
        const bookingData: PersistedPaymentData = JSON.parse(tempData);

        // Check if data is for this event
        if (bookingData.eventId === this.eventId && bookingData.seatSelections?.length > 0) {
          this.seatSelections = bookingData.seatSelections;
          this.totalAmount = bookingData.totalAmount;
          this.eventTitle = bookingData.eventName
            ? bookingData.eventName
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (l: string) => l.toUpperCase())
            : '';

          // Also persist for refresh protection
          this.persistToSessionStorage();
          this.calculateBookingFee();
          this.loadEventDetails();

          // Clear after restoring
          sessionStorage.removeItem('temp_booking_data');
          return;
        }
      } catch {
        sessionStorage.removeItem('temp_booking_data');
      }
    }

    // If no data found, redirect
    if (!this.seatSelections.length) {
      this.toastr.warning('Please select seats first', 'Selection Required');
      this.router.navigate(['/event-booking', this.eventId, this.eventNameSlug]);
    }
  }

  clearSessionStorage(): void {
    sessionStorage.removeItem('temp_seat_selections');
    sessionStorage.removeItem('temp_total_amount');
    sessionStorage.removeItem('temp_event_id');
    sessionStorage.removeItem('temp_event_name');
  }

  loadEventDetails(): void {
    this.apiService.getEventDetailsById(this.eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.eventTitle = response.data.event_name || this.eventTitle;
          this.eventDate = response.data.event_date.toString();
          this.eventTime = `${response.data.start_time} - ${response.data.end_time}`;
          this.eventLocation = response.data.location;

          // Capture the convenience fee percentage from API response
          if (response.data.convenience_fee !== undefined && response.data.convenience_fee !== null) {
            this.convenienceFeePercentage = response.data.convenience_fee;
          } else {
            this.convenienceFeePercentage = 6; // Default to 6%
          }

          this.calculateBookingFee();
          this.checkForBestCoupon();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        // Set default fee on error
        this.convenienceFeePercentage = 6;
        this.calculateBookingFee();
        this.checkForBestCoupon();
        this.cdr.markForCheck();
      },
      complete: () => {
        this.isPageLoading = false;
        this.cdr.markForCheck();
      },
    });
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
      day: 'numeric',
    });
  }

  onProceedToPay(): void {
    // Check if user is logged in when clicking Proceed to Pay
    if (!this.authService.isLoggedIn()) {
      this.toastr.warning('Please sign in to complete booking', 'Authentication Required');

      // Save current booking data to restore after login
      this.saveBookingDataForAfterLogin();

      // Open the auth modal directly
      this.showAuthModal = true;
      this.isLoginMode = false;
      this.resetAuthForms();

      // Also dispatch custom event as backup
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('openAuthModal', {
            detail: { returnUrl: `/event-payment-antrixh/${this.eventId}/${this.eventNameSlug}` },
          }),
        );
      }, 100);

      this.cdr.markForCheck();
      return;
    }

    // User is logged in - proceed with payment
    if (this.seatSelections.length === 0) {
      this.toastr.error('No seats selected', 'Error');
      return;
    }

    this.isProcessing = true;

    // Create booking request WITH coupon data if applied - send empty string instead of null
    const bookingWithPaymentRequest = {
      EventId: this.eventId,
      SeatSelections: this.seatSelections.map((seat) => ({
        SeatTypeId: seat.SeatTypeId,
        Quantity: seat.Quantity,
      })),
      CouponCode: this.couponResult?.is_applied ? this.couponResult.coupon_code : "",
      DiscountAmount: this.couponResult?.is_applied ? this.couponResult.discount_value : 0
    };

    this.apiService.createBookingWithPayment(bookingWithPaymentRequest).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          // Initialize Razorpay payment
          this.initiateRazorpayPayment(response.data);

          if ((window as any).fbq) {
            (window as any).fbq('track', 'InitiateCheckout', {
              value: this.finalAmount,
              currency: 'INR',
              content_name: this.eventTitle,
              content_ids: [this.eventId],
              num_items: this.getTotalTickets(),
              content_type: 'product'
            });
          }
        } else {
          this.isProcessing = false;
          this.toastr.error(response.message || 'Failed to create booking with payment', 'Error');
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isProcessing = false;
        // Show more detailed error message
        if (error.error?.errors) {
          const errorMsg = Object.values(error.error.errors).join(', ');
          this.toastr.error(errorMsg, 'Validation Error');
        } else {
          this.toastr.error('Error creating booking with payment. Please try again.', 'Error');
        }
        this.cdr.markForCheck();
      },
    });
  }

  private saveBookingDataForAfterLogin(): void {
    // Save current seat selections to sessionStorage
    if (this.seatSelections.length > 0) {
      const bookingData: PersistedPaymentData = {
        seatSelections: this.seatSelections,
        totalAmount: this.totalAmount,
        eventId: this.eventId,
        eventName: this.eventNameSlug,
        eventTitle: this.eventTitle,
        timestamp: new Date().getTime(),
      };

      sessionStorage.setItem('pending_payment_booking', JSON.stringify(bookingData));

      // Also persist for refresh protection
      this.persistToSessionStorage();
    }
  }

  initiateRazorpayPayment(orderData: RazorpayOrderData): void {
    // Check if Razorpay is available
    if (typeof (window as any).Razorpay === 'undefined') {
      this.isProcessing = false;
      this.toastr.error('Payment gateway not loaded. Please refresh the page.', 'Error');
      return;
    }

    const razorpayKey = orderData.keyId || orderData.KeyId || '';

    if (!razorpayKey) {
      this.isProcessing = false;
      this.toastr.error('Payment key is missing', 'Error');
      return;
    }

    const options = {
      key: razorpayKey,
      amount: Math.round(orderData.amount * 100),
      currency: orderData.currency || 'INR',
      name: orderData.companyName || 'TicketHouse',
      description: `Payment for ${this.eventTitle}`,
      order_id: orderData.orderId,
      image: 'https://tickethouse.in/assets/th_transparent_logo.png',
      handler: (response: any) => {
        this.verifyPayment(response, orderData.bookingId);
      },
      prefill: {
        name: orderData.customerName,
        email: orderData.customerEmail,
        contact: orderData.customerPhone || '',
      },
      notes: orderData.notes,

      theme: {
        color: '#9234ea',
      },

      modal: {
        ondismiss: () => {
          this.isProcessing = false;
          this.toastr.info('Payment cancelled', 'Info');
          this.cdr.markForCheck();
        },
        escape: true,
        backdropclose: true,
        redirect: true,
      },

      // Method configuration for better UX
      method: {
        upi: {
          flow: 'qr',
        },
      },

      retry: {
        enabled: true,
        max_count: 3,
      },

      timeout: 300,
    };

    try {
      const RazorpayInstance = (window as any).Razorpay;
      const rzp = new RazorpayInstance(options);

      rzp.on('payment.failed', (response: any) => {
        this.toastr.error(response.error.description || 'Payment failed', 'Error');
      });

      rzp.open();
    } catch {
      this.isProcessing = false;
      this.toastr.error('Failed to initialize payment gateway', 'Error');
      this.cdr.markForCheck();
    }
  }

  verifyPayment(paymentResponse: any, bookingId: number): void {
    const verifyRequest = {
      BookingId: bookingId,
      RazorpayOrderId: paymentResponse.razorpay_order_id,
      RazorpayPaymentId: paymentResponse.razorpay_payment_id,
      RazorpaySignature: paymentResponse.razorpay_signature,
    };

    this.apiService.verifyPayment(verifyRequest).subscribe({
      next: (response) => {
        if (response.status === 'Success') {
          this.toastr.success('Payment successful! Booking confirmed.', 'Success');

          // Store booking ID for QR generation
          this.bookingId = bookingId;

          // Show processing modal while generating QR
          this.showProcessingModal = true;

          // Show QR code modal directly
          this.showQRCodeModal(bookingId);
        } else {
          this.toastr.error(response.message || 'Payment verification failed', 'Error');
          this.isProcessing = false;

          setTimeout(() => {
            this.router.navigate(['/my-bookings']);
          }, 1500);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isProcessing = false;
        this.toastr.error('Payment verification failed. Please contact support.', 'Error');

        // Still try to show QR code if payment was successful
        if (bookingId) {
          this.showQRCodeModal(bookingId);
        } else {
          setTimeout(() => {
            this.router.navigate(['/my-bookings']);
          }, 1500);
        }
        this.cdr.markForCheck();
      },
    });
  }

  showQRCodeModal(bookingId: number): void {
    this.isProcessing = false;

    // Check if user is still logged in
    if (!this.authService.isLoggedIn()) {
      this.toastr.error('Session expired. Please login again.', 'Authentication Error');
      this.showProcessingModal = false;
      this.router.navigate(['/login']);
      return;
    }

    this.apiService.confirmBookingWithQR(bookingId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.qrCodeBase64 = response.data.qrCodeBase64;
          this.thankYouMessage = response.data.thankYouMessage;
          this.bookingDetails = response.data.bookingDetails;
          this.bookingCode = response.data.bookingCode || response.data.BookingCode || '';

          // Clear all local storage
          this.clearAllLocalStorage();

          // Use timeout to ensure view updates
          setTimeout(() => {
            this.showProcessingModal = false;
            this.showSuccessModal = true;
            this.toastr.success('Booking confirmed! Your QR code is ready.', 'Success');
            this.cdr.markForCheck();
          }, 100);
        } else {
          this.showProcessingModal = false;
          this.toastr.success(
            'Payment successful! Please check your bookings for ticket.',
            'Success',
          );
          this.clearAllLocalStorage();

          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.showProcessingModal = false;

        // Even if QR generation fails, payment was successful
        this.toastr.success(
          'Payment successful! Please check your bookings for ticket.',
          'Success',
        );
        this.clearAllLocalStorage();

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
        this.cdr.markForCheck();
      },
    });
  }

  onSuccessModalClose(): void {
    this.showProcessingModal = false;
    this.showSuccessModal = false;
    this.router.navigate(['/']);
  }

  clearAllLocalStorage(): void {
    localStorage.removeItem('pending_seat_selections');
    localStorage.removeItem('pending_total_amount');
    localStorage.removeItem('pending_event_id');
    localStorage.removeItem('pending_event_name');
    localStorage.removeItem('pending_booking_id');
    localStorage.removeItem('pending_booking_user');

    // Clear sessionStorage payment page data
    sessionStorage.removeItem('payment_page_data');
    sessionStorage.removeItem('pending_payment_booking');
    sessionStorage.removeItem('temp_booking_data');
  }

  // ===========================================
  // AUTH MODAL METHODS (From seats-booking)
  // ===========================================

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
    this.signupFirstName = '';
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Login failed. Please check your credentials and try again.', 'Error');
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Failed to send OTP. Please try again.', 'Error');
        this.cdr.markForCheck();
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
      this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Failed to resend OTP', 'Error');
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastr.error('OTP verification failed', 'Error');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // Complete Signup - Create user account
  completeSignup(): void {
    // Prepare signup data
    const signUpData: SignUpRequest = {
      first_name: this.signupFirstName,
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastr.error('Account creation failed. Please try again.', 'Error');
        this.isLoading = false;
        this.cdr.markForCheck();
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
  }

  // Helper Methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toggleFeeBreakup(): void {
    this.showFeeBreakup = !this.showFeeBreakup;
  }

  // Check for best coupon
  checkForBestCoupon(): void {
    if (!this.eventId || this.seatSelections.length === 0) {
      return;
    }

    this.isCheckingCoupon = true;

    // Calculate total seats
    const totalSeats = this.getTotalTickets();

    const feePercentage = this.convenienceFeePercentage > 0
      ? this.convenienceFeePercentage / 100
      : 0.00;

    const calculatedConvenienceFee = this.totalAmount * feePercentage;
    const calculatedGstTotal = calculatedConvenienceFee * 0.18; // 18% GST
    const calculatedFinalAmount = this.totalAmount + calculatedConvenienceFee + calculatedGstTotal;

    const checkRequest = {
      event_id: this.eventId,
      seat_selections: this.seatSelections.map(seat => ({
        SeatTypeId: seat.SeatTypeId,
        Quantity: seat.Quantity
      })),
      ticket_base_price: this.totalAmount / totalSeats,
      total_seats: totalSeats,
      subtotal: this.totalAmount,
      convenience_fee: calculatedConvenienceFee,
      gst_amount: calculatedGstTotal,
      final_amount: calculatedFinalAmount
    };

    this.apiService.checkAndApplyBestCoupon(checkRequest).subscribe({
      next: (response) => {
        this.isCheckingCoupon = false;

        if (response.status === 'Success' && response.data?.is_applied) {
          this.couponResult = response.data;

          // Update the displayed amounts
          this.updateAmountsWithCoupon();
        } else {
          this.couponResult = null;
          this.updateAmountsWithCoupon(); // Recalculate without coupon
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isCheckingCoupon = false;
        this.couponResult = null;
        this.cdr.markForCheck();
      }
    });
  }

  calculateBookingFee(): void {
    // Use dynamic convenience fee percentage from API, default to 0 if not available
    const feePercentage = this.convenienceFeePercentage > 0
      ? this.convenienceFeePercentage / 100
      : 0.00;

    // Calculate convenience fee based on subtotal
    this.convenienceFee = this.totalAmount * feePercentage;

    // Calculate GST on convenience fee only (18%)
    this.gstTotal = this.convenienceFee * 0.18;
    this.cgstAmount = this.gstTotal / 2;
    this.sgstAmount = this.gstTotal / 2;

    // Calculate final amount BEFORE coupon (subtotal + fees)
    const amountBeforeCoupon = this.totalAmount + this.convenienceFee + this.gstTotal;

    // If coupon applied, subtract discount from the amount with fees
    if (this.couponResult?.is_applied) {
      this.finalAmount = amountBeforeCoupon - this.couponResult.discount_value;
    } else {
      this.finalAmount = amountBeforeCoupon;
    }
  }

  // Update amounts with coupon
  updateAmountsWithCoupon(): void {
    // Recalculate fees first (based on subtotal)
    const feePercentage = this.convenienceFeePercentage > 0
      ? this.convenienceFeePercentage / 100
      : 0.00;

    this.convenienceFee = this.totalAmount * feePercentage;
    this.gstTotal = this.convenienceFee * 0.18;
    this.cgstAmount = this.gstTotal / 2;
    this.sgstAmount = this.gstTotal / 2;

    const amountBeforeCoupon = this.totalAmount + this.convenienceFee + this.gstTotal;

    if (this.couponResult?.is_applied) {
      this.finalAmount = amountBeforeCoupon - this.couponResult.discount_value;
    } else {
      this.finalAmount = amountBeforeCoupon;
    }
  }

  ngOnDestroy(): void {
    this.clearOtpTimer();
    // Clean up localStorage when leaving page
    this.clearAllLocalStorage();
    this.showProcessingModal = false;
  }
}
