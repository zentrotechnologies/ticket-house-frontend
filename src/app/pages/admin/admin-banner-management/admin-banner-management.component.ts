import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { BannerManagementModel } from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-banner-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-banner-management.component.html',
  styleUrl: './admin-banner-management.component.css',
})
export class AdminBannerManagementComponent implements OnInit {
  @ViewChild('bannerImageInput') bannerImageInput!: ElementRef<HTMLInputElement>;
  
  banners: BannerManagementModel[] = [];
  filteredBanners: BannerManagementModel[] = [];
  
  // Form properties
  bannerForm: BannerManagementModel = {
    banner_id: 0,
    banner_img: '',
    action_link_url: '',
    created_by: '',
    created_on: '',
    updated_by: '',
    updated_on: null,
    active: 1
  };

  // Image handling
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null;
  isUploading: boolean = false;
  isSubmitting: boolean = false;
  isDeleting: boolean = false;
  
  // Search and filter
  searchText: string = '';
  bannerIdToDelete: number = 0;
  
  // Current user
  currentUser: any = null;
  userId: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadBanners();
  }

  loadCurrentUser(): void {
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      try {
        this.currentUser = JSON.parse(currentUserStr);
        this.userId = this.currentUser.user_id || '';
        
        if (!this.userId) {
          this.userId = this.authService.getCurrentUserId() || '';
        }
      } catch (error) {
        console.error('Error parsing current user:', error);
      }
    } else {
      this.userId = this.authService.getCurrentUserId() || '';
    }
  }

  loadBanners(): void {
    this.apiService.getAllBanners().subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.banners = response.data;
          this.applyFilter();
        } else {
          this.toastr.error(response.message || 'Failed to load banners', 'Error');
        }
      },
      error: (error) => {
        console.error('Error loading banners:', error);
        this.toastr.error('Failed to load banners', 'Error');
      }
    });
  }

  applyFilter(): void {
    if (!this.searchText.trim()) {
      this.filteredBanners = [...this.banners];
      return;
    }

    const searchLower = this.searchText.toLowerCase();
    this.filteredBanners = this.banners.filter(banner => 
      banner.action_link_url?.toLowerCase().includes(searchLower) ||
      banner.banner_id.toString().includes(searchLower)
    );
  }

  onSearch(): void {
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchText = '';
    this.applyFilter();
  }

  // Image handling
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.warning('File size must be less than 5MB', 'Warning');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.toastr.warning('Only image files are allowed (JPEG, PNG, GIF, WEBP)', 'Warning');
        return;
      }

      this.selectedImageFile = file;

      // Convert to Base64 for preview and storage
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrl = e.target.result;
        this.bannerForm.banner_img = e.target.result; // Store base64 directly
      };
      reader.readAsDataURL(file);
    }
  }

  clearImageSelection(): void {
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    this.bannerForm.banner_img = '';
    
    if (this.bannerImageInput?.nativeElement) {
      this.bannerImageInput.nativeElement.value = '';
    }
  }

  // Reset form
  resetForm(): void {
    this.bannerForm = {
      banner_id: 0,
      banner_img: '',
      action_link_url: '',
      created_by: this.userId,
      created_on: '',
      updated_by: this.userId,
      updated_on: null,
      active: 1
    };
    this.clearImageSelection();
  }

  // Open add modal
  openAddModal(): void {
    this.resetForm();
    this.showModal('addBannerModal');
  }

  // Open edit modal
  openEditModal(banner: BannerManagementModel): void {
    this.bannerForm = { ...banner };
    
    // Set preview URL from existing banner image
    if (banner.banner_img) {
      this.imagePreviewUrl = banner.banner_img;
    } else {
      this.imagePreviewUrl = null;
    }
    
    this.selectedImageFile = null;
    this.showModal('editBannerModal');
  }

  // Open delete modal
  openDeleteModal(bannerId: number): void {
    this.bannerIdToDelete = bannerId;
    this.showModal('deleteConfirmModal');
  }

  // Create banner
  createBanner(): void {
    if (!this.validateForm()) {
      return;
    }

    if (!this.userId) {
      this.toastr.warning('User not authenticated. Please login again.', 'Warning');
      return;
    }

    this.isSubmitting = true;

    const request = {
      banner_img: this.bannerForm.banner_img,
      action_link_url: this.bannerForm.action_link_url,
      created_by: this.userId
    };

    this.apiService.createBanner(request).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.toastr.success('Banner created successfully!', 'Success');
          this.loadBanners();
          this.closeModalProperly('addBannerModal');
          this.resetForm();
        } else {
          this.toastr.error(response.message || 'Failed to create banner', 'Error');
        }
      },
      error: (error) => {
        console.error('Error creating banner:', error);
        this.toastr.error(error.error?.message || 'Failed to create banner', 'Error');
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  // Update banner
  updateBanner(): void {
    if (!this.validateForm(true)) {
      return;
    }

    if (!this.userId) {
      this.toastr.warning('User not authenticated. Please login again.', 'Warning');
      return;
    }

    this.isSubmitting = true;

    const request: any = {
      action_link_url: this.bannerForm.action_link_url,
      updated_by: this.userId
    };

    // Only include banner_img if a new image was selected
    if (this.bannerForm.banner_img && this.selectedImageFile) {
      request.banner_img = this.bannerForm.banner_img;
    }

    this.apiService.updateBanner(this.bannerForm.banner_id, request).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.toastr.success('Banner updated successfully!', 'Success');
          this.loadBanners();
          this.closeModalProperly('editBannerModal');
          this.resetForm();
        } else {
          this.toastr.error(response.message || 'Failed to update banner', 'Error');
        }
      },
      error: (error) => {
        console.error('Error updating banner:', error);
        this.toastr.error(error.error?.message || 'Failed to update banner', 'Error');
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  // Delete banner
  confirmDelete(): void {
    if (!this.bannerIdToDelete) {
      this.toastr.error('No banner selected for deletion', 'Error');
      this.closeModalProperly('deleteConfirmModal');
      return;
    }

    this.isDeleting = true;

    this.apiService.deleteBanner(this.bannerIdToDelete).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.toastr.success('Banner deleted successfully!', 'Success');
          this.loadBanners();
          this.closeModalProperly('deleteConfirmModal');
        } else {
          this.toastr.error(response.message || 'Failed to delete banner', 'Error');
        }
      },
      error: (error) => {
        console.error('Error deleting banner:', error);
        this.toastr.error('Failed to delete banner', 'Error');
      },
      complete: () => {
        this.isDeleting = false;
        this.bannerIdToDelete = 0;
      }
    });
  }

  // Validate form
  validateForm(isUpdate: boolean = false): boolean {
    if (!this.bannerForm.action_link_url?.trim()) {
      this.toastr.warning('Action link URL is required', 'Warning');
      return false;
    }

    // Validate URL format
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(this.bannerForm.action_link_url)) {
      this.toastr.warning('Please enter a valid URL', 'Warning');
      return false;
    }

    // For create, image is required
    if (!isUpdate && !this.bannerForm.banner_img) {
      this.toastr.warning('Please select a banner image', 'Warning');
      return false;
    }

    return true;
  }

  // Modal methods
  showModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      modalElement.setAttribute('aria-modal', 'true');
      modalElement.setAttribute('role', 'dialog');
      document.body.classList.add('modal-open');
      
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
      try {
        // @ts-ignore
        const bootstrapModal = bootstrap.Modal.getInstance(modalElement);
        if (bootstrapModal) {
          bootstrapModal.hide();
        } else {
          this.manualCloseModal(modalElement);
        }
      } catch (error) {
        this.manualCloseModal(modalElement);
      }
      
      setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
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

  // Helper to get image source (already base64 from API)
  getImageSrc(base64String: string): string {
    return base64String || 'assets/images/default-banner.png';
  }
}
