import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonResponse, CommonResponseModel, EventCategoryModel, EventCategoryRequest, EventCompleteResponseModel, EventCreateRequestModel, EventDetailsModel, EventPaginationRequest, GenerateOTPRequest, OrganizerModel, OrganizerPagedResponse, OrganizerRequest, OTPResponse, PagedResponse, PaginationRequest, ResendOTPRequest, ResendOTPResponse, SignUpRequest, SignUpResponse, TestimonialModel, UpdateEventCategoryStatusRequest, UpdateOrganizerStatusRequest, UpdateTestimonialStatusRequest, UserIdRequest, VerifyOTPRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  apiurl: string = environment.THapibaseurl;

  ThApi: string = '';

  constructor(private httpClient: HttpClient) {
    this.ThApi = this.apiurl; // API base URL for the application
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
}
