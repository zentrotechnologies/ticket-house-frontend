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
  // isSidebarCollapsed = false;

  // onSidebarToggle(collapsed: boolean): void {
  //   this.isSidebarCollapsed = collapsed;
  // }

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

  // Check if user is admin (role_id 1 or 2)
  // In layout.component.ts - add to isAdminUser() and isAudienceOrPublic()
  isAdminUser(): boolean {
    const isAdmin = this.userRole === 1 || this.userRole === 2;
    // console.log('Layout - isAdminUser:', isAdmin, 'role:', this.userRole);
    return isAdmin;
  }

  isAudienceOrPublic(): boolean {
    const isAudienceOrPublic = !this.userRole || this.userRole === 3;
    // console.log('Layout - isAudienceOrPublic:', isAudienceOrPublic, 'role:', this.userRole);
    return isAudienceOrPublic;
  }
}