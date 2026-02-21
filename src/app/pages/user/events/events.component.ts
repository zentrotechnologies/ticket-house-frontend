import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ArtistResponse, BannerManagementModel, BannerResponse, GenerateOTPRequest, LoginResponse, ShowsByArtistsResponse, SignUpRequest, SignUpResponse, TestimonialResponse, TestimonialsResponse, UpcomingEventResponse, UpcomingEventsResponse, User, VerifyOTPRequest } from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css',
})
export class EventsComponent implements OnInit {
  upcomingEvents: UpcomingEventResponse[] = [];
  artists: ArtistResponse[] = [];
  testimonials: TestimonialResponse[] = [];
  currentTestimonialIndex = 0;

  isLoadingEvents = false;
  isLoadingArtists = false;
  isLoadingTestimonials = false;

  sectionTitle = 'Coming This Week';

  // Auth properties
  isUserLoggedIn = false;
  currentUserId: string | null = null;
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
  isLoading = false;
  eventPrices: Map<number, number | null> = new Map();

  // Add these new properties for banners
  banners: BannerManagementModel[] = [];
  isLoadingBanners = false;
  currentBannerIndex = 0;
  bannerInterval: any;

  private userSubscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadBanners(); // Load banners first
    this.loadUpcomingEvents();
    this.loadArtists();
    this.loadTestimonials();
  }

  // Add this new method to load banners
  loadBanners(): void {
    this.isLoadingBanners = true;

    this.apiService.getAllBanners().subscribe({
      next: (response: BannerResponse) => {
        if (response.status === 'Success' && response.data) {
          // Filter only active banners
          this.banners = response.data.filter(banner => banner.active === 1);

          // Start carousel if there are banners
          if (this.banners.length > 1) {
            this.startBannerCarousel();
          }
        } else {
          this.banners = [];
        }
      },
      error: (error) => {
        console.error('Error loading banners:', error);
        this.banners = [];
      },
      complete: () => {
        this.isLoadingBanners = false;
      }
    });
  }

  // Add carousel control methods
  startBannerCarousel(): void {
    if (this.bannerInterval) {
      clearInterval(this.bannerInterval);
    }

    this.bannerInterval = setInterval(() => {
      this.nextBanner();
    }, 5000); // Change banner every 5 seconds
  }

  nextBanner(): void {
    if (this.banners.length > 0) {
      this.currentBannerIndex = (this.currentBannerIndex + 1) % this.banners.length;
    }
  }

  prevBanner(): void {
    if (this.banners.length > 0) {
      this.currentBannerIndex = (this.currentBannerIndex - 1 + this.banners.length) % this.banners.length;
    }
  }

  goToBanner(index: number): void {
    this.currentBannerIndex = index;
  }

  getCurrentBanner(): BannerManagementModel | null {
    return this.banners.length > 0 ? this.banners[this.currentBannerIndex] : null;
  }

  // Helper method to safely get banner image URL
  getBannerImageUrl(banner: BannerManagementModel): string {
    if (!banner || !banner.banner_img) {
      return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=60&w=1500'; // Fallback image
    }

    // If the banner_img is already a full data URL, use it directly
    if (banner.banner_img.startsWith('data:image/')) {
      return banner.banner_img;
    }

    // If it's just base64 data, prepend the data URL prefix
    // You might need to detect the image type - assuming JPEG here
    return `data:image/jpeg;base64,${banner.banner_img}`;
  }

  // Handle banner click
  onBannerClick(banner: BannerManagementModel): void {
    if (banner.action_link_url) {
      // If it's a full URL, open in new tab
      if (banner.action_link_url.startsWith('http')) {
        window.open(banner.action_link_url, '_blank');
      } else {
        // Otherwise, navigate within the app
        this.router.navigate([banner.action_link_url]);
      }
    }
  }

  // loadUpcomingEvents(): void {
  //   this.isLoadingEvents = true;

  //   const request = {
  //     Count: 8,
  //     IncludeLaterEvents: true
  //   };

  //   this.apiService.getUpcomingEvents(request).subscribe({
  //     next: (response: UpcomingEventsResponse) => {
  //       if (response.status === 'Success' && response.data) {
  //         this.upcomingEvents = response.data;

  //         // Update section title based on number of events
  //         if (this.upcomingEvents.length === 0) {
  //           this.sectionTitle = 'No Upcoming Events';
  //         } else if (this.upcomingEvents.length < 3) {
  //           this.sectionTitle = 'Upcoming Events';
  //         }
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error loading upcoming events:', error);
  //     },
  //     complete: () => {
  //       this.isLoadingEvents = false;
  //     }
  //   });
  // }

  loadUpcomingEvents(): void {
    this.isLoadingEvents = true;

    this.apiService.getUpcomingEventsDefault().subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.upcomingEvents = response.data;

          // Load price for each event
          this.upcomingEvents.forEach(event => {
            this.loadEventPrice(event.event_id);
          });
        } else {
          this.upcomingEvents = [];
        }
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.isLoadingEvents = false;
      },
      complete: () => {
        this.isLoadingEvents = false;
      }
    });
  }

  // Add this method to load price for an event by ID
  loadEventPrice(eventId: number): void {
    this.apiService.getEventPriceInRange(eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data !== null) {
          this.eventPrices.set(eventId, response.data);
        } else {
          this.eventPrices.set(eventId, null);
        }
      },
      error: (error) => {
        console.error(`Error loading price for event ${eventId}:`, error);
        this.eventPrices.set(eventId, null);
      }
    });
  }

  // Add this method to get price for an event
  getEventPrice(event: UpcomingEventResponse): number | null {
    return this.eventPrices.get(event.event_id) ?? null;
  }

  loadArtists(): void {
    this.isLoadingArtists = true;

    const request = {
      Count: 5
    };

    this.apiService.getShowsByArtists(request).subscribe({
      next: (response: ShowsByArtistsResponse) => {
        if (response.status === 'Success' && response.data) {
          this.artists = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading artists:', error);
      },
      complete: () => {
        this.isLoadingArtists = false;
      }
    });
  }

  loadTestimonials(): void {
    this.isLoadingTestimonials = true;

    this.apiService.getTestimonialsByArtists().subscribe({
      next: (response: TestimonialsResponse) => {
        if (response.status === 'Success' && response.data) {
          this.testimonials = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading testimonials:', error);
      },
      complete: () => {
        this.isLoadingTestimonials = false;
      }
    });
  }

  nextTestimonial(): void {
    if (this.testimonials.length > 0) {
      this.currentTestimonialIndex =
        (this.currentTestimonialIndex + 1) % this.testimonials.length;
    }
  }

  prevTestimonial(): void {
    if (this.testimonials.length > 0) {
      this.currentTestimonialIndex =
        (this.currentTestimonialIndex - 1 + this.testimonials.length) % this.testimonials.length;
    }
  }

  getCurrentTestimonial(): TestimonialResponse | null {
    return this.testimonials.length > 0
      ? this.testimonials[this.currentTestimonialIndex]
      : null;
  }

  /* Helper method for date formatting in component */
  formatDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // Add the missing viewAllEvents method
  viewAllEvents(): void {
    // Navigate to a dedicated events listing page or show all events
    this.router.navigate(['/events/all']);

    // OR if you want to implement a modal/dialog to show all events
    // this.showAllEventsModal();
  }

  // Optional: Method to show more events in a modal
  showAllEventsModal(): void {
    // You can implement a modal/dialog to show all events
    console.log('Show all events modal');
  }

  // Add click handler for event cards
  onEventClick(event: UpcomingEventResponse): void {
    // Create URL-friendly event name
    const eventNameSlug = this.createSlug(event.event_name);

    // Navigate to event-booking with event_id and event_name in route
    this.router.navigate(['/event-booking', event.event_id, eventNameSlug]);

    // Alternative: Using query params
    // this.router.navigate(['/event-booking'], {
    //   queryParams: { 
    //     event_id: event.event_id,
    //     event_name: eventNameSlug 
    //   }
    // });
  }

  // Helper method to create URL slug
  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/--+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  // Optional: Format date for display
  formatEventDate(dateString: string | Date): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }

  // Check authentication status
  checkAuthStatus(): void {
    this.isUserLoggedIn = this.authService.isLoggedIn();
    if (this.isUserLoggedIn) {
      this.currentUserId = this.authService.getCurrentUserId();

      // Subscribe to user changes
      this.userSubscription = this.authService.currentUser$.subscribe((user) => {
        if (user) {
          this.userFirstName = user.first_name;
          this.currentUserId = user.user_id;
        }
      });
    }
  }

  onSignIn() {
    this.showAuthModal = true;
    this.resetAuthForms();
  }

  // ===========================================
  // AUTHENTICATION METHODS
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
          this.currentUserId = response.user_id;

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
          this.currentUserId = response.user_id;

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

    if (!this.currentUserId) {
      this.toastr.error('User information not found. Please login again.', 'Error');
      return;
    }

    // Navigate to My Bookings page with user_id in the route
    this.router.navigate(['/my-bookings', this.currentUserId]);
  }

  onLogout(): void {
    this.showUserDropdown = false;

    // Call auth service logout
    this.authService.logout();

    // Update component state
    this.isUserLoggedIn = false;
    this.userFirstName = '';
    this.currentUserId = null;

    // Show success message
    this.toastr.success('Logged out successfully!', 'Success');
  }

  navigateToSignUp(): void {
    // this.router.navigate(['/auth/sign-up']);
    // window.location.href = 'mailto:support@tickethouse.in';
    window.open('mailto:support@tickethouse.in', '_blank');
  }

  openPrivacyPolicy(): void {
    // Open privacy policy in a new tab
    const url = this.router.createUrlTree(['/privacy-policy']).toString();
    window.open(url, '_blank');
  }

  openTermsConditions(): void {
    // Open terms & conditions in a new tab
    const url = this.router.createUrlTree(['/terms-conditions']).toString();
    window.open(url, '_blank');
  }

  openRefundPolicy(): void {
    // Open refund policy in a new tab
    const url = this.router.createUrlTree(['/refund-policy']).toString();
    window.open(url, '_blank');
  }

  /**
 * Check if event has a valid map URL or coordinates
 */
  hasLocationUrl(event: UpcomingEventResponse): boolean {
    return !!(event.geo_map_url || (event.latitude && event.longitude));
  }

  /**
   * Handle location click - open map in new tab
   */
  onLocationClick(event: MouseEvent, eventData: UpcomingEventResponse): void {
    // Stop propagation to prevent triggering the card click
    event.stopPropagation();

    let mapUrl = '';

    // Priority 1: Use geo_map_url if available
    if (eventData.geo_map_url) {
      mapUrl = eventData.geo_map_url;
    }
    // Priority 2: Use latitude/longitude to create Google Maps URL
    else if (eventData.latitude && eventData.longitude) {
      mapUrl = `https://www.google.com/maps?q=${eventData.latitude},${eventData.longitude}`;
    }
    // Priority 3: Use full address if available
    else if (eventData.full_address) {
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventData.full_address)}`;
    }
    // Priority 4: Use location name as fallback
    else if (eventData.location) {
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventData.location)}`;
    }

    // Open in new tab if we have a URL
    if (mapUrl) {
      window.open(mapUrl, '_blank');
    }
  }

  /**
   * Alternative: Open in Google Maps app on mobile
   */
  onLocationClickMobile(event: MouseEvent, eventData: UpcomingEventResponse): void {
    event.stopPropagation();

    let mapUrl = '';

    if (eventData.geo_map_url) {
      mapUrl = eventData.geo_map_url;
    } else if (eventData.latitude && eventData.longitude) {
      // For mobile, use geo: URI scheme
      mapUrl = `geo:${eventData.latitude},${eventData.longitude}?q=${eventData.latitude},${eventData.longitude}(${encodeURIComponent(eventData.event_name)})`;
    } else if (eventData.full_address) {
      mapUrl = `https://maps.apple.com/?q=${encodeURIComponent(eventData.full_address)}`;
    } else if (eventData.location) {
      mapUrl = `https://maps.apple.com/?q=${encodeURIComponent(eventData.location)}`;
    }

    if (mapUrl) {
      window.open(mapUrl, '_blank');
    }
  }

  // Clean up event listener when component is destroyed
  ngOnDestroy(): void {
    if (this.bannerInterval) {
      clearInterval(this.bannerInterval);
    }

    document.removeEventListener('click', this.closeDropdownOnClickOutside.bind(this));
    this.clearOtpTimer();
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
