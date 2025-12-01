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

export interface PagedResponse<T> {
  status: string;
  message: string;
  errorCode: string;
  data: T;
  totalPages: number;
  currentPage: number;
  pageSize: number;
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