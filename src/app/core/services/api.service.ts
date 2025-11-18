import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonResponse, GenerateOTPRequest, OTPResponse, ResendOTPRequest, ResendOTPResponse, SignUpRequest, SignUpResponse, VerifyOTPRequest } from '../models/auth.model';

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
}
