import { inject, Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { OTPResponse, GenerateOTPRequest, CommonResponse, VerifyOTPRequest, ResendOTPResponse, ResendOTPRequest } from '../models/auth.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class OtpService {
  private apiService = inject(ApiService);
  private toastr = inject(ToastrService);

  private currentOtpId: number | null = null;
  private resendCount = 0;
  private readonly MAX_RESEND_ATTEMPTS = 3;

  // Generate OTP for email verification
  generateEmailOTP(email: string, isNewUser: boolean = true): Observable<OTPResponse> {
    const otpRequest: GenerateOTPRequest = {
      contact_type: 'email',
      email: email,
      newUser: isNewUser
    };

    return this.apiService.GenerateOTP(otpRequest).pipe(
      tap((response: OTPResponse) => { // Fixed: Added type annotation
        if (response.response.status === 'Success') {
          this.currentOtpId = response.validationotp_id;
          this.resendCount = 0; // Reset resend count on new OTP generation
          this.toastr.success('OTP sent to your email address', 'Success');
        } else {
          this.toastr.error(response.response.message, 'OTP Generation Failed');
        }
      }),
      catchError((error: any) => { // Fixed: Added type annotation
        this.toastr.error('Failed to generate OTP. Please try again.', 'Error');
        return throwError(() => error);
      })
    );
  }

  // Verify OTP
  verifyOTP(otp: string, email: string): Observable<CommonResponse> {
    if (!this.currentOtpId) {
      this.toastr.error('No active OTP session. Please generate a new OTP.', 'Error');
      return throwError(() => new Error('No active OTP session'));
    }

    const verifyRequest: VerifyOTPRequest = {
      otp_id: this.currentOtpId,
      otp: otp,
      email: email,
      contact_type: 'email'
    };

    return this.apiService.VerifyOTP(verifyRequest).pipe(
      tap((response: CommonResponse) => { // Fixed: Added type annotation
        if (response.status === 'Success') {
          this.toastr.success('Email verified successfully!', 'Success');
          this.clearOTPSession(); // Clear session after successful verification
        } else {
          this.toastr.error(response.message, 'Verification Failed');
        }
      }),
      catchError((error: any) => { // Fixed: Added type annotation
        this.toastr.error('OTP verification failed. Please try again.', 'Error');
        return throwError(() => error);
      })
    );
  }

  // Resend OTP
  resendOTP(): Observable<ResendOTPResponse> {
    if (!this.currentOtpId) {
      this.toastr.error('No active OTP session. Please generate a new OTP.', 'Error');
      return throwError(() => new Error('No active OTP session'));
    }

    if (this.resendCount >= this.MAX_RESEND_ATTEMPTS) {
      this.toastr.error('Maximum resend attempts reached. Please generate a new OTP.', 'Error');
      return throwError(() => new Error('Maximum resend attempts reached'));
    }

    const resendRequest: ResendOTPRequest = {
      otp_id: this.currentOtpId
    };

    return this.apiService.ResendOTP(resendRequest).pipe(
      tap((response: ResendOTPResponse) => { // Fixed: Added type annotation
        if (response.response.status === 'Success') {
          this.currentOtpId = response.new_otp_id;
          this.resendCount++;
          const remainingAttempts = this.MAX_RESEND_ATTEMPTS - this.resendCount;
          this.toastr.success(`OTP resent successfully. ${remainingAttempts} attempts remaining.`, 'Success');
        } else {
          this.toastr.error(response.response.message, 'Resend Failed');
        }
      }),
      catchError((error: any) => { // Fixed: Added type annotation
        this.toastr.error('Failed to resend OTP. Please try again.', 'Error');
        return throwError(() => error);
      })
    );
  }

  // Get current OTP ID
  getCurrentOtpId(): number | null {
    return this.currentOtpId;
  }

  // Set OTP ID (useful when coming from signup)
  setOtpId(otpId: number): void {
    this.currentOtpId = otpId;
  }

  // Clear OTP session
  clearOTPSession(): void {
    this.currentOtpId = null;
    this.resendCount = 0;
  }

  // Get remaining resend attempts
  getRemainingResendAttempts(): number {
    return this.MAX_RESEND_ATTEMPTS - this.resendCount;
  }

  // Check if OTP session is active
  hasActiveOTPSession(): boolean {
    return this.currentOtpId !== null;
  }
}
