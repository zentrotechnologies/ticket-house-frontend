import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/admin-login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/sign-up',
    loadComponent: () => import('./auth/sign-up/sign-up.component').then((m) => m.SignUpComponent),
    // canActivate: [guestGuard]
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./pages/admin/admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'events',
    loadComponent: () => import('./pages/user/events/events.component').then((m) => m.EventsComponent),
    canActivate: [authGuard]
  },
  // Wildcard route - redirect to login for any unknown paths
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];

// console.log('Routes configured:', routes);