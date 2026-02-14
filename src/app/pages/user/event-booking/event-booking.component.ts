import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventCategoryModel, EventDetailsModel, EventSeatTypeInventoryModel, UpcomingEventResponse } from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';
import { DateworkerService } from '../../../core/services/dateworker.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-event-booking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-booking.component.html',
  styleUrl: './event-booking.component.css',
})
export class EventBookingComponent implements OnInit {
  eventId!: number;
  eventNameSlug!: string;
  eventDetails: EventDetailsModel | null = null;
  eventCategories: EventCategoryModel[] = [];
  similarEvents: UpcomingEventResponse[] = [];

  // Seat selection properties (from seats-booking)
  seatTypes: EventSeatTypeInventoryModel[] = [];
  selectedSeats: { [key: number]: number } = {}; // seatTypeId -> quantity
  totalAmount: number = 0;
  isSeatLoading = false;

  // Loading states
  isLoading = true;
  isSimilarLoading = false;
  priceInRange: number | null = null;
  isPriceLoading = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private apiService: ApiService,
    private dateWorker: DateworkerService,
    private authService: AuthService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.eventId = +params['event_id'] || 0;
      this.eventNameSlug = params['event_name'] || '';

      if (this.eventId > 0) {
        this.loadEventDetails();
        this.loadEventSeats(); // Load seats immediately
        this.loadEventCategories();
      } else {
        this.router.navigate(['/events']);
      }
    });
  }

  loadEventDetails(): void {
    this.isLoading = true;

    this.apiService.getEventDetailsById(this.eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.eventDetails = response.data;
          this.loadPriceInRange();

          if (this.eventDetails.event_category_id) {
            this.loadSimilarEvents();
          }
        } else {
          console.error('Event not found:', response.message);
          this.router.navigate(['/events']);
        }
      },
      error: (error) => {
        console.error('Error loading event details:', error);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // Load event seats (from seats-booking component)
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

          console.log('Seat types loaded:', this.seatTypes);
        } else {
          console.error('Error loading seat types:', response.message);
          this.toastr.error('Failed to load seat types', 'Error');
        }
      },
      error: (error) => {
        console.error('Error loading event seats:', error);
        this.toastr.error('Error loading seat information', 'Error');
      },
      complete: () => {
        this.isSeatLoading = false;
      }
    });
  }

  loadPriceInRange(): void {
    if (!this.eventId) return;

    this.isPriceLoading = true;

    this.apiService.getEventPriceInRange(this.eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data !== null) {
          this.priceInRange = response.data;
        } else {
          this.priceInRange = null;
        }
      },
      error: (error) => {
        console.error('Error loading price in range:', error);
        this.priceInRange = null;
      },
      complete: () => {
        this.isPriceLoading = false;
      }
    });
  }

  loadEventCategories(): void {
    this.apiService.getAllEventCategories().subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.eventCategories = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading event categories:', error);
      }
    });
  }

  loadSimilarEvents(): void {
    if (!this.eventDetails?.event_category_id) return;

    this.isSimilarLoading = true;

    const request = {
      categoryId: this.eventDetails.event_category_id,
      excludeEventId: this.eventId,
      count: 4
    };

    this.apiService.getSimilarEventsByCategory(request).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.similarEvents = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading similar events:', error);
      },
      complete: () => {
        this.isSimilarLoading = false;
      }
    });
  }

  // ===========================================
  // SEAT SELECTION METHODS (from seats-booking)
  // ===========================================

  toggleSeatSelection(seatTypeId: number, event: any): void {
    const isChecked = event.target.checked;
    const seatType = this.seatTypes.find(s => s.event_seat_type_inventory_id === seatTypeId);

    if (!seatType) return;

    if (isChecked) {
      // Check if we've reached max 10 tickets
      const totalSelected = this.getSelectedSeatCount();
      if (totalSelected >= 10) {
        this.toastr.warning('You can select maximum 10 tickets only', 'Limit Reached');
        event.target.checked = false;
        return;
      }

      // Check if seats are available
      if (seatType.available_seats === 0) {
        this.toastr.warning('No seats available for this type', 'Sold Out');
        event.target.checked = false;
        return;
      }

      // Select with default quantity 1
      this.selectedSeats[seatTypeId] = 1;
      console.log(`Selected seat: ${seatType.seat_name} with quantity 1`);
    } else {
      // Unselect - set quantity to 0
      this.selectedSeats[seatTypeId] = 0;
      console.log(`Unselected seat: ${seatType.seat_name}`);
    }

    this.calculateTotalAmount();
  }

  isSeatSelected(seatTypeId: number): boolean {
    return this.selectedSeats[seatTypeId] > 0;
  }

  increaseSeats(seatTypeId: number): void {
    const seatType = this.seatTypes.find((s) => s.event_seat_type_inventory_id === seatTypeId);
    if (!seatType) return;

    // Check total tickets limit (max 10)
    const totalSelected = this.getSelectedSeatCount();
    if (totalSelected >= 10) {
      this.toastr.warning('You can select maximum 10 tickets only', 'Limit Reached');
      return;
    }

    // Check available seats for this type
    if (this.selectedSeats[seatTypeId] < seatType.available_seats) {
      this.selectedSeats[seatTypeId]++;
      console.log(`Increased ${seatType.seat_name} to ${this.selectedSeats[seatTypeId]}`);
      this.calculateTotalAmount();
    } else {
      this.toastr.warning(`Only ${seatType.available_seats} seats available`, 'Limit Reached');
    }
  }

  decreaseSeats(seatTypeId: number): void {
    if (this.selectedSeats[seatTypeId] > 0) {
      this.selectedSeats[seatTypeId]--;
      console.log(`Decreased to ${this.selectedSeats[seatTypeId]}`);
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

    console.log('Total amount calculated:', this.totalAmount);
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

  hasSelectedSeats(): boolean {
    return this.getSelectedSeatCount() > 0;
  }

  // ===========================================
  // BOOK NOW METHOD (with auth check)
  // ===========================================

  // onBookNow(): void {
  //   const selectedSeatCount = this.getSelectedSeatCount();

  //   if (selectedSeatCount === 0) {
  //     this.toastr.warning('Please select at least one seat', 'Selection Required');
  //     return;
  //   }

  //   if (selectedSeatCount > 10) {
  //     this.toastr.warning('You can select maximum 10 tickets only', 'Limit Exceeded');
  //     return;
  //   }

  //   console.log('Book Now clicked - Seat selections:', this.getSelectedSeatsList());
  //   console.log('Total amount:', this.totalAmount);

  //   // Save seat selections to localStorage
  //   this.saveSeatSelections();

  //   // Check if user is logged in
  //   const isLoggedIn = this.authService.isLoggedIn();
  //   console.log('User logged in?', isLoggedIn);

  //   if (isLoggedIn) {
  //     // User is logged in, redirect to payment page
  //     console.log('User logged in - redirecting to payment');
  //     this.navigateToPayment();
  //   } else {
  //     // User not logged in - show message and store for after login
  //     console.log('User not logged in - showing toast');
  //     this.toastr.warning('Please sign in to continue with booking', 'Authentication Required');

  //     // Store booking data for after login
  //     localStorage.setItem('pending_booking_action', 'proceed_to_payment');
  //     localStorage.setItem('pending_event_id', this.eventId.toString());
  //     localStorage.setItem('pending_event_name', this.eventNameSlug);

  //     // Store seat selections for after login
  //     localStorage.setItem('pending_seat_selections', JSON.stringify(this.getSelectedSeatsList().map(item => ({
  //       SeatTypeId: item.seatType.event_seat_type_inventory_id,
  //       Quantity: item.quantity,
  //       SeatName: item.seatType.seat_name,
  //       Price: item.seatType.price
  //     }))));
  //     localStorage.setItem('pending_total_amount', this.totalAmount.toString());

  //     // Navigate to login with return URL
  //     this.router.navigate(['/auth/login'], { 
  //       queryParams: { 
  //         returnUrl: `/event-payment/${this.eventId}/${this.eventNameSlug}`,
  //         fromBooking: 'true'
  //       } 
  //     });
  //   }
  // }

  // In event-booking.component.ts - Replace the onBookNow method

  // In event-booking.component.ts - Replace the onBookNow method with this simpler version

onBookNow(): void {
  const selectedSeatCount = this.getSelectedSeatCount();

  if (selectedSeatCount === 0) {
    this.toastr.warning('Please select at least one seat', 'Selection Required');
    return;
  }

  if (selectedSeatCount > 10) {
    this.toastr.warning('You can select maximum 10 tickets only', 'Limit Exceeded');
    return;
  }

  console.log('Book Now clicked - Seat selections:', this.getSelectedSeatsList());
  console.log('Total amount:', this.totalAmount);

  // Save seat selections to sessionStorage (not localStorage)
  // sessionStorage clears when tab is closed, which is better for this flow
  sessionStorage.setItem('temp_seat_selections', JSON.stringify(this.getSelectedSeatsList().map(item => ({
    SeatTypeId: item.seatType.event_seat_type_inventory_id,
    Quantity: item.quantity,
    SeatName: item.seatType.seat_name,
    Price: item.seatType.price
  }))));
  sessionStorage.setItem('temp_total_amount', this.totalAmount.toString());
  sessionStorage.setItem('temp_event_id', this.eventId.toString());
  sessionStorage.setItem('temp_event_name', this.eventNameSlug);

  // Check if user is logged in
  const isLoggedIn = this.authService.isLoggedIn();
  console.log('User logged in?', isLoggedIn);

  if (isLoggedIn) {
    // User is logged in, redirect to payment page
    console.log('User logged in - redirecting to payment');
    this.navigateToPayment();
  } else {
    // User not logged in - open auth modal WITHOUT clearing selections
    console.log('User not logged in - opening auth modal');
    
    // Simply open the auth modal - selections remain in component state
    this.openAuthModal();
  }
}

// Method to open auth modal
private openAuthModal(): void {
  // Dispatch a simple event to open the modal
  window.dispatchEvent(new CustomEvent('openAuthModal'));
}

// Navigate to payment page - use selections from component state, not sessionStorage
private navigateToPayment(): void {
  const seatSelections = this.getSelectedSeatsList().map((item) => ({
    SeatTypeId: item.seatType.event_seat_type_inventory_id,
    Quantity: item.quantity,
    SeatName: item.seatType.seat_name,
    Price: item.seatType.price
  }));

  const userId = this.authService.getCurrentUserId();

  console.log('Navigating to payment with current selections:', seatSelections);

  // Navigate to payment page with state
  this.router.navigate(['/event-payment', this.eventId, this.eventNameSlug], {
    state: {
      seatSelections: seatSelections,
      totalAmount: this.totalAmount,
      userId: userId,
      eventTitle: this.eventDetails?.event_name || this.formatEventTitle(this.eventNameSlug)
    },
  });
}

  // Save seat selections to localStorage
  private saveSeatSelections(): void {
    const seatSelections = this.getSelectedSeatsList().map((item) => ({
      SeatTypeId: item.seatType.event_seat_type_inventory_id,
      Quantity: item.quantity,
      SeatName: item.seatType.seat_name,
      Price: item.seatType.price
    }));

    localStorage.setItem('pending_seat_selections', JSON.stringify(seatSelections));
    localStorage.setItem('pending_total_amount', this.totalAmount.toString());
    localStorage.setItem('pending_event_id', this.eventId.toString());
    localStorage.setItem('pending_event_name', this.eventNameSlug);

    console.log('Seat selections saved to localStorage:', seatSelections);
  }

  // Navigate to payment page
  // private navigateToPayment(): void {
  //   const seatSelections = this.getSelectedSeatsList().map((item) => ({
  //     SeatTypeId: item.seatType.event_seat_type_inventory_id,
  //     Quantity: item.quantity,
  //     SeatName: item.seatType.seat_name,
  //     Price: item.seatType.price
  //   }));

  //   const userId = this.authService.getCurrentUserId();

  //   console.log('Navigating to payment with:', {
  //     seatSelections,
  //     totalAmount: this.totalAmount,
  //     userId
  //   });

  //   // Navigate to payment page with state
  //   this.router.navigate(['/event-payment', this.eventId, this.eventNameSlug], {
  //     state: {
  //       seatSelections: seatSelections,
  //       totalAmount: this.totalAmount,
  //       userId: userId,
  //       eventTitle: this.eventDetails?.event_name || this.formatEventTitle(this.eventNameSlug)
  //     },
  //   });
  // }

  // ===========================================
  // EXISTING METHODS (from original)
  // ===========================================

  getEventCategoryName(): string {
    if (!this.eventDetails) return '';

    if (this.eventDetails.event_category_name) {
      return this.eventDetails.event_category_name;
    }

    if (this.eventDetails.event_category_id && this.eventCategories.length > 0) {
      const category = this.eventCategories.find(
        cat => cat.event_category_id === this.eventDetails!.event_category_id
      );
      return category ? category.event_category_name : '';
    }

    return '';
  }

  formatDisplayDate(dateString: string | Date | undefined | null): string {
    if (!dateString) return 'Date not specified';
    try {
      const result = this.dateWorker.formatDateAndTime(dateString.toString());
      return result.date;
    } catch (error) {
      return 'Invalid date';
    }
  }

  getDisplayPrice(): string {
    if (this.priceInRange !== null && this.priceInRange > 0) {
      return `₹${this.priceInRange}`;
    }

    if (this.eventDetails?.min_price) {
      return `₹${this.eventDetails.min_price}`;
    }

    return 'Free';
  }

  getPriceRangeDisplay(): string {
    if (this.priceInRange !== null) return '';

    if (!this.eventDetails?.max_price || !this.eventDetails?.min_price) return '';

    if (this.eventDetails.max_price > this.eventDetails.min_price) {
      return ` - ₹${this.eventDetails.max_price}`;
    }

    return '';
  }

  formatTimeForDisplay(timeString: string | undefined | null): string {
    if (!timeString) return 'Time not specified';

    if (timeString.includes('AM') || timeString.includes('PM') || timeString.includes(':')) {
      return timeString;
    }

    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
      return timeString;
    }
  }

  formatDuration(minutes: number | null | undefined): string {
    if (!minutes || minutes <= 0) return 'Duration not specified';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  }

  onSimilarEventClick(event: UpcomingEventResponse): void {
    const eventNameSlug = this.createSlug(event.event_name);
    this.router.navigate(['/event-booking', event.event_id, eventNameSlug]);
    window.scrollTo(0, 0);
  }

  private createSlug(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  private formatEventTitle(slug: string): string {
    return slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  onSignIn() {
    this.router.navigate(['/auth/login']);
  }

  openImageModal(imageUrl: string): void {
    if (!imageUrl) return;
    console.log('Open image modal:', imageUrl);
  }

  navigateToSignUp(): void {
    this.router.navigate(['/auth/sign-up']);
  }
}
