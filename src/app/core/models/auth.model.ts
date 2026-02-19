//-----Login-----
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user_id: string;
  token: string;
  refresh_token: string;
  token_expiry: string;
  refresh_token_expiry: string;
  user_role: string | null;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  country_code: string;
  profile_img: string | null;
  role_id: number;
  is_otp_required: boolean;
  validationotp_id: string | null;
  tempToken: string | null;
  response: CommonResponse;
}

//-----Common Response----- 
export interface CommonResponse {
  status: string;
  success: string | null;
  message: string;
  errorCode: string | null;
  data: any | null;
}

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  country_code: string;
  profile_img: string | null;
  role_id: number;
}

//-----Sign-Up-----
export interface SignUpRequest {
  first_name?: string;
  last_name?: string;
  email: string;
  country_code?: string;
  mobile?: string;
  password: string;
  role_id: number;

  // Event Organizer specific fields
  org_name?: string;
  org_start_date?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  bank_name?: string;
  beneficiary_name?: string;
  aadhar_number?: string;
  pancard_number?: string;
  owner_personal_email?: string;
  owner_mobile?: string;
  state?: string;
  city?: string;
  country?: string;
  gst_number?: string;
  instagram_link?: string;
  youtube_link?: string;
  facebook_link?: string;
  twitter_link?: string;
}

export interface SignUpResponse {
  response: CommonResponse;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

//-----OTP Models-----
export interface GenerateOTPRequest {
  contact_type: string;
  email?: string;
  mobile?: string;
  country_code?: string;
  newUser: boolean;
}

export interface VerifyOTPRequest {
  otp_id: number;
  otp: string;
  email?: string;
  mobile?: string;
  contact_type: string;
}

export interface ResendOTPRequest {
  otp_id: number;
}

export interface OTPResponse {
  response: CommonResponse;
  validationotp_id: number;
}

export interface ResendOTPResponse {
  response: CommonResponse;
  new_otp_id: number;
}

//----- Event Category Models -----
export interface EventCategoryModel {
  event_category_id: number;
  event_category_name: string;
  event_category_desc: string;
  created_by: string;
  created_on: string;
  updated_by: string;
  updated_on: string;
  active: number;
}

export interface EventCategoryRequest {
  event_category_name: string;
  event_category_desc: string;
  created_by?: string;
  updated_by?: string;
}

export interface UpdateEventCategoryStatusRequest {
  event_category_id: number;
  active: number;
  updated_by: string;
}

export interface CommonResponseModel<T> {
  status: string;
  message: string;
  errorCode: string;
  data: T;
}

// export interface PagedResponse<T> {
//   status: string;
//   message: string;
//   errorCode: string;
//   data: T;
//   totalPages: number;
//   currentPage: number;
//   pageSize: number;
// }

// Update PagedResponse interface
export interface PagedResponse<T> {
  status: string;
  message: string;
  errorCode: string;
  data?: T;
  totalCount?: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  success?: boolean;
}

export interface UserIdRequest {
  user_id: string;
  pageNumber: number;
  pageSize: number;
  filterText?: string;
  filterType?: string;
}

// Testimonial Models
export interface TestimonialModel {
  testimonial_id: number;
  name: string;
  designation: string;
  profile_img: string;
  description: string;
  active: number;
  created_by: string;
  created_on: string;
  updated_by: string;
  updated_on: string;
}

export interface TestimonialRequest {
  name: string;
  designation: string;
  description: string;
  active: number;
  created_by: string;
  updated_by: string;
  profile_image?: File;
}

export interface UpdateTestimonialStatusRequest {
  testimonial_id: number;
  active: number;
  updated_by: string;
}

// Organizer Model
export interface OrganizerModel {
  user_id?: string;
  organizer_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  role_id?: number;
  role_name?: string;
  org_name?: string;
  org_start_date?: string | Date;
  bank_account_no?: string;
  bank_ifsc?: string;
  bank_name?: string;
  beneficiary_name?: string;
  aadhar_number?: string;
  pancard_number?: string;
  owner_personal_email?: string;
  owner_mobile?: string;
  state?: string;
  city?: string;
  country?: string;
  gst_number?: string;
  instagram_link?: string;
  youtube_link?: string;
  facebook_link?: string;
  twitter_link?: string;
  verification_status?: string;
  active?: number;
  created_on?: string;
  password?: string;
}

// Update OrganizerRequest interface
export interface OrganizerRequest {
  first_name?: string;
  last_name?: string;
  email: string;
  country_code?: string;
  mobile?: string;
  password: string;
  role_id: number;
  org_name?: string;
  org_start_date?: Date;
  bank_account_no?: string;
  bank_ifsc?: string;
  bank_name?: string;
  beneficiary_name?: string;
  aadhar_number?: string;
  pancard_number?: string;
  owner_personal_email?: string;
  owner_mobile?: string;
  state?: string;
  city?: string;
  country?: string;
  gst_number?: string;
  instagram_link?: string;
  youtube_link?: string;
  facebook_link?: string;
  twitter_link?: string;
  created_by: string;
  updated_by: string;
}

// Update UpdateOrganizerStatusRequest interface
export interface UpdateOrganizerStatusRequest {
  organizer_id: string;
  status: number; // 1 for approve, 0 for reject
  updated_by: string;
}

// Update PaginationRequest interface
export interface PaginationRequest {
  pageNumber: number;
  pageSize: number;
  filterText?: string;
  filterType?: string;
  filterFlag?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface OrganizerPagedResponse extends PagedResponse<OrganizerModel[]> {}

// Event Models
export interface EventDetailsModel {
  event_id: number;
  organizer_id?: string;
  event_name: string;
  event_description: string;
  event_date: string | Date;
  start_time: string;
  end_time: string;
  total_duration_minutes: number;
  location: string;
  full_address: string;
  geo_map_url: string;
  latitude: number | null;
  longitude: number | null;
  language: string;
  event_category_id: number;
  event_category_name?: string; //to display in event booking
  banner_image: string;
  gallery_media: string; // JSON string
  // gallery_media: any; // Changed from string to any for JSON object
  age_limit: number | null;
  artists: string; // JSON string
  // artists: any; // Changed from string to any for JSON object
  terms_and_conditions: string;
  min_price: number | null;
  max_price: number | null;
  is_featured: boolean;
  status: string;
  no_of_seats: number | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string | null;
  active: number;
  convenience_fee: number; // Add this line
}

export interface EventArtistModel {
  event_artist_id: number;
  event_id: number;
  artist_name: string;
  artist_photo: string;
  created_by: string;
  created_on: string;
  updated_by: string;
  updated_on: string | null;
  active: number;
}

export interface EventGalleryModel {
  event_gallary_id: number;
  event_id: number;
  event_img: string;
  created_by: string;
  created_on: string;
  updated_by: string;
  updated_on: string | null;
  active: number;
}

export interface EventMediaModel {
  event_media_id: number;
  event_id: number;
  media_type: string;
  media_url: string;
  created_by: string;
  created_on: string;
  updated_by: string;
  updated_on: string | null;
  active: number;
}

// export interface EventCompleteResponseModel {
//   EventDetails: EventDetailsModel;
//   EventArtists: EventArtistModel[];
//   EventGalleries: EventGalleryModel[];
//   EventMedia: EventMediaModel[];
// }

export interface EventSeatTypeInventoryModel {
  event_seat_type_inventory_id: number;
  event_id: number;
  seat_name: string;
  price: number;
  total_seats: number;
  available_seats: number;
  created_by: string;
  created_on: string;
  updated_by: string;
  updated_on: string | null;
  active: number;
}

export interface EventCompleteResponseModel {
  eventDetails: EventDetailsModel;  // camelCase to match API
  eventArtists: EventArtistModel[];
  eventGalleries: EventGalleryModel[];
  eventMedia?: EventMediaModel[]; // Optional if your API includes it
  seatTypes?: EventSeatTypeInventoryModel[];
}

export interface EventCreateRequestModel {
  EventDetails: EventDetailsModel;
  EventArtists: EventArtistModel[];
  EventGalleries: EventGalleryModel[];
  BannerImageFile?: File;
  SeatTypes: EventSeatTypeInventoryModel[];
}

export interface EventPaginationRequest {
  created_by: string;
  PageNumber: number;
  PageSize: number;
  SearchText?: string;
  Status?: string;
  FromDate?: string | null;
  ToDate?: string | null;
}

export interface ArtistUploadRequest {
  EventId: number;
  ArtistName: string;
  ArtistPhoto: File;
}

export interface GalleryUploadRequest {
  EventId: number;
  GalleryImage: File;
}

export interface BannerUploadRequest {
  EventId: number;
  BannerImage: File;
}

//User Events
export interface UpcomingEventResponse {
  event_id: number;
  event_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  banner_image: string;
  formatted_date: string;
}

export interface ArtistResponse {
  event_artist_id: number;
  artist_name: string;
  artist_photo: string;
  role: string;
  event_count: number;
}

export interface TestimonialResponse {
  testimonial_id: number;
  name: string;
  designation: string;
  profile_img: string;
  description: string;
  role: string;
}

export interface UpcomingEventsRequest {
  Count?: number;
  IncludeLaterEvents?: boolean;
}

export interface GetShowsByArtistsRequest {
  Count?: number;
}

// Add response types
export interface UpcomingEventsResponse extends CommonResponseModel<UpcomingEventResponse[]> {}
export interface ShowsByArtistsResponse extends CommonResponseModel<ArtistResponse[]> {}
export interface TestimonialsResponse extends CommonResponseModel<TestimonialResponse[]> {}

export interface SimilarEventsRequest {
  categoryId: number;
  excludeEventId: number;
  count?: number;
}

// Add to auth.model.ts
export interface SimilarEventsResponse extends CommonResponseModel<UpcomingEventResponse[]> {}

// ===== BOOKING MODELS =====

// Request Models
export interface SeatSelectionRequest {
  EventId: number;
  SeatSelections: SeatSelection[];
}

export interface SeatSelection {
  SeatTypeId: number;
  Quantity: number;
}

export interface CreateBookingRequest {
  EventId: number;
  SeatSelections: SeatSelection[];
}

export interface SeatAvailabilityRequest {
  SeatSelections: SeatSelection[];
}

export interface SeatUpdateRequest {
  SeatTypeId: number;
  Quantity: number;
}

// Response Models
export interface SeatSelectionResponse {
  EventId: number;
  SeatDetails: SeatDetail[];
  TotalAmount: number;
}

export interface SeatDetail {
  SeatTypeId: number;
  SeatName: string;
  Price: number;
  Quantity: number;
  Subtotal: number;
  AvailableSeats: number;
}

export interface BookingResponse {
  BookingId: number;
  BookingCode: string;
  EventId: number;
  EventName: string;
  TotalAmount: number;
  Status: string;
  CreatedOn: Date;
  bookingId: number;        // lowercase b
  bookingCode: string;      // lowercase b
}

export interface BookingDetailsResponse {
  booking_id: number;
  booking_code: string;
  user_id: string;
  event_id: number;
  event_name: string;
  event_date: Date;
  start_time: string;
  end_time: string;
  location: string;
  banner_image: string;
  total_amount: number;
  status: string;
  created_on: Date;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  BookingSeats: BookingSeatResponse[];
}

export interface BookingSeatResponse {
  booking_seat_id: number;
  event_seat_type_inventory_id: number;
  seat_name: string;
  quantity: number;
  price_per_seat: number;
  subtotal: number;
}

export interface MyBookingsResponse {
    booking_id: number;
    booking_code: string;
    user_id: string;
    event_id: number;
    total_amount: number;
    status: string;
    created_on: string;
    
    // Event Details
    event_name: string;
    event_date: string;
    start_time: string;
    end_time: string;
    location: string;
    banner_image: string;
    
    // Booking Seats
    BookingSeats: BookingSeatResponse[];
}

export interface BookingQRResponse extends BookingResponse {
  qrCodeBase64: string;
  thankYouMessage: string;
  bookingDetails: BookingDetailsResponse;
}

export interface QRCodeDataResponse {
  bookingId: number;
  bookingCode: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  bookingDate: string;
  seats: QRSeatDetail[];
  message: string;
}

export interface QRSeatDetail {
  seatType: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ScanTicketRequest {
  bookingCode: string;
  seatTypeId?: number;
  quantityToScan: number;
  scannedBy: string;
  scanType: string;
  deviceInfo: string;
  forceScan: boolean;
}

export interface PartialScanRequest {
  bookingId: number;
  seatScanDetails: SeatScanDetail[];
  scannedBy: string;
  deviceInfo: string;
}

export interface SeatScanDetail {
  seatTypeId: number;
  quantityToScan: number;
}

export interface TicketScanResponse {
  isSuccess: boolean;
  message: string;
  status: string;
  bookingId: number;
  bookingCode: string;
  eventName: string;
  customerName: string;
  scanTime: string;
  scanResults: SeatScanResult[];
  summary: ScanSummary;
}

export interface SeatScanResult {
  seatTypeId: number;
  seatName: string;
  requestedQuantity: number;
  scannedQuantity: number;
  remainingQuantity: number;
  isFullyScanned: boolean;
  status: string;
}

export interface ScanSummary {
  totalTickets: number;
  scannedTickets: number;
  remainingTickets: number;
  isFullyScanned: boolean;
  percentageScanned: number;
}

export interface BookingScanSummaryResponse {
  bookingId: number;
  bookingCode: string;
  eventName: string;
  eventDate: string;
  customerName: string;
  seatScanInfo: SeatScanInfo[];
  summary: ScanSummary;
  firstScanTime: string;
  lastScanTime: string;
}

export interface SeatScanInfo {
  seatTypeId: number;
  seatName: string;
  totalQuantity: number;
  scannedQuantity: number;
  remainingQuantity: number;
  isFullyScanned: boolean;
  lastScanTime: string;
  lastScannedBy: string;
}

// Add interfaces for payment responses
export interface PaymentOrderResponse {
  OrderId: string;
  KeyId: string;
  Amount: number;
  Currency: string;
  CompanyName: string;
  CustomerName: string;
  CustomerEmail: string;
  Notes: { [key: string]: string };
}

export interface PaymentVerificationResponse {
  IsSuccess: boolean;
  Message: string;
  PaymentId: string;
  OrderId: string;
  PaymentMethod: string;
  CardLast4: string;
  CardNetwork: string;
  BankName: string;
  Wallet: string;
  VPA: string;
  PaymentStatus: string;
  PaymentDate: string;
  PaymentDetails?: { [key: string]: string };
}

export interface PaymentStatusResponse {
  PaymentId: string;
  Status: string;
  Amount: number;
  Currency: string;
  Method: string;
  CreatedAt: string;
  Notes?: { [key: string]: string };
}

// Event Summary Models
export interface EventSummaryResponse {
  status: string;
  success: any;
  message: string;
  errorCode: string;
  data: EventSummaryData;
}

export interface EventSummaryData {
  eventId: number;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  occupancyPercentage: number;
  totalProfit: number;
  currency: string;
  seatTypeDetails: SeatTypeSummary[];
  paymentDetails: PaymentSummary;
}

export interface SeatTypeSummary {
  seatTypeId: number;
  seatName: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  revenue: number;
  occupancyPercentage: number;
}

export interface PaymentSummary {
  totalSuccessfulBookings: number;
  totalAmount: number;
  totalConvenienceFee: number;
  totalGST: number;
  firstBookingDate: string;
  lastBookingDate: string;
}

export interface BookingHistoryRequest {
  userId: string;
  pageNumber: number;
  pageSize: number;
  filterText?: string;
  sortBy?: string;
  sortDirection?: string;
}

export interface BookingSeatHistoryResponse {
  seat_name: string;
  quantity: number;
  scanned_quantity: number;
  remaining_quantity: number;
  price_per_seat: number;
  subtotal: number;
  last_scan_time: string | null;
  scanned_by: string | null;
}

export interface BookingHistoryResponse {
  booking_id: number;
  booking_code: string;
  event_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  full_address: string;
  final_amount: number;
  total_amount: number;
  convenience_fee: number;
  gst_amount: number;
  currency: string;
  payment_method: string | null;
  payment_status: string;
  payment_date: string | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  booking_status: string;
  created_on: string;
  seats: BookingSeatHistoryResponse[];
}

export interface PagedBookingHistoryResponse extends CommonResponseModel<BookingHistoryResponse[]> {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

// ===== BANNER MANAGEMENT MODELS =====
export interface BannerManagementModel {
  banner_id: number;
  banner_img: string; // Base64 URL stored in DB
  action_link_url: string;
  created_by: string;
  created_on: string;
  updated_by: string;
  updated_on: string | null;
  active: number;
}

export interface CreateBannerRequest {
  banner_img: string; // Base64 string
  action_link_url: string;
  created_by?: string;
}

export interface UpdateBannerRequest {
  banner_img?: string; // Optional for updates
  action_link_url?: string;
  updated_by?: string;
}

export interface BannerResponse extends CommonResponseModel<BannerManagementModel[]> {}
export interface SingleBannerResponse extends CommonResponseModel<BannerManagementModel> {}
export interface BannerIdResponse extends CommonResponseModel<number> {}
export interface BannerBooleanResponse extends CommonResponseModel<boolean> {}