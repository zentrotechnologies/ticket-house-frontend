import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment';
import { TestimonialModel, UpdateTestimonialStatusRequest } from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-testimonial',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './testimonial.component.html',
  styleUrl: './testimonial.component.css',
})
export class TestimonialComponent implements OnInit {
  // Properties for data management
  testimonials: TestimonialModel[] = [];
  filteredTestimonials: TestimonialModel[] = [];
  allFilteredTestimonials: TestimonialModel[] = [];

  // Properties for form handling
  currentTestimonial: TestimonialModel = this.initializeTestimonial();
  testimonialToDelete: TestimonialModel | null = null;
  isEditMode: boolean = false;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

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
    this.loadTestimonials();
  }

  // Initialize empty testimonial
  private initializeTestimonial(): TestimonialModel {
    return {
      testimonial_id: 0,
      name: '',
      designation: '',
      profile_img: '',
      description: '',
      active: 1,
      created_by: '',
      created_on: '',
      updated_by: '',
      updated_on: ''
    };
  }

  // Load all testimonials - FIXED VERSION
  loadTestimonials(): void {
    this.isLoading = true;

    this.apiService.getAllTestimonials().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'Success' && response.data) {
          this.testimonials = response.data;
          this.applyFilterAndPagination();
          // this.toastr.success('Testimonials loaded successfully', 'Success');
        } else {
          this.toastr.error(response.message || 'Failed to load testimonials', 'Error');
          this.testimonials = []; // Ensure empty array on error
          this.applyFilterAndPagination();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Error loading testimonials: ' + error.message, 'Error');
        console.error('Error loading testimonials:', error);
        this.testimonials = []; // Ensure empty array on error
        this.applyFilterAndPagination();
      }
    });
  }

  // Apply search filter and pagination
  applyFilterAndPagination(): void {
    // Apply search filter
    if (this.searchText.trim()) {
      this.allFilteredTestimonials = this.testimonials.filter(testimonial =>
        testimonial.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        (testimonial.designation && testimonial.designation.toLowerCase().includes(this.searchText.toLowerCase())) ||
        testimonial.description.toLowerCase().includes(this.searchText.toLowerCase())
      );
    } else {
      this.allFilteredTestimonials = [...this.testimonials];
    }

    // Apply pagination
    this.totalPages = Math.ceil(this.allFilteredTestimonials.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  // Update paginated data based on current page
  updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredTestimonials = this.allFilteredTestimonials.slice(startIndex, endIndex);
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
    const end = Math.min(this.currentPage * this.itemsPerPage, this.allFilteredTestimonials.length);
    return {
      start,
      end,
      total: this.allFilteredTestimonials.length
    };
  }

  // File selection handler
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.toastr.error('Please select a valid image file (JPEG, PNG, GIF, BMP, WebP)', 'Error');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('File size should be less than 5MB', 'Error');
        return;
      }

      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Remove selected file
  removeSelectedFile(): void {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  // Get full image URL - FIXED VERSION
  getImageUrl(profileImg: string): string {
    // If no profile image, return default avatar from assets
    if (!profileImg || profileImg.trim() === '') {
      return 'assets/default-avatar.png'; // Make sure this file exists in your assets
    }
    
    // If it's already a full URL, return as is
    if (profileImg.startsWith('http')) {
      return profileImg;
    }
    
    // If it's a relative path starting with /, remove the leading slash for proper concatenation
    if (profileImg.startsWith('/')) {
      profileImg = profileImg.substring(1);
    }
    
    // Return full URL by combining base URL with relative path
    return environment.THapibaseurl + profileImg;
  }

  // Add new testimonial - FIXED to allow without image
  addTestimonial(): void {
    // Basic validation
    if (!this.currentTestimonial.name.trim()) {
      this.toastr.error('Name is required', 'Error');
      return;
    }

    if (!this.currentTestimonial.description.trim()) {
      this.toastr.error('Testimonial description is required', 'Error');
      return;
    }

    const currentUser = this.authService.getCurrentUserId();
    if (!currentUser) {
      this.toastr.error('User not authenticated', 'Error');
      return;
    }

    const formData = new FormData();
    formData.append('Name', this.currentTestimonial.name.trim());
    formData.append('Designation', this.currentTestimonial.designation.trim());
    formData.append('Description', this.currentTestimonial.description.trim());
    formData.append('Active', this.currentTestimonial.active.toString());
    formData.append('CreatedBy', currentUser);
    formData.append('UpdatedBy', currentUser);

    // FIX: Only append file if selected - it's optional
    if (this.selectedFile) {
      formData.append('ProfileImage', this.selectedFile);
    }

    this.isLoading = true;

    this.apiService.addTestimonial(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'Success' && response.data) {
          this.toastr.success('Testimonial added successfully', 'Success');
          this.closeModal('addTestimonialModal');
          this.loadTestimonials();
          this.resetForm();
        } else {
          this.toastr.error(response.message || 'Failed to add testimonial', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Error adding testimonial: ' + error.message, 'Error');
        console.error('Error adding testimonial:', error);
      }
    });
  }

  // Edit testimonial - prepare form with existing data
  editTestimonial(testimonial: TestimonialModel): void {
    this.isEditMode = true;
    this.currentTestimonial = { ...testimonial };
    this.imagePreview = this.getImageUrl(testimonial.profile_img);
    this.selectedFile = null;
  }

  // Update testimonial - FIXED to allow without image
  updateTestimonial(): void {
    // Basic validation
    if (!this.currentTestimonial.name.trim()) {
      this.toastr.error('Name is required', 'Error');
      return;
    }

    if (!this.currentTestimonial.description.trim()) {
      this.toastr.error('Testimonial description is required', 'Error');
      return;
    }

    const currentUser = this.authService.getCurrentUserId();
    if (!currentUser) {
      this.toastr.error('User not authenticated', 'Error');
      return;
    }

    const formData = new FormData();
    formData.append('TestimonialId', this.currentTestimonial.testimonial_id.toString());
    formData.append('Name', this.currentTestimonial.name.trim());
    formData.append('Designation', this.currentTestimonial.designation.trim());
    formData.append('Description', this.currentTestimonial.description.trim());
    formData.append('Active', this.currentTestimonial.active.toString());
    formData.append('UpdatedBy', currentUser);

    // FIX: Only append file if selected - it's optional
    if (this.selectedFile) {
      formData.append('ProfileImage', this.selectedFile);
    }

    this.isLoading = true;

    this.apiService.updateTestimonial(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'Success' && response.data) {
          this.toastr.success('Testimonial updated successfully', 'Success');
          this.closeModal('editTestimonialModal');
          this.loadTestimonials();
          this.resetForm();
        } else {
          this.toastr.error(response.message || 'Failed to update testimonial', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Error updating testimonial: ' + error.message, 'Error');
        console.error('Error updating testimonial:', error);
      }
    });
  }

  // Prepare for delete - set the testimonial to delete
  prepareForDelete(testimonial: TestimonialModel): void {
    this.testimonialToDelete = testimonial;
  }

  // Confirm and execute delete
  confirmDelete(): void {
    if (!this.testimonialToDelete) {
      return;
    }

    const currentUser = this.authService.getCurrentUserId();
    if (!currentUser) {
      this.toastr.error('User not authenticated', 'Error');
      this.closeModal('deleteTestimonialModal');
      return;
    }

    const updatedBy = currentUser.toString();
    this.isLoading = true;

    this.apiService.deleteTestimonial(this.testimonialToDelete.testimonial_id, updatedBy).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'Success') {
          this.toastr.success('Testimonial deleted successfully', 'Success');
          this.closeModal('deleteTestimonialModal');
          this.loadTestimonials();
          this.testimonialToDelete = null;
        } else {
          this.toastr.error(response.message || 'Failed to delete testimonial', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Error deleting testimonial: ' + error.message, 'Error');
        console.error('Error deleting testimonial:', error);
      }
    });
  }

  // Toggle testimonial status (active/inactive)
  toggleTestimonialStatus(testimonial: TestimonialModel): void {
    const currentUser = this.authService.getCurrentUserId();
    if (!currentUser) {
      this.toastr.error('User not authenticated', 'Error');
      return;
    }

    // Determine new status: if currently active (1), set to inactive (2), and vice versa
    const newStatus = testimonial.active === 1 ? 2 : 1;
    
    const statusRequest: UpdateTestimonialStatusRequest = {
      testimonial_id: testimonial.testimonial_id,
      active: newStatus,
      updated_by: currentUser
    };

    this.isLoading = true;

    this.apiService.updateTestimonialStatus(statusRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'Success') {
          // Update the local testimonial status
          testimonial.active = newStatus;
          this.toastr.success(response.message, 'Success');
        } else {
          // Revert the toggle if failed
          testimonial.active = testimonial.active === 1 ? 2 : 1;
          this.toastr.error(response.message || 'Failed to update status', 'Error');
        }
      },
      error: (error) => {
        this.isLoading = false;
        // Revert the toggle if error
        testimonial.active = testimonial.active === 1 ? 2 : 1;
        this.toastr.error('Error updating status: ' + error.message, 'Error');
        console.error('Error updating testimonial status:', error);
      }
    });
  }

  // Reset form
  resetForm(): void {
    this.currentTestimonial = this.initializeTestimonial();
    this.isEditMode = false;
    this.selectedFile = null;
    this.imagePreview = null;
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
