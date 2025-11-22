import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
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

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.menuItems = this.authService.getMenuItems();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.toggle.emit(this.isCollapsed); // Emit the collapsed state
  }

  hasChildren(menuItem: MenuItem): boolean {
    return !!menuItem.children && menuItem.children.length > 0;
  }
}
