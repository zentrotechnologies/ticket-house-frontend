import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import {
  EventCompleteResponseModel,
  EventDetailsModel,
  EventArtistModel,
  EventGalleryModel,
  EventPaginationRequest,
  EventCreateRequestModel,
  EventCategoryModel,
  EventSummaryData,
  AdminEventResponse,
} from '../../../core/models/auth.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CKEditorModule],
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.css',
})
export class AdminEventsComponent implements OnInit {
  // CKEditor configuration - using default import (not namespace import)
  public Editor = ClassicEditor as any;

  // CKEditor configuration options (using 'any' to avoid type conflicts)
  public editorConfig: any = {
    toolbar: {
      items: [
        'heading',
        '|',
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'subscript',
        'superscript',
        'code',
        '|',
        'fontSize',
        'fontFamily',
        'fontColor',
        'fontBackgroundColor',
        'highlight',
        '|',
        'alignment',
        '|',
        'bulletedList',
        'numberedList',
        'todoList',
        '|',
        'outdent',
        'indent',
        '|',
        'blockQuote',
        'insertTable',
        'mediaEmbed',
        'link',
        'imageUpload',
        '|',
        'horizontalLine',
        'pageBreak',
        '|',
        'specialCharacters',
        '|',
        'undo',
        'redo',
        '|',
        'removeFormat',
        'sourceEditing',
      ],
    },
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells',
        'tableProperties',
        'tableCellProperties',
      ],
    },
    image: {
      toolbar: ['imageTextAlternative', 'imageStyle:full', 'imageStyle:side', 'linkImage'],
    },
    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
        { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
        { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
        { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' },
      ],
    },
    fontSize: {
      options: ['tiny', 'small', 'default', 'big', 'huge'],
      supportAllValues: true,
    },
    fontFamily: {
      options: [
        'default',
        'Arial, Helvetica, sans-serif',
        'Courier New, Courier, monospace',
        'Georgia, serif',
        'Lucida Sans Unicode, Lucida Grande, sans-serif',
        'Tahoma, Geneva, sans-serif',
        'Times New Roman, Times, serif',
        'Trebuchet MS, Helvetica, sans-serif',
        'Verdana, Geneva, sans-serif',
      ],
      supportAllValues: true,
    },
    fontColor: {
      colors: [
        { color: 'hsl(0, 0%, 0%)', label: 'Black' },
        { color: 'hsl(0, 0%, 30%)', label: 'Dim grey' },
        { color: 'hsl(0, 0%, 60%)', label: 'Grey' },
        { color: 'hsl(0, 0%, 90%)', label: 'Light grey' },
        { color: 'hsl(0, 0%, 100%)', label: 'White', hasBorder: true },
        { color: 'hsl(0, 75%, 60%)', label: 'Red' },
        { color: 'hsl(30, 75%, 60%)', label: 'Orange' },
        { color: 'hsl(60, 75%, 60%)', label: 'Yellow' },
        { color: 'hsl(90, 75%, 60%)', label: 'Light green' },
        { color: 'hsl(120, 75%, 60%)', label: 'Green' },
        { color: 'hsl(150, 75%, 60%)', label: 'Aquamarine' },
        { color: 'hsl(180, 75%, 60%)', label: 'Turquoise' },
        { color: 'hsl(210, 75%, 60%)', label: 'Light blue' },
        { color: 'hsl(240, 75%, 60%)', label: 'Blue' },
        { color: 'hsl(270, 75%, 60%)', label: 'Purple' },
      ],
    },
    fontBackgroundColor: {
      colors: [
        { color: 'hsl(0, 0%, 0%)', label: 'Black' },
        { color: 'hsl(0, 0%, 30%)', label: 'Dim grey' },
        { color: 'hsl(0, 0%, 60%)', label: 'Grey' },
        { color: 'hsl(0, 0%, 90%)', label: 'Light grey' },
        { color: 'hsl(0, 75%, 60%)', label: 'Red' },
        { color: 'hsl(30, 75%, 60%)', label: 'Orange' },
        { color: 'hsl(60, 75%, 60%)', label: 'Yellow' },
        { color: 'hsl(90, 75%, 60%)', label: 'Light green' },
        { color: 'hsl(120, 75%, 60%)', label: 'Green' },
        { color: 'hsl(180, 75%, 60%)', label: 'Turquoise' },
        { color: 'hsl(210, 75%, 60%)', label: 'Light blue' },
        { color: 'hsl(240, 75%, 60%)', label: 'Blue' },
        { color: 'hsl(270, 75%, 60%)', label: 'Purple' },
      ],
    },
    alignment: {
      options: ['left', 'center', 'right', 'justify'],
    },
    placeholder: 'Enter event description here...',
    link: {
      addTargetToExternalLinks: true,
      defaultProtocol: 'https://',
    },
    list: {
      properties: {
        styles: true,
        startIndex: true,
        reversed: true,
      },
    },
    codeBlock: {
      languages: [
        { language: 'plaintext', label: 'Plain text' },
        { language: 'html', label: 'HTML' },
        { language: 'css', label: 'CSS' },
        { language: 'javascript', label: 'JavaScript' },
        { language: 'typescript', label: 'TypeScript' },
        { language: 'json', label: 'JSON' },
        { language: 'sql', label: 'SQL' },
        { language: 'python', label: 'Python' },
        { language: 'java', label: 'Java' },
        { language: 'csharp', label: 'C#' },
        { language: 'php', label: 'PHP' },
      ],
    },
    language: 'en',
  };

  public termsEditorConfig: any = {
    toolbar: {
      items: [
        'heading',
        '|',
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'subscript',
        'superscript',
        '|',
        'fontSize',
        'fontFamily',
        'fontColor',
        'fontBackgroundColor',
        'highlight',
        '|',
        'alignment',
        '|',
        'bulletedList',
        'numberedList',
        '|',
        'blockQuote',
        'insertTable',
        'link',
        '|',
        'horizontalLine',
        '|',
        'specialCharacters',
        '|',
        'undo',
        'redo',
        '|',
        'removeFormat',
      ],
    },
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells',
        'tableProperties',
        'tableCellProperties',
      ],
    },
    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
        { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
        { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
        { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' },
      ],
    },
    fontSize: {
      options: ['tiny', 'small', 'default', 'big', 'huge'],
      supportAllValues: true,
    },
    fontFamily: {
      options: [
        'default',
        'Arial, Helvetica, sans-serif',
        'Courier New, Courier, monospace',
        'Georgia, serif',
        'Lucida Sans Unicode, Lucida Grande, sans-serif',
        'Tahoma, Geneva, sans-serif',
        'Times New Roman, Times, serif',
        'Trebuchet MS, Helvetica, sans-serif',
        'Verdana, Geneva, sans-serif',
      ],
      supportAllValues: true,
    },
    alignment: {
      options: ['left', 'center', 'right', 'justify'],
    },
    placeholder: 'Enter terms and conditions here...',
    link: {
      addTargetToExternalLinks: true,
      defaultProtocol: 'https://',
    },
  };

  editingSeatIndex: number = -1;
  editingSeatType: any = {
    event_seat_type_inventory_id: 0,
    event_id: 0,
    seat_name: '',
    price: 0,
    total_seats: 0,
    available_seats: 0,
    is_sold_out: false,
    created_by: '',
    created_on: '',
    updated_by: '',
    updated_on: null,
    active: 1,
  };

  isUpdatingSeatType: boolean = false;

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
    convenience_fee: 0.0, // Add this line
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

  isAdmin: boolean = false;
  adminEvents: AdminEventResponse[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastr: ToastrService,
  ) { }

  ngOnInit(): void {
    // Get current user from localStorage or AuthService
    this.loadCurrentUser();
    // this.isAdmin = this.authService.isAdminUser();

    // Debug logging
    console.log('Current user:', this.currentUser);
    console.log('User role_id:', this.currentUser?.role_id);
    console.log('Is admin from authService:', this.authService.isAdminUser());
    console.log('Is admin from direct check:', this.currentUser?.role_id === 1);

    // Check if user is admin using the currentUser object
    this.isAdmin = this.currentUser?.role_id === 1 || this.authService.isAdminUser();
    console.log('Final isAdmin value:', this.isAdmin);

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

  // loadCurrentUser(): void {
  //   const currentUserStr = localStorage.getItem('currentUser');
  //   if (currentUserStr) {
  //     try {
  //       this.currentUser = JSON.parse(currentUserStr);
  //       this.userId = this.currentUser.user_id || '';

  //       // Log for debugging
  //       console.log('Current User ID:', this.userId);

  //       if (!this.userId) {
  //         console.error('User ID not found in currentUser object');
  //         // Try to get from AuthService
  //         this.userId = this.authService.getCurrentUserId() || '';
  //       }

  //       // Set user ID in event form
  //       this.eventForm.created_by = this.userId;
  //       this.eventForm.updated_by = this.userId;
  //       this.eventForm.organizer_id = this.userId; // Set organizer_id with user_id
  //     } catch (error) {
  //       console.error('Error parsing current user:', error);
  //     }
  //   } else {
  //     // Try to get from AuthService
  //     this.userId = this.authService.getCurrentUserId() || '';
  //     if (this.userId) {
  //       this.eventForm.created_by = this.userId;
  //       this.eventForm.updated_by = this.userId;
  //       this.eventForm.organizer_id = this.userId;
  //     }
  //   }
  // }

  loadCurrentUser(): void {
    console.log('=== loadCurrentUser called ===');

    // Method 1: Try to get from AuthService's BehaviorSubject
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user;
      this.userId = user.user_id || '';
      console.log('User loaded from AuthService:', this.currentUser);
      return;
    }

    // Method 2: Try to get from localStorage using the correct key
    const userDataStr = localStorage.getItem(environment.USERDATA_KEY);
    console.log('USERDATA_KEY:', environment.USERDATA_KEY);
    console.log('Raw user data from localStorage:', userDataStr);

    if (userDataStr) {
      try {
        // Parse the login response
        const loginResponse = JSON.parse(userDataStr);
        console.log('Parsed login response:', loginResponse);

        // Extract user data from the login response
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
        console.log('User loaded successfully:', this.currentUser);
        console.log('User role_id:', this.currentUser.role_id);

        // Also update AuthService's BehaviorSubject
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

          // Check if it has user data
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
            console.log('User loaded from key:', key, this.currentUser);
            return;
          }
        } catch (e) {
          // Continue to next key
        }
      }
    }

    // Method 4: Try to get from JWT token
    const token = localStorage.getItem('jwt_token');
    if (token) {
      try {
        // Decode JWT token to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT payload:', payload);

        if (payload.email || payload.sub) {
          this.currentUser = {
            user_id: payload.sub || payload.user_id || '',
            first_name: payload.first_name || '',
            last_name: payload.last_name || '',
            email: payload.email || '',
            mobile: payload.mobile || '',
            country_code: payload.country_code || '',
            profile_img: payload.profile_img || null,
            role_id: parseInt(payload.role_id) || 0,
          };
          this.userId = this.currentUser.user_id || '';
          console.log('User loaded from JWT token:', this.currentUser);
          return;
        }
      } catch (e) {
        console.error('Error decoding JWT token:', e);
      }
    }

    console.error('Could not load user data from any source');
    this.currentUser = null;
    this.userId = '';
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

  // loadEvents(): void {
  //   const request: EventPaginationRequest = {
  //     created_by: this.userId,
  //     PageNumber: this.currentPage,
  //     PageSize: this.pageSize,
  //     SearchText: this.searchText,
  //     Status: this.statusFilter,
  //     FromDate: this.fromDate || null,
  //     ToDate: this.toDate || null,
  //   };

  //   this.apiService.getPaginatedEventsByCreatedBy(request).subscribe({
  //     next: (response) => {
  //       if (response.status === 'Success' && response.data) {
  //         this.events = response.data;
  //         this.totalEvents = response.totalCount || 0;
  //         this.totalPages = response.totalPages || 0;
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error loading events:', error);
  //       alert('Failed to load events');
  //     },
  //   });

  //   // Add this to your loadEvents method temporarily to debug
  //   console.log('Sending request with PageSize:', Number(this.pageSize), 'Type:', typeof Number(this.pageSize));
  // }

  loadEvents(): void {
    // Check if user is admin
    const isAdmin = this.currentUser?.role_id === 1 || this.authService.isAdminUser();

    if (isAdmin) {
      // Admin - get all events from all organizers
      this.loadAdminEvents();
    } else {
      // Organizer - get only their events
      this.loadOrganizerEvents();
    }
  }

  loadAdminEvents(): void {
    const request: any = {
      PageNumber: this.currentPage,
      PageSize: this.pageSize,
      SearchText: this.searchText,
      Status: this.statusFilter,
      FromDate: this.fromDate || null,
      ToDate: this.toDate || null,
    };

    this.apiService.getPaginatedAdminEvents(request).subscribe({
      next: (response) => {
        if (response.status === 'Success' && response.data) {
          this.adminEvents = response.data;
          // Fix: Map to full EventCompleteResponseModel structure
          this.events = response.data.map((event: AdminEventResponse) => ({
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
              // Store organizer info for display
              organizer_name: event.organizer_name,
              organizer_email: event.organizer_email,
              organizer_mobile: event.organizer_mobile,
              organizer_country_code: event.organizer_country_code,
            } as any,
            // Add these required properties with empty arrays
            // eventArtists: event.artist_list || [],
            // eventGalleries: event.gallery_list || [],
            eventArtists: event.artist_list || [], // Changed from event.artists
            eventGalleries: event.gallery_list || [], // Changed from event.galleries
            // Add optional properties if needed
            eventMedia: [],
            seatTypes: [],
          }));
          this.totalEvents = response.totalCount || 0;
          this.totalPages = response.totalPages || 0;
        }
      },
      error: (error) => {
        console.error('Error loading admin events:', error);
        this.toastr.error('Failed to load events', 'Error');
      },
    });
  }

  // Helper method to get organizer display name
  getOrganizerDisplayName(event: any): string {
    if (this.isAdmin) {
      return event.eventDetails.organizer_name || event.eventDetails.organizer_email || 'N/A';
    }
    return '';
  }

  loadOrganizerEvents(): void {
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
        this.toastr.error('Failed to load events', 'Error');
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
      convenience_fee: this.eventForm.convenience_fee || 0.0, // Add this line
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

    const seatTypesWithUserIds = this.seatTypes.map((seatType) => {
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

  // Helper method to format date for input field
  formatDateForInput(dateValue: any): string {
    if (!dateValue) return '';

    // If it's already a string in YYYY-MM-DD format
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }

    // If it's a Date object
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }

    // If it's an ISO string like "2026-04-30T00:00:00"
    if (typeof dateValue === 'string' && dateValue.includes('T')) {
      return dateValue.split('T')[0];
    }

    return '';
  }

  editEvent(event: EventCompleteResponseModel): void {
    this.isEditMode = true;
    this.selectedEvent = event;

    this.eventForm = { ...event.eventDetails };

    // FIX: Format the date properly for the date input field
    this.eventForm.event_date = this.formatDateForInput(this.eventForm.event_date);

    // Also format start_time and end_time
    if (this.eventForm.start_time) {
      const timeParts = this.eventForm.start_time.split(':');
      if (timeParts.length >= 2) {
        this.eventForm.start_time = `${timeParts[0]}:${timeParts[1]}`;
      }
    }

    if (this.eventForm.end_time) {
      const timeParts = this.eventForm.end_time.split(':');
      if (timeParts.length >= 2) {
        this.eventForm.end_time = `${timeParts[0]}:${timeParts[1]}`;
      }
    }

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
      convenience_fee: this.eventForm.convenience_fee || 0.0, // Add this line
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
            })),
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

    const seatTypesWithUserIds = this.seatTypes.map((seatType) => {
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
      },
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

    // if (!this.eventForm.event_description.trim()) {
    //   this.toastr.warning('Event description is required', 'Warning');
    //   return false;
    // }

    // Check if event_description contains actual content (not just empty HTML)
    const descriptionText = this.stripHtmlTags(this.eventForm.event_description || '');
    if (!descriptionText.trim()) {
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
      convenience_fee: 0.0, // Add this line
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

    this.editingSeatIndex = -1;
    this.editingSeatType = {
      seat_name: '',
      price: 0,
      total_seats: 0,
      available_seats: 0,
      event_seat_type_inventory_id: 0,
    };
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

  // addSeatType(): void {
  //   if (!this.isValidSeatType()) {
  //     this.toastr.warning('Please fill all seat type fields correctly', 'Warning');
  //     return;
  //   }

  //   const seatType = {
  //     event_seat_type_inventory_id: 0,
  //     event_id: this.eventForm.event_id,
  //     seat_name: this.newSeatType.seat_name,
  //     price: this.newSeatType.price,
  //     total_seats: this.newSeatType.total_seats,
  //     available_seats: this.newSeatType.total_seats,
  //     created_by: this.userId,
  //     updated_by: this.userId,
  //     active: 1,
  //     is_sold_out: false
  //   };

  //   this.seatTypes.push(seatType);
  //   this.resetSeatTypeForm();
  //   this.toastr.success('Seat type added successfully', 'Success');
  //   // Force change detection
  //   this.seatTypes = [...this.seatTypes];
  // }

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

  // removeSeatType(index: number): void {
  //   this.seatTypes.splice(index, 1);
  //   this.toastr.info('Seat type removed', 'Info');
  // }

  removeSeatType(index: number): void {
    const seatType = this.seatTypes[index];
    if (!seatType) return;

    // Check if this is an existing seat type (has ID) or a new one
    if (seatType.event_seat_type_inventory_id > 0 && this.eventForm.event_id > 0) {
      // For existing seat types, check with API if bookings exist
      this.checkSeatTypeBookingsAndDelete(seatType, index);
    } else {
      // For new seat types (not saved to DB yet), can delete directly
      this.confirmAndDeleteSeatType(index);
    }
  }

  private checkSeatTypeBookingsAndDelete(seatType: any, index: number): void {
    this.isUpdatingSeatType = true;

    // First check if the seat type has bookings
    this.apiService.checkSeatTypeBookings(seatType.event_seat_type_inventory_id).subscribe({
      next: (response) => {
        this.isUpdatingSeatType = false;
        if (response.status === 'Success' && response.data) {
          // Seat type has bookings - show error message
          this.toastr.error(
            `Cannot delete "${seatType.seat_name}". ${response.data} ticket(s) have already been booked for this seat type.`,
            'Delete Blocked'
          );
        } else {
          // No bookings, proceed with delete confirmation
          this.confirmAndDeleteSeatType(index);
        }
      },
      error: (error) => {
        this.isUpdatingSeatType = false;
        console.error('Error checking seat type bookings:', error);
        // If API check fails, ask user to try again or proceed with caution
        this.toastr.warning('Unable to verify bookings. Please try again.', 'Verification Failed');
      }
    });
  }

  private confirmAndDeleteSeatType(index: number): void {
    const seatType = this.seatTypes[index];
    const seatName = seatType.seat_name || 'this seat type';

    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete "${seatName}"? This action cannot be undone.`)) {
      return;
    }

    // If this is an existing event (edit mode) and seat type has an ID, delete via API
    if (this.isEditMode && this.eventForm.event_id > 0 &&
      seatType.event_seat_type_inventory_id > 0) {
      this.deleteSeatTypeViaAPI(index);
    } else {
      // For new events or unsaved seat types, just remove from local array
      this.seatTypes.splice(index, 1);
      this.toastr.success('Seat type removed successfully', 'Success');
      this.seatTypes = [...this.seatTypes];
    }
  }

  private deleteSeatTypeViaAPI(index: number): void {
    const seatType = this.seatTypes[index];
    this.isUpdatingSeatType = true;

    this.apiService.deleteEventSeatType(seatType.event_seat_type_inventory_id, this.userId).subscribe({
      next: (response) => {
        this.isUpdatingSeatType = false;
        if (response.status === 'Success' && response.data) {
          // Remove from local array
          this.seatTypes.splice(index, 1);
          this.toastr.success('Seat type deleted successfully', 'Success');
          this.seatTypes = [...this.seatTypes];
        } else {
          // Check if this is a booking conflict error
          if (response.errorCode === '409') {
            this.toastr.error(
              response.message || 'Cannot delete seat type with existing bookings.',
              'Delete Blocked'
            );
          } else {
            this.toastr.error(response.message || 'Failed to delete seat type', 'Error');
          }
        }
      },
      error: (error) => {
        this.isUpdatingSeatType = false;
        console.error('Error deleting seat type:', error);

        // Parse error response
        let errorMessage = 'Failed to delete seat type';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Check if it's a conflict (409) 
        if (error.status === 409) {
          this.toastr.error(errorMessage || 'Cannot delete seat type with existing bookings.', 'Delete Blocked');
        } else {
          this.toastr.error(errorMessage, 'Error');
        }
      }
    });
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
      },
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
      },
    });
  }

  // Helper method to strip HTML tags for preview display (optional)
  stripHtmlTags(html: string): string {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  // Update the startEditSeatType method
  startEditSeatType(index: number): void {
    const seatType = this.seatTypes[index];
    console.log('Starting edit for seat type:', seatType);

    // Calculate booked seats from total - available
    const bookedSeats = (seatType.total_seats || 0) - (seatType.available_seats || 0);

    // Make a deep copy - handle all fields with defaults
    this.editingSeatType = {
      event_seat_type_inventory_id: seatType.event_seat_type_inventory_id || 0,
      event_id: seatType.event_id || this.eventForm.event_id || 0,
      seat_name: seatType.seat_name || '',
      price: seatType.price || 0,
      total_seats: seatType.total_seats || 0,
      available_seats: seatType.available_seats || 0,
      booked_seats: bookedSeats,
      is_sold_out: seatType.is_sold_out || false,
      created_by: seatType.created_by || '',
      created_on: seatType.created_on || new Date().toISOString(),
      updated_by: seatType.updated_by || '',
      updated_on: seatType.updated_on || null,
      active: seatType.active !== undefined ? seatType.active : 1
    };

    this.editingSeatIndex = index;
    console.log('Editing seat type after copy:', this.editingSeatType);
  }

  // Update the saveEditSeatType method
  saveEditSeatType(index: number): void {
    console.log('Saving seat type with values:', this.editingSeatType);

    // Validate edited data
    if (!this.editingSeatType.seat_name?.trim()) {
      this.toastr.warning('Seat name is required', 'Warning');
      return;
    }

    if (this.editingSeatType.price <= 0) {
      this.toastr.warning('Price must be greater than 0', 'Warning');
      return;
    }

    // Validate available seats - must not be negative
    if (this.editingSeatType.available_seats < 0) {
      this.toastr.warning('Available seats cannot be negative', 'Warning');
      return;
    }

    // Calculate total_seats from booked + available
    const bookedSeats = this.editingSeatType.booked_seats || 0;
    const newTotalSeats = bookedSeats + this.editingSeatType.available_seats;

    // Ensure total seats is at least available seats
    if (newTotalSeats < this.editingSeatType.available_seats) {
      this.toastr.warning('Total seats cannot be less than available seats', 'Warning');
      return;
    }

    // Update the total_seats in editing object
    this.editingSeatType.total_seats = newTotalSeats;

    // If this is an existing event (edit mode), update via API
    if (
      this.isEditMode &&
      this.eventForm.event_id > 0 &&
      this.editingSeatType.event_seat_type_inventory_id > 0
    ) {
      this.updateSeatTypeViaAPI(this.editingSeatType, index);
    } else {
      // For new events, just update locally
      this.seatTypes[index] = {
        ...this.editingSeatType,
      };
      this.toastr.success('Seat type updated successfully', 'Success');
      this.cancelEditSeatType();
    }
  }

  // Update updateSeatTypeViaAPI to send the correct data
  updateSeatTypeViaAPI(seatTypeData: any, index: number): void {
    this.isUpdatingSeatType = true;

    const updateData = {
      event_seat_type_inventory_id: seatTypeData.event_seat_type_inventory_id,
      event_id: this.eventForm.event_id || 0,
      seat_name: seatTypeData.seat_name,
      price: seatTypeData.price,
      available_seats: seatTypeData.available_seats,
      total_seats: seatTypeData.total_seats,
      updated_by: this.userId
    };

    console.log('Sending update data:', updateData);

    this.apiService.updateEventSeatType(updateData).subscribe({
      next: (response) => {
        this.isUpdatingSeatType = false;
        console.log('Update response:', response);

        if (response.status === 'Success') {
          this.toastr.success('Seat type updated successfully', 'Success');

          if (response.data) {
            // Update the local array with the response data
            const foundIndex = this.seatTypes.findIndex(
              st => st.event_seat_type_inventory_id === response.data.event_seat_type_inventory_id
            );

            if (foundIndex !== -1) {
              // Calculate booked seats from the updated data
              const updatedBookedSeats = (response.data.total_seats || 0) - (response.data.available_seats || 0);

              this.seatTypes[foundIndex] = {
                ...this.seatTypes[foundIndex],
                seat_name: response.data.seat_name || this.seatTypes[foundIndex].seat_name,
                price: response.data.price || this.seatTypes[foundIndex].price,
                total_seats: response.data.total_seats || 0,
                available_seats: response.data.available_seats || 0,
                booked_seats: updatedBookedSeats,
                is_sold_out: response.data.is_sold_out || false,
                updated_by: response.data.updated_by || this.userId,
                updated_on: response.data.updated_on || new Date().toISOString(),
                // Handle nullable fields properly
                created_on: response.data.created_on || this.seatTypes[foundIndex].created_on || new Date().toISOString(),
                created_by: response.data.created_by || this.seatTypes[foundIndex].created_by || this.userId
              };
            }
          }

          this.cancelEditSeatType();
          this.seatTypes = [...this.seatTypes];
        } else {
          this.toastr.error(response.message || 'Failed to update seat type', 'Error');
        }
      },
      error: (error) => {
        this.isUpdatingSeatType = false;
        console.error('Error updating seat type:', error);

        // Parse error message if possible
        let errorMessage = 'Failed to update seat type';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        this.toastr.error(errorMessage, 'Error');
      }
    });
  }

  // Cancel editing
  cancelEditSeatType(): void {
    this.editingSeatIndex = -1;
    this.editingSeatType = {
      seat_name: '',
      price: 0,
      total_seats: 0,
      available_seats: 0,
      booked_seats: 0,
      event_seat_type_inventory_id: 0,
    };
    this.isUpdatingSeatType = false;
  }

  // Add a new method to add seat types with correct calculation
  addSeatType(): void {
    if (!this.isValidSeatType()) {
      this.toastr.warning('Please fill all seat type fields correctly', 'Warning');
      return;
    }

    // When adding a new seat type, available = total (no bookings yet)
    const seatType = {
      event_seat_type_inventory_id: 0,
      event_id: this.eventForm.event_id,
      seat_name: this.newSeatType.seat_name,
      price: this.newSeatType.price,
      total_seats: this.newSeatType.total_seats,
      available_seats: this.newSeatType.total_seats, // Initially available = total
      booked_seats: 0, // No bookings initially
      created_by: this.userId,
      updated_by: this.userId,
      active: 1,
      is_sold_out: false,
    };

    this.seatTypes.push(seatType);
    this.resetSeatTypeForm();
    this.toastr.success('Seat type added successfully', 'Success');
    this.seatTypes = [...this.seatTypes];
  }

  // Mark seat type as sold out
  markSeatTypeAsSoldOut(index: number): void {
    const seatType = this.seatTypes[index];

    if (seatType.available_seats === 0) {
      this.toastr.info('This seat type is already sold out', 'Info');
      return;
    }

    // Confirmation dialog
    if (
      !confirm(
        `Are you sure you want to mark "${seatType.seat_name}" as SOLD OUT? This will set remaining seats to 0.`,
      )
    ) {
      return;
    }

    // If this is an existing event, update via API
    if (this.isEditMode && this.eventForm.event_id > 0) {
      this.apiService
        .markSeatTypeAsSoldOut(seatType.event_seat_type_inventory_id, this.userId)
        .subscribe({
          next: (response) => {
            if (response.status === 'Success') {
              this.toastr.success(
                `"${seatType.seat_name}" marked as sold out successfully`,
                'Success',
              );
              // Update the local array
              this.seatTypes[index].available_seats = 0;
              this.seatTypes[index].is_sold_out = true;
              // Force change detection
              this.seatTypes = [...this.seatTypes];
            } else {
              this.toastr.error(response.message || 'Failed to mark as sold out', 'Error');
            }
          },
          error: (error) => {
            console.error('Error marking seat type as sold out:', error);
            this.toastr.error('Failed to mark seat type as sold out', 'Error');
          },
        });
    } else {
      // For new events, just update locally
      this.seatTypes[index].available_seats = 0;
      this.seatTypes[index].is_sold_out = true;
      this.seatTypes = [...this.seatTypes];
      this.toastr.success(`"${seatType.seat_name}" marked as sold out`, 'Success');
    }
  }

  // Reload seat types from API
  reloadSeatTypes(): void {
    if (this.eventForm.event_id > 0) {
      this.apiService.getEventSeatTypes(this.eventForm.event_id).subscribe({
        next: (response) => {
          if (response.status === 'Success' && response.data) {
            this.seatTypes = response.data;
            console.log('Reloaded seat types:', this.seatTypes);
          }
        },
        error: (error) => {
          console.error('Error reloading seat types:', error);
        },
      });
    }
  }

  recalculateTotalSeats(): void {
    if (this.editingSeatType) {
      const bookedSeats = this.editingSeatType.booked_seats || 0;
      const availableSeats = this.editingSeatType.available_seats || 0;
      this.editingSeatType.total_seats = bookedSeats + availableSeats;
    }
  }
}
