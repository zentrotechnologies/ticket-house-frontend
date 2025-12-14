import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ArtistResponse, ShowsByArtistsResponse, TestimonialResponse, TestimonialsResponse, UpcomingEventResponse, UpcomingEventsResponse } from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  constructor(
    private router: Router,
    private apiService: ApiService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadUpcomingEvents();
    this.loadArtists();
    this.loadTestimonials();
  }

  loadUpcomingEvents(): void {
    this.isLoadingEvents = true;

    const request = {
      Count: 8,
      IncludeLaterEvents: true
    };

    this.apiService.getUpcomingEvents(request).subscribe({
      next: (response: UpcomingEventsResponse) => {
        if (response.status === 'Success' && response.data) {
          this.upcomingEvents = response.data;

          // Update section title based on number of events
          if (this.upcomingEvents.length === 0) {
            this.sectionTitle = 'No Upcoming Events';
          } else if (this.upcomingEvents.length < 3) {
            this.sectionTitle = 'Upcoming Events';
          }
        }
      },
      error: (error) => {
        console.error('Error loading upcoming events:', error);
      },
      complete: () => {
        this.isLoadingEvents = false;
      }
    });
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

  onSignIn() {
    this.router.navigate(['/auth/login']);
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
}
