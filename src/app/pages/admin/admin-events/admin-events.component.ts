import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  EventCompleteResponseModel,
  EventDetailsModel,
  EventArtistModel,
  EventGalleryModel,
  EventPaginationRequest,
  EventCreateRequestModel,
  EventCategoryModel,
  EventSummaryData,
} from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.css',
})
export class AdminEventsComponent implements OnInit {
  @ViewChild('artistPhotoInput') artistPhotoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('artistPhotoInputEdit') artistPhotoInputEdit!: ElementRef<HTMLInputElement>;
  @ViewChild('closeAddModalBtn') closeAddModalBtn!: ElementRef<HTMLButtonElement>; // Add this
  @ViewChild('closeEditModalBtn') closeEditModalBtn!: ElementRef<HTMLButtonElement>; // Add this

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

  // Add these properties to the component
  newSeatType: any = {
    seat_name: '',
    price: 0,
    total_seats: 0,
  };

  seatTypes: any[] = [];

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

  eventIdToDelete: number = 0;
  isDeleting: boolean = false;

  eventSummary: EventSummaryData | null = null;
  isLoadingSummary: boolean = false;

  constructor(private apiService: ApiService, private authService: AuthService, private toastr: ToastrService) {}

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

    // Add this to your loadEvents method temporarily to debug
    console.log('Sending request with PageSize:', Number(this.pageSize), 'Type:', typeof Number(this.pageSize));
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
      this.toastr.warning('Please select an event category', 'Warning');
      return;
    }

    if (!this.userId) {
      this.toastr.warning('User not authenticated. Please login again.', 'Warning');
      return;
    }

    this.eventForm.organizer_id = this.userId;
    this.eventForm.created_by = this.userId;
    this.eventForm.updated_by = this.userId;

    this.isSubmitting = true;

    const formData = new FormData();

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
      gallery_media: '[]',
      artists: '[]',
      banner_image: '',
    };

    formData.append('EventDetails', JSON.stringify(eventDetails));

    if (this.bannerImage) {
      formData.append('BannerImageFile', this.bannerImage);
    }

    const artistsWithData = this.artists.map((artist) => {
      const artistCopy = { ...artist };
      artistCopy.created_on = new Date().toISOString();
      artistCopy.updated_on = new Date().toISOString();
      artistCopy.created_by = this.userId;
      artistCopy.updated_by = this.userId;
      return artistCopy;
    });
    formData.append('EventArtists', JSON.stringify(artistsWithData));

    const galleriesWithData = this.galleries.map((gallery) => {
      const galleryCopy = { ...gallery };
      galleryCopy.created_on = new Date().toISOString();
      galleryCopy.updated_on = new Date().toISOString();
      galleryCopy.created_by = this.userId;
      galleryCopy.updated_by = this.userId;
      return galleryCopy;
    });
    formData.append('EventGalleries', JSON.stringify(galleriesWithData));

    const seatTypesWithUserIds = this.seatTypes.map(seatType => {
        const seatTypeCopy = { ...seatType };
        seatTypeCopy.created_on = new Date().toISOString();
        seatTypeCopy.updated_on = new Date().toISOString();
        seatTypeCopy.created_by = this.userId;
        seatTypeCopy.updated_by = this.userId;
        seatTypeCopy.event_id = 0;
        return seatTypeCopy;
    });

    formData.append('SeatTypes', JSON.stringify(seatTypesWithUserIds));
    formData.append('createdBy', this.userId);

    this.debugFormData(formData);

    this.apiService.createEventWithArtistsAndGalleries(formData).subscribe({
      next: (response) => {
        if (response.status === 'Success') {
          this.toastr.success('Event created successfully!', 'Success');
          this.resetForm();
          this.loadEvents();
          this.closeModalProperly('addEventModal'); // Use proper close method
        } else {
          this.toastr.error(response.message || 'Failed to create event', 'Error');
        }
      },
      error: (error) => {
        console.error('Error creating event:', error);
        if (error.error?.errors) {
          const errorMessages = Object.values(error.error.errors).flat().join('\n');
          this.toastr.error('Validation errors:\n' + errorMessages, 'Error');
        } else if (error.error?.message) {
          this.toastr.error('Error: ' + error.error.message, 'Error');
        } else {
          this.toastr.error('Failed to create event: ' + error.message, 'Error');
        }
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  editEvent(event: EventCompleteResponseModel): void {
    this.isEditMode = true;
    this.selectedEvent = event;

    this.eventForm = { ...event.eventDetails };

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

    if (!this.eventForm.created_at) {
      this.eventForm.created_at = new Date().toISOString();
    }

    this.artists = [...event.eventArtists];
    this.galleries = [...event.eventGalleries];
    this.seatTypes = [...(event.seatTypes || [])];

    this.bannerImage = null;
    this.bannerPreviewUrl = null;

    this.loadEventSeatTypes(event.eventDetails.event_id);
    this.showModal('editEventModal');
  }

  updateEvent(): void {
    if (!this.validateEventForm()) {
      return;
    }

    if (!this.eventForm.event_category_id) {
      this.toastr.warning('Please select an event category', 'Warning');
      return;
    }

    if (!this.userId) {
      this.toastr.warning('User not authenticated. Please login again.', 'Warning');
      return;
    }

    this.eventForm.updated_by = this.userId;
    this.eventForm.updated_at = new Date().toISOString();

    this.isSubmitting = true;

    const formData = new FormData();

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

    if (this.bannerImage) {
      formData.append('BannerImageFile', this.bannerImage);
    }

    const currentDateTime = new Date().toISOString();
    const artistsWithUserIds = this.artists.map((artist) => ({
      ...artist,
      updated_by: this.userId,
      updated_on: currentDateTime,
    }));
    formData.append('EventArtists', JSON.stringify(artistsWithUserIds));

    const galleriesWithUserIds = this.galleries.map((gallery) => ({
      ...gallery,
      updated_by: this.userId,
      updated_on: currentDateTime,
    }));
    formData.append('EventGalleries', JSON.stringify(galleriesWithUserIds));

    const seatTypesWithUserIds = this.seatTypes.map(seatType => {
        const seatTypeCopy = { ...seatType };
        seatTypeCopy.updated_by = this.userId;
        seatTypeCopy.updated_on = new Date().toISOString();
        return seatTypeCopy;
    });

    formData.append('SeatTypes', JSON.stringify(seatTypesWithUserIds));
    formData.append('updatedBy', this.userId);

    this.debugFormData(formData);

    this.apiService.updateEventWithArtistsAndGalleries(formData).subscribe({
      next: (response) => {
        if (response.status === 'Success') {
          this.toastr.success('Event updated successfully!', 'Success');
          this.resetForm();
          this.loadEvents();
          this.closeModalProperly('editEventModal'); // Use proper close method
        } else {
          this.toastr.error(response.message || 'Failed to update event', 'Error');
        }
      },
      error: (error) => {
        console.error('Error updating event:', error);
        if (error.error?.errors) {
          const errorMessages = Object.values(error.error.errors).flat().join('\n');
          this.toastr.error('Validation errors:\n' + errorMessages, 'Error');
        } else if (error.error?.message) {
          this.toastr.error('Error: ' + error.error.message, 'Error');
        } else {
          this.toastr.error('Failed to update event: ' + error.message, 'Error');
        }
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  deleteEvent(eventId: number): void {
    this.eventIdToDelete = eventId;
    this.showModal('deleteConfirmModal');
  }

  confirmDelete(): void {
    if (!this.eventIdToDelete) {
      this.toastr.error('No event selected for deletion', 'Error');
      this.closeModalProperly('deleteConfirmModal');
      return;
    }

    this.isDeleting = true;
    const updatedBy = this.userId || 'system';

    this.apiService.deleteEventWithArtistsAndGalleries(this.eventIdToDelete, updatedBy).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.toastr.success('Event deleted successfully!', 'Success');
          this.loadEvents();
          this.closeModalProperly('deleteConfirmModal');
        } else {
          this.toastr.error(response.message || 'Failed to delete event', 'Error');
        }
      },
      error: (error) => {
        console.error('Error deleting event:', error);
        this.toastr.error('Failed to delete event', 'Error');
      },
      complete: () => {
        this.isDeleting = false;
        this.eventIdToDelete = 0;
      }
    });
  }

  viewEvent(eventId: number): void {
    this.apiService.getEventWithArtistsAndGalleries(eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.selectedEvent = response.data;
          this.toastr.info(`Viewing event: ${response.data.eventDetails.event_name}`, 'Info');
        } else {
          this.toastr.error(response.message || 'Event not found', 'Error');
        }
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.toastr.error('Failed to load event details', 'Error');
      },
    });
  }

  validateEventForm(): boolean {
    if (!this.eventForm.event_name.trim()) {
      this.toastr.warning('Event name is required', 'Warning');
      return false;
    }

    if (!this.eventForm.event_description.trim()) {
      this.toastr.warning('Event description is required', 'Warning');
      return false;
    }

    if (!this.eventForm.event_date) {
      this.toastr.warning('Event date is required', 'Warning');
      return false;
    }

    if (!this.eventForm.location.trim()) {
      this.toastr.warning('Location is required', 'Warning');
      return false;
    }

    if (!this.eventForm.full_address.trim()) {
      this.toastr.warning('Full address is required', 'Warning');
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
      gallery_media: '[]',
      age_limit: null,
      artists: '[]',
      terms_and_conditions: '',
      min_price: null,
      max_price: null,
      is_featured: false,
      status: 'draft',
      no_of_seats: null,
      created_by: this.eventForm.created_by || 'system',
      created_at: currentDate.toISOString(),
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
    this.seatTypes = [];
    this.resetSeatTypeForm();
  }

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

  // goToPage(page: number): void {
  //   if (page >= 1 && page <= this.totalPages) {
  //     this.currentPage = page;
  //     this.loadEvents();
  //   }
  // }

  goToPage(page: number): void {
    if (page >= 1 && (!this.totalPages || page <= this.totalPages)) {
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

  // getPageNumbers(): number[] {
  //   const pages: number[] = [];
  //   const maxVisiblePages = 5;

  //   if (this.totalPages <= maxVisiblePages) {
  //     for (let i = 1; i <= this.totalPages; i++) {
  //       pages.push(i);
  //     }
  //   } else {
  //     let startPage = Math.max(1, this.currentPage - 2);
  //     let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

  //     if (endPage - startPage + 1 < maxVisiblePages) {
  //       startPage = Math.max(1, endPage - maxVisiblePages + 1);
  //     }

  //     for (let i = startPage; i <= endPage; i++) {
  //       pages.push(i);
  //     }
  //   }

  //   return pages;
  // }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    
    if (this.totalPages <= 0) {
      return [1]; // Show page 1 when no pages yet
    }
    
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

  onPageSizeChange(): void {
    // Ensure pageSize is a number
    const newSize = Number(this.pageSize);
    console.log('=== PAGE SIZE CHANGE ===');
    console.log('Previous pageSize:', this.pageSize, 'Type:', typeof this.pageSize);
    console.log('New pageSize (converted):', newSize, 'Type:', typeof newSize);
    
    // Update with numeric value
    this.pageSize = newSize;
    this.currentPage = 1; // Reset to first page
    
    console.log('Updated pageSize property:', this.pageSize, 'Type:', typeof this.pageSize);
    console.log('Current page reset to:', this.currentPage);
    
    this.loadEvents();
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

  // IMPROVED MODAL METHODS - FIXED CLOSING ISSUES
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

  closeModal(modalId: string): void {
    this.closeModalProperly(modalId);
  }

  resetFormAndOpenModal(): void {
    this.resetForm();
    this.showModal('addEventModal');
  }

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
        pair[0] === 'EventDetails' ||
        pair[0] === 'SeatTypes'
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

  // Add seat type methods
  addSeatType(): void {
    if (!this.isValidSeatType()) {
      this.toastr.warning('Please fill all seat type fields correctly', 'Warning');
      return;
    }

    const seatType = {
      event_seat_type_inventory_id: 0,
      event_id: this.eventForm.event_id,
      seat_name: this.newSeatType.seat_name,
      price: this.newSeatType.price,
      total_seats: this.newSeatType.total_seats,
      available_seats: this.newSeatType.total_seats,
      created_by: this.userId,
      updated_by: this.userId,
      active: 1,
    };

    this.seatTypes.push(seatType);
    this.resetSeatTypeForm();
    this.toastr.success('Seat type added successfully', 'Success');
  }

  isValidSeatType(): boolean {
    return (
      this.newSeatType.seat_name?.trim().length > 0 &&
      this.newSeatType.price > 0 &&
      this.newSeatType.total_seats > 0
    );
  }

  resetSeatTypeForm(): void {
    this.newSeatType = {
      seat_name: '',
      price: 0,
      total_seats: 0,
    };
  }

  removeSeatType(index: number): void {
    this.seatTypes.splice(index, 1);
    this.toastr.info('Seat type removed', 'Info');
  }

  loadEventSeatTypes(eventId: number): void {
    this.apiService.getEventSeatTypes(eventId).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.seatTypes = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading seat types:', error);
      }
    });
  }

  // Add this method to view event summary
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
      }
    });
  }
}
