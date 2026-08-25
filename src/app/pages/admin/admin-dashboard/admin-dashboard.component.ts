import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';

// Add this interface for event summary
interface EventSummaryData {
  eventId: number;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  currency: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  occupancyPercentage: number;
  totalProfit: number;
  seatTypeDetails: SeatTypeDetail[];
  paymentDetails: PaymentDetail | null;
}

interface SeatTypeDetail {
  seatName: string;
  price: number;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  revenue: number;
  occupancyPercentage: number;
}

interface PaymentDetail {
  totalSuccessfulBookings: number;
  totalAmount: number;
  totalConvenienceFee: number;
  totalGST: number;
  firstBookingDate: string;
  lastBookingDate: string;
}

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
  userRoleId: number = 0;
  userId: string = '';
  currentUser: any = null;
  
  // Recent Events
  recentEvents: any[] = [];
  isLoadingEvents: boolean = false;
  totalRecentEvents: number = 0;
  currentPage: number = 1;
  pageSize: number = 5; // Show only 5 recent events on dashboard
  
  // Event Summary
  isLoadingSummary: boolean = false;
  eventSummary: EventSummaryData | null = null;
  
  dashboardStats = {
    totalEvents: 0,
    totalUsers: 0,
    totalCategories: 0,
    pendingApprovals: 0
  };

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.userName = this.authService.getUserDisplayName();
    this.userRole = this.authService.getUserRoleName();
    this.loadDashboardStats();
    this.loadRecentEvents();
  }

  loadCurrentUser(): void {
    console.log('=== loadCurrentUser called ===');
    
    // Method 1: Try to get from AuthService's BehaviorSubject
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user;
      this.userId = user.user_id || '';
      this.userRoleId = user.role_id || 0;
      console.log('User loaded from AuthService:', this.currentUser);
      return;
    }

    // Method 2: Try to get from localStorage using the correct key
    const userDataStr = localStorage.getItem(environment.USERDATA_KEY);
    console.log('USERDATA_KEY:', environment.USERDATA_KEY);
    console.log('Raw user data from localStorage:', userDataStr);
    
    if (userDataStr) {
      try {
        const loginResponse = JSON.parse(userDataStr);
        console.log('Parsed login response:', loginResponse);
        
        this.currentUser = {
          user_id: loginResponse.user_id || '',
          first_name: loginResponse.first_name || '',
          last_name: loginResponse.last_name || '',
          email: loginResponse.email || '',
          mobile: loginResponse.mobile || '',
          country_code: loginResponse.country_code || '',
          profile_img: loginResponse.profile_img || null,
          role_id: loginResponse.role_id || 0,
        };
        
        this.userId = this.currentUser.user_id || '';
        this.userRoleId = this.currentUser.role_id || 0;
        console.log('User loaded successfully:', this.currentUser);
        console.log('User role_id:', this.currentUser.role_id);
        
        this.authService.setcurrentUser(this.currentUser);
        return;
      } catch (error) {
        console.error('Error parsing user data from USERDATA_KEY:', error);
      }
    }

    // Method 3: Try alternative keys
    const alternativeKeys = ['user', 'currentUser', 'user_data', 'auth_user'];
    for (const key of alternativeKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log(`Found data in key "${key}":`, parsed);
          
          if (parsed.user_id || parsed.role_id) {
            this.currentUser = {
              user_id: parsed.user_id || '',
              first_name: parsed.first_name || '',
              last_name: parsed.last_name || '',
              email: parsed.email || '',
              mobile: parsed.mobile || '',
              country_code: parsed.country_code || '',
              profile_img: parsed.profile_img || null,
              role_id: parsed.role_id || 0,
            };
            this.userId = this.currentUser.user_id || '';
            this.userRoleId = this.currentUser.role_id || 0;
            console.log('User loaded from key:', key, this.currentUser);
            return;
          }
        } catch (e) {
          // Continue to next key
        }
      }
    }

    console.error('Could not load user data from any source');
    this.currentUser = null;
    this.userId = '';
    this.userRoleId = 0;
  }

  loadDashboardStats(): void {
    // Mock data for demonstration - you can replace with API calls
    this.dashboardStats = {
      totalEvents: 24,
      totalUsers: 156,
      totalCategories: 8,
      pendingApprovals: 3
    };
  }

  loadRecentEvents(): void {
    this.isLoadingEvents = true;
    
    // Check if user is admin
    const isAdmin = this.currentUser?.role_id === 1 || this.authService.isAdminUser();
    
    if (isAdmin) {
      this.loadAdminRecentEvents();
    } else {
      this.loadOrganizerRecentEvents();
    }
  }

  loadAdminRecentEvents(): void {
    const request: any = {
      PageNumber: this.currentPage,
      PageSize: this.pageSize,
      SearchText: '',
      Status: '',
      FromDate: null,
      ToDate: null,
    };

    this.apiService.getPaginatedAdminEvents(request).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          // Map to match the structure expected in the template
          this.recentEvents = response.data.map((event: any) => ({
            eventDetails: {
              event_id: event.event_id,
              organizer_id: event.organizer_id,
              event_name: event.event_name,
              event_description: event.event_description,
              event_date: event.event_date,
              start_time: event.start_time,
              end_time: event.end_time,
              total_duration_minutes: event.total_duration_minutes,
              location: event.location,
              full_address: event.full_address,
              geo_map_url: event.geo_map_url,
              latitude: event.latitude,
              longitude: event.longitude,
              language: event.language,
              event_category_id: event.event_category_id,
              banner_image: event.banner_image,
              gallery_media: event.gallery_media,
              age_limit: event.age_limit,
              artists: event.artists,
              terms_and_conditions: event.terms_and_conditions,
              min_price: event.min_price,
              max_price: event.max_price,
              is_featured: event.is_featured,
              status: event.status,
              no_of_seats: event.no_of_seats,
              created_by: event.created_by,
              created_at: event.created_at,
              updated_by: event.updated_by,
              updated_at: event.updated_at,
              active: event.active,
              convenience_fee: event.convenience_fee || 0,
              organizer_name: event.organizer_name,
              organizer_email: event.organizer_email,
              organizer_mobile: event.organizer_mobile,
              organizer_country_code: event.organizer_country_code,
            },
            eventArtists: event.artist_list || [],
            eventGalleries: event.gallery_list || [],
            seatTypes: []
          }));
          
          this.totalRecentEvents = response.totalCount || 0;
        }
        this.isLoadingEvents = false;
      },
      error: (error) => {
        console.error('Error loading recent events:', error);
        this.toastr.error('Failed to load recent events', 'Error');
        this.isLoadingEvents = false;
      }
    });
  }

  loadOrganizerRecentEvents(): void {
    const request: any = {
      created_by: this.userId,
      PageNumber: this.currentPage,
      PageSize: this.pageSize,
      SearchText: '',
      Status: '',
      FromDate: null,
      ToDate: null,
    };

    this.apiService.getPaginatedEventsByCreatedBy(request).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.recentEvents = response.data;
          this.totalRecentEvents = response.totalCount || 0;
        }
        this.isLoadingEvents = false;
      },
      error: (error) => {
        console.error('Error loading recent events:', error);
        this.toastr.error('Failed to load recent events', 'Error');
        this.isLoadingEvents = false;
      }
    });
  }

  // NEW: View Event Summary - same as admin-events component
  viewEventSummary(eventId: number): void {
    this.isLoadingSummary = true;
    this.eventSummary = null;

    this.apiService.getEventSummary(eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.eventSummary = response.data;
          this.showModal('eventSummaryModal');
        } else {
          this.toastr.error(response.message || 'Failed to load event summary', 'Error');
        }
      },
      error: (error) => {
        console.error('Error loading event summary:', error);
        this.toastr.error('Failed to load event summary', 'Error');
      },
      complete: () => {
        this.isLoadingSummary = false;
      },
    });
  }

  // NEW: Modal methods - same as admin-events component
  showModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      modalElement.setAttribute('aria-modal', 'true');
      modalElement.setAttribute('role', 'dialog');
      document.body.classList.add('modal-open');

      // Add backdrop
      let backdrop = document.querySelector('.modal-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
      }
    }
  }

  closeModalProperly(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      // Use Bootstrap's modal API if available
      try {
        // @ts-ignore
        const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
        if (bootstrapModal) {
          bootstrapModal.hide();
        } else {
          // Fallback to manual closing
          this.manualCloseModal(modalElement);
        }
      } catch (error) {
        // If Bootstrap is not available, use manual close
        this.manualCloseModal(modalElement);
      }

      // Clear any pending modal backdrops
      setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((backdrop) => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
        document.body.style.removeProperty('overflow');
      }, 150);
    }
  }

  private manualCloseModal(modalElement: HTMLElement): void {
    modalElement.classList.remove('show');
    modalElement.style.display = 'none';
    modalElement.setAttribute('aria-hidden', 'true');
    modalElement.removeAttribute('aria-modal');
    modalElement.removeAttribute('role');
  }

  // Helper method to strip HTML tags for description preview
  stripHtmlTags(html: string): string {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  // Helper method to truncate text
  truncateText(text: string, maxLength: number = 100): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Get status badge class
  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-badge status-active';
      case 'inactive':
        return 'status-badge status-inactive';
      case 'draft':
        return 'status-badge status-draft';
      default:
        return 'status-badge status-draft';
    }
  }

  // Format date for display
  formatDate(date: string): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return date;
    }
  }
}
