import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BookingHistoryRequest, BookingHistoryResponse, BookingResponse, BookingSeatHistoryResponse, PagedBookingHistoryResponse } from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-bookings',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.css',
})
export class MyBookingsComponent implements OnInit {
  userId: string | null = null;
  bookings: BookingHistoryResponse[] = [];
  isLoading = false;
  isUserLoggedIn = false;
  
  // Pagination properties
  currentPage = 1;
  pageSize = 6;
  totalPages = 0;
  totalCount = 0;
  hasPrevious = false;
  hasNext = false;
  pageSizeOptions = [6, 10, 25, 50];
  
  // Filter properties
  filterText = '';

  showQRModal = false;
  selectedQRCode: string = '';
  selectedBookingCode: string = '';
  selectedEventName: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    this.isUserLoggedIn = this.authService.isLoggedIn();
    
    if (!this.isUserLoggedIn) {
      this.toastr.warning('Please login to view your bookings', 'Authentication Required');
      this.router.navigate(['/events']);
      return;
    }

    // Get user_id from route parameter
    this.route.params.subscribe(params => {
      this.userId = params['user_id'];
      
      if (!this.userId) {
        // If no user_id in route, get from auth service
        this.userId = this.authService.getCurrentUserId();
        
        if (!this.userId) {
          this.toastr.error('User information not found', 'Error');
          this.router.navigate(['/events']);
          return;
        }
        
        // Redirect to proper URL with user_id
        this.router.navigate(['/my-bookings', this.userId]);
        return;
      }
      
      // Load bookings with pagination
      this.loadBookings();
    });
  }

  loadBookings(): void {
    if (!this.userId) return;
    
    this.isLoading = true;
    
    const request: BookingHistoryRequest = {
      userId: this.userId,
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      filterText: this.filterText || undefined,
      sortBy: 'created_on',
      sortDirection: 'desc'
    };
    
    this.apiService.getPagedBookingHistoryByUserId(request).subscribe({
      next: (response: PagedBookingHistoryResponse) => {
        if (response.status === 'Success' || response.status === 'success') {
          this.bookings = response.data || [];
          this.totalCount = response.totalCount || 0;
          this.totalPages = response.totalPages || 0;
          this.currentPage = response.currentPage || 1;
          this.pageSize = response.pageSize || 10;
          this.hasPrevious = response.hasPrevious || false;
          this.hasNext = response.hasNext || false;
        } else {
          this.toastr.error(response.message || 'Failed to load bookings', 'Error');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.toastr.error('An error occurred while loading bookings', 'Error');
        this.isLoading = false;
      }
    });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadBookings();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadBookings();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadBookings();
  }

  clearSearch(): void {
    this.filterText = '';
    this.onSearch();
  }

  onBackToEvents(): void {
    this.router.navigate(['/events']);
  }

  viewBookingDetails(bookingId: number): void {
    this.router.navigate(['/booking-details', bookingId]);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    if (!timeString) return 'N/A';
    // Handle TimeSpan format (HH:mm:ss)
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0]);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    }
    return timeString;
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending_payment':
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'captured':
        return 'payment-success';
      case 'created':
      case 'pending':
        return 'payment-pending';
      case 'failed':
        return 'payment-failed';
      default:
        return 'payment-default';
    }
  }

  // Add this method to your component class
  getPaymentMethodClass(paymentMethod: string | null): string {
    if (!paymentMethod) return 'payment-not-paid';
    
    switch (paymentMethod?.toLowerCase()) {
      case 'netbanking':
        return 'payment-netbanking';
      case 'upi':
        return 'payment-upi';
      case 'card':
      case 'credit_card':
      case 'debit_card':
        return 'payment-card';
      case 'wallet':
        return 'payment-wallet';
      default:
        return 'payment-other';
    }
  }

  // Optional: Add a method to format payment method display
  formatPaymentMethod(paymentMethod: string | null): string {
    if (!paymentMethod) return 'Not Paid';
    
    switch (paymentMethod?.toLowerCase()) {
      case 'netbanking':
        return 'Net Banking';
      case 'upi':
        return 'UPI';
      case 'card':
      case 'credit_card':
        return 'Credit Card';
      case 'debit_card':
        return 'Debit Card';
      case 'wallet':
        return 'Wallet';
      default:
        // Capitalize first letter
        return paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);
    }
  }

  // Helper methods for template calculations
  getBookingTotalTickets(booking: BookingHistoryResponse): number {
    if (!booking.seats) return 0;
    return booking.seats.reduce((sum: number, seat: BookingSeatHistoryResponse) => sum + seat.quantity, 0);
  }

  getBookingScannedTickets(booking: BookingHistoryResponse): number {
    if (!booking.seats) return 0;
    return booking.seats.reduce((sum: number, seat: BookingSeatHistoryResponse) => sum + seat.scanned_quantity, 0);
  }

  getBookingRemainingTickets(booking: BookingHistoryResponse): number {
    if (!booking.seats) return 0;
    return booking.seats.reduce((sum: number, seat: BookingSeatHistoryResponse) => sum + seat.remaining_quantity, 0);
  }

  getTotalTickets(): number {
    return this.bookings.reduce((total: number, booking: BookingHistoryResponse) => {
      return total + this.getBookingTotalTickets(booking);
    }, 0);
  }

  getTotalScanned(): number {
    return this.bookings.reduce((total: number, booking: BookingHistoryResponse) => {
      return total + this.getBookingScannedTickets(booking);
    }, 0);
  }

  getTotalRemaining(): number {
    return this.bookings.reduce((total: number, booking: BookingHistoryResponse) => {
      return total + this.getBookingRemainingTickets(booking);
    }, 0);
  }

  // Add method to show QR code modal
  showQRCodeModal(booking: BookingHistoryResponse): void {
    this.selectedQRCode = booking.qr_code;
    this.selectedBookingCode = booking.booking_code;
    this.selectedEventName = booking.event_name;
    this.showQRModal = true;
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  }

  // Add method to close QR modal
  closeQRModal(): void {
    this.showQRModal = false;
    this.selectedQRCode = '';
    this.selectedBookingCode = '';
    this.selectedEventName = '';
    
    // Restore body scrolling
    document.body.style.overflow = 'auto';
  }

  // Add method to download QR code
  downloadQRCode(): void {
    if (!this.selectedQRCode) return;
    
    const link = document.createElement('a');
    link.href = 'data:image/png;base64,' + this.selectedQRCode;
    link.download = `ticket-${this.selectedBookingCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Add ngOnDestroy to clean up
  ngOnDestroy(): void {
    document.body.style.overflow = 'auto';
  }
}
