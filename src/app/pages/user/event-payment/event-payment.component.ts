import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-event-payment',
  imports: [CommonModule, RouterLink],
  templateUrl: './event-payment.component.html',
  styleUrl: './event-payment.component.css',
})
export class EventPaymentComponent {
  constructor(private router: Router) {}

  onSignIn() {
    this.router.navigate(['/auth/login']);
  }
}
