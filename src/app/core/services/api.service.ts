import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookingDetailsResponse, BookingQRResponse, BookingResponse, BookingScanSummaryResponse, CommonResponse, CommonResponseModel, CreateBookingRequest, EventCategoryModel, EventCategoryRequest, EventCompleteResponseModel, EventCreateRequestModel, EventDetailsModel, EventPaginationRequest, EventSeatTypeInventoryModel, GenerateOTPRequest, GetShowsByArtistsRequest, MyBookingsResponse, OrganizerModel, OrganizerPagedResponse, OrganizerRequest, OTPResponse, PagedResponse, PaginationRequest, PartialScanRequest, PaymentOrderResponse, PaymentStatusResponse, PaymentVerificationResponse, QRCodeDataResponse, ResendOTPRequest, ResendOTPResponse, ScanTicketRequest, SeatAvailabilityRequest, ShowsByArtistsResponse, SignUpRequest, SignUpResponse, SimilarEventsRequest, TestimonialModel, TestimonialsResponse, TicketScanResponse, UpcomingEventResponse, UpcomingEventsRequest, UpcomingEventsResponse, UpdateEventCategoryStatusRequest, UpdateOrganizerStatusRequest, UpdateTestimonialStatusRequest, UserIdRequest, VerifyOTPRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  apiurl: string = environment.THapibaseurl;

  ThApi: string = '';

  constructor(private httpClient: HttpClient) {
    this.ThApi = this.apiurl; // API base URL for the application
  }

  // Helper method to get authentication headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  // Helper method to get auth headers for FormData (different content-type)
  private getAuthHeadersFormData(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
        // Note: No Content-Type for FormData - browser sets it automatically with boundary
      });
    }
    return new HttpHeaders();
  }

  //Login API
  UserLogin(loginReq: any) {
    let url = this.ThApi + 'api/Login/Login';
    return this.httpClient.post<any>(url, loginReq);
  }

  // SignUp API
  UserSignUp(signUpReq: SignUpRequest): Observable<SignUpResponse> {
    let url = this.ThApi + 'api/Login/SignUp';
    return this.httpClient.post<SignUpResponse>(url, signUpReq);
  }

  // OTP APIs
  GenerateOTP(otpRequest: GenerateOTPRequest): Observable<OTPResponse> {
    let url = this.ThApi + 'api/Login/GenerateOTP';
    return this.httpClient.post<OTPResponse>(url, otpRequest);
  }

  VerifyOTP(verifyRequest: VerifyOTPRequest): Observable<CommonResponse> {
    let url = this.ThApi + 'api/Login/VerifyOTP';
    return this.httpClient.post<CommonResponse>(url, verifyRequest);
  }

  ResendOTP(resendRequest: ResendOTPRequest): Observable<ResendOTPResponse> {
    let url = this.ThApi + 'api/Login/ResendOTP';
    return this.httpClient.post<ResendOTPResponse>(url, resendRequest);
  }

  //event category

  // Get all event categories
  getAllEventCategories(): Observable<CommonResponseModel<EventCategoryModel[]>> {
    const url = `${this.ThApi}api/EventCategory/GetAllEventCategories`;
    return this.httpClient.get<CommonResponseModel<EventCategoryModel[]>>(url);
  }

  // Get event category by ID
  getEventCategoryById(eventCategoryId: number): Observable<CommonResponseModel<EventCategoryModel>> {
    const url = `${this.ThApi}api/EventCategory/GetEventCategoryById/${eventCategoryId}`;
    return this.httpClient.get<CommonResponseModel<EventCategoryModel>>(url);
  }

  // Add new event category
  addEventCategory(eventCategory: EventCategoryRequest): Observable<CommonResponseModel<EventCategoryModel>> {
    const url = `${this.ThApi}api/EventCategory/AddEventCategory`;
    return this.httpClient.post<CommonResponseModel<EventCategoryModel>>(url, eventCategory);
  }

  // Update event category
  updateEventCategory(eventCategory: EventCategoryModel): Observable<CommonResponseModel<EventCategoryModel>> {
    const url = `${this.ThApi}api/EventCategory/UpdateEventCategory`;
    return this.httpClient.post<CommonResponseModel<EventCategoryModel>>(url, eventCategory);
  }

  // Delete event category
  deleteEventCategory(eventCategoryId: number, updatedBy: string): Observable<CommonResponseModel<EventCategoryModel>> {
    const url = `${this.ThApi}api/EventCategory/DeleteEventCategory/${eventCategoryId}?updatedBy=${encodeURIComponent(updatedBy)}`;
    return this.httpClient.post<CommonResponseModel<EventCategoryModel>>(url, {});
  }

  updateEventCategoryStatus(request: UpdateEventCategoryStatusRequest): Observable<CommonResponseModel<boolean>> {
    const url = `${this.ThApi}api/EventCategory/UpdateEventCategoryStatus`;
    return this.httpClient.post<CommonResponseModel<boolean>>(url, request);
  }

  // Get paginated event categories by user ID
  getPaginatedEventCategoryByUserId(request: UserIdRequest): Observable<PagedResponse<EventCategoryModel[]>> {
    const url = `${this.ThApi}api/EventCategory/GetPaginatedEventCategoryByUserId`;
    return this.httpClient.post<PagedResponse<EventCategoryModel[]>>(url, request);
  }

  // Testimonial APIs

  // Get all testimonials
  getAllTestimonials(): Observable<CommonResponseModel<TestimonialModel[]>> {
    const url = `${this.ThApi}api/Testimonial/GetAllTestimonials`;
    return this.httpClient.get<CommonResponseModel<TestimonialModel[]>>(url);
  }

  // Get testimonial by ID
  getTestimonialById(testimonialId: number): Observable<CommonResponseModel<TestimonialModel>> {
    const url = `${this.ThApi}api/Testimonial/GetTestimonialById/${testimonialId}`;
    return this.httpClient.get<CommonResponseModel<TestimonialModel>>(url);
  }

  // Add testimonial with file upload
  addTestimonial(testimonialData: FormData): Observable<CommonResponseModel<TestimonialModel>> {
    const url = `${this.ThApi}api/Testimonial/AddTestimonial`;
    return this.httpClient.post<CommonResponseModel<TestimonialModel>>(url, testimonialData);
  }

  // Update testimonial with file upload
  updateTestimonial(testimonialData: FormData): Observable<CommonResponseModel<TestimonialModel>> {
    const url = `${this.ThApi}api/Testimonial/UpdateTestimonial`;
    return this.httpClient.post<CommonResponseModel<TestimonialModel>>(url, testimonialData);
  }

  // Delete testimonial
  deleteTestimonial(testimonialId: number, updatedBy: string): Observable<CommonResponseModel<TestimonialModel>> {
    const url = `${this.ThApi}api/Testimonial/DeleteTestimonial/${testimonialId}`;
    return this.httpClient.post<CommonResponseModel<TestimonialModel>>(url, { updatedBy });
  }

  // Update testimonial status
  updateTestimonialStatus(request: UpdateTestimonialStatusRequest): Observable<CommonResponseModel<boolean>> {
    const url = `${this.ThApi}api/Testimonial/UpdateTestimonialStatus`;
    return this.httpClient.post<CommonResponseModel<boolean>>(url, request);
  }

  // ===== ORGANIZER APIS =====

  // Get paginated organizers
  getPaginatedOrganizers(request: PaginationRequest): Observable<OrganizerPagedResponse> {
    const url = `${this.ThApi}api/User/GetPaginatedOrganizers`;
    return this.httpClient.post<OrganizerPagedResponse>(url, request);
  }

  // Get organizer by ID
  getOrganizerById(organizerId: string): Observable<CommonResponseModel<OrganizerModel>> {
    const url = `${this.ThApi}api/User/GetOrganizerById/${organizerId}`;
    return this.httpClient.get<CommonResponseModel<OrganizerModel>>(url);
  }

  // Add organizer
  addOrganizer(organizer: OrganizerRequest): Observable<CommonResponseModel<OrganizerModel>> {
    const url = `${this.ThApi}api/User/AddOrganizer`;
    return this.httpClient.post<CommonResponseModel<OrganizerModel>>(url, organizer);
  }

  // Update organizer
  updateOrganizer(organizerId: string, organizer: OrganizerRequest): Observable<CommonResponseModel<OrganizerModel>> {
    const url = `${this.ThApi}api/User/UpdateOrganizer/${organizerId}`;
    return this.httpClient.post<CommonResponseModel<OrganizerModel>>(url, organizer);
  }

  // Delete organizer
  deleteOrganizer(organizerId: string): Observable<CommonResponseModel<boolean>> {
    const url = `${this.ThApi}api/User/DeleteOrganizer/${organizerId}`;
    return this.httpClient.post<CommonResponseModel<boolean>>(url, {});
  }

  // Update organizer status
  updateOrganizerStatus(request: UpdateOrganizerStatusRequest): Observable<CommonResponseModel<boolean>> {
    const url = `${this.ThApi}api/User/UpdateOrganizerStatus/${request.organizer_id}`;
    return this.httpClient.post<CommonResponseModel<boolean>>(url, { status: request.status });
  }

  // ===== EVENT APIS =====

  // Upload artist photo
  uploadArtistPhoto(eventId: number, artistName: string, artistPhoto: File): Observable<CommonResponseModel<string>> {
    const formData = new FormData();
    formData.append('EventId', eventId.toString());
    formData.append('ArtistName', artistName);
    formData.append('ArtistPhoto', artistPhoto);

    const url = `${this.ThApi}api/EventDetails/UploadArtistPhoto`;
    return this.httpClient.post<CommonResponseModel<string>>(url, formData);
  }

  // Upload gallery image
  uploadGalleryImage(eventId: number, galleryImage: File): Observable<CommonResponseModel<string>> {
    const formData = new FormData();
    formData.append('EventId', eventId.toString());
    formData.append('GalleryImage', galleryImage);

    const url = `${this.ThApi}api/EventDetails/UploadGalleryImage`;
    return this.httpClient.post<CommonResponseModel<string>>(url, formData);
  }

  // Upload event banner
  uploadEventBanner(eventId: number, bannerImage: File): Observable<CommonResponseModel<string>> {
    const formData = new FormData();
    formData.append('EventId', eventId.toString());
    formData.append('BannerImage', bannerImage);

    const url = `${this.ThApi}api/EventDetails/UploadEventBanner`;
    return this.httpClient.post<CommonResponseModel<string>>(url, formData);
  }

  // Get seat types for event
  getEventSeatTypes(eventId: number): Observable<CommonResponseModel<EventSeatTypeInventoryModel[]>> {
    const url = `${this.ThApi}api/EventDetails/GetEventSeatTypes/${eventId}`;
    return this.httpClient.get<CommonResponseModel<EventSeatTypeInventoryModel[]>>(url);
  }

  // Add seat types to event
  addEventSeatTypes(seatTypes: EventSeatTypeInventoryModel[]):
    Observable<CommonResponseModel<EventSeatTypeInventoryModel[]>> {
    const url = `${this.ThApi}api/EventDetails/AddEventSeatTypes`;
    return this.httpClient.post<CommonResponseModel<EventSeatTypeInventoryModel[]>>(url, seatTypes);
  }

  // Create event with artists and galleries
  createEventWithArtistsAndGalleries(eventData: FormData): Observable<CommonResponseModel<EventCompleteResponseModel>> {
    const url = `${this.ThApi}api/EventDetails/CreateEventWithArtistsAndGalleries`;
    return this.httpClient.post<CommonResponseModel<EventCompleteResponseModel>>(url, eventData, {
      headers: { 'Accept': 'application/json' }
    });
  }

  // Update event with artists and galleries
  updateEventWithArtistsAndGalleries(eventData: FormData): Observable<CommonResponseModel<EventCompleteResponseModel>> {
    const url = `${this.ThApi}api/EventDetails/UpdateEventWithArtistsAndGalleries`;
    return this.httpClient.post<CommonResponseModel<EventCompleteResponseModel>>(url, eventData, {
      headers: { 'Accept': 'application/json' }
    });
  }

  // Get event with artists and galleries
  getEventWithArtistsAndGalleries(eventId: number): Observable<CommonResponseModel<EventCompleteResponseModel>> {
    const url = `${this.ThApi}api/EventDetails/GetEventWithArtistsAndGalleries/${eventId}`;
    return this.httpClient.get<CommonResponseModel<EventCompleteResponseModel>>(url);
  }

  // Get paginated events by created_by
  getPaginatedEventsByCreatedBy(request: EventPaginationRequest): Observable<PagedResponse<EventCompleteResponseModel[]>> {
    const url = `${this.ThApi}api/EventDetails/GetPaginatedEventsByCreatedBy`;
    return this.httpClient.post<PagedResponse<EventCompleteResponseModel[]>>(url, request);
  }

  // Delete event with artists and galleries
  deleteEventWithArtistsAndGalleries(eventId: number, updatedBy: string): Observable<CommonResponseModel<boolean>> {
    const url = `${this.ThApi}api/EventDetails/DeleteEventWithArtistsAndGalleries/${eventId}`;
    return this.httpClient.post<CommonResponseModel<boolean>>(url, { updatedBy });
  }

  // ===== USER EVENTS APIS =====

  // Get upcoming events
  getUpcomingEvents(request: UpcomingEventsRequest): Observable<UpcomingEventsResponse> {
    const url = `${this.ThApi}api/UserEvents/GetUpcomingEvents`;
    return this.httpClient.post<UpcomingEventsResponse>(url, request);
  }

  // Get upcoming events with default values
  getUpcomingEventsDefault(): Observable<UpcomingEventsResponse> {
    const url = `${this.ThApi}api/UserEvents/GetUpcomingEventsDefault`;
    return this.httpClient.get<UpcomingEventsResponse>(url);
  }

  // Get shows by artists
  getShowsByArtists(request: GetShowsByArtistsRequest): Observable<ShowsByArtistsResponse> {
    const url = `${this.ThApi}api/UserEvents/GetShowsByArtists`;
    return this.httpClient.post<ShowsByArtistsResponse>(url, request);
  }

  // Get shows by artists with default values
  getShowsByArtistsDefault(): Observable<ShowsByArtistsResponse> {
    const url = `${this.ThApi}api/UserEvents/GetShowsByArtistsDefault`;
    return this.httpClient.get<ShowsByArtistsResponse>(url);
  }

  // Add this method to get the price in range (200-1000)
  getEventPriceInRange(eventId: number): Observable<CommonResponseModel<number>> {
    const url = `${this.ThApi}api/UserEvents/GetEventPriceInRange/${eventId}`;
    return this.httpClient.get<CommonResponseModel<number>>(url);
  }

  // Get testimonials by artists
  getTestimonialsByArtists(): Observable<TestimonialsResponse> {
    const url = `${this.ThApi}api/UserEvents/GetTestimonialsByArtists`;
    return this.httpClient.get<TestimonialsResponse>(url);
  }

  // Get event details by ID
  getEventDetailsById(eventId: number): Observable<CommonResponseModel<EventDetailsModel>> {
    const url = `${this.ThApi}api/UserEvents/GetEventDetailsById/${eventId}`;
    return this.httpClient.get<CommonResponseModel<EventDetailsModel>>(url);
  }

  // Get similar events
  getSimilarEventsByCategory(request: SimilarEventsRequest): Observable<CommonResponseModel<UpcomingEventResponse[]>> {
    const url = `${this.ThApi}api/UserEvents/GetSimilarEventsByCategory`;
    return this.httpClient.post<CommonResponseModel<UpcomingEventResponse[]>>(url, request);
  }

  // Booking APIs
  createBooking(request: CreateBookingRequest): Observable<CommonResponseModel<BookingResponse>> {
    const url = `${this.ThApi}api/Booking/CreateBooking`;
    return this.httpClient.post<CommonResponseModel<BookingResponse>>(url, request);
  }

  confirmBooking(bookingId: number): Observable<CommonResponseModel<BookingResponse>> {
    const url = `${this.ThApi}api/Booking/ConfirmBooking/${bookingId}`;
    return this.httpClient.post<CommonResponseModel<BookingResponse>>(url, {});
  }

  createBookingWithUser(request: any): Observable<CommonResponseModel<BookingResponse>> {
    const url = `${this.ThApi}api/Booking/CreateBooking`;
    return this.httpClient.post<CommonResponseModel<BookingResponse>>(url, request);
  }

  confirmBookingWithUser(bookingId: number, userId: string): Observable<CommonResponseModel<BookingResponse>> {
    const url = `${this.ThApi}api/Booking/ConfirmBookingWithUser`;
    return this.httpClient.post<CommonResponseModel<BookingResponse>>(url, { 
      bookingId, 
      userId 
    });
  }

  getBookingDetails(bookingId: number): Observable<CommonResponseModel<BookingDetailsResponse>> {
    const url = `${this.ThApi}api/Booking/GetBookingDetails/${bookingId}`;
    return this.httpClient.get<CommonResponseModel<BookingDetailsResponse>>(url);
  }

  getBookingDetailsByCode(bookingCode: string): Observable<CommonResponseModel<BookingDetailsResponse>> {
    const url = `${this.ThApi}api/Booking/GetBookingDetailsByCode/${bookingCode}`;
    return this.httpClient.get<CommonResponseModel<BookingDetailsResponse>>(url);
  }

  getUserBookings(): Observable<CommonResponseModel<BookingResponse[]>> {
    const url = `${this.ThApi}api/Booking/GetUserBookings`;
    return this.httpClient.get<CommonResponseModel<BookingResponse[]>>(url);
  }

  checkSeatAvailability(request: SeatAvailabilityRequest): Observable<CommonResponseModel<boolean>> {
    const url = `${this.ThApi}api/Booking/CheckSeatAvailability`;
    return this.httpClient.post<CommonResponseModel<boolean>>(url, request);
  }

  // Add this method for getting available seats
  getAvailableSeats(eventId: number): Observable<CommonResponseModel<EventSeatTypeInventoryModel[]>> {
    const url = `${this.ThApi}api/Booking/GetAvailableSeats/${eventId}`;
    return this.httpClient.get<CommonResponseModel<EventSeatTypeInventoryModel[]>>(url);
  }

  //my bookings
  getMyBookingsByUserId(userId: string): Observable<CommonResponseModel<MyBookingsResponse[]>> {
    const url = `${this.ThApi}api/Booking/GetMyBookingsByUserId/${userId}`;
    return this.httpClient.get<CommonResponseModel<MyBookingsResponse[]>>(url);
  }

  // Confirm booking with QR code generation
  confirmBookingWithQR(bookingId: number): Observable<CommonResponseModel<BookingQRResponse>> {
    const url = `${this.ThApi}api/Booking/ConfirmBookingWithQR/${bookingId}`;
    return this.httpClient.post<CommonResponseModel<BookingQRResponse>>(url, {});
  }

  // Decode QR code data
  decodeQRCode(qrCodeBase64: string): Observable<CommonResponseModel<QRCodeDataResponse>> {
    const url = `${this.ThApi}api/Booking/DecodeQRCode`;
    return this.httpClient.post<CommonResponseModel<QRCodeDataResponse>>(url, { QRCodeBase64: qrCodeBase64 });
  }

  // Get booking for scanning
  getBookingForScanning(bookingCode: string): Observable<CommonResponseModel<BookingDetailsResponse>> {
    const url = `${this.ThApi}api/Booking/GetBookingForScan/${bookingCode}`;
    return this.httpClient.get<CommonResponseModel<BookingDetailsResponse>>(url);
  }

  // Scan ticket
  scanTicket(request: ScanTicketRequest): Observable<CommonResponseModel<TicketScanResponse>> {
    const url = `${this.ThApi}api/Booking/ScanTicket`;
    return this.httpClient.post<CommonResponseModel<TicketScanResponse>>(url, request);
  }

  // Partial scan
  partialScan(request: PartialScanRequest): Observable<CommonResponseModel<TicketScanResponse>> {
    const url = `${this.ThApi}api/Booking/PartialScan`;
    return this.httpClient.post<CommonResponseModel<TicketScanResponse>>(url, request);
  }

  // Get scan summary
  getScanSummary(bookingId: number): Observable<CommonResponseModel<BookingScanSummaryResponse>> {
    const url = `${this.ThApi}api/Booking/GetScanSummary/${bookingId}`;
    return this.httpClient.get<CommonResponseModel<BookingScanSummaryResponse>>(url);
  }

  // Reset scan count
  resetScanCount(bookingId: number): Observable<CommonResponseModel<boolean>> {
    const url = `${this.ThApi}api/Booking/ResetScan/${bookingId}`;
    return this.httpClient.post<CommonResponseModel<boolean>>(url, {});
  }

  // Payment APIs
  createPaymentOrder(request: any): Observable<CommonResponseModel<PaymentOrderResponse>> {
    const url = `${this.ThApi}api/Payment/CreateOrder`;
    return this.httpClient.post<CommonResponseModel<PaymentOrderResponse>>(url, request);
  }

  verifyPayment(request: any): Observable<CommonResponseModel<PaymentVerificationResponse>> {
    const url = `${this.ThApi}api/Payment/VerifyPayment`;
    return this.httpClient.post<CommonResponseModel<PaymentVerificationResponse>>(url, request);
  }

  getPaymentStatus(bookingId: number): Observable<CommonResponseModel<PaymentStatusResponse>> {
    const url = `${this.ThApi}api/Payment/GetPaymentStatus/${bookingId}`;
    return this.httpClient.get<CommonResponseModel<PaymentStatusResponse>>(url);
  }

  createBookingWithPayment(request: any): Observable<any> {
    return this.httpClient.post<any>(`${this.ThApi}api/Payment/CreateBookingWithPayment`, request, {
        headers: this.getAuthHeaders()
    });
  }
}
