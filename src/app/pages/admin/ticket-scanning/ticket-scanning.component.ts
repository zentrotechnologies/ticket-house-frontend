import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-ticket-scanning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-scanning.component.html',
  styleUrl: './ticket-scanning.component.css',
})
export class TicketScanningComponent implements OnInit {
  step: number = 1;
  bookingCode: string = '';
  booking: any = null;
  scanResult: any = null;
  isLoading: boolean = false;
  partialScanSeat: any = null;
  partialScanQuantity: number = 1;
  bulkPartialScanQuantities: any = {};

  // For QR scanning
  isCameraActive: boolean = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void { }

  // FIXED: Load booking with proper error handling
  async loadBooking(): Promise<void> {
    console.log('Loading booking for code:', this.bookingCode);

    if (!this.bookingCode.trim()) {
      this.toastr.warning('Please enter a booking code', 'Input Required');
      return;
    }

    this.isLoading = true;

    try {
      const response = await this.apiService.getBookingForScanning(this.bookingCode).toPromise();
      console.log('API Response:', response);

      if (response && response.status === 'Success' && response.data) {
        this.booking = response.data;
        console.log('Booking loaded:', this.booking);

        // FIX: Handle both 'BookingSeats' and 'bookingSeats' property names
        let seats = this.booking.BookingSeats || this.booking.bookingSeats;
        console.log('Seats data (original):', seats);

        if (!Array.isArray(seats)) {
          seats = [];
          console.warn('Seats was not an array, initialized to empty array');
        }

        // Ensure the property is set correctly for the rest of the component
        this.booking.BookingSeats = seats;
        console.log('BookingSeats after fix:', this.booking.BookingSeats);

        // Initialize bulk scan quantities
        this.initializeBulkScanQuantities();

        // Check if already fully scanned
        if (this.isFullyScanned()) {
          this.toastr.info('All tickets for this booking have already been scanned', 'Fully Scanned');
          this.step = 2;
        } else {
          this.toastr.success('Booking found successfully', 'Success');
          this.step = 2;
        }
      } else {
        const errorMsg = response?.message || 'Booking not found';
        this.toastr.error(errorMsg, 'Error');
        console.error('Booking not found:', response);
      }
    } catch (error: any) {
      console.error('Error loading booking:', error);
      let errorMessage = 'Error loading booking details';
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      this.toastr.error(errorMessage, 'Error');
    } finally {
      this.isLoading = false;
    }
  }

  // Add a helper method to get seats safely
  getSeats(): any[] {
    if (!this.booking) return [];
    return this.booking.BookingSeats || this.booking.bookingSeats || [];
  }

  // Initialize bulk scan quantities
  initializeBulkScanQuantities(): void {
    this.bulkPartialScanQuantities = {};
    if (this.booking?.BookingSeats && Array.isArray(this.booking.BookingSeats)) {
      this.booking.BookingSeats.forEach((seat: any) => {
        this.bulkPartialScanQuantities[seat.event_seat_type_inventory_id] = 0;
      });
    }
  }

  // Check if all tickets are fully scanned
  isFullyScanned(): boolean {
    if (!this.booking?.BookingSeats || !Array.isArray(this.booking.BookingSeats)) return false;
    return this.booking.BookingSeats.every((seat: any) =>
      (seat.scanned_quantity || 0) >= (seat.quantity || 0)
    );
  }

  // Check if specific seat is fully scanned
  isSeatFullyScanned(seat: any): boolean {
    if (!seat) return true;
    
    // Check if remaining_quantity is 0 or if scanned equals total
    const remaining = this.getRemaining(seat);
    return remaining <= 0;
  }

  // Update all methods that access BookingSeats to use the helper
  getTotalTickets(): number {
    const seats = this.getSeats();
    return seats.reduce((sum: number, seat: any) => sum + (seat.quantity || 0), 0);
  }

  getScannedTickets(): number {
    const seats = this.getSeats();
    return seats.reduce((sum: number, seat: any) => sum + (seat.scanned_quantity || 0), 0);
  }

  getRemaining(seat: any): number {
    if (!seat) return 0;
    
    // Priority: Use remaining_quantity from DB if available
    if (seat.remaining_quantity !== undefined && seat.remaining_quantity !== null) {
        return seat.remaining_quantity;
    }
    
    // Fallback: Calculate from quantity and scanned_quantity
    const quantity = seat.quantity || 0;
    const scanned = seat.scanned_quantity || 0;
    return Math.max(0, quantity - scanned);
  }

  // Helper method to calculate half of remaining tickets
  getHalfRemaining(): number {
    if (!this.partialScanSeat) return 0;
    const remaining = this.getRemaining(this.partialScanSeat);
    return Math.floor(remaining / 2);
  }

  // Set to scan half of remaining tickets
  scanHalf(): void {
    if (this.partialScanSeat) {
      this.partialScanQuantity = this.getHalfRemaining();
    }
  }

  getScanPercentage(): number {
    const total = this.getTotalTickets();
    const scanned = this.getScannedTickets();
    return total > 0 ? (scanned / total) * 100 : 0;
  }

  backToStep1(): void {
    this.step = 1;
    this.bookingCode = '';
    this.booking = null;
    this.scanResult = null;
    this.partialScanSeat = null;
    this.partialScanQuantity = 1;
    this.isCameraActive = false;
    this.bulkPartialScanQuantities = {};
  }

  // FIXED: Full Scan - Scan all remaining tickets
  async fullScan(): Promise<void> {
    console.log('Starting full scan...');

    if (!this.booking) {
      this.toastr.error('No booking selected', 'Error');
      return;
    }

    // Check if already fully scanned
    if (this.isFullyScanned()) {
      this.toastr.info('All tickets for this booking have already been scanned', 'Already Scanned');
      return;
    }

    // const adminEmail = this.authService.getCurrentUserEmail();
    // if (!adminEmail) {
    //   this.toastr.error('Admin authentication required', 'Authentication Error');
    //   return;
    // }

    // Get user ID instead of email
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
        this.toastr.error('User authentication required', 'Authentication Error');
        return;
    }

    // Use user_id instead of email
    const scannedBy = currentUser.user_id; // This should be the GUID/user_id

    // FIX: Check if BookingSeats exists and is iterable
    if (!this.booking.BookingSeats || !Array.isArray(this.booking.BookingSeats)) {
      console.error('BookingSeats is not iterable:', this.booking.BookingSeats);
      this.toastr.error('Invalid booking data - no seats found', 'Error');
      return;
    }

    console.log('BookingSeats for full scan:', this.booking.BookingSeats);

    this.isLoading = true;

    try {
      // Prepare scan request for ALL remaining seats
      const seatScanDetails: any[] = [];

      for (const seat of this.booking.BookingSeats) {
        const remaining = this.getRemaining(seat);
        console.log(`Seat: ${seat.seat_name}, Remaining: ${remaining}`);

        if (remaining > 0) {
          seatScanDetails.push({
            seatTypeId: seat.event_seat_type_inventory_id,
            quantityToScan: remaining // Scan ALL remaining
          });
        }
      }

      console.log('SeatScanDetails:', seatScanDetails);

      if (seatScanDetails.length === 0) {
        this.toastr.warning('No tickets available to scan', 'Warning');
        this.isLoading = false;
        return;
      }

      const request = {
        bookingId: this.booking.booking_id,
        seatScanDetails: seatScanDetails,
        scannedBy: scannedBy,
        deviceInfo: 'Web Scanner - Full Scan'
      };

      console.log('Full scan request:', request);

      const response = await this.apiService.partialScan(request).toPromise();
      console.log('Full scan response:', response);

      if (response?.status === 'Success' || response?.status === 'Partial') {
        this.scanResult = response.data;
        this.step = 4;

        const totalScanned = seatScanDetails.reduce((sum: number, detail: any) => sum + detail.quantityToScan, 0);
        this.toastr.success(`Successfully scanned ${totalScanned} ticket(s)`, 'Full Scan Complete');

        // Refresh booking data
        await this.loadBooking();
      } else {
        this.toastr.error(response?.message || 'Full scan failed', 'Error');
      }
    } catch (error: any) {
      console.error('Error in full scan:', error);
      let errorMessage = 'Error in full scan';
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      this.toastr.error(errorMessage, 'Error');
    } finally {
      this.isLoading = false;
    }
  }

  // Open partial scan for single seat
  openSeatScan(seat: any): void {
    console.log('Opening seat scan for:', seat);

    if (!seat) return;

    if (this.isSeatFullyScanned(seat)) {
      this.toastr.info(`All ${seat.quantity} ${seat.seat_name} tickets have already been scanned`, 'Already Scanned');
      return;
    }

    this.partialScanSeat = seat;
    this.partialScanQuantity = Math.min(1, this.getRemaining(seat));
    this.step = 3;
  }

  // Helper methods for quantity adjustment
  decreaseQuantity(): void {
    if (this.partialScanQuantity > 1) {
      this.partialScanQuantity--;
    }
  }

  increaseQuantity(): void {
    const maxQuantity = this.getRemaining(this.partialScanSeat);
    if (this.partialScanQuantity < maxQuantity) {
      this.partialScanQuantity++;
    }
  }

  setScanFive(): void {
    const maxQuantity = this.getRemaining(this.partialScanSeat);
    this.partialScanQuantity = Math.min(5, maxQuantity);
  }

  // FIXED: Submit scan for single seat
  async submitSeatScan(): Promise<void> {
    console.log('Submitting seat scan...');

    if (!this.partialScanSeat || this.partialScanQuantity <= 0) {
      this.toastr.warning('Please enter a valid quantity to scan', 'Invalid Input');
      return;
    }

    const remaining = this.getRemaining(this.partialScanSeat);
    if (this.partialScanQuantity > remaining) {
      this.toastr.warning(`Cannot scan more than ${remaining} remaining tickets`, 'Invalid Quantity');
      return;
    }

    // const adminEmail = this.authService.getCurrentUserEmail();
    // if (!adminEmail) {
    //   this.toastr.error('Admin authentication required', 'Authentication Error');
    //   return;
    // }

    // Get user ID instead of email
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
        this.toastr.error('Admin authentication required', 'Authentication Error');
        return;
    }

    // Use user_id instead of email
    const scannedBy = currentUser.user_id;

    this.isLoading = true;

    try {
      const request = {
        bookingId: this.booking.booking_id,
        seatScanDetails: [{
          seatTypeId: this.partialScanSeat.event_seat_type_inventory_id,
          quantityToScan: this.partialScanQuantity
        }],
        scannedBy: scannedBy,
        deviceInfo: 'Web Scanner - Single Seat'
      };

      console.log('Single seat scan request:', request);

      const response = await this.apiService.partialScan(request).toPromise();
      console.log('Single seat scan response:', response);

      if (response?.status === 'Success' || response?.status === 'Partial') {
        this.scanResult = response.data;
        this.step = 4;
        this.toastr.success(`Successfully scanned ${this.partialScanQuantity} ${this.partialScanSeat.seat_name} ticket(s)`, 'Scan Successful');

        // Refresh booking data
        await this.loadBooking();
      } else {
        this.toastr.error(response?.message || 'Scan failed', 'Error');
      }
    } catch (error: any) {
      console.error('Error scanning ticket:', error);
      let errorMessage = 'Error scanning ticket';
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      this.toastr.error(errorMessage, 'Error');
    } finally {
      this.isLoading = false;
      this.partialScanSeat = null;
      this.partialScanQuantity = 1;
    }
  }

  // Open bulk partial scan modal
  openBulkPartialScan(): void {
    console.log('Opening bulk partial scan...');

    if (this.isFullyScanned()) {
      this.toastr.info('All tickets have already been scanned', 'Already Scanned');
      return;
    }

    // Initialize quantities to 0
    this.initializeBulkScanQuantities();
    this.step = 3.5;
  }

  // Set all remaining quantities for bulk scan
  setAllRemaining(): void {
    if (!this.booking?.BookingSeats || !Array.isArray(this.booking.BookingSeats)) return;

    this.booking.BookingSeats.forEach((seat: any) => {
      const remaining = this.getRemaining(seat);
      this.bulkPartialScanQuantities[seat.event_seat_type_inventory_id] = remaining;
    });
  }

  // Clear all quantities for bulk scan
  clearAll(): void {
    if (!this.booking?.BookingSeats || !Array.isArray(this.booking.BookingSeats)) return;

    this.booking.BookingSeats.forEach((seat: any) => {
      this.bulkPartialScanQuantities[seat.event_seat_type_inventory_id] = 0;
    });
  }

  // Check if bulk scan has any quantities
  hasBulkScanQuantities(): boolean {
    if (!this.booking?.BookingSeats || !Array.isArray(this.booking.BookingSeats)) return false;

    return this.booking.BookingSeats.some((seat: any) => {
      const quantity = this.bulkPartialScanQuantities[seat.event_seat_type_inventory_id] || 0;
      const remaining = this.getRemaining(seat);
      return quantity > 0 && quantity <= remaining;
    });
  }

  // Validate bulk scan quantities
  validateBulkScanQuantities(): boolean {
    if (!this.booking?.BookingSeats || !Array.isArray(this.booking.BookingSeats)) return false;

    for (const seat of this.booking.BookingSeats) {
      const quantity = this.bulkPartialScanQuantities[seat.event_seat_type_inventory_id] || 0;
      const remaining = this.getRemaining(seat);

      if (quantity > remaining) {
        this.toastr.warning(`Cannot scan ${quantity} ${seat.seat_name} tickets. Only ${remaining} remaining.`, 'Invalid Quantity');
        return false;
      }
    }
    return true;
  }

  // FIXED: Submit bulk partial scan
  async submitBulkPartialScan(): Promise<void> {
    console.log('Submitting bulk partial scan...');

    if (!this.validateBulkScanQuantities()) {
      return;
    }

    if (!this.hasBulkScanQuantities()) {
      this.toastr.warning('Please enter valid scan quantities', 'Invalid Input');
      return;
    }

    // const adminEmail = this.authService.getCurrentUserEmail();
    // if (!adminEmail) {
    //   this.toastr.error('Admin authentication required', 'Authentication Error');
    //   return;
    // }

    // Get user ID instead of email
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
        this.toastr.error('Admin authentication required', 'Authentication Error');
        return;
    }

    // Use user_id instead of email
    const scannedBy = currentUser.user_id;

    // Check if BookingSeats exists
    if (!this.booking?.BookingSeats || !Array.isArray(this.booking.BookingSeats)) {
      this.toastr.error('No seat data available', 'Error');
      return;
    }

    this.isLoading = true;

    try {
      // Prepare seat scan details
      const seatScanDetails: any[] = [];
      let totalToScan = 0;

      for (const seat of this.booking.BookingSeats) {
        const quantity = this.bulkPartialScanQuantities[seat.event_seat_type_inventory_id] || 0;
        if (quantity > 0) {
          seatScanDetails.push({
            seatTypeId: seat.event_seat_type_inventory_id,
            quantityToScan: quantity
          });
          totalToScan += quantity;
        }
      }

      console.log('Bulk scan details:', seatScanDetails);
      console.log('Total to scan:', totalToScan);

      if (seatScanDetails.length === 0) {
        this.toastr.warning('No quantities selected for scanning', 'Warning');
        this.isLoading = false;
        return;
      }

      const request = {
        bookingId: this.booking.booking_id,
        seatScanDetails: seatScanDetails,
        scannedBy: scannedBy,
        deviceInfo: 'Web Scanner - Bulk Partial'
      };

      console.log('Bulk scan request:', request);

      const response = await this.apiService.partialScan(request).toPromise();
      console.log('Bulk scan response:', response);

      if (response?.status === 'Success' || response?.status === 'Partial') {
        this.scanResult = response.data;
        this.step = 4;

        this.toastr.success(`Successfully scanned ${totalToScan} ticket(s)`, 'Partial Scan Complete');

        // Refresh booking data
        await this.loadBooking();
      } else {
        this.toastr.error(response?.message || 'Partial scan failed', 'Error');
      }
    } catch (error: any) {
      console.error('Error processing partial scan:', error);
      let errorMessage = 'Error processing partial scan';
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      this.toastr.error(errorMessage, 'Error');
    } finally {
      this.isLoading = false;
    }
  }

  // Get bulk scan quantity for a seat
  getBulkScanQuantity(seat: any): number {
    if (!seat || !seat.event_seat_type_inventory_id) return 0;
    return this.bulkPartialScanQuantities[seat.event_seat_type_inventory_id] || 0;
  }

  // Update bulk scan quantity
  updateBulkScanQuantity(seat: any, quantity: number): void {
    if (!seat || !seat.event_seat_type_inventory_id) return;

    const remaining = this.getRemaining(seat);
    if (quantity >= 0 && quantity <= remaining) {
      this.bulkPartialScanQuantities[seat.event_seat_type_inventory_id] = quantity;
    }
  }

  // Methods for scan result display
  getRequestedTotal(): number {
    if (!this.scanResult?.scanResults || !Array.isArray(this.scanResult.scanResults)) return 0;
    return this.scanResult.scanResults.reduce((sum: number, r: any) => sum + (r.requestedQuantity || 0), 0);
  }

  getScannedTotal(): number {
    if (!this.scanResult?.scanResults || !Array.isArray(this.scanResult.scanResults)) return 0;
    return this.scanResult.scanResults.reduce((sum: number, r: any) => sum + (r.scannedQuantity || 0), 0);
  }

  getRemainingTotal(): number {
    if (!this.scanResult?.scanResults || !Array.isArray(this.scanResult.scanResults)) return 0;
    return this.scanResult.scanResults.reduce((sum: number, r: any) => sum + (r.remainingQuantity || 0), 0);
  }

  // QR Code scanning simulation
  async simulateQRScan(bookingCode: string): Promise<void> {
    this.bookingCode = bookingCode;
    await this.loadBooking();
  }

  // For demo purposes
  startCamera(): void {
    this.isCameraActive = true;
    this.toastr.info('QR Scanner activated. In production, this would open camera.', 'QR Scanner');

    // Simulate QR scan for demo after 2 seconds
    setTimeout(() => {
      this.isCameraActive = false;

      // For testing - simulate scanning a QR code
      const testBookingCode = 'ZTH202601101344267546'; // Replace with actual test code
      this.toastr.info(`Simulated QR scan: ${testBookingCode}`, 'QR Scan Simulation');

      // Uncomment to auto-load test booking
      // this.bookingCode = testBookingCode;
      // this.loadBooking();
    }, 2000);
  }

  // Validate partial quantity
  validatePartialQuantity(): void {
    if (this.partialScanSeat) {
      const maxQuantity = this.getRemaining(this.partialScanSeat);
      if (this.partialScanQuantity > maxQuantity) {
        this.partialScanQuantity = maxQuantity;
      }
      if (this.partialScanQuantity < 1) {
        this.partialScanQuantity = 1;
      }
    }
  }

  // Get total bulk scan quantity
  getTotalBulkScanQuantity(): number {
    let total = 0;
    if (this.booking?.BookingSeats && Array.isArray(this.booking.BookingSeats)) {
      for (const seat of this.booking.BookingSeats) {
        total += this.bulkPartialScanQuantities[seat.event_seat_type_inventory_id] || 0;
      }
    }
    return total;
  }

  // SIMPLE DEBUG METHOD - Add this to check data
  debugBooking(): void {
    console.log('=== DEBUG BOOKING ===');
    console.log('Booking:', this.booking);
    console.log('BookingSeats (uppercase):', this.booking?.BookingSeats);
    console.log('bookingSeats (lowercase):', this.booking?.bookingSeats);
    console.log('Is BookingSeats Array?', Array.isArray(this.booking?.BookingSeats));
    console.log('Is bookingSeats Array?', Array.isArray(this.booking?.bookingSeats));

    // Check both properties
    const seats = this.booking?.BookingSeats || this.booking?.bookingSeats;
    console.log('Final seats array:', seats);
    console.log('Final seats length:', seats?.length);

    if (seats && Array.isArray(seats)) {
      seats.forEach((seat: any, index: number) => {
        console.log(`Seat ${index}:`, seat);
      });
    }
    console.log('=== END DEBUG ===');
  }
}
