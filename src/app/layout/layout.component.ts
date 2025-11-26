import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { HeaderComponent } from "./header/header/header.component";
import { SidebarComponent } from "./sidebar/sidebar/sidebar.component";
import { AuthService } from "../core/services/auth.service";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent, FormsModule,ReactiveFormsModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  // isSidebarCollapsed = false;

  // onSidebarToggle(collapsed: boolean): void {
  //   this.isSidebarCollapsed = collapsed;
  // }

  isSidebarCollapsed = false;

  constructor(private authService: AuthService) {} // Inject AuthService

  ngOnInit(): void {}

  onSidebarToggle(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  // Check if user is audience (role_id = 3)
  isAudienceUser(): boolean {
    return this.authService.isAudience();
  }
}