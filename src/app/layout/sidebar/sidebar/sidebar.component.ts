import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuItem } from '../../../core/constants/MenuConst';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  @Output() toggle = new EventEmitter<boolean>();
  
  menuItems: MenuItem[] = [];
  isCollapsed = false;
  isMobileView = false;
  isMobileSidebarOpen = false;
  userRoleId: number = 0;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userRoleId = this.authService.getUserRoleId();
    this.menuItems = this.authService.getMenuItems();
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isMobileView = window.innerWidth <= 768;
    if (!this.isMobileView) {
      this.isMobileSidebarOpen = false;
    }
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.toggle.emit(this.isCollapsed);
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
    // Prevent body scroll when mobile sidebar is open
    if (this.isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
    document.body.style.overflow = '';
  }

  hasChildren(menuItem: MenuItem): boolean {
    return !!menuItem.children && menuItem.children.length > 0;
  }

  // Add this getter to check if sidebar should be visible
  get shouldShowSidebar(): boolean {
    // Only show sidebar for Super Admin (role 1)
    // Hide for Organizer (role 2) and other roles
    return this.userRoleId === 1;
  }
}
