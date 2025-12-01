import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-event-booking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-booking.component.html',
  styleUrl: './event-booking.component.css',
})
export class EventBookingComponent {
  constructor(private router: Router) {}

  onSignIn() {
    this.router.navigate(['/auth/login']);
  }
}
