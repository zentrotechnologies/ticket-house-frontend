import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-seats-booking',
  imports: [CommonModule, RouterLink],
  templateUrl: './seats-booking.component.html',
  styleUrl: './seats-booking.component.css',
})
export class SeatsBookingComponent {
  constructor(private router: Router) {}

  onSignIn() {
    this.router.navigate(['/auth/login']);
  }
}
