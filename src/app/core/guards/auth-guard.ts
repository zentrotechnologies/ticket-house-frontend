import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  // return true;

  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    // Show warning message
    toastr.warning('Please login to access this page', 'Authentication Required');
    
    // Redirect to login page with return URL
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }
};
