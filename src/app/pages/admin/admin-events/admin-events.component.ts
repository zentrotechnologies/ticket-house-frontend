import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EventCompleteResponseModel,
  EventDetailsModel,
  EventArtistModel,
  EventGalleryModel,
  EventPaginationRequest,
  EventCreateRequestModel,
  EventCategoryModel,
} from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.css',
})
export class AdminEventsComponent implements OnInit {
  @ViewChild('artistPhotoInput') artistPhotoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('artistPhotoInputEdit') artistPhotoInputEdit!: ElementRef<HTMLInputElement>;

  currentUser: any = null;
  userId: string = ''; // Add this to store user ID
  events: EventCompleteResponseModel[] = [];
  totalEvents: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  searchText: string = '';
  statusFilter: string = '';
  fromDate: string = '';
  toDate: string = '';

  selectedEvent: EventCompleteResponseModel | null = null;
  isEditMode: boolean = false;

  // Event form
  eventForm: EventDetailsModel = {
    event_id: 0,
    organizer_id: '',
    event_name: '',
    event_description: '',
    event_date: new Date().toISOString().split('T')[0],
    start_time: '18:00',
    end_time: '22:00',
    total_duration_minutes: 240,
    location: '',
    full_address: '',
    geo_map_url: '',
    latitude: null,
    longitude: null,
    language: 'english',
    event_category_id: 0,
    banner_image: '',
    gallery_media: '',
    age_limit: null,
    artists: '',
    terms_and_conditions: '',
    min_price: null,
    max_price: null,
    is_featured: false,
    status: 'draft',
    no_of_seats: null,
    created_by: '',
    created_at: '',
    updated_by: '',
    updated_at: null,
    active: 1,
  };

  // Artists and Galleries
  artists: EventArtistModel[] = [];
  galleries: EventGalleryModel[] = [];

  // Banner image
  bannerImage: File | null = null;
  bannerPreviewUrl: string | null = null; // For preview

  // New artist/gallery
  newArtistName: string = '';
  newArtistPhoto: File | null = null;
  newArtistPreviewUrl: string | null = null;

  // Upload status
  isUploadingArtist: boolean = false;
  isUploadingGallery: boolean = false;
  isUploadingBanner: boolean = false;
  isSubmitting: boolean = false;

  // Categories
  categories: EventCategoryModel[] = [];
  isLoadingCategories: boolean = false;

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit(): void {
    // Get current user from localStorage or AuthService
    this.loadCurrentUser();
    this.loadCategories();
    this.loadEvents();

    // // Get current user from localStorage
    // const currentUserStr = localStorage.getItem('currentUser');
    // if (currentUserStr) {
    //   this.currentUser = JSON.parse(currentUserStr);
    //   this.userId = this.currentUser.user_id || ''; // Get user_id from currentUser

    //   // Set created_by and updated_by with user_id
    //   this.eventForm.created_by = this.userId;
    //   this.eventForm.updated_by = this.userId;
    // }
  }

  loadCurrentUser(): void {
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      try {
        this.currentUser = JSON.parse(currentUserStr);
        this.userId = this.currentUser.user_id || '';

        // Log for debugging
        console.log('Current User ID:', this.userId);

        if (!this.userId) {
          console.error('User ID not found in currentUser object');
          // Try to get from AuthService
          this.userId = this.authService.getCurrentUserId() || '';
        }

        // Set user ID in event form
        this.eventForm.created_by = this.userId;
        this.eventForm.updated_by = this.userId;
        this.eventForm.organizer_id = this.userId; // Set organizer_id with user_id
      } catch (error) {
        console.error('Error parsing current user:', error);
      }
    } else {
      // Try to get from AuthService
      this.userId = this.authService.getCurrentUserId() || '';
      if (this.userId) {
        this.eventForm.created_by = this.userId;
        this.eventForm.updated_by = this.userId;
        this.eventForm.organizer_id = this.userId;
      }
    }
  }

  loadCategories(): void {
    this.isLoadingCategories = true;

    this.apiService.getAllEventCategories().subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.categories = response.data;
        } else {
          console.error('Failed to load categories:', response.message);
          alert('Failed to load event categories');
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        alert('Error loading event categories');
        this.categories = [];
      },
      complete: () => {
        this.isLoadingCategories = false;
      },
    });
  }

  loadEvents(): void {
    const request: EventPaginationRequest = {
      created_by: this.userId,
      PageNumber: this.currentPage,
      PageSize: this.pageSize,
      SearchText: this.searchText,
      Status: this.statusFilter,
      FromDate: this.fromDate || null,
      ToDate: this.toDate || null,
    };

    this.apiService.getPaginatedEventsByCreatedBy(request).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.events = response.data;
          this.totalEvents = response.totalCount || 0;
          this.totalPages = response.totalPages || 0;
        }
      },
      error: (error) => {
        console.error('Error loading events:', error);
        alert('Failed to load events');
      },
    });
  }

  // Banner methods
  onBannerSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only image files are allowed');
        return;
      }

      this.bannerImage = file;

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.bannerPreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  clearBannerPreview(): void {
    this.bannerImage = null;
    this.bannerPreviewUrl = null;
  }

  // Artist methods
  onArtistPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        event.target.value = '';
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only image files are allowed');
        event.target.value = '';
        return;
      }

      this.newArtistPhoto = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newArtistPreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  addArtist(): void {
    if (!this.newArtistName.trim()) {
      alert('Please enter artist name');
      return;
    }

    if (!this.newArtistPhoto && this.eventForm.event_id > 0) {
      alert('Please select a photo for the artist');
      return;
    }

    // For new events, we'll save the file temporarily
    if (this.eventForm.event_id === 0) {
      const tempArtist: EventArtistModel = {
        event_artist_id: 0,
        event_id: 0,
        artist_name: this.newArtistName,
        artist_photo: this.newArtistPreviewUrl || '', // Store preview URL temporarily
        created_by: this.eventForm.created_by,
        created_on: new Date().toISOString(),
        updated_by: this.eventForm.created_by,
        updated_on: null,
        active: 1,
      };

      // Store the file with the artist
      (tempArtist as any).photoFile = this.newArtistPhoto;
      this.artists.push(tempArtist);

      this.resetArtistForm();
    } else {
      // For existing events, upload immediately
      this.isUploadingArtist = true;

      this.apiService
        .uploadArtistPhoto(this.eventForm.event_id, this.newArtistName, this.newArtistPhoto!)
        .subscribe({
          next: (response) => {
            if (response.status === 'Success' && response.data) {
              const artist: EventArtistModel = {
                event_artist_id: 0,
                event_id: this.eventForm.event_id,
                artist_name: this.newArtistName,
                artist_photo: response.data,
                created_by: this.eventForm.created_by,
                created_on: new Date().toISOString(),
                updated_by: this.eventForm.created_by,
                updated_on: null,
                active: 1,
              };

              this.artists.push(artist);
              this.resetArtistForm();
            } else {
              alert(response.message || 'Failed to upload artist photo');
            }
          },
          error: (error) => {
            console.error('Error uploading artist photo:', error);
            alert('Failed to upload artist photo');
          },
          complete: () => {
            this.isUploadingArtist = false;
          },
        });
    }
  }

  resetArtistForm(): void {
    this.newArtistName = '';
    this.newArtistPhoto = null;
    this.newArtistPreviewUrl = null;

    // Reset file input
    if (this.isEditMode && this.artistPhotoInputEdit?.nativeElement) {
      this.artistPhotoInputEdit.nativeElement.value = '';
    } else if (this.artistPhotoInput?.nativeElement) {
      this.artistPhotoInput.nativeElement.value = '';
    }
  }

  removeArtist(index: number): void {
    this.artists.splice(index, 1);
  }

  // Gallery methods
  onGalleryImageSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > 2 * 1024 * 1024) {
          alert(`File ${file.name} exceeds 2MB limit`);
          continue;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          alert(`File ${file.name} is not a valid image type`);
          continue;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const previewUrl = e.target.result;

          // For new events, store temporarily
          if (this.eventForm.event_id === 0) {
            const tempGallery: EventGalleryModel = {
              event_gallary_id: 0,
              event_id: 0,
              event_img: previewUrl, // Store preview URL temporarily
              created_by: this.eventForm.created_by,
              created_on: new Date().toISOString(),
              updated_by: this.eventForm.created_by,
              updated_on: null,
              active: 1,
            };

            // Store the file with the gallery
            (tempGallery as any).imageFile = file;
            this.galleries.push(tempGallery);
          } else {
            // For existing events, upload immediately
            this.uploadGalleryImage(file);
          }
        };
        reader.readAsDataURL(file);
      }

      event.target.value = '';
    }
  }

  uploadGalleryImage(file: File): void {
    this.isUploadingGallery = true;

    this.apiService.uploadGalleryImage(this.eventForm.event_id, file).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          const gallery: EventGalleryModel = {
            event_gallary_id: 0,
            event_id: this.eventForm.event_id,
            event_img: response.data,
            created_by: this.eventForm.created_by,
            created_on: new Date().toISOString(),
            updated_by: this.eventForm.created_by,
            updated_on: null,
            active: 1,
          };

          this.galleries.push(gallery);
        } else {
          alert(response.message || 'Failed to upload gallery image');
        }
      },
      error: (error) => {
        console.error('Error uploading gallery image:', error);
        alert('Failed to upload gallery image');
      },
      complete: () => {
        this.isUploadingGallery = false;
      },
    });
  }

  removeGallery(index: number): void {
    this.galleries.splice(index, 1);
  }

  // **UPDATED createEvent() method**
  //   createEvent(): void {
  //   if (!this.validateEventForm()) {
  //     return;
  //   }

  //   if (!this.eventForm.event_category_id) {
  //     alert('Please select an event category');
  //     return;
  //   }

  //   // Ensure user ID is set
  //   if (!this.userId) {
  //     alert('User not authenticated. Please login again.');
  //     return;
  //   }

  //   // Set all user-related fields
  //   this.eventForm.organizer_id = this.userId;
  //   this.eventForm.created_by = this.userId;
  //   this.eventForm.updated_by = this.userId;

  //   console.log('Creating event with user ID:', this.userId);
  //   console.log('Event form organizer_id:', this.eventForm.organizer_id);

  //   this.isSubmitting = true;

  //   // Create FormData
  //   const formData = new FormData();

  //   // Prepare event details with simple JSON strings
  //   const currentDate = new Date();
  //   const eventDetails = {
  //     ...this.eventForm,
  //     // Convert date string to proper Date object
  //     event_date: new Date(this.eventForm.event_date).toISOString().split('T')[0],
  //     start_time: this.eventForm.start_time,
  //     end_time: this.eventForm.end_time,
  //     // Set proper datetime values
  //     created_at: currentDate.toISOString(),
  //     updated_at: currentDate.toISOString(),
  //     organizer_id: this.userId,
  //     created_by: this.userId,
  //     updated_by: this.userId,
  //     latitude: this.eventForm.latitude || 0,
  //     longitude: this.eventForm.longitude || 0,
  //     min_price: this.eventForm.min_price || 0,
  //     max_price: this.eventForm.max_price || 0,
  //     age_limit: this.eventForm.age_limit || 0,
  //     no_of_seats: this.eventForm.no_of_seats || 0,
  //     // Simple empty JSON arrays as strings
  //     gallery_media: '[]',
  //     artists: '[]'
  //   };

  //   // Convert to JSON string
  //   formData.append('EventDetails', JSON.stringify(eventDetails));

  //   // Add banner image if selected
  //   if (this.bannerImage) {
  //     formData.append('BannerImageFile', this.bannerImage);
  //   }

  //   // Add artists data
  //   const artistsWithUserIds = this.artists.map(artist => {
  //     const artistCopy = { ...artist };
  //     // Set proper datetime for artists
  //     artistCopy.created_on = new Date().toISOString();
  //     artistCopy.updated_on = new Date().toISOString();
  //     artistCopy.created_by = this.userId;
  //     artistCopy.updated_by = this.userId;
  //     return artistCopy;
  //   });
  //   formData.append('EventArtists', JSON.stringify(artistsWithUserIds));

  //   // Add galleries data
  //   const galleriesWithUserIds = this.galleries.map(gallery => {
  //     const galleryCopy = { ...gallery };
  //     // Set proper datetime for galleries
  //     galleryCopy.created_on = new Date().toISOString();
  //     galleryCopy.updated_on = new Date().toISOString();
  //     galleryCopy.created_by = this.userId;
  //     galleryCopy.updated_by = this.userId;
  //     return galleryCopy;
  //   });
  //   formData.append('EventGalleries', JSON.stringify(galleriesWithUserIds));

  //   // Add createdBy field
  //   formData.append('createdBy', this.userId);

  //   // Debug: Log FormData contents
  //   this.debugFormData(formData);

  //   this.apiService.createEventWithArtistsAndGalleries(formData).subscribe({
  //     next: (response) => {
  //       if (response.status === 'Success') {
  //         alert('Event created successfully!');
  //         this.resetForm();
  //         this.loadEvents();
  //         this.closeModal('addEventModal');
  //       } else {
  //         alert(response.message || 'Failed to create event');
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error creating event:', error);
  //       if (error.error?.errors) {
  //         const errorMessages = Object.values(error.error.errors).flat().join('\n');
  //         alert('Validation errors:\n' + errorMessages);
  //       } else if (error.error?.message) {
  //         alert('Error: ' + error.error.message);
  //       } else {
  //         alert('Failed to create event: ' + error.message);
  //       }
  //     },
  //     complete: () => {
  //       this.isSubmitting = false;
  //     }
  //   });
  // }

  // Update the createEvent method to handle Base64 conversion
  // createEvent(): void {
  //   if (!this.validateEventForm()) {
  //     return;
  //   }

  //   if (!this.eventForm.event_category_id) {
  //     alert('Please select an event category');
  //     return;
  //   }

  //   // Ensure user ID is set
  //   if (!this.userId) {
  //     alert('User not authenticated. Please login again.');
  //     return;
  //   }

  //   // Set all user-related fields
  //   this.eventForm.organizer_id = this.userId;
  //   this.eventForm.created_by = this.userId;
  //   this.eventForm.updated_by = this.userId;

  //   this.isSubmitting = true;

  //   // Create FormData
  //   const formData = new FormData();

  //   // Prepare event details
  //   const currentDate = new Date();
  //   const eventDetails = {
  //     ...this.eventForm,
  //     event_date: new Date(this.eventForm.event_date).toISOString().split('T')[0],
  //     start_time: this.eventForm.start_time,
  //     end_time: this.eventForm.end_time,
  //     created_at: currentDate.toISOString(),
  //     updated_at: currentDate.toISOString(),
  //     organizer_id: this.userId,
  //     created_by: this.userId,
  //     updated_by: this.userId,
  //     latitude: this.eventForm.latitude || 0,
  //     longitude: this.eventForm.longitude || 0,
  //     min_price: this.eventForm.min_price || 0,
  //     max_price: this.eventForm.max_price || 0,
  //     age_limit: this.eventForm.age_limit || 0,
  //     no_of_seats: this.eventForm.no_of_seats || 0,
  //     gallery_media: '[]',
  //     artists: '[]',
  //   };

  //   formData.append('EventDetails', JSON.stringify(eventDetails));

  //   // Add banner image as Base64
  //   if (this.bannerImage) {
  //     this.convertFileToBase64(this.bannerImage).then((base64String) => {
  //       formData.append('BannerImageFile', base64String);
  //     });
  //   }

  //   // Convert artists' photos to Base64
  //   const convertArtistPhotos = async () => {
  //     const artistsWithBase64 = [];
  //     for (const artist of this.artists) {
  //       const artistCopy = { ...artist };
  //       artistCopy.created_on = new Date().toISOString();
  //       artistCopy.updated_on = new Date().toISOString();
  //       artistCopy.created_by = this.userId;
  //       artistCopy.updated_by = this.userId;

  //       // If artist has a photo file, convert to Base64
  //       if ((artist as any).photoFile) {
  //         artistCopy.artist_photo = await this.convertFileToBase64((artist as any).photoFile);
  //       }
  //       artistsWithBase64.push(artistCopy);
  //     }
  //     return artistsWithBase64;
  //   };

  //   // Convert gallery images to Base64
  //   const convertGalleryImages = async () => {
  //     const galleriesWithBase64 = [];
  //     for (const gallery of this.galleries) {
  //       const galleryCopy = { ...gallery };
  //       galleryCopy.created_on = new Date().toISOString();
  //       galleryCopy.updated_on = new Date().toISOString();
  //       galleryCopy.created_by = this.userId;
  //       galleryCopy.updated_by = this.userId;

  //       // If gallery has an image file, convert to Base64
  //       if ((gallery as any).imageFile) {
  //         galleryCopy.event_img = await this.convertFileToBase64((gallery as any).imageFile);
  //       }
  //       galleriesWithBase64.push(galleryCopy);
  //     }
  //     return galleriesWithBase64;
  //   };

  //   // Process all images and submit
  //   Promise.all([convertArtistPhotos(), convertGalleryImages()]).then(
  //     ([artistsWithBase64, galleriesWithBase64]) => {
  //       formData.append('EventArtists', JSON.stringify(artistsWithBase64));
  //       formData.append('EventGalleries', JSON.stringify(galleriesWithBase64));
  //       formData.append('createdBy', this.userId);

  //       this.apiService.createEventWithArtistsAndGalleries(formData).subscribe({
  //         next: (response) => {
  //           if (response.status === 'Success') {
  //             alert('Event created successfully!');
  //             this.resetForm();
  //             this.loadEvents();
  //             this.closeModal('addEventModal');
  //           } else {
  //             alert(response.message || 'Failed to create event');
  //           }
  //         },
  //         error: (error) => {
  //           console.error('Error creating event:', error);
  //           if (error.error?.errors) {
  //             const errorMessages = Object.values(error.error.errors).flat().join('\n');
  //             alert('Validation errors:\n' + errorMessages);
  //           } else if (error.error?.message) {
  //             alert('Error: ' + error.error.message);
  //           } else {
  //             alert('Failed to create event: ' + error.message);
  //           }
  //         },
  //         complete: () => {
  //           this.isSubmitting = false;
  //         },
  //       });
  //     }
  //   );
  // }

  createEvent(): void {
    if (!this.validateEventForm()) {
      return;
    }

    if (!this.eventForm.event_category_id) {
      alert('Please select an event category');
      return;
    }

    // Ensure user ID is set
    if (!this.userId) {
      alert('User not authenticated. Please login again.');
      return;
    }

    // Set all user-related fields
    this.eventForm.organizer_id = this.userId;
    this.eventForm.created_by = this.userId;
    this.eventForm.updated_by = this.userId;

    this.isSubmitting = true;

    // Create FormData
    const formData = new FormData();

    // Prepare event details
    const currentDate = new Date();
    const eventDetails = {
      ...this.eventForm,
      event_date: new Date(this.eventForm.event_date).toISOString().split('T')[0],
      start_time: this.eventForm.start_time,
      end_time: this.eventForm.end_time,
      created_at: currentDate.toISOString(),
      updated_at: currentDate.toISOString(),
      organizer_id: this.userId,
      created_by: this.userId,
      updated_by: this.userId,
      latitude: this.eventForm.latitude || 0,
      longitude: this.eventForm.longitude || 0,
      min_price: this.eventForm.min_price || 0,
      max_price: this.eventForm.max_price || 0,
      age_limit: this.eventForm.age_limit || 0,
      no_of_seats: this.eventForm.no_of_seats || 0,
      gallery_media: '[]', // Empty JSON array
      artists: '[]', // Empty JSON array
      // IMPORTANT: Clear banner_image field as we'll handle it separately
      banner_image: '',
    };

    formData.append('EventDetails', JSON.stringify(eventDetails));

    // Add banner image as file
    if (this.bannerImage) {
      formData.append('BannerImageFile', this.bannerImage);
    }

    // Add artists data (convert photos to Base64 on backend)
    const artistsWithData = this.artists.map((artist) => {
      const artistCopy = { ...artist };
      artistCopy.created_on = new Date().toISOString();
      artistCopy.updated_on = new Date().toISOString();
      artistCopy.created_by = this.userId;
      artistCopy.updated_by = this.userId;
      return artistCopy;
    });
    formData.append('EventArtists', JSON.stringify(artistsWithData));

    // Add galleries data (convert images to Base64 on backend)
    const galleriesWithData = this.galleries.map((gallery) => {
      const galleryCopy = { ...gallery };
      galleryCopy.created_on = new Date().toISOString();
      galleryCopy.updated_on = new Date().toISOString();
      galleryCopy.created_by = this.userId;
      galleryCopy.updated_by = this.userId;
      return galleryCopy;
    });
    formData.append('EventGalleries', JSON.stringify(galleriesWithData));

    // Add createdBy field
    formData.append('createdBy', this.userId);

    // Debug: Log FormData contents
    this.debugFormData(formData);

    this.apiService.createEventWithArtistsAndGalleries(formData).subscribe({
      next: (response) => {
        if (response.status === 'Success') {
          alert('Event created successfully!');
          this.resetForm();
          this.loadEvents();
          this.closeModal('addEventModal');
        } else {
          alert(response.message || 'Failed to create event');
        }
      },
      error: (error) => {
        console.error('Error creating event:', error);
        if (error.error?.errors) {
          const errorMessages = Object.values(error.error.errors).flat().join('\n');
          alert('Validation errors:\n' + errorMessages);
        } else if (error.error?.message) {
          alert('Error: ' + error.error.message);
        } else {
          alert('Failed to create event: ' + error.message);
        }
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  // Helper method to upload artist photos for new event
  async uploadArtistPhotosForNewEvent(formData: FormData): Promise<void> {
    // This would be called after event is created to upload photos
    // For now, we'll handle it in the backend
    return Promise.resolve();
  }

  // editEvent(event: EventCompleteResponseModel): void {
  //   this.isEditMode = true;
  //   this.selectedEvent = event;

  //   // Set event form
  //   this.eventForm = { ...event.EventDetails };

  //   // Parse JSON fields if they're strings
  //   if (typeof this.eventForm.gallery_media === 'string') {
  //     try {
  //       this.eventForm.gallery_media = JSON.parse(this.eventForm.gallery_media as string);
  //     } catch (e) {
  //       this.eventForm.gallery_media = JSON.stringify([]);
  //     }
  //   }

  //   if (typeof this.eventForm.artists === 'string') {
  //     try {
  //       this.eventForm.artists = JSON.parse(this.eventForm.artists as string);
  //     } catch (e) {
  //       this.eventForm.artists = JSON.stringify([]);
  //     }
  //   }

  //   // Ensure datetime fields are properly set
  //   if (!this.eventForm.created_at) {
  //     this.eventForm.created_at = new Date().toISOString();
  //   }

  //   // Set artists and galleries
  //   this.artists = [...event.EventArtists];
  //   this.galleries = [...event.EventGalleries];

  //   // Clear temporary files
  //   this.bannerImage = null;
  //   this.bannerPreviewUrl = null;

  //   // Show edit modal
  //   this.showModal('editEventModal');
  // }

  editEvent(event: EventCompleteResponseModel): void {
    this.isEditMode = true;
    this.selectedEvent = event;

    // Set event form - use eventDetails instead of EventDetails
    this.eventForm = { ...event.eventDetails };

    // Parse JSON fields if they're strings
    if (typeof this.eventForm.gallery_media === 'string') {
      try {
        this.eventForm.gallery_media = JSON.parse(this.eventForm.gallery_media as string);
      } catch (e) {
        this.eventForm.gallery_media = JSON.stringify([]);
      }
    }

    if (typeof this.eventForm.artists === 'string') {
      try {
        this.eventForm.artists = JSON.parse(this.eventForm.artists as string);
      } catch (e) {
        this.eventForm.artists = JSON.stringify([]);
      }
    }

    // Ensure datetime fields are properly set
    if (!this.eventForm.created_at) {
      this.eventForm.created_at = new Date().toISOString();
    }

    // Set artists and galleries - use eventArtists and eventGalleries
    this.artists = [...event.eventArtists];
    this.galleries = [...event.eventGalleries];

    // Clear temporary files
    this.bannerImage = null;
    this.bannerPreviewUrl = null;

    // Show edit modal
    this.showModal('editEventModal');
  }

  // Update the updateEvent() method:
  // updateEvent(): void {
  //   if (!this.validateEventForm()) {
  //     return;
  //   }

  //   if (!this.eventForm.event_category_id) {
  //     alert('Please select an event category');
  //     return;
  //   }

  //   // Set updated_by with current user ID
  //   this.eventForm.updated_by = this.userId;

  //   this.isSubmitting = true;

  //   // Create FormData with proper formatting
  //   const formData = new FormData();

  //   // Add event details as JSON string with correct key name
  //   const eventDetails = {
  //     ...this.eventForm,
  //     event_date: this.eventForm.event_date.toString(),
  //     start_time: this.eventForm.start_time.toString(),
  //     end_time: this.eventForm.end_time.toString(),
  //     updated_by: this.userId // Pass user_id as updated_by
  //   };

  //   formData.append('EventDetails', JSON.stringify(eventDetails));

  //   // Add banner image if selected
  //   if (this.bannerImage) {
  //     formData.append('BannerImageFile', this.bannerImage);
  //   }

  //   // Add artists data
  //   if (this.artists.length > 0) {
  //     const artistsData = this.artists.map(artist => {
  //       // Remove temporary file reference if exists
  //       const artistCopy = { ...artist };
  //       if ((artistCopy as any).photoFile) {
  //         delete (artistCopy as any).photoFile;
  //       }
  //       return artistCopy;
  //     });
  //     formData.append('EventArtists', JSON.stringify(artistsData));
  //   } else {
  //     formData.append('EventArtists', '[]');
  //   }

  //   // Add galleries data
  //   if (this.galleries.length > 0) {
  //     const galleriesData = this.galleries.map(gallery => {
  //       // Remove temporary file reference if exists
  //       const galleryCopy = { ...gallery };
  //       if ((galleryCopy as any).imageFile) {
  //         delete (galleryCopy as any).imageFile;
  //       }
  //       return galleryCopy;
  //     });
  //     formData.append('EventGalleries', JSON.stringify(galleriesData));
  //   } else {
  //     formData.append('EventGalleries', '[]');
  //   }

  //   // Add updated_by user
  //   const userEmail = this.currentUser?.email || 'system';
  //   formData.append('updatedBy', userEmail);

  //   this.apiService.updateEventWithArtistsAndGalleries(formData).subscribe({
  //     next: (response) => {
  //       if (response.status === 'Success') {
  //         alert('Event updated successfully!');
  //         this.resetForm();
  //         this.loadEvents();
  //         this.closeModal('editEventModal');
  //       } else {
  //         alert(response.message || 'Failed to update event');
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error updating event:', error);
  //       if (error.error?.errors) {
  //         // Display validation errors
  //         const errorMessages = Object.values(error.error.errors).flat().join('\n');
  //         alert('Validation errors:\n' + errorMessages);
  //       } else {
  //         alert('Failed to update event: ' + error.message);
  //       }
  //     },
  //     complete: () => {
  //       this.isSubmitting = false;
  //     }
  //   });
  // }

  // **UPDATED updateEvent() method**
  updateEvent(): void {
    if (!this.validateEventForm()) {
      return;
    }

    if (!this.eventForm.event_category_id) {
      alert('Please select an event category');
      return;
    }

    // Ensure user ID is set
    if (!this.userId) {
      alert('User not authenticated. Please login again.');
      return;
    }

    // Set updated_by with current user ID
    this.eventForm.updated_by = this.userId;
    this.eventForm.updated_at = new Date().toISOString();

    this.isSubmitting = true;

    // Create FormData
    const formData = new FormData();

    // Prepare event details with JSON handling
    const eventDetails = {
      ...this.eventForm,
      event_date: new Date(this.eventForm.event_date).toISOString().split('T')[0],
      start_time: this.eventForm.start_time,
      end_time: this.eventForm.end_time,
      updated_by: this.userId,
      updated_at: new Date().toISOString(),
      latitude: this.eventForm.latitude || 0,
      longitude: this.eventForm.longitude || 0,
      min_price: this.eventForm.min_price || 0,
      max_price: this.eventForm.max_price || 0,
      age_limit: this.eventForm.age_limit || 0,
      no_of_seats: this.eventForm.no_of_seats || 0,
      // Handle JSON fields properly
      gallery_media:
        this.galleries.length > 0
          ? JSON.stringify(this.galleries.map((g) => ({ image: g.event_img })))
          : JSON.stringify([]),
      artists:
        this.artists.length > 0
          ? JSON.stringify(
              this.artists.map((a) => ({
                name: a.artist_name,
                photo: a.artist_photo,
              }))
            )
          : JSON.stringify([]),
    };

    formData.append('EventDetails', JSON.stringify(eventDetails));

    // Add banner image if selected
    if (this.bannerImage) {
      formData.append('BannerImageFile', this.bannerImage);
    }

    // Add artists data
    const currentDateTime = new Date().toISOString();
    const artistsWithUserIds = this.artists.map((artist) => ({
      ...artist,
      updated_by: this.userId,
      updated_on: currentDateTime,
    }));
    formData.append('EventArtists', JSON.stringify(artistsWithUserIds));

    // Add galleries data
    const galleriesWithUserIds = this.galleries.map((gallery) => ({
      ...gallery,
      updated_by: this.userId,
      updated_on: currentDateTime,
    }));
    formData.append('EventGalleries', JSON.stringify(galleriesWithUserIds));

    // Add updatedBy field
    formData.append('updatedBy', this.userId);

    this.debugFormData(formData);

    this.apiService.updateEventWithArtistsAndGalleries(formData).subscribe({
      next: (response) => {
        if (response.status === 'Success') {
          alert('Event updated successfully!');
          this.resetForm();
          this.loadEvents();
          this.closeModal('editEventModal');
        } else {
          alert(response.message || 'Failed to update event');
        }
      },
      error: (error) => {
        console.error('Error updating event:', error);
        if (error.error?.errors) {
          const errorMessages = Object.values(error.error.errors).flat().join('\n');
          alert('Validation errors:\n' + errorMessages);
        } else if (error.error?.message) {
          alert('Error: ' + error.error.message);
        } else {
          alert('Failed to update event: ' + error.message);
        }
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  // deleteEvent(eventId: number): void {
  //   if (confirm('Are you sure you want to delete this event?')) {
  //     const updatedBy = this.userId || 'system';

  //     this.apiService.deleteEventWithArtistsAndGalleries(eventId, updatedBy).subscribe({
  //       next: (response) => {
  //         if (response.status === 'Success' && response.data) {
  //           alert('Event deleted successfully!');
  //           this.loadEvents();
  //         } else {
  //           alert(response.message || 'Failed to delete event');
  //         }
  //       },
  //       error: (error) => {
  //         console.error('Error deleting event:', error);
  //         alert('Failed to delete event');
  //       }
  //     });
  //   }
  // }

  deleteEvent(eventId: number): void {
    if (confirm('Are you sure you want to delete this event?')) {
      const updatedBy = this.userId || 'system';

      this.apiService.deleteEventWithArtistsAndGalleries(eventId, updatedBy).subscribe({
        next: (response) => {
          if (response.status === 'Success' && response.data) {
            alert('Event deleted successfully!');
            this.loadEvents();
          } else {
            alert(response.message || 'Failed to delete event');
          }
        },
        error: (error) => {
          console.error('Error deleting event:', error);
          alert('Failed to delete event');
        },
      });
    }
  }

  viewEvent(eventId: number): void {
    this.apiService.getEventWithArtistsAndGalleries(eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.selectedEvent = response.data;
          alert(`Viewing event: ${response.data.eventDetails.event_name}`);
        } else {
          alert(response.message || 'Event not found');
        }
      },
      error: (error) => {
        console.error('Error loading event:', error);
        alert('Failed to load event details');
      },
    });
  }

  validateEventForm(): boolean {
    if (!this.eventForm.event_name.trim()) {
      alert('Event name is required');
      return false;
    }

    if (!this.eventForm.event_description.trim()) {
      alert('Event description is required');
      return false;
    }

    if (!this.eventForm.event_date) {
      alert('Event date is required');
      return false;
    }

    if (!this.eventForm.location.trim()) {
      alert('Location is required');
      return false;
    }

    if (!this.eventForm.full_address.trim()) {
      alert('Full address is required');
      return false;
    }

    return true;
  }

  resetForm(): void {
    const currentDate = new Date();
    this.eventForm = {
      event_id: 0,
      organizer_id: '',
      event_name: '',
      event_description: '',
      event_date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      total_duration_minutes: 0,
      location: '',
      full_address: '',
      geo_map_url: '',
      latitude: null,
      longitude: null,
      language: 'hindi',
      event_category_id: 0,
      banner_image: '',
      // gallery_media: '',
      gallery_media: '[]', // Simple JSON string
      age_limit: null,
      // artists: '',
      artists: '[]', // Simple JSON string
      terms_and_conditions: '',
      min_price: null,
      max_price: null,
      is_featured: false,
      status: 'draft',
      no_of_seats: null,
      created_by: this.eventForm.created_by || 'system',
      created_at: currentDate.toISOString(), // Set current datetime
      updated_by: '',
      updated_at: currentDate.toISOString(),
      active: 1,
    };

    this.artists = [];
    this.galleries = [];
    this.bannerImage = null;
    this.bannerPreviewUrl = null;
    this.newArtistName = '';
    this.newArtistPhoto = null;
    this.newArtistPreviewUrl = null;
    this.isEditMode = false;
    this.selectedEvent = null;
  }

  // Helper methods (pagination, duration calculation, etc.)
  calculateDuration(): void {
    if (this.eventForm.start_time && this.eventForm.end_time) {
      const start = new Date(`2000-01-01T${this.eventForm.start_time}`);
      const end = new Date(`2000-01-01T${this.eventForm.end_time}`);

      let duration = (end.getTime() - start.getTime()) / (1000 * 60);

      if (duration < 0) {
        duration += 24 * 60;
      }

      this.eventForm.total_duration_minutes = Math.round(duration);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadEvents();
    }
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadEvents();
  }

  clearFilters(): void {
    this.searchText = '';
    this.statusFilter = '';
    this.fromDate = '';
    this.toDate = '';
    this.currentPage = 1;
    this.loadEvents();
  }

  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  triggerFileInput(): void {
    if (this.artistPhotoInput?.nativeElement) {
      this.artistPhotoInput.nativeElement.click();
    }
  }

  triggerFileInputEdit(): void {
    if (this.artistPhotoInputEdit?.nativeElement) {
      this.artistPhotoInputEdit.nativeElement.click();
    }
  }

  showModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  closeModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  resetFormAndOpenModal(): void {
    this.resetForm();
    this.showModal('addEventModal');
  }

  // Add this helper method to convert file to Base64
  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  debugFormData(formData: FormData): void {
    console.log('=== FormData Contents ===');
    for (let pair of (formData as any).entries()) {
      if (
        pair[0] === 'EventArtists' ||
        pair[0] === 'EventGalleries' ||
        pair[0] === 'EventDetails'
      ) {
        try {
          console.log(pair[0] + ': ', JSON.parse(pair[1]));
        } catch (e) {
          console.log(pair[0] + ': ', pair[1]);
        }
      } else {
        console.log(pair[0] + ': ', pair[1]);
      }
    }
    console.log('=========================');
  }
}
