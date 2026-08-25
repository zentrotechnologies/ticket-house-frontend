import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { HeaderComponent } from "./header/header/header.component";
import { SidebarComponent } from "./sidebar/sidebar/sidebar.component";
import { AuthService } from "../core/services/auth.service";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { UserHeaderComponent } from "./user-header/user-header.component";

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent, FormsModule, ReactiveFormsModule, UserHeaderComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  isSidebarCollapsed = false;
  userRole: number | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userRole = user.role_id;
      } else {
        this.userRole = null;
      }
    });
  }

  onSidebarToggle(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  // Check if user is Super Admin (role_id 1)
  isSuperAdmin(): boolean {
    return this.userRole === 1;
  }

  // Check if user is Organizer (role_id 2)
  isOrganizer(): boolean {
    return this.userRole === 2;
  }

  // Check if user is Admin (role_id 1 or 2)
  isAdminUser(): boolean {
    return this.userRole === 1 || this.userRole === 2;
  }

  // Check if user is Audience (role_id 3) or Public (not logged in)
  isAudienceOrPublic(): boolean {
    return !this.userRole || this.userRole === 3;
  }
}