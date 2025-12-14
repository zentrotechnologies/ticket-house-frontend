import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventDetailsModel } from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-seats-booking',
  imports: [CommonModule, RouterLink],
  templateUrl: './seats-booking.component.html',
  styleUrl: './seats-booking.component.css',
})
export class SeatsBookingComponent implements OnInit {
  eventId!: number;
  eventNameSlug!: string;
  eventDetails: EventDetailsModel | null = null;
  isLoading = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService // Inject API service if needed
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.eventId = +params['event_id'] || 0;
      this.eventNameSlug = params['event_name'] || '';
      
      if (this.eventId > 0) {
        this.loadEventDetails();
      } else {
        this.router.navigate(['/events']);
      }
    });
  }

  loadEventDetails(): void {
    this.isLoading = true;
    
    // You can fetch event details again if needed, or just use the ID and name
    // For now, we'll just log them
    console.log('Seats booking for Event ID:', this.eventId);
    console.log('Event Name Slug:', this.eventNameSlug);
    
    // If you need to fetch event details, uncomment this:
    /*
    this.apiService.getEventDetailsById(this.eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.eventDetails = response.data;
          // Update the event title in the template
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
    */
    
    this.isLoading = false;
  }

  // Optional: Helper to format the event name for display
  getEventTitle(): string {
    // Convert slug back to readable format
    return this.eventNameSlug
      ? this.eventNameSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : 'Event Details';
  }

  onSignIn() {
    this.router.navigate(['/auth/login']);
  }
}
