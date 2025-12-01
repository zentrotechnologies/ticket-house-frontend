import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EventCategoryModel, EventCategoryRequest, UpdateEventCategoryStatusRequest } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-event-category',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './event-category.component.html',
  styleUrl: './event-category.component.css',
})
export class EventCategoryComponent implements OnInit {
  // Properties for data management
  eventCategories: EventCategoryModel[] = [];
  filteredCategories: EventCategoryModel[] = [];
  allFilteredCategories: EventCategoryModel[] = []; // Store all filtered categories for pagination

  // Properties for form handling
  currentCategory: EventCategoryModel = this.initializeCategory();
  categoryToDelete: EventCategoryModel | null = null;
  isEditMode: boolean = false;

  // Properties for UI state
  isLoading: boolean = false;
  searchText: string = '';
  itemsPerPage: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.loadEventCategories();
  }

  // Initialize empty category
  private initializeCategory(): EventCategoryModel {
    return {
      event_category_id: 0,
      event_category_name: '',
      event_category_desc: '',
      created_by: '',
      created_on: '',
      updated_by: '',
      updated_on: '',
      active: 1
    };
  }

  // Load all event categories
  loadEventCategories(): void {
    this.isLoading = true;

    this.apiService.getAllEventCategories().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'Success' && response.data) {
          this.eventCategories = response.data;
          this.applyFilterAndPagination();
        } else {
          this.toastr.error(response.message || 'Failed to load event categories', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Error loading event categories: ' + error.message, 'Error');
        console.error('Error loading event categories:', error);
      }
    });
  }

  // Apply search filter and pagination
  applyFilterAndPagination(): void {
    // Apply search filter
    if (this.searchText.trim()) {
      this.allFilteredCategories = this.eventCategories.filter(category =>
        category.event_category_name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        category.event_category_desc.toLowerCase().includes(this.searchText.toLowerCase())
      );
    } else {
      this.allFilteredCategories = [...this.eventCategories];
    }

    // Apply pagination
    this.totalPages = Math.ceil(this.allFilteredCategories.length / this.itemsPerPage);
    this.currentPage = 1; // Reset to first page when filtering
    this.updatePaginatedData();
  }

  // Update paginated data based on current page
  updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredCategories = this.allFilteredCategories.slice(startIndex, endIndex);
  }

  // Search functionality
  onSearch(): void {
    this.applyFilterAndPagination();
  }

  // Items per page change
  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Calculate display range for pagination info
  getDisplayRange(): { start: number, end: number, total: number } {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.allFilteredCategories.length);
    return {
      start,
      end,
      total: this.allFilteredCategories.length
    };
  }

  // Add new event category
  addEventCategory(): void {
    // Basic validation
    if (!this.currentCategory.event_category_name.trim()) {
      this.toastr.error('Event category name is required', 'Error');
      return;
    }

    const currentUser = this.authService.getCurrentUserId();
    if (!currentUser) {
      this.toastr.error('User not authenticated', 'Error');
      return;
    }

    const categoryRequest: EventCategoryRequest = {
      event_category_name: this.currentCategory.event_category_name.trim(),
      event_category_desc: this.currentCategory.event_category_desc.trim(),
      created_by: currentUser,
      updated_by: currentUser
    };

    this.isLoading = true;

    this.apiService.addEventCategory(categoryRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'Success' && response.data) {
          this.toastr.success('Event category added successfully', 'Success');
          this.closeModal('addCategoryModal');
          this.loadEventCategories(); // Reload the list
          this.resetForm();
        } else {
          this.toastr.error(response.message || 'Failed to add event category', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Error adding event category: ' + error.message, 'Error');
        console.error('Error adding event category:', error);
      }
    });
  }

  // Edit event category - prepare form with existing data
  editEventCategory(category: EventCategoryModel): void {
    this.isEditMode = true;
    this.currentCategory = { ...category };
  }

  // Update event category
  updateEventCategory(): void {
    // Basic validation
    if (!this.currentCategory.event_category_name.trim()) {
      this.toastr.error('Event category name is required', 'Error');
      return;
    }

    const currentUser = this.authService.getCurrentUserId();
    if (!currentUser) {
      this.toastr.error('User not authenticated', 'Error');
      return;
    }

    this.currentCategory.updated_by = currentUser;
    this.isLoading = true;

    this.apiService.updateEventCategory(this.currentCategory).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'Success' && response.data) {
          this.toastr.success('Event category updated successfully', 'Success');
          this.closeModal('editCategoryModal');
          this.loadEventCategories(); // Reload the list
          this.resetForm();
        } else {
          this.toastr.error(response.message || 'Failed to update event category', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Error updating event category: ' + error.message, 'Error');
        console.error('Error updating event category:', error);
      }
    });
  }

  // Prepare for delete - set the category to delete
  prepareForDelete(category: EventCategoryModel): void {
    this.categoryToDelete = category;
  }

  // Confirm and execute delete
  confirmDelete(): void {
    if (!this.categoryToDelete) {
      return;
    }

    const currentUser = this.authService.getCurrentUserId();
    if (!currentUser) {
      this.toastr.error('User not authenticated', 'Error');
      this.closeModal('deleteCategoryModal');
      return;
    }

    const updatedBy = currentUser.toString();
    this.isLoading = true;

    this.apiService.deleteEventCategory(this.categoryToDelete.event_category_id, updatedBy).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'Success') {
          this.toastr.success('Event category deleted successfully', 'Success');
          this.closeModal('deleteCategoryModal');
          this.loadEventCategories(); // Reload the list
          this.categoryToDelete = null;
        } else {
          this.toastr.error(response.message || 'Failed to delete event category', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Error deleting event category: ' + error.message, 'Error');
        console.error('Error deleting event category:', error);
      }
    });
  }

  // Toggle category status (active/inactive)
  toggleCategoryStatus(category: EventCategoryModel): void {
    const currentUser = this.authService.getCurrentUserId();
    if (!currentUser) {
      this.toastr.error('User not authenticated', 'Error');
      return;
    }

    // Determine new status: if currently active (1), set to inactive (2), and vice versa
    const newStatus = category.active === 1 ? 2 : 1;
    
    const statusRequest: UpdateEventCategoryStatusRequest = {
      event_category_id: category.event_category_id,
      active: newStatus,
      updated_by: currentUser
    };

    this.isLoading = true;

    this.apiService.updateEventCategoryStatus(statusRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'Success') {
          // Update the local category status
          category.active = newStatus;
          this.toastr.success(response.message, 'Success');
          
          // If you want to reload the entire list instead:
          // this.loadEventCategories();
        } else {
          // Revert the toggle if failed
          category.active = category.active === 1 ? 2 : 1;
          this.toastr.error(response.message || 'Failed to update status', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        // Revert the toggle if error
        category.active = category.active === 1 ? 2 : 1;
        this.toastr.error('Error updating status: ' + error.message, 'Error');
        console.error('Error updating event category status:', error);
      }
    });
  }

  // Reset form
  resetForm(): void {
    this.currentCategory = this.initializeCategory();
    this.isEditMode = false;
  }

  // Close modal using Bootstrap's JavaScript
  closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    this.resetForm();
  }

  // Prepare for add mode
  prepareForAdd(): void {
    this.resetForm();
    this.isEditMode = false;
  }

  // Get status text
  getStatusText(active: number): string {
    return active === 1 ? 'Active' : 'Inactive';
  }
}
