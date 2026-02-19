import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';
import { LayoutComponent } from './layout/layout.component';
import { PrivacyPolicyComponent } from './pages/Policy/privacy-policy/privacy-policy.component';
import { TermsConditionsComponent } from './pages/Policy/terms-conditions/terms-conditions.component';
import { RefundPolicyComponent } from './pages/Policy/refund-policy/refund-policy.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'events',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'sign-up',
        loadComponent: () =>
          import('./auth/sign-up/sign-up.component').then((m) => m.SignUpComponent),
      },
    ],
  },
  {
    path: '',
    component: LayoutComponent, // Layout wraps ALL routes below
    children: [
      // PUBLIC USER ROUTES - No auth guard needed
      // {
      //   path: 'events',
      //   loadComponent: () =>
      //     import('./pages/user/events/events.component').then((m) => m.EventsComponent),
      // },
      {
        path: '',
        loadComponent: () =>
          import('./pages/user/events/events.component').then((m) => m.EventsComponent),
      },
      // Also keep /events as an alias that redirects to empty path
      {
        path: 'events',
        redirectTo: '',
        pathMatch: 'full',
      },
      {
        path: 'event-booking/:event_id/:event_name',
        loadComponent: () =>
          import('./pages/user/event-booking/event-booking.component').then(
            (m) => m.EventBookingComponent
          ),
      },
      {
        path: 'seats-booking/:event_id/:event_name',
        loadComponent: () =>
          import('./pages/user/seats-booking/seats-booking.component').then(
            (m) => m.SeatsBookingComponent
          ),
      },
      {
        path: 'event-payment/:event_id/:event_name',
        loadComponent: () =>
          import('./pages/user/event-payment/event-payment.component').then(
            (m) => m.EventPaymentComponent
          ),
      },
      {
        path: 'my-bookings/:user_id',
        loadComponent: () =>
          import('./pages/user/my-bookings/my-bookings.component').then(
            (m) => m.MyBookingsComponent
          ),
      },

      // Policies
      { path: 'privacy-policy', component: PrivacyPolicyComponent },
      { path: 'terms-conditions', component: TermsConditionsComponent },
      { path: 'refund-policy', component: RefundPolicyComponent },
      
      // PROTECTED ADMIN ROUTES - With auth guard
      {
        path: 'admin',
        canActivate: [authGuard],
        children: [
          {
            path: '',
            canActivate: [roleGuard],
            data: { roles: [1, 2] },
            children: [
              {
                path: 'dashboard',
                loadComponent: () =>
                  import('./pages/admin/admin-dashboard/admin-dashboard.component').then(
                    (m) => m.AdminDashboardComponent
                  ),
              },
              {
                path: 'events',
                loadComponent: () =>
                  import('./pages/admin/admin-events/admin-events.component').then(
                    (m) => m.AdminEventsComponent
                  ),
              },
              {
                path: 'ticket-scanning',
                loadComponent: () =>
                  import('./pages/admin/ticket-scanning/ticket-scanning.component').then(
                    (m) => m.TicketScanningComponent
                  ),
              },
            ],
          },
          {
            path: '',
            canActivate: [roleGuard],
            data: { roles: [1] },
            children: [
              {
                path: 'event-organizer',
                loadComponent: () =>
                  import('./pages/admin/organizer-management/event-organizer/event-organizer.component').then(
                    (m) => m.EventOrganizerComponent
                  ),
              },
              {
                path: 'event-categories',
                loadComponent: () =>
                  import('./pages/admin/event-category/event-category.component').then(
                    (m) => m.EventCategoryComponent
                  ),
              },
              {
                path: 'banner-management',
                loadComponent: () =>
                  import('./pages/admin/admin-banner-management/admin-banner-management.component').then(
                    (m) => m.AdminBannerManagementComponent
                  ),
              },
              {
                path: 'testimonial',
                loadComponent: () =>
                  import('./pages/admin/testimonial/testimonial.component').then(
                    (m) => m.TestimonialComponent
                  ),
              },
            ]
          }
        ]
      },
    ],
  },
  
  // Wildcard route
  {
    path: '**',
    redirectTo: 'events',
  },
  
  // {
  //   path: '',
  //   redirectTo: 'events',
  //   pathMatch: 'full',
  // },
  // {
  //   path: 'auth',
  //   children: [
  //     {
  //       path: 'login',
  //       loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  //     },
  //     {
  //       path: 'sign-up',
  //       loadComponent: () =>
  //         import('./auth/sign-up/sign-up.component').then((m) => m.SignUpComponent),
  //     },
  //   ],
  // },
  // {
  //   path: 'events',
  //   loadComponent: () =>
  //     import('./pages/user/events/events.component').then((m) => m.EventsComponent),
  // },
  // // {
  // //   path: 'event-booking',
  // //   loadComponent: () =>
  // //     import('./pages/user/event-booking/event-booking.component').then(
  // //       (m) => m.EventBookingComponent
  // //     ),
  // // },
  // {
  //   path: 'event-booking/:event_id/:event_name',
  //   loadComponent: () =>
  //     import('./pages/user/event-booking/event-booking.component').then(
  //       (m) => m.EventBookingComponent
  //     ),
  // },
  // // Alternative with query params:
  // // {
  // //   path: 'event-booking',
  // //   loadComponent: () =>
  // //     import('./pages/user/event-booking/event-booking.component').then(
  // //       (m) => m.EventBookingComponent
  // //     ),
  // // },
  // {
  //   path: 'seats-booking/:event_id/:event_name',
  //   loadComponent: () =>
  //     import('./pages/user/seats-booking/seats-booking.component').then(
  //       (m) => m.SeatsBookingComponent
  //     ),
  // },
  // {
  //   path: 'event-payment/:event_id/:event_name',
  //   loadComponent: () =>
  //     import('./pages/user/event-payment/event-payment.component').then(
  //       (m) => m.EventPaymentComponent
  //     ),
  // },
  // {
  //   path: 'my-bookings/:user_id',
  //   loadComponent: () =>
  //     import('./pages/user/my-bookings/my-bookings.component').then(
  //       (m) => m.MyBookingsComponent
  //     ),
  // },
  // // Protected routes with layout
  // {
  //   path: '',
  //   component: LayoutComponent,
  //   canActivate: [authGuard],
  //   children: [
  //     // Admin routes
  //     {
  //       path: 'admin',
  //       canActivate: [roleGuard],
  //       data: { roles: [1, 2] },
  //       children: [
  //         {
  //           path: 'dashboard',
  //           loadComponent: () =>
  //             import('./pages/admin/admin-dashboard/admin-dashboard.component').then(
  //               (m) => m.AdminDashboardComponent
  //             ),
  //         },
  //         {
  //           path: 'events',
  //           loadComponent: () =>
  //             import('./pages/admin/admin-events/admin-events.component').then(
  //               (m) => m.AdminEventsComponent
  //             ),
  //         },
  //         {
  //           path: 'ticket-scanning',
  //           loadComponent: () =>
  //             import('./pages/admin/ticket-scanning/ticket-scanning.component').then(
  //               (m) => m.TicketScanningComponent
  //             ),
  //         },
  //         // {
  //         //   path: 'scan-history',
  //         //   loadComponent: () =>
  //         //     import('./pages/admin/scan-history/scan-history.component').then(
  //         //       (m) => m.ScanHistoryComponent
  //         //     ),
  //         // }
  //       ],
  //     },
  //     {
  //       path: 'admin',
  //       canActivate: [roleGuard],
  //       data: { roles: [1] },
  //       children: [
  //         {
  //           path: 'event-organizer',
  //           loadComponent: () =>
  //             import('./pages/admin/organizer-management/event-organizer/event-organizer.component').then(
  //               (m) => m.EventOrganizerComponent
  //             ),
  //         },
  //         {
  //           path: 'event-categories',
  //           loadComponent: () =>
  //             import('./pages/admin/event-category/event-category.component').then(
  //               (m) => m.EventCategoryComponent
  //             ),
  //         },
  //         {
  //           path: 'testimonial',
  //           loadComponent: () =>
  //             import('./pages/admin/testimonial/testimonial.component').then(
  //               (m) => m.TestimonialComponent
  //             ),
  //         },
  //       ]
  //     }
  //   ],
  // },
  
  // // Wildcard route
  // {
  //   path: '**',
  //   redirectTo: 'auth/login',
  // },
];

// console.log('Routes configured:', routes);


