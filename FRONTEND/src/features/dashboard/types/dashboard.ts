export interface DashboardKpis {
  totalUsers: number;
  totalEmployees: number;
  totalVendors: number;
  totalVenues: number;
  totalBookings: number;
  totalRevenue: number;
  totalEvents: number;
  activeVendors: number;
  activeVenues: number;
  pendingApprovals: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  newUsersThisMonth: number;
  newVendorsThisMonth: number;
}

export interface DashboardQuickStats {
  todaysBookings: number;
  thisWeekRevenue: number;
  thisMonthRevenue: number;
  averageBookingValue: number;
  averageRating: number;
}

export interface TrendPoint {
  month: string;
  bookings: number;
  revenue: number;
}

export interface DistributionItem {
  name: string;
  value: number;
}

export interface TopPerformer {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
}

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface RecentBooking {
  id: string;
  bookingId: string;
  status: string;
  amount: number;
  eventDate?: string;
  createdAt: string;
}

export interface RecentReview {
  id: string;
  entityType: string;
  entityId: string;
  score: number;
  review?: string;
  createdAt: string;
}

export interface RecentNotification {
  id: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface DashboardStats {
  kpis: DashboardKpis;
  quickStats: DashboardQuickStats;
  monthlyBookingsTrend: TrendPoint[];
  monthlyRevenueTrend: TrendPoint[];
  bookingStatusDistribution: DistributionItem[];
  vendorCategoryDistribution: DistributionItem[];
  venueCategoryDistribution: DistributionItem[];
  topVendors: TopPerformer[];
  topVenues: TopPerformer[];
  recentUsers: RecentUser[];
  recentBookings: RecentBooking[];
  latestReviews: RecentReview[];
  latestNotifications: RecentNotification[];
  recentActivity: ActivityItem[];
}
