import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
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

  isTermsModalOpen: boolean = false; // Add this property
  eventHighlights: string[] = []; // Populate from your data
  eventArtists: any[] = []; // Populate from your data
  isImageModalOpen = false;
  selectedImage = '';
  isSeatModalOpen: boolean = false;
  private isNavigatingAway = false;
  similarEventPrices: Map<number, number | null> = new Map();

  @ViewChild('sidebarCard') sidebarCard!: ElementRef;
  @ViewChild('bookingSidebar') bookingSidebar!: ElementRef;

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
        // this.loadEventSeats(); // Load seats immediately

        // Check if we have navigation state with seat selections
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras.state as {
          seatSelections?: any[],
          totalAmount?: number,
          userId?: string,
          eventTitle?: string
        };

        // Only load seats if we don't have selections from navigation
        // AND we're not navigating away
        if (!state?.seatSelections && !this.isNavigatingAway) {
          this.loadEventSeats();
        }

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
  // loadEventSeats(): void {
  //   this.isSeatLoading = true;

  //   this.apiService.getEventSeatTypes(this.eventId).subscribe({
  //     next: (response) => {
  //       if (response.status === 'Success' && response.data) {
  //         this.seatTypes = response.data;

  //         // Initialize selected seats with 0
  //         // this.seatTypes.forEach((seat) => {
  //         //   this.selectedSeats[seat.event_seat_type_inventory_id] = 0;
  //         // });

  //         // Initialize selected seats with 0
  //         this.resetSeatSelections();

  //         console.log('Seat types loaded:', this.seatTypes);
  //       } else {
  //         console.error('Error loading seat types:', response.message);
  //         this.toastr.error('Failed to load seat types', 'Error');
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error loading event seats:', error);
  //       this.toastr.error('Error loading seat information', 'Error');
  //     },
  //     complete: () => {
  //       this.isSeatLoading = false;
  //     }
  //   });
  // }

  loadEventSeats(): void {
    // Don't reload seats if we're navigating away
    if (this.isNavigatingAway) {
      console.log('Skipping seat load - navigating away');
      return;
    }

    this.isSeatLoading = true;

    this.apiService.getEventSeatTypes(this.eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.seatTypes = response.data;

          // Check if we already have selected seats (from navigation)
          const navigation = this.router.getCurrentNavigation();
          const state = navigation?.extras.state as {
            seatSelections?: any[]
          };

          // Only reset selections if we don't have any from navigation
          if (!state?.seatSelections && !this.isNavigatingAway) {
            this.resetSeatSelections();
          } else {
            console.log('Restoring seat selections from navigation state:', state?.seatSelections);
          }

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

  @HostListener('window:focus')
  onWindowFocus(): void {
    // Reset navigation flag when user comes back to the page
    this.isNavigatingAway = false;
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

  // loadSimilarEvents(): void {
  //   if (!this.eventDetails?.event_category_id) return;

  //   this.isSimilarLoading = true;

  //   const request = {
  //     categoryId: this.eventDetails.event_category_id,
  //     excludeEventId: this.eventId,
  //     count: 4
  //   };

  //   this.apiService.getSimilarEventsByCategory(request).subscribe({
  //     next: (response) => {
  //       if (response.status === 'Success' && response.data) {
  //         this.similarEvents = response.data;
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error loading similar events:', error);
  //     },
  //     complete: () => {
  //       this.isSimilarLoading = false;
  //     }
  //   });
  // }

  // Add this method to get price for similar events
  getSimilarEventPrice(event: UpcomingEventResponse): string {
    // If we already have the price in the map, use it
    if (this.similarEventPrices.has(event.event_id)) {
      const price = this.similarEventPrices.get(event.event_id);
      return price !== null ? `₹${price}` : 'Price not available';
    }

    // If not, load it and return a placeholder
    this.loadSimilarEventPrice(event.event_id);
    return 'Loading...';
  }

  // Add this method to load price for a similar event
  loadSimilarEventPrice(eventId: number): void {
    this.apiService.getEventPriceInRange(eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data !== null) {
          this.similarEventPrices.set(eventId, response.data);
        } else {
          this.similarEventPrices.set(eventId, null);
        }
      },
      error: (error) => {
        console.error(`Error loading price for similar event ${eventId}:`, error);
        this.similarEventPrices.set(eventId, null);
      }
    });
  }

  // Update your loadSimilarEvents method to also load prices
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

          // Load prices for all similar events
          this.similarEvents.forEach(event => {
            this.loadSimilarEventPrice(event.event_id);
          });
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

  // Add this method to handle div clicks for seat selection
  toggleSeatSelectionFromDiv(seatTypeId: number, event: MouseEvent): void {
    // Prevent if clicking on quantity buttons or checkbox
    const target = event.target as HTMLElement;
    if (target.closest('.qty-btn') || target.closest('.checkbox-container') || target.closest('input[type="checkbox"]')) {
      return;
    }

    const seatType = this.seatTypes.find(s => s.event_seat_type_inventory_id === seatTypeId);
    if (!seatType) return;

    // Check if seats are available
    if (seatType.available_seats === 0) {
      this.toastr.warning('No seats available for this type', 'Sold Out');
      return;
    }

    const isCurrentlySelected = this.isSeatSelected(seatTypeId);

    if (!isCurrentlySelected) {
      // Check if we've reached max 10 tickets
      const totalSelected = this.getSelectedSeatCount();
      if (totalSelected >= 10) {
        this.toastr.warning('You can select maximum 10 tickets only', 'Limit Reached');
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

  //   // Save seat selections to sessionStorage (not localStorage)
  //   // sessionStorage clears when tab is closed, which is better for this flow
  //   sessionStorage.setItem('temp_seat_selections', JSON.stringify(this.getSelectedSeatsList().map(item => ({
  //     SeatTypeId: item.seatType.event_seat_type_inventory_id,
  //     Quantity: item.quantity,
  //     SeatName: item.seatType.seat_name,
  //     Price: item.seatType.price
  //   }))));
  //   sessionStorage.setItem('temp_total_amount', this.totalAmount.toString());
  //   sessionStorage.setItem('temp_event_id', this.eventId.toString());
  //   sessionStorage.setItem('temp_event_name', this.eventNameSlug);

  //   // Check if user is logged in
  //   const isLoggedIn = this.authService.isLoggedIn();
  //   console.log('User logged in?', isLoggedIn);

  //   if (isLoggedIn) {
  //     // User is logged in, redirect to payment page
  //     console.log('User logged in - redirecting to payment');
  //     this.navigateToPayment();
  //   } else {
  //     // User not logged in - open auth modal WITHOUT clearing selections
  //     console.log('User not logged in - opening auth modal');

  //     // Simply open the auth modal - selections remain in component state
  //     this.openAuthModal();
  //   }
  // }

  // onBookNow(): void {
  //   // Reset navigation flag when opening modal
  //   this.isNavigatingAway = false;

  //   // REMOVED: Login check - Always open seat selection modal
  //   console.log('Opening seat selection modal');

  //   // Load seats if not already loaded
  //   if (this.seatTypes.length === 0) {
  //     this.loadEventSeats();
  //     setTimeout(() => {
  //       this.openSeatModal();
  //     }, 500);
  //   } else {
  //     this.resetSeatSelections();
  //     this.openSeatModal();
  //   }
  // }

  onBookNow(): void {
    // Add this check at the beginning
    if (!this.hasValidPrice()) {
      this.toastr.warning('This event is sold out', 'Not Available');
      return;
    }

    // Reset navigation flag when opening modal
    this.isNavigatingAway = false;

    console.log('Opening seat selection modal');

    // Load seats if not already loaded
    if (this.seatTypes.length === 0) {
      this.loadEventSeats();
      setTimeout(() => {
        this.openSeatModal();
      }, 500);
    } else {
      this.resetSeatSelections();
      this.openSeatModal();
    }
  }

  resetSeatSelections(): void {
    this.selectedSeats = {};
    this.totalAmount = 0;

    // Initialize all seats with 0 if seatTypes exist
    if (this.seatTypes && this.seatTypes.length > 0) {
      this.seatTypes.forEach((seat) => {
        this.selectedSeats[seat.event_seat_type_inventory_id] = 0;
      });
      console.log('Seat selections reset:', this.selectedSeats);
    } else {
      console.log('No seat types available to reset');
    }
  }

  /**
 * Open seat selection modal for logged-in users
 */
  openSeatModal(): void {
    this.isSeatModalOpen = true;
    document.body.style.overflow = 'hidden';

    // Initialize selected seats if not already done
    if (Object.keys(this.selectedSeats).length === 0 && this.seatTypes.length > 0) {
      this.resetSeatSelections();
    }
  }

  /**
   * Close seat selection modal
   */
  closeSeatModal(): void {
    this.isSeatModalOpen = false;
    document.body.style.overflow = 'auto';
  }

  /**
   * Close modal on backdrop click
   */
  closeSeatModalOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('seat-modal')) {
      this.closeSeatModal();
    }
  }

  /**
   * Proceed to checkout from seat modal
   */
  proceedToCheckout(): void {
    const selectedSeatCount = this.getSelectedSeatCount();

    if (selectedSeatCount === 0) {
      this.toastr.warning('Please select at least one seat', 'Selection Required');
      return;
    }

    if (selectedSeatCount > 10) {
      this.toastr.warning('You can select maximum 10 tickets only', 'Limit Exceeded');
      return;
    }

    console.log('Proceed to Checkout - Seat selections:', this.getSelectedSeatsList());
    console.log('Total amount:', this.totalAmount);

    // Set flag to prevent reset on navigation
    this.isNavigatingAway = true;

    // Get current selections
    const selectedSeatsList = this.getSelectedSeatsList();

    // Save to sessionStorage as backup
    const bookingData = {
      seatSelections: selectedSeatsList.map(item => ({
        SeatTypeId: item.seatType.event_seat_type_inventory_id,
        Quantity: item.quantity,
        SeatName: item.seatType.seat_name,
        Price: item.seatType.price
      })),
      totalAmount: this.totalAmount,
      eventId: this.eventId,
      eventName: this.eventNameSlug,
      timestamp: new Date().getTime()
    };

    sessionStorage.setItem('temp_booking_data', JSON.stringify(bookingData));

    // Close modal
    this.closeSeatModal();

    // Navigate to payment with state
    setTimeout(() => {
      this.router.navigate(['/event-payment', this.eventId, this.eventNameSlug], {
        state: {
          seatSelections: selectedSeatsList.map(item => ({
            SeatTypeId: item.seatType.event_seat_type_inventory_id,
            Quantity: item.quantity,
            SeatName: item.seatType.seat_name,
            Price: item.seatType.price
          })),
          totalAmount: this.totalAmount,
          userId: this.authService.getCurrentUserId(),
          eventTitle: this.eventDetails?.event_name || this.formatEventTitle(this.eventNameSlug)
        }
      });
    }, 100);
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
    if (!this.hasValidPrice()) {
      return 'Sold Out';
    }

    if (this.priceInRange !== null && this.priceInRange > 0) {
      return `₹${this.priceInRange}`;
    }

    if (this.eventDetails?.min_price) {
      return `₹${this.eventDetails.min_price}`;
    }

    return 'Sold Out';
  }

  getPriceRangeDisplay(): string {
    if (!this.hasValidPrice()) return '';

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
    // this.router.navigate(['/auth/sign-up']);
    // window.location.href = 'mailto:support@tickethouse.in';
    window.open('mailto:support@tickethouse.in', '_blank');
  }

  // Add these new methods
  openTermsModal(): void {
    this.isTermsModalOpen = true;
    // Optional: Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  }

  closeTermsModal(): void {
    this.isTermsModalOpen = false;
    // Re-enable body scrolling
    document.body.style.overflow = 'auto';
  }

  closeTermsModalOnBackdrop(event: MouseEvent): void {
    // Close only if clicking on the backdrop (not the modal content)
    if ((event.target as HTMLElement).classList.contains('terms-modal')) {
      this.closeTermsModal();
    }
  }

  // Fixed: Changed parameter type to any to avoid type mismatch
  // @HostListener('document:keydown.escape', ['$event'])
  // onEscapePress(event: any): void {
  //   if (this.isTermsModalOpen) {
  //     this.closeTermsModal();
  //   }
  // }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapePress(event: any): void {
    if (this.isSeatModalOpen) {
      this.closeSeatModal();
    }
    if (this.isTermsModalOpen) {
      this.closeTermsModal();
    }
    if (this.isImageModalOpen) {
      this.closeImageModal();
    }
  }

  // Add these methods
  // openImageModal(imageUrl: string) {
  //   this.selectedImage = imageUrl;
  //   this.isImageModalOpen = true;
  // }

  closeImageModal() {
    this.isImageModalOpen = false;
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

  ngAfterViewInit() {
    this.setupStickySidebar();
  }

  @HostListener('window:resize')
  onResize() {
    this.setupStickySidebar();
  }

  setupStickySidebar() {
    if (window.innerWidth > 1024) {
      const sidebar = this.sidebarCard?.nativeElement;
      const sidebarContainer = this.bookingSidebar?.nativeElement;

      if (sidebar && sidebarContainer) {
        // Set the spacer height to match sidebar height
        const sidebarHeight = sidebar.offsetHeight;
        sidebarContainer.style.setProperty('--sidebar-height', sidebarHeight + 'px');

        // Add CSS rule dynamically
        const style = document.createElement('style');
        style.textContent = `
        .booking-sidebar::before {
          height: var(--sidebar-height, ${sidebarHeight}px) !important;
        }
      `;
        document.head.appendChild(style);
      }
    }
  }

  hasValidPrice(): boolean {
    // Check priceInRange first
    if (this.priceInRange !== null && this.priceInRange > 0) {
      return true;
    }

    // Fallback to eventDetails min_price
    if (this.eventDetails?.min_price && this.eventDetails.min_price > 0) {
      return true;
    }

    // Check if there are any seat types with available seats and price
    if (this.seatTypes && this.seatTypes.length > 0) {
      return this.seatTypes.some(seat =>
        seat.available_seats > 0 && seat.price > 0
      );
    }

    return false;
  }

  /**
 * Check if current event has location URL or coordinates
 */
  hasLocationUrl(): boolean {
    if (!this.eventDetails) return false;
    return !!(this.eventDetails.geo_map_url ||
      (this.eventDetails.latitude && this.eventDetails.longitude) ||
      this.eventDetails.full_address ||
      this.eventDetails.location);
  }

  /**
   * Handle venue location click on event details page
   */
  onVenueLocationClick(event: MouseEvent): void {
    event.stopPropagation();

    if (!this.eventDetails) return;

    const mapUrl = this.getMapUrlFromEventData({
      geo_map_url: this.eventDetails.geo_map_url,
      latitude: this.eventDetails.latitude,
      longitude: this.eventDetails.longitude,
      full_address: this.eventDetails.full_address,
      location: this.eventDetails.location,
      event_name: this.eventDetails.event_name
    });

    if (mapUrl) {
      window.open(mapUrl, '_blank');
    }
  }

  /**
   * Check if similar event has location URL or coordinates
   */
  hasSimilarEventLocationUrl(event: UpcomingEventResponse): boolean {
    return !!(event.geo_map_url ||
      (event.latitude && event.longitude) ||
      event.full_address ||
      event.location);
  }

  /**
   * Handle location click on similar event card
   */
  onSimilarEventLocationClick(event: MouseEvent, eventData: UpcomingEventResponse): void {
    // Stop propagation to prevent triggering the card click
    event.stopPropagation();

    const mapUrl = this.getMapUrlFromEventData({
      geo_map_url: eventData.geo_map_url,
      latitude: eventData.latitude,
      longitude: eventData.longitude,
      full_address: eventData.full_address,
      location: eventData.location,
      event_name: eventData.event_name
    });

    if (mapUrl) {
      window.open(mapUrl, '_blank');
    }
  }

  /**
   * Helper method to generate map URL from event data
   */
  private getMapUrlFromEventData(data: {
    geo_map_url?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    full_address?: string | null;
    location?: string | null;
    event_name?: string | null;
  }): string | null {
    // Priority 1: Use geo_map_url if available
    if (data.geo_map_url) {
      return data.geo_map_url;
    }

    // Priority 2: Use latitude/longitude to create Google Maps URL
    if (data.latitude && data.longitude) {
      return `https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
    }

    // Priority 3: Use full address if available
    if (data.full_address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.full_address)}`;
    }

    // Priority 4: Use location name as fallback
    if (data.location) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.location)}`;
    }

    return null;
  }
}
