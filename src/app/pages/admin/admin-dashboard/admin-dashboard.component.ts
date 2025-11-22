import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  userName: string = '';
  userRole: string = '';
  dashboardStats = {
    totalEvents: 0,
    totalUsers: 0,
    totalCategories: 0,
    pendingApprovals: 0
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userName = this.authService.getUserDisplayName();
    this.userRole = this.authService.getUserRoleName();
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    // Mock data for demonstration
    this.dashboardStats = {
      totalEvents: 24,
      totalUsers: 156,
      totalCategories: 8,
      pendingApprovals: 3
    };
  }
}
