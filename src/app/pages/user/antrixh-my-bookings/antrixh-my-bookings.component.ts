import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  BookingHistoryRequest,
  BookingHistoryResponse,
  BookingSeatHistoryResponse,
  PagedBookingHistoryResponse,
} from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-antrixh-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './antrixh-my-bookings.component.html',
  styleUrl: './antrixh-my-bookings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AntrixhMyBookingsComponent implements OnInit, OnDestroy {
  userId: string | null = null;
  bookings: BookingHistoryResponse[] = [];
  isLoading = false;
  isUserLoggedIn = false;

  // Pagination
  currentPage = 1;
  pageSize = 6;
  totalPages = 0;
  totalCount = 0;
  hasPrevious = false;
  hasNext = false;
  pageSizeOptions = [6, 10, 25, 50];

  // Filter
  filterText = '';

  // QR modal
  showQRModal = false;
  selectedQRCode = '';
  selectedBookingCode = '';
  selectedEventName = '';

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.isUserLoggedIn = this.authService.isLoggedIn();

    if (!this.isUserLoggedIn) {
      this.toastr.warning('Please login to view your bookings', 'Authentication Required');
      this.router.navigate(['/']);
      return;
    }

    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.userId = params['user_id'];

      if (!this.userId) {
        this.userId = this.authService.getCurrentUserId();

        if (!this.userId) {
          this.toastr.error('User information not found', 'Error');
          this.router.navigate(['/']);
          return;
        }

        this.router.navigate(['/my-bookings-antrixh', this.userId]);
        return;
      }

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
      sortDirection: 'desc',
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.toastr.error('An error occurred while loading bookings', 'Error');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
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

  onBackToEvents(): void {
    this.router.navigate(['/']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  formatTime(timeString: string): string {
    if (!timeString) return 'N/A';
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
        return 'ax-status--confirmed';
      case 'pending_payment':
      case 'pending':
        return 'ax-status--pending';
      case 'cancelled':
        return 'ax-status--cancelled';
      default:
        return 'ax-status--default';
    }
  }

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

  showQRCodeModal(booking: BookingHistoryResponse): void {
    this.selectedQRCode = booking.qr_code;
    this.selectedBookingCode = booking.booking_code;
    this.selectedEventName = booking.event_name;
    this.showQRModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeQRModal(): void {
    this.showQRModal = false;
    this.selectedQRCode = '';
    this.selectedBookingCode = '';
    this.selectedEventName = '';
    document.body.style.overflow = 'auto';
  }

  downloadQRCode(): void {
    if (!this.selectedQRCode) return;

    const link = document.createElement('a');
    link.href = 'data:image/png;base64,' + this.selectedQRCode;
    link.download = `ticket-${this.selectedBookingCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  ngOnDestroy(): void {
    document.body.style.overflow = 'auto';
  }
}
