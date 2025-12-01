import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonResponse, CommonResponseModel, EventCategoryModel, EventCategoryRequest, GenerateOTPRequest, OTPResponse, PagedResponse, ResendOTPRequest, ResendOTPResponse, SignUpRequest, SignUpResponse, TestimonialModel, UpdateEventCategoryStatusRequest, UpdateTestimonialStatusRequest, UserIdRequest, VerifyOTPRequest } from '../models/auth.model';

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
}
