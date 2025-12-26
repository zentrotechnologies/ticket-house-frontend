import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BookingResponse } from '../../../core/models/auth.model';
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
  bookings: BookingResponse[] = [];
  isLoading = false;
  isUserLoggedIn = false;

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
    });
  }

  onBackToEvents(): void {
    this.router.navigate(['/events']);
  }
}
