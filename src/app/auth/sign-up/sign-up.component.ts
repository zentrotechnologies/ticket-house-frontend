import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonResponse, OTPResponse, ResendOTPResponse, SignUpRequest } from '../../core/models/auth.model';
import { SignupService } from '../../core/services/signup.service';
import { CommonModule } from '@angular/common';
import { OtpService } from '../../core/services/otp.service';
import { ToastrModule } from 'ngx-toastr';

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, ToastrModule],
  standalone: true,
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css'],
})
export class SignUpComponent {
  private fb = inject(FormBuilder);
  private signupService = inject(SignupService);
  public otpService = inject(OtpService); 
  private router = inject(Router);
  private toastr = inject(ToastrService);

  signUpForm: FormGroup;
  currentStep = 1;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  // OTP Verification Properties
  showOTPModal = false;
  isVerifyingOTP = false;
  isSendingOTP = false;
  otp: string = '';
  countdown: number = 0;
  countdownInterval: any;

  constructor() {
    this.signUpForm = this.createSignUpForm();
  }

  private createSignUpForm(): FormGroup {
    return this.fb.group({
      // Step 1 - Company Details
      first_name: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\s]*$/)]],
      last_name: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-Z\s]*$/)]],
      org_name: ['', [Validators.required]],
      org_start_date: ['', [Validators.required]],
      owner_personal_email: ['', [Validators.required, Validators.email]],
      address: ['', [Validators.required]],
      city: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]*$/)]],
      state: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]*$/)]],
      country: ['', [Validators.required]],
      aadhar_number: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]],
      pancard_number: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      gst_number: ['', [Validators.required, Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]],

      // Step 2 - Confirm Identity
      email: ['', [Validators.required, Validators.email]],
      country_code: ['+91'],
      mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), 
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)]],
      confirm_password: ['', [Validators.required]],
      bank_account_no: ['', [Validators.required, Validators.pattern(/^\d{9,18}$/)]],
      bank_ifsc: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
      bank_name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]*$/)]],
      beneficiary_name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z\s]*$/)]],
      
      // Social Links - Optional
      instagram_link: [''],
      facebook_link: [''],
      twitter_link: [''],
      youtube_link: ['']
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator for password match
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirm_password');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }
  }

  // Step navigation
  nextStep(): void {
    if (this.currentStep === 1) {
      // Validate step 1 fields
      const step1Fields = [
        'first_name', 'last_name', 'org_name', 'org_start_date', 
        'owner_personal_email', 'address', 'city', 'state', 'country',
        'aadhar_number', 'pancard_number', 'gst_number'
      ];
      const step1Valid = step1Fields.every(field => this.signUpForm.get(field)?.valid);
      
      if (step1Valid) {
        this.currentStep = 2;
      } else {
        this.markStep1FieldsAsTouched();
        this.toastr.warning('Please fill all required fields correctly before proceeding.', 'Validation Error');
      }
    }
  }

  prevStep(): void {
    if (this.currentStep === 2) {
      this.currentStep = 1;
    }
  }

  private markStep1FieldsAsTouched(): void {
    const step1Fields = [
      'first_name', 'last_name', 'org_name', 'org_start_date', 
      'owner_personal_email', 'address', 'city', 'state', 'country',
      'aadhar_number', 'pancard_number', 'gst_number'
    ];
    step1Fields.forEach(field => {
      this.signUpForm.get(field)?.markAsTouched();
    });
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // OTP Methods
  sendOTP(): void {
    const email = this.signUpForm.get('email')?.value;
    
    if (!email) {
      this.toastr.warning('Please enter your email address first.', 'Email Required');
      return;
    }

    this.isSendingOTP = true;
    this.otpService.generateEmailOTP(email, true).subscribe({
      next: (response: OTPResponse) => { // Fixed: Added type annotation
        this.isSendingOTP = false;
        this.showOTPModal = true;
        this.startCountdown(120); // 2 minutes countdown
      },
      error: (error: any) => { // Fixed: Added type annotation
        this.isSendingOTP = false;
        console.error('OTP generation error:', error);
      }
    });
  }

  verifyOTP(): void {
    const email = this.signUpForm.get('email')?.value;
    
    if (!this.otp || this.otp.length !== 4) {
      this.toastr.warning('Please enter a valid 4-digit OTP.', 'Invalid OTP');
      return;
    }

    this.isVerifyingOTP = true;
    this.otpService.verifyOTP(this.otp, email).subscribe({
      next: (response: CommonResponse) => { // Fixed: Added type annotation
        this.isVerifyingOTP = false;
        if (response.status === 'Success') {
          this.showOTPModal = false;
          this.otp = '';
          this.clearCountdown();
          // Proceed with registration after successful verification
          this.submitRegistration();
        }
      },
      error: (error: any) => { // Fixed: Added type annotation
        this.isVerifyingOTP = false;
        console.error('OTP verification error:', error);
      }
    });
  }

  resendOTP(): void {
    this.otpService.resendOTP().subscribe({
      next: (response: ResendOTPResponse) => { // Fixed: Added type annotation
        this.startCountdown(120); // Restart countdown
      },
      error: (error: any) => { // Fixed: Added type annotation
        console.error('OTP resend error:', error);
      }
    });
  }

  closeOTPModal(): void {
    this.showOTPModal = false;
    this.otp = '';
    this.clearCountdown();
    this.otpService.clearOTPSession();
  }

  // Countdown methods
  startCountdown(seconds: number): void {
    this.countdown = seconds;
    this.clearCountdown();
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.clearCountdown();
      }
    }, 1000);
  }

  clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  get countdownFormatted(): string {
    const minutes = Math.floor(this.countdown / 60);
    const seconds = this.countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Form submission - Updated to include OTP verification
  onSubmit(): void {
    if (this.signUpForm.valid && !this.isLoading) {
      // Check if email is already verified
      if (this.otpService.hasActiveOTPSession()) {
        // If OTP session exists but not verified, show OTP modal
        this.showOTPModal = true;
        if (this.countdown <= 0) {
          this.startCountdown(120);
        }
      } else {
        // Send OTP for verification first
        this.sendOTP();
      }
    } else {
      this.markAllFieldsAsTouched();
      this.toastr.warning('Please fill all required fields correctly.', 'Form Validation', {
        timeOut: 5000,
        positionClass: 'toast-top-right'
      });
    }
  }

  // Actual registration submission (called after OTP verification)
  private submitRegistration(): void {
    this.isLoading = true;

    const formData = this.signUpForm.value;
    const signUpData: SignUpRequest = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      country_code: formData.country_code,
      mobile: formData.mobile,
      password: formData.password,
      role_id: 2, // Event Organizer role

      // Event Organizer specific fields
      org_name: formData.org_name,
      org_start_date: formData.org_start_date ? new Date(formData.org_start_date).toISOString() : undefined,
      owner_personal_email: formData.owner_personal_email,
      state: formData.state,
      city: formData.city,
      country: formData.country,
      aadhar_number: formData.aadhar_number,
      pancard_number: formData.pancard_number,
      gst_number: formData.gst_number,
      bank_account_no: formData.bank_account_no,
      bank_ifsc: formData.bank_ifsc,
      bank_name: formData.bank_name,
      beneficiary_name: formData.beneficiary_name,
      instagram_link: formData.instagram_link,
      facebook_link: formData.facebook_link,
      twitter_link: formData.twitter_link,
      youtube_link: formData.youtube_link
    };

    console.log('Submitting signup data:', signUpData);

    this.signupService.signUp(signUpData).subscribe({
      next: (response: any) => { // Fixed: Added type annotation
        this.isLoading = false;
        console.log('Signup response:', response);
        
        if (response.response && response.response.status === 'Success') {
          const successMessage = response.response.message || 'Registration successful! Your application is under review.';
          
          this.toastr.success(successMessage, 'Success!', {
            timeOut: 5000,
            positionClass: 'toast-top-right',
            progressBar: true,
            closeButton: true
          });

          setTimeout(() => {
            this.router.navigate(['/admin-dashboard']);
          }, 3000);
          
        } else {
          this.handleApiError(response.response || response);
        }
      },
      error: (error: any) => { // Fixed: Added type annotation
        this.isLoading = false;
        console.error('Signup error:', error);
        
        if (error.error && error.error.response) {
          this.handleApiError(error.error.response);
        } else {
          this.toastr.error(
            error.error?.message || 'An error occurred during registration. Please try again.', 
            'Registration Error', 
            {
              timeOut: 5000,
              positionClass: 'toast-top-right',
              progressBar: true,
              closeButton: true
            }
          );
        }
      }
    });
  }

  private handleApiError(response: any): void {
    console.log('Handling API error:', response);
    
    const errorCode = response.errorCode;
    const message = response.message || 'An error occurred during registration';

    switch (errorCode) {
      case 'EMAIL_EXISTS':
        this.toastr.error('This email is already registered. Please use a different email or try logging in.', 'Email Exists', {
          timeOut: 6000,
          positionClass: 'toast-top-right',
          progressBar: true
        });
        break;
      case 'MOBILE_EXISTS':
        this.toastr.error('This mobile number is already registered. Please use a different mobile number.', 'Mobile Exists', {
          timeOut: 6000,
          positionClass: 'toast-top-right',
          progressBar: true
        });
        break;
      case 'REGISTRATION_ERROR':
        this.toastr.error('Registration failed due to a system error. Please try again later.', 'Registration Error', {
          timeOut: 5000,
          positionClass: 'toast-top-right',
          progressBar: true
        });
        break;
      case 'INVALID_CREDENTIALS':
        this.toastr.error('Invalid email or password provided.', 'Invalid Credentials', {
          timeOut: 5000,
          positionClass: 'toast-top-right',
          progressBar: true
        });
        break;
      default:
        this.toastr.error(message, 'Registration Failed', {
          timeOut: 5000,
          positionClass: 'toast-top-right',
          progressBar: true
        });
        break;
    }
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.signUpForm.controls).forEach(key => {
      this.signUpForm.get(key)?.markAsTouched();
    });
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.signUpForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.signUpForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) {
        if (fieldName === 'password') {
          return 'Password must be at least 8 characters long';
        }
        return `Minimum length is ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        return this.getPatternErrorMessage(fieldName);
      }
      if (field.errors['passwordMismatch']) return 'Passwords do not match';
    }
    return '';
  }

  private getPatternErrorMessage(fieldName: string): string {
    switch (fieldName) {
      case 'first_name':
      case 'last_name':
      case 'city':
      case 'state':
      case 'bank_name':
      case 'beneficiary_name':
        return 'Only letters and spaces are allowed';
      
      case 'aadhar_number':
        return 'Aadhar number must be exactly 12 digits';
      
      case 'pancard_number':
        return 'PAN card must be in format: AAAAA9999A';
      
      case 'gst_number':
        return 'Please enter a valid GST number';
      
      case 'mobile':
        return 'Please enter a valid 10-digit mobile number starting with 6-9';
      
      case 'password':
        return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
      
      case 'bank_account_no':
        return 'Bank account number must be between 9-18 digits';
      
      case 'bank_ifsc':
        return 'Please enter a valid IFSC code';
      
      default:
        return 'Please enter a valid format';
    }
  }

  // Auto-move to next input in OTP
  onOtpInput(event: any, index: number): void {
    const input = event.target;
    const value = input.value;
    
    if (value.length === 1 && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
    
    // Update the complete OTP
    this.updateCompleteOTP();
  }

  onOtpKeyDown(event: any, index: number): void {
    if (event.key === 'Backspace' && !event.target.value && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  private updateCompleteOTP(): void {
    const otpInputs = document.querySelectorAll('.otp-input') as NodeListOf<HTMLInputElement>;
    let completeOtp = '';
    otpInputs.forEach(input => {
      completeOtp += input.value;
    });
    this.otp = completeOtp;
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }
}
