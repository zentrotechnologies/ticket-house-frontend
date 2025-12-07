import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  CommonResponseModel,
  OrganizerModel,
  OrganizerPagedResponse,
  OrganizerRequest,
  PaginationRequest,
  UpdateOrganizerStatusRequest,
} from '../../../../core/models/auth.model';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Modal } from 'bootstrap';

@Component({
  selector: 'app-event-organizer',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './event-organizer.component.html',
  styleUrl: './event-organizer.component.css',
})
export class EventOrganizerComponent implements OnInit {
  // Properties for data management
  organizers: OrganizerModel[] = [];
  filteredOrganizers: OrganizerModel[] = [];

  // Properties for form handling
  currentOrganizer!: OrganizerRequest;
  selectedOrganizer: OrganizerModel | null = null;
  organizerToDelete: OrganizerModel | null = null;
  isEditMode: boolean = false;

  // Properties for UI state
  isLoading: boolean = false;
  searchText: string = '';
  itemsPerPage: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;
  totalCount: number = 0;

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private toastr: ToastrService
  ) {
    this.currentOrganizer = this.initializeOrganizer();
  }

  ngOnInit(): void {
    this.loadOrganizers();
  }

  // Initialize empty organizer
  private initializeOrganizer(): OrganizerRequest {
    let userId = 'system';
    if (this.authService && this.authService.getCurrentUserId) {
      userId = this.authService.getCurrentUserId() || 'system';
    }

    return {
      first_name: '',
      last_name: '',
      email: '',
      mobile: '',
      password: '',
      role_id: 2,
      org_name: '',
      org_start_date: undefined,
      bank_account_no: '',
      bank_ifsc: '',
      bank_name: '',
      beneficiary_name: '',
      aadhar_number: '',
      pancard_number: '',
      owner_personal_email: '',
      owner_mobile: '',
      state: '',
      city: '',
      country: '',
      gst_number: '',
      instagram_link: '',
      youtube_link: '',
      facebook_link: '',
      twitter_link: '',
      created_by: userId,
      updated_by: userId,
    };
  }

  // Load organizers with pagination
  loadOrganizers(): void {
    this.isLoading = true;

    const request: PaginationRequest = {
      pageNumber: this.currentPage,
      pageSize: this.itemsPerPage,
      filterText: this.searchText,
      filterFlag: !!this.searchText.trim()
    };

    this.apiService.getPaginatedOrganizers(request).subscribe({
      next: (response: OrganizerPagedResponse) => {
        this.isLoading = false;
        if (response.status === 'Success' && response.data) {
          this.organizers = response.data;
          this.filteredOrganizers = [...this.organizers];
          this.totalPages = response.totalPages || 1;
          this.totalCount = response.totalCount || 0;
          this.currentPage = response.currentPage || 1;
        } else {
          this.toastr.error(response.message || 'Failed to load organizers', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Error loading organizers: ' + error.message, 'Error');
        console.error('Error loading organizers:', error);
      },
    });
  }

  // Apply search filter
  onSearch(): void {
    this.currentPage = 1;
    this.loadOrganizers();
  }

  // Clear search
  clearSearch(): void {
    this.searchText = '';
    this.currentPage = 1;
    this.loadOrganizers();
  }

  // Items per page change
  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadOrganizers();
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadOrganizers();
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Calculate display range
  getDisplayRange(): { start: number; end: number; total: number } {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalCount);
    return {
      start,
      end,
      total: this.totalCount,
    };
  }

  // Prepare for add - opens modal in add mode
  prepareForAdd(): void {
    this.isEditMode = false;
    this.resetForm();
  }

  // Add new organizer
  addOrganizer(): void {
    if (!this.isOrganizerFormValid(false)) {
      this.toastr.error('Please fill all required fields', 'Error');
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.toastr.error('User not authenticated', 'Error');
      return;
    }

    this.currentOrganizer.created_by = userId;
    this.currentOrganizer.updated_by = userId;

    this.isLoading = true;

    this.apiService.addOrganizer(this.currentOrganizer).subscribe({
      next: (response: CommonResponseModel<OrganizerModel>) => {
        this.isLoading = false;
        if (response.status === 'Success' && response.data) {
          this.toastr.success(response.message || 'Organizer added successfully', 'Success');
          this.closeModal('organizerModal');
          this.loadOrganizers();
          this.resetForm();
        } else {
          this.toastr.error(response.message || 'Failed to add organizer', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Error adding organizer: ' + error.message, 'Error');
        console.error('Error adding organizer:', error);
      },
    });
  }

  // Edit organizer - opens modal in edit mode
  editOrganizer(organizer: OrganizerModel): void {
    this.isEditMode = true;
    this.selectedOrganizer = organizer;

    // Convert OrganizerModel to OrganizerRequest for form
    this.currentOrganizer = {
      first_name: organizer.first_name || '',
      last_name: organizer.last_name || '',
      email: organizer.email || '',
      mobile: organizer.mobile || '',
      password: '', // Don't show password in edit
      role_id: organizer.role_id || 2,
      org_name: organizer.org_name || '',
      org_start_date: organizer.org_start_date ? new Date(organizer.org_start_date.toString()) : undefined,
      bank_account_no: organizer.bank_account_no || '',
      bank_ifsc: organizer.bank_ifsc || '',
      bank_name: organizer.bank_name || '',
      beneficiary_name: organizer.beneficiary_name || '',
      aadhar_number: organizer.aadhar_number || '',
      pancard_number: organizer.pancard_number || '',
      owner_personal_email: organizer.owner_personal_email || '',
      owner_mobile: organizer.owner_mobile || '',
      state: organizer.state || '',
      city: organizer.city || '',
      country: organizer.country || '',
      gst_number: organizer.gst_number || '',
      instagram_link: organizer.instagram_link || '',
      youtube_link: organizer.youtube_link || '',
      facebook_link: organizer.facebook_link || '',
      twitter_link: organizer.twitter_link || '',
      created_by: this.authService.getCurrentUserId() || '',
      updated_by: this.authService.getCurrentUserId() || '',
    };
  }

  // Update organizer - FIXED VERSION
  updateOrganizer(): void {
    if (!this.selectedOrganizer?.organizer_id) {
      this.toastr.error('Organizer ID not found', 'Error');
      return;
    }

    if (!this.isOrganizerFormValid(true)) {
      this.toastr.error('Please fill all required fields', 'Error');
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.toastr.error('User not authenticated', 'Error');
      return;
    }

    this.currentOrganizer.updated_by = userId;

    // Create a new object without password if it's empty
    let requestData: any = { ...this.currentOrganizer };
    
    // If password is empty in edit mode, create a copy without the password property
    if (!requestData.password?.trim()) {
      const { password, ...rest } = requestData;
      requestData = rest;
    }

    this.isLoading = true;

    this.apiService
      .updateOrganizer(this.selectedOrganizer.organizer_id, requestData)
      .subscribe({
        next: (response: CommonResponseModel<OrganizerModel>) => {
          this.isLoading = false;
          if (response.status === 'Success' && response.data) {
            this.toastr.success(response.message || 'Organizer updated successfully', 'Success');
            this.closeModal('organizerModal');
            this.loadOrganizers();
            this.resetForm();
          } else {
            this.toastr.error(response.message || 'Failed to update organizer', 'Error');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Error updating organizer: ' + error.message, 'Error');
          console.error('Error updating organizer:', error);
        },
      });
  }

  // Alternative updateOrganizer method - Option 2 (using type assertion)
  updateOrganizerAlternative(): void {
    if (!this.selectedOrganizer?.organizer_id) {
      this.toastr.error('Organizer ID not found', 'Error');
      return;
    }

    if (!this.isOrganizerFormValid(true)) {
      this.toastr.error('Please fill all required fields', 'Error');
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.toastr.error('User not authenticated', 'Error');
      return;
    }

    this.currentOrganizer.updated_by = userId;

    // Create request data without using delete operator
    const requestData: Partial<OrganizerRequest> = {
      first_name: this.currentOrganizer.first_name,
      last_name: this.currentOrganizer.last_name,
      email: this.currentOrganizer.email,
      mobile: this.currentOrganizer.mobile,
      role_id: this.currentOrganizer.role_id,
      org_name: this.currentOrganizer.org_name,
      org_start_date: this.currentOrganizer.org_start_date,
      bank_account_no: this.currentOrganizer.bank_account_no,
      bank_ifsc: this.currentOrganizer.bank_ifsc,
      bank_name: this.currentOrganizer.bank_name,
      beneficiary_name: this.currentOrganizer.beneficiary_name,
      aadhar_number: this.currentOrganizer.aadhar_number,
      pancard_number: this.currentOrganizer.pancard_number,
      owner_personal_email: this.currentOrganizer.owner_personal_email,
      owner_mobile: this.currentOrganizer.owner_mobile,
      state: this.currentOrganizer.state,
      city: this.currentOrganizer.city,
      country: this.currentOrganizer.country,
      gst_number: this.currentOrganizer.gst_number,
      instagram_link: this.currentOrganizer.instagram_link,
      youtube_link: this.currentOrganizer.youtube_link,
      facebook_link: this.currentOrganizer.facebook_link,
      twitter_link: this.currentOrganizer.twitter_link,
      created_by: this.currentOrganizer.created_by,
      updated_by: this.currentOrganizer.updated_by,
    };

    // Only include password if it's not empty
    if (this.currentOrganizer.password?.trim()) {
      (requestData as any).password = this.currentOrganizer.password;
    }

    this.isLoading = true;

    this.apiService
      .updateOrganizer(this.selectedOrganizer.organizer_id, requestData as OrganizerRequest)
      .subscribe({
        next: (response: CommonResponseModel<OrganizerModel>) => {
          this.isLoading = false;
          if (response.status === 'Success' && response.data) {
            this.toastr.success(response.message || 'Organizer updated successfully', 'Success');
            this.closeModal('organizerModal');
            this.loadOrganizers();
            this.resetForm();
          } else {
            this.toastr.error(response.message || 'Failed to update organizer', 'Error');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Error updating organizer: ' + error.message, 'Error');
          console.error('Error updating organizer:', error);
        },
      });
  }

  // View organizer details
  viewOrganizer(organizer: OrganizerModel): void {
    this.selectedOrganizer = organizer;
  }

  // Prepare for delete
  prepareForDelete(organizer: OrganizerModel): void {
    this.organizerToDelete = organizer;
  }

  // Confirm and execute delete
  confirmDelete(): void {
    if (!this.organizerToDelete?.organizer_id) {
      this.toastr.error('Organizer not selected', 'Error');
      return;
    }

    this.isLoading = true;

    this.apiService.deleteOrganizer(this.organizerToDelete.organizer_id).subscribe({
      next: (response: CommonResponseModel<boolean>) => {
        this.isLoading = false;
        if (response.status === 'Success' && response.data) {
          this.toastr.success(response.message || 'Organizer deleted successfully', 'Success');
          this.closeModal('deleteOrganizerModal');
          this.loadOrganizers();
          this.organizerToDelete = null;
        } else {
          this.toastr.error(response.message || 'Failed to delete organizer', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Error deleting organizer: ' + error.message, 'Error');
        console.error('Error deleting organizer:', error);
      },
    });
  }

  // Update organizer status
  updateOrganizerStatus(organizerId: string, status: number): void {
    const statusText = status === 1 ? 'approve' : 'reject';

    if (!confirm(`Are you sure you want to ${statusText} this organizer?`)) {
      return;
    }

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.toastr.error('User not authenticated', 'Error');
      return;
    }

    const request: UpdateOrganizerStatusRequest = {
      organizer_id: organizerId,
      status: status,
      updated_by: userId,
    };

    this.isLoading = true;

    this.apiService.updateOrganizerStatus(request).subscribe({
      next: (response: CommonResponseModel<boolean>) => {
        this.isLoading = false;
        if (response.status === 'Success' && response.data) {
          this.toastr.success(`Organizer ${statusText}d successfully`, 'Success');
          this.loadOrganizers();
        } else {
          this.toastr.error(response.message || `Failed to ${statusText} organizer`, 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error(`Error ${statusText}ing organizer: ` + error.message, 'Error');
        console.error(`Error ${statusText}ing organizer:`, error);
      },
    });
  }

  // Form validation
  isOrganizerFormValid(isEdit: boolean = false): boolean {
    const requiredFields = [
      this.currentOrganizer.first_name?.trim(),
      this.currentOrganizer.last_name?.trim(),
      this.currentOrganizer.email?.trim(),
      this.currentOrganizer.mobile?.trim(),
      this.currentOrganizer.org_name?.trim()
    ];

    // Password is required only for add, not for edit
    if (!isEdit) {
      requiredFields.push(this.currentOrganizer.password?.trim());
    }

    return requiredFields.every(field => field && field.length > 0);
  }

  // Reset form
  resetForm(): void {
    this.currentOrganizer = this.initializeOrganizer();
    this.selectedOrganizer = null;
    this.isEditMode = false;
  }

  // Close modal properly - UPDATED VERSION
  closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    
    if (modalElement) {
      // Get the modal instance
      const modal = Modal.getInstance(modalElement) || new Modal(modalElement);
      
      // Hide the modal
      modal.hide();
      
      // Manually remove backdrop if exists
      this.removeModalBackdrop();
      
      // Reset form after modal is closed
      setTimeout(() => {
        this.resetForm();
      }, 300);
    }
  }

  // Method to manually remove backdrop
  removeModalBackdrop(): void {
    // Get all modal backdrops
    const backdrops = document.querySelectorAll('.modal-backdrop');
    
    // Remove each backdrop
    backdrops.forEach(backdrop => {
      backdrop.remove();
    });
    
    // Remove modal-open class from body
    document.body.classList.remove('modal-open');
    
    // Reset body style
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  // Get status text
  getStatusText(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  // Get status class for styling
  getStatusClass(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'badge bg-warning';
      case 'approved':
        return 'badge bg-success';
      case 'rejected':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  // Permission methods
  canAdd(): boolean {
    const roleId = this.authService.getUserRole();
    return roleId === 1; // Only Super Admin can add
  }

  canEdit(): boolean {
    const roleId = this.authService.getUserRole();
    return roleId === 1 || roleId === 2; // Super Admin and Admin can edit
  }

  canDelete(): boolean {
    const roleId = this.authService.getUserRole();
    return roleId === 1; // Only Super Admin can delete
  }

  canApproveReject(): boolean {
    const roleId = this.authService.getUserRole();
    return roleId === 1 || roleId === 2; // Super Admin and Admin can approve/reject
  }
}
