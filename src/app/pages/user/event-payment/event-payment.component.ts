import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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
  bookingDetails: any = null;
  userId: string | null = null;
  eventTitle: string = '';
  eventDate: string = '';
  eventTime: string = '';
  eventLocation: string = '';

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
          this.bookingDetails = response.data;
          
          // Show success message
          this.toastr.success('Booking created successfully! Please confirm payment.', 'Booking Created');
          
          // Store booking ID for confirmation
          localStorage.setItem('pending_booking_id', response.data.BookingId.toString());
          localStorage.setItem('pending_booking_user', this.userId!);
          
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

  confirmPayment(): void {
    const bookingId = localStorage.getItem('pending_booking_id');
    const userId = localStorage.getItem('pending_booking_user');
    
    if (!bookingId) {
      this.toastr.error('No pending booking found', 'Error');
      return;
    }

    this.isProcessing = true;

    // Use the appropriate method based on whether userId is needed
    if (userId) {
      // If your backend supports userId, use confirmBookingWithUser
      this.apiService.confirmBookingWithUser(parseInt(bookingId), userId).subscribe({
        next: (response) => {
          this.handlePaymentResponse(response);
        },
        error: (error) => {
          this.handlePaymentError(error);
        }
      });
    } else {
      // Otherwise use the standard method
      this.apiService.confirmBooking(parseInt(bookingId)).subscribe({
        next: (response) => {
          this.handlePaymentResponse(response);
        },
        error: (error) => {
          this.handlePaymentError(error);
        }
      });
    }
  }

  private handlePaymentResponse(response: any): void {
    this.isProcessing = false;
    if (response.status === 'Success' && response.data) {
      // Clear pending booking
      localStorage.removeItem('pending_booking_id');
      localStorage.removeItem('pending_booking_user');
      
      // Show success message
      this.toastr.success('Payment confirmed! Your booking is now active.', 'Booking Confirmed');
      
      // Navigate to booking confirmation page
      this.router.navigate(['/booking-confirmation', response.data.BookingCode]);
    } else {
      this.toastr.error(response.message || 'Failed to confirm payment', 'Error');
    }
  }

  private handlePaymentError(error: any): void {
    this.isProcessing = false;
    console.error('Payment confirmation error:', error);
    this.toastr.error('Error confirming payment. Please try again.', 'Error');
  }

  // Helper method to format the event title for display
  getFormattedEventTitle(): string {
    return this.eventNameSlug
      ? this.eventNameSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : 'Event Details';
  }

  ngOnDestroy(): void {
    // Clean up localStorage when leaving page
    this.clearLocalStorage();
  }
}
