import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventCategoryModel, EventDetailsModel, UpcomingEventResponse } from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';
import { DateworkerService } from '../../../core/services/dateworker.service';

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
  isLoading = true;
  isSimilarLoading = false;
  priceInRange: number | null = null; // Add this property
  isPriceLoading = false; // Add loading state for price

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private apiService: ApiService,
    private dateWorker: DateworkerService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.eventId = +params['event_id'] || 0;
      this.eventNameSlug = params['event_name'] || '';
      
      if (this.eventId > 0) {
        this.loadEventDetails();
        // Also load event categories for fallback
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

          // Load price in range AFTER getting event details
          this.loadPriceInRange();
          
          // Load similar events after getting category ID
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

  // Add this new method to load price in range
  loadPriceInRange(): void {
    if (!this.eventId) return;
    
    this.isPriceLoading = true;
    
    this.apiService.getEventPriceInRange(this.eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data !== null) {
          this.priceInRange = response.data;
        } else {
          // If no price in range found, keep it null to fallback to min_price
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

  // Get category name - use from eventDetails if available, otherwise find from categories list
  getEventCategoryName(): string {
    if (!this.eventDetails) return '';
    
    // First try to get from eventDetails (if backend includes it)
    if (this.eventDetails.event_category_name) {
      return this.eventDetails.event_category_name;
    }
    
    // Fallback: find from categories list
    if (this.eventDetails.event_category_id && this.eventCategories.length > 0) {
      const category = this.eventCategories.find(
        cat => cat.event_category_id === this.eventDetails!.event_category_id
      );
      return category ? category.event_category_name : '';
    }
    
    return '';
  }

  // Format date for display
  formatDisplayDate(dateString: string | Date | undefined | null): string {
    if (!dateString) return 'Date not specified';
    try {
      const result = this.dateWorker.formatDateAndTime(dateString.toString());
      return result.date;
    } catch (error) {
      return 'Invalid date';
    }
  }

  // Add a helper method to display the price
  getDisplayPrice(): string {
    // First priority: Price in range (200-1000)
    if (this.priceInRange !== null && this.priceInRange > 0) {
      return `₹${this.priceInRange}`;
    }
    
    // Fallback to min_price from eventDetails
    if (this.eventDetails?.min_price) {
      return `₹${this.eventDetails.min_price}`;
    }
    
    // Final fallback
    return 'Free';
  }

  // Add this method
  getPriceRangeDisplay(): string {
    if (this.priceInRange !== null) return '';
    
    if (!this.eventDetails?.max_price || !this.eventDetails?.min_price) return '';
    
    if (this.eventDetails.max_price > this.eventDetails.min_price) {
      return ` - ₹${this.eventDetails.max_price}`;
    }
    
    return '';
  }

  // Format time for display - SIMPLIFIED VERSION
  formatTimeForDisplay(timeString: string | undefined | null): string {
    if (!timeString) return 'Time not specified';
    
    // If time is already in a nice format (like "02:30 PM"), return as is
    if (timeString.includes('AM') || timeString.includes('PM') || timeString.includes(':')) {
      return timeString;
    }
    
    // If it's in 24-hour format, convert to 12-hour
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } catch (error) {
      return timeString; // Return as is if parsing fails
    }
  }

  // Format duration
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

  // Navigate to similar event
  onSimilarEventClick(event: UpcomingEventResponse): void {
    const eventNameSlug = this.createSlug(event.event_name);
    this.router.navigate(['/event-booking', event.event_id, eventNameSlug]);
    window.scrollTo(0, 0);
  }

  // Helper method to create URL slug
  private createSlug(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  onSignIn() {
    this.router.navigate(['/auth/login']);
  }

  // Book Now action
  onBookNow(): void {
    if (this.eventDetails) {
      // Create URL-friendly event name
      const eventNameSlug = this.createSlug(this.eventDetails.event_name);
      
      // Navigate to seats-booking with both event_id and event_name
      this.router.navigate(['/seats-booking', this.eventId, eventNameSlug]);
    }
  }

  // Modal for image preview
  openImageModal(imageUrl: string): void {
    if (!imageUrl) return;
    console.log('Open image modal:', imageUrl);
  }
}
