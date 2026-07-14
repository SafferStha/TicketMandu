export const getHomeRoute = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'organizer') return '/organizer';
  return '/';
};

export const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/events', label: 'Events' },
  { to: '/admin/organizers', label: 'Organizers' },
  { to: '/admin/venues', label: 'Venues' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/event-images', label: 'Event Images' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/tickets', label: 'Tickets' },
  { to: '/admin/ticket-types', label: 'Ticket Types' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/coupons', label: 'Coupons' },
  { to: '/admin/seat-maps', label: 'Seat Maps' },
  { to: '/admin/seats', label: 'Seats' },
  { to: '/admin/notifications', label: 'Notifications' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
  { to: '/admin/reports', label: 'Reports' },
];

export const ORGANIZER_NAV = [
  { to: '/organizer', label: 'Dashboard' },
  { to: '/organizer/events', label: 'My Events' },
  { to: '/organizer/ticket-types', label: 'Ticket Types' },
  { to: '/organizer/event-images', label: 'Event Images' },
  { to: '/organizer/coupons', label: 'Coupons' },
  { to: '/organizer/orders', label: 'Orders' },
  { to: '/organizer/tickets', label: 'Ticket Checks' },
  { to: '/organizer/analytics', label: 'Analytics' },
  { to: '/organizer/profile', label: 'Profile' },
];

export const CUSTOMER_NAV = [
  { to: '/', label: 'Home' },
  { to: '/discover', label: 'Discover' },
  { to: '/orders', label: 'My Orders' },
  { to: '/tickets', label: 'My Tickets' },
  { to: '/favorites', label: 'Favorites' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' },
];
