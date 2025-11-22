import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  // return true;
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  if (!authService.isLoggedIn()) {
    toastr.warning('Please login to access this page', 'Authentication Required');
    router.navigate(['/auth/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }

  const userRole = authService.getUserRole();
  const requiredRoles = route.data?.['roles'] as number[];

  if (!requiredRoles || requiredRoles.includes(userRole!)) {
    return true;
  }

  // Redirect to appropriate dashboard based on role
  if (authService.isAdmin()) {
    router.navigate(['/admin/dashboard']);
  } else if (authService.isAudience()) {
    router.navigate(['/user/events']);
  } else {
    router.navigate(['/auth/login']);
  }

  toastr.error('You do not have permission to access this page', 'Access Denied');
  return false;
};
