export interface MenuItem {
  title: string;
  icon?: string;
  route?: string;
  children?: MenuItem[];
  roles: number[]; // Role IDs that can access this menu
}

export const MENU_ITEMS: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: 'dashboard',
    route: '/admin/dashboard',
    roles: [1, 2] // Role 1 and 2 can access
  },
  {
    title: 'Event Management',
    icon: 'event',
    roles: [1, 2],
    children: [
      {
        title: 'Events',
        route: '/admin/events',
        roles: [1, 2]
      },
      {
        title: 'Event Categories',
        route: '/admin/event-categories',
        roles: [1]
      },
      {
        title: 'Ticket Scanning',
        icon: 'qr_code_scanner',
        route: '/admin/ticket-scanning',
        roles: [1, 2]
      },
      // {
      //   title: 'Scan History',
      //   icon: 'history',
      //   route: '/admin/scan-history',
      //   roles: [1, 2]
      // }
    ]
  },
  // Add Banner Management here - ABOVE Testimonial
  {
    title: 'Banner Management',
    icon: 'image', // You can change the icon as needed
    route: '/admin/banner-management',
    roles: [1, 2] // Role 1 and 2 can access
  },
  {
    title: 'Testimonial',
    icon: '',
    route: '/admin/testimonial',
    roles: [1] // Role 1 and 2 can access
  },
  {
    title: 'Organizer Management',
    icon: '',
    roles: [1],
    children: [
      {
        title: 'Event Organizer',
        route: '/admin/event-organizer',
        roles: [1]
      }
    ]
  }
//   {
//     title: 'User Management',
//     icon: 'people',
//     roles: [1, 2],
//     children: [
//       {
//         title: 'User List',
//         route: '/admin/users',
//         roles: [1, 2]
//       },
//       {
//         title: 'Accounts',
//         route: '/admin/accounts',
//         roles: [1, 2]
//       }
//     ]
//   }
];

export const ROLE_NAMES: { [key: number]: string } = {
  1: 'Super Admin',
  2: 'Admin',
  3: 'User'
};