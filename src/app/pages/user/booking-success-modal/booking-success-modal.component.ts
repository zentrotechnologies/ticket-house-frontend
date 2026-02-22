import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-booking-success-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-success-modal.component.html',
  styleUrl: './booking-success-modal.component.css',
})
export class BookingSuccessModalComponent implements OnInit, OnDestroy {
  @Input() qrCodeBase64: string = '';
  @Input() thankYouMessage: string = '';
  @Input() bookingDetails: any = null;
  @Input() bookingCode: string = '';
  @Output() close = new EventEmitter<void>();
  
  imageLoaded = false;
  imageError = false;
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
    // Add escape key listener
    document.addEventListener('keydown', this.onEscapeKey.bind(this));
  }
  
  ngOnDestroy(): void {
    // Restore scrolling when component is destroyed
    document.body.style.overflow = 'auto';
    document.removeEventListener('keydown', this.onEscapeKey.bind(this));
  }
  
  onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }
  
  closeModal(): void {
    this.close.emit();
  }
  
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }
  
  onImageLoad(): void {
    this.imageLoaded = true;
    this.imageError = false;
  }
  
  onImageError(): void {
    this.imageError = true;
    this.imageLoaded = false;
  }
  
  formatDate(dateString: string | Date): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }
  
  downloadQRCode(): void {
    if (!this.qrCodeBase64 || this.imageError || !this.imageLoaded) {
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = 'data:image/png;base64,' + this.qrCodeBase64;
      link.download = `TicketHouse-Booking-${this.bookingCode || 'QR'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  }
  
  shareQRCode(): void {
    if (!this.qrCodeBase64 || this.imageError || !this.imageLoaded) {
      return;
    }
    
    // Convert base64 to blob
    const byteCharacters = atob(this.qrCodeBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    const file = new File([blob], `TicketHouse-Booking-${this.bookingCode}.png`, { type: 'image/png' });
    
    // Check if Web Share API is available
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        title: `My TicketHouse Booking - ${this.bookingCode}`,
        text: `Check out my booking for ${this.bookingDetails?.event_name}!`,
        files: [file]
      }).catch(error => {
        console.log('Error sharing:', error);
        this.fallbackShare();
      });
    } else {
      this.fallbackShare();
    }
  }
  
  private fallbackShare(): void {
    // Fallback: Copy booking code to clipboard
    navigator.clipboard.writeText(this.bookingCode).then(() => {
      alert(`Booking code ${this.bookingCode} copied to clipboard!`);
    }).catch(() => {
      alert(`Your booking code is: ${this.bookingCode}`);
    });
  }
  
  viewBookingDetails(): void {
    this.closeModal();
    if (this.bookingDetails?.booking_id) {
      this.router.navigate(['/booking-details', this.bookingDetails.booking_id]);
    } else {
      this.router.navigate(['/my-bookings']);
    }
  }
  
  goToEvents(): void {
    this.closeModal();
    this.router.navigate(['/events']);
  }

  // Add this method to your BookingSuccessModalComponent class
  calculateSubtotal(seats: any[]): number {
    if (!seats || !seats.length) return 0;
    return seats.reduce((sum, seat) => sum + (seat.subtotal || 0), 0);
  }
}
