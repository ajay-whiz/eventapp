import { ApiProperty } from '@nestjs/swagger';

export class DashboardKpiDto {
  @ApiProperty() totalUsers: number;
  @ApiProperty() totalEmployees: number;
  @ApiProperty() totalVendors: number;
  @ApiProperty() totalVenues: number;
  @ApiProperty() totalBookings: number;
  @ApiProperty() totalRevenue: number;
  @ApiProperty() totalEvents: number;
  @ApiProperty() activeVendors: number;
  @ApiProperty() activeVenues: number;
  @ApiProperty() pendingApprovals: number;
  @ApiProperty() upcomingBookings: number;
  @ApiProperty() completedBookings: number;
  @ApiProperty() cancelledBookings: number;
  @ApiProperty() newUsersThisMonth: number;
  @ApiProperty() newVendorsThisMonth: number;
}

export class DashboardQuickStatsDto {
  @ApiProperty() todaysBookings: number;
  @ApiProperty() thisWeekRevenue: number;
  @ApiProperty() thisMonthRevenue: number;
  @ApiProperty() averageBookingValue: number;
  @ApiProperty() averageRating: number;
}

export class TrendPointDto {
  @ApiProperty() month: string;
  @ApiProperty() bookings: number;
  @ApiProperty() revenue: number;
}

export class DistributionItemDto {
  @ApiProperty() name: string;
  @ApiProperty() value: number;
}

export class TopPerformerDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() bookings: number;
  @ApiProperty() revenue: number;
}

export class RecentUserDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty() createdAt: Date;
}

export class RecentBookingDto {
  @ApiProperty() id: string;
  @ApiProperty() bookingId: string;
  @ApiProperty() status: string;
  @ApiProperty() amount: number;
  @ApiProperty() eventDate?: string;
  @ApiProperty() createdAt: Date;
}

export class RecentReviewDto {
  @ApiProperty() id: string;
  @ApiProperty() entityType: string;
  @ApiProperty() entityId: string;
  @ApiProperty() score: number;
  @ApiProperty() review?: string;
  @ApiProperty() createdAt: Date;
}

export class RecentNotificationDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() message: string;
  @ApiProperty() status: string;
  @ApiProperty() createdAt: Date;
}

export class ActivityItemDto {
  @ApiProperty() id: string;
  @ApiProperty() type: string;
  @ApiProperty() message: string;
  @ApiProperty() createdAt: Date;
}

export class DashboardStatsResponseDto {
  @ApiProperty({ type: DashboardKpiDto }) kpis: DashboardKpiDto;
  @ApiProperty({ type: DashboardQuickStatsDto }) quickStats: DashboardQuickStatsDto;
  @ApiProperty({ type: [TrendPointDto] }) monthlyBookingsTrend: TrendPointDto[];
  @ApiProperty({ type: [TrendPointDto] }) monthlyRevenueTrend: TrendPointDto[];
  @ApiProperty({ type: [DistributionItemDto] }) bookingStatusDistribution: DistributionItemDto[];
  @ApiProperty({ type: [DistributionItemDto] }) vendorCategoryDistribution: DistributionItemDto[];
  @ApiProperty({ type: [DistributionItemDto] }) venueCategoryDistribution: DistributionItemDto[];
  @ApiProperty({ type: [TopPerformerDto] }) topVendors: TopPerformerDto[];
  @ApiProperty({ type: [TopPerformerDto] }) topVenues: TopPerformerDto[];
  @ApiProperty({ type: [RecentUserDto] }) recentUsers: RecentUserDto[];
  @ApiProperty({ type: [RecentBookingDto] }) recentBookings: RecentBookingDto[];
  @ApiProperty({ type: [RecentReviewDto] }) latestReviews: RecentReviewDto[];
  @ApiProperty({ type: [RecentNotificationDto] }) latestNotifications: RecentNotificationDto[];
  @ApiProperty({ type: [ActivityItemDto] }) recentActivity: ActivityItemDto[];
}
