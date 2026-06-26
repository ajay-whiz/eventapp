import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { User } from '@modules/user/entities/user.entity';
import { Vendor } from '@modules/vendor/entity/vendor.entity';
import { Venue } from '@modules/venue/entity/venue.entity';
import { Booking } from '@modules/booking/entities/booking.entity';
import { Event } from '@modules/event/entities/event.entity';
import { Rating } from '@modules/rating/entity/rating.entity';
import { Notification } from '@modules/notification/entity/notification.entity';
import { BookingStatus } from '@shared/enums/bookingStatus';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(User, 'mongo')
    private readonly userRepo: MongoRepository<User>,
    @InjectRepository(Vendor, 'mongo')
    private readonly vendorRepo: MongoRepository<Vendor>,
    @InjectRepository(Venue, 'mongo')
    private readonly venueRepo: MongoRepository<Venue>,
    @InjectRepository(Booking, 'mongo')
    private readonly bookingRepo: MongoRepository<Booking>,
    @InjectRepository(Event, 'mongo')
    private readonly eventRepo: MongoRepository<Event>,
    @InjectRepository(Rating, 'mongo')
    private readonly ratingRepo: MongoRepository<Rating>,
    @InjectRepository(Notification, 'mongo')
    private readonly notificationRepo: MongoRepository<Notification>,
  ) {}

  private notDeletedMatch() {
    return { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] };
  }

  private bookingAmountExpr() {
    return { $ifNull: ['$paymentDetails.amount', { $ifNull: ['$budgetRange', 0] }] };
  }

  private appUserMatch() {
    const notDeleted = this.notDeletedMatch();
    return {
      $and: [
        notDeleted,
        {
          $or: [
            { userType: 'USER' },
            {
              userType: { $exists: false },
              isEnterpriseAdmin: { $ne: true },
              $or: [
                { enterpriseId: { $exists: false } },
                { enterpriseId: null },
                { enterpriseId: '' },
              ],
            },
          ],
        },
      ],
    };
  }

  private employeeMatch() {
    return {
      $and: [
        this.notDeletedMatch(),
        { isMobileAppUser: false },
        { enterpriseId: { $exists: true, $nin: [null, ''] } },
      ],
    };
  }

  private startOfDay(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private startOfWeek(date = new Date()) {
    const d = this.startOfDay(date);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    return d;
  }

  private startOfMonth(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private monthStartMonthsAgo(months: number) {
    const d = new Date();
    d.setMonth(d.getMonth() - months);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private async countByMatch(repo: MongoRepository<any>, match: Record<string, unknown>) {
    const rows = await repo.aggregate([{ $match: match }, { $count: 'total' }]).toArray();
    return rows[0]?.total ?? 0;
  }

  private async aggregate<T>(repo: MongoRepository<any>, pipeline: Record<string, unknown>[]): Promise<T[]> {
    return repo.aggregate(pipeline).toArray() as Promise<T[]>;
  }

  private async findRecent<T>(repo: MongoRepository<any>, match: Record<string, unknown>, limit: number): Promise<T[]> {
    return repo
      .aggregate([{ $match: match }, { $sort: { createdAt: -1 } }, { $limit: limit }])
      .toArray() as Promise<T[]>;
  }

  private formatMonthLabel(year: number, month: number) {
    return `${MONTH_LABELS[month - 1]} ${String(year).slice(-2)}`;
  }

  private buildMonthlyTrend(rows: Array<{ _id: { year: number; month: number }; count: number; revenue: number }>) {
    return rows.map((row) => ({
      month: this.formatMonthLabel(row._id.year, row._id.month),
      bookings: row.count,
      revenue: Math.round(row.revenue || 0),
    }));
  }

  private formatStatusLabel(status: string) {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  private categoryLookupStage(collectionName: string) {
    return {
      $lookup: {
        from: collectionName,
        let: { categoryId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: [{ $toString: '$_id' }, { $toString: '$$categoryId' }] },
                  { $eq: ['$key', { $toString: '$$categoryId' }] },
                ],
              },
            },
          },
          { $project: { name: 1 } },
          { $limit: 1 },
        ],
        as: 'categoryDoc',
      },
    };
  }

  private categoryNameProjection() {
    return {
      $project: {
        name: {
          $let: {
            vars: {
              resolvedName: { $arrayElemAt: ['$categoryDoc.name', 0] },
            },
            in: {
              $cond: [
                { $and: [{ $ne: ['$$resolvedName', null] }, { $ne: ['$$resolvedName', ''] }] },
                '$$resolvedName',
                {
                  $cond: [
                    {
                      $or: [
                        { $eq: ['$_id', 'Uncategorized'] },
                        { $eq: ['$_id', null] },
                        { $eq: ['$_id', ''] },
                      ],
                    },
                    'Uncategorized',
                    'Unknown Category',
                  ],
                },
              ],
            },
          },
        },
        value: 1,
      },
    };
  }

  private entityLookupStages() {
    return [
      {
        $lookup: {
          from: 'venues',
          let: { entityId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: '$_id' }, '$$entityId'] },
              },
            },
            { $project: { name: 1, title: 1 } },
            { $limit: 1 },
          ],
          as: 'venueDoc',
        },
      },
      {
        $lookup: {
          from: 'vendors',
          let: { entityId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: '$_id' }, '$$entityId'] },
              },
            },
            { $project: { name: 1, title: 1 } },
            { $limit: 1 },
          ],
          as: 'vendorDoc',
        },
      },
      {
        $addFields: {
          name: {
            $ifNull: [
              { $arrayElemAt: ['$venueDoc.name', 0] },
              { $arrayElemAt: ['$vendorDoc.name', 0] },
              { $arrayElemAt: ['$venueDoc.title', 0] },
              { $arrayElemAt: ['$vendorDoc.title', 0] },
              'Unknown',
            ],
          },
        },
      },
    ];
  }

  async getStats() {
    try {
      return await this.buildStats();
    } catch (error) {
      this.logger.error('Failed to build dashboard stats', error instanceof Error ? error.stack : error);
      throw error;
    }
  }

  private async buildStats() {
    const now = new Date();
    const todayStart = this.startOfDay(now);
    const weekStart = this.startOfWeek(now);
    const monthStart = this.startOfMonth(now);
    const sixMonthsAgo = this.monthStartMonthsAgo(5);
    const notDeleted = this.notDeletedMatch();
    const amountExpr = this.bookingAmountExpr();
    const appUsers = this.appUserMatch();
    const employees = this.employeeMatch();

    const [
      totalUsers,
      totalEmployees,
      totalVendors,
      activeVendors,
      totalVenues,
      activeVenues,
      totalBookings,
      totalEvents,
      pendingVendorApprovals,
      pendingVenueApprovals,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
      newUsersThisMonth,
      newVendorsThisMonth,
      todaysBookings,
      weekRevenueRows,
      monthRevenueRows,
      totalRevenueRows,
      avgBookingRows,
      avgRatingRows,
      monthlyTrendRows,
      statusDistribution,
      vendorCategoryRows,
      venueCategoryRows,
      topVendorRows,
      topVenueRows,
      recentUsers,
      recentBookings,
      latestReviews,
      latestNotifications,
      recentVendorAdds,
      recentVenueAdds,
    ] = await Promise.all([
      this.countByMatch(this.userRepo, appUsers),
      this.countByMatch(this.userRepo, employees),
      this.countByMatch(this.vendorRepo, notDeleted),
      this.countByMatch(this.vendorRepo, { $and: [notDeleted, { isActive: true }] }),
      this.countByMatch(this.venueRepo, notDeleted),
      this.countByMatch(this.venueRepo, { $and: [notDeleted, { isActive: true }] }),
      this.countByMatch(this.bookingRepo, notDeleted),
      this.countByMatch(this.eventRepo, notDeleted),
      this.countByMatch(this.vendorRepo, { $and: [notDeleted, { isActive: false }] }),
      this.countByMatch(this.venueRepo, { $and: [notDeleted, { isActive: false }] }),
      this.countByMatch(this.bookingRepo, {
        $and: [notDeleted, { bookingStatus: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } }],
      }),
      this.countByMatch(this.bookingRepo, { $and: [notDeleted, { bookingStatus: BookingStatus.COMPLETED }] }),
      this.countByMatch(this.bookingRepo, { $and: [notDeleted, { bookingStatus: BookingStatus.CANCELLED }] }),
      this.countByMatch(this.userRepo, { $and: [appUsers, { createdAt: { $gte: monthStart } }] }),
      this.countByMatch(this.vendorRepo, { $and: [notDeleted, { createdAt: { $gte: monthStart } }] }),
      this.countByMatch(this.bookingRepo, { $and: [notDeleted, { createdAt: { $gte: todayStart } }] }),
      this.aggregate<{ total: number }>(this.bookingRepo, [
        { $match: { $and: [notDeleted, { createdAt: { $gte: weekStart } }] } },
        { $group: { _id: null, total: { $sum: amountExpr } } },
      ]),
      this.aggregate<{ total: number }>(this.bookingRepo, [
        { $match: { $and: [notDeleted, { createdAt: { $gte: monthStart } }] } },
        { $group: { _id: null, total: { $sum: amountExpr } } },
      ]),
      this.aggregate<{ total: number }>(this.bookingRepo, [
        { $match: notDeleted },
        { $group: { _id: null, total: { $sum: amountExpr } } },
      ]),
      this.aggregate<{ avg: number }>(this.bookingRepo, [
        { $match: notDeleted },
        { $group: { _id: null, avg: { $avg: amountExpr } } },
      ]),
      this.aggregate<{ avg: number }>(this.ratingRepo, [
        { $match: notDeleted },
        { $group: { _id: null, avg: { $avg: '$score' } } },
      ]),
      this.aggregate<{ _id: { year: number; month: number }; count: number; revenue: number }>(
        this.bookingRepo,
        [
          { $match: { $and: [notDeleted, { createdAt: { $gte: sixMonthsAgo } }] } },
          {
            $group: {
              _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
              count: { $sum: 1 },
              revenue: { $sum: amountExpr },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ],
      ),
      this.aggregate<{ _id: string; count: number }>(this.bookingRepo, [
        { $match: notDeleted },
        { $group: { _id: { $ifNull: ['$bookingStatus', 'pending'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.aggregate<{ _id: string; name: string; value: number }>(this.vendorRepo, [
        { $match: notDeleted },
        { $group: { _id: { $ifNull: ['$categoryId', 'Uncategorized'] }, value: { $sum: 1 } } },
        this.categoryLookupStage('categories'),
        this.categoryNameProjection(),
        { $sort: { value: -1 } },
        { $limit: 8 },
      ]),
      this.aggregate<{ _id: string; name: string; value: number }>(this.venueRepo, [
        { $match: notDeleted },
        { $group: { _id: { $ifNull: ['$categoryId', 'Uncategorized'] }, value: { $sum: 1 } } },
        this.categoryLookupStage('categories'),
        this.categoryNameProjection(),
        { $sort: { value: -1 } },
        { $limit: 8 },
      ]),
      this.aggregate<{ _id: string; name: string; bookings: number; revenue: number }>(this.bookingRepo, [
        { $match: { $and: [notDeleted, { bookingType: 'vendor' }, { venueId: { $exists: true, $ne: '' } }] } },
        { $group: { _id: '$venueId', bookings: { $sum: 1 }, revenue: { $sum: amountExpr } } },
        { $sort: { bookings: -1 } },
        { $limit: 5 },
        ...this.entityLookupStages(),
      ]),
      this.aggregate<{ _id: string; name: string; bookings: number; revenue: number }>(this.bookingRepo, [
        { $match: { $and: [notDeleted, { bookingType: 'venue' }, { venueId: { $exists: true, $ne: '' } }] } },
        { $group: { _id: '$venueId', bookings: { $sum: 1 }, revenue: { $sum: amountExpr } } },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        ...this.entityLookupStages(),
      ]),
      this.findRecent<any>(this.userRepo, appUsers, 5),
      this.findRecent<any>(this.bookingRepo, notDeleted, 5),
      this.findRecent<any>(this.ratingRepo, notDeleted, 5),
      this.findRecent<any>(this.notificationRepo, notDeleted, 5),
      this.findRecent<any>(this.vendorRepo, notDeleted, 3),
      this.findRecent<any>(this.venueRepo, notDeleted, 3),
    ]);

    const monthlyBookingsTrend = this.buildMonthlyTrend(monthlyTrendRows);
    const monthlyRevenueTrend = monthlyBookingsTrend.map((item) => ({
      month: item.month,
      bookings: item.bookings,
      revenue: item.revenue,
    }));

    const recentActivity = [
      ...recentUsers.map((user) => ({
        id: this.docId(user),
        type: 'user',
        message: `New user registered: ${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        createdAt: user.createdAt,
      })),
      ...recentBookings.map((booking) => ({
        id: this.docId(booking),
        type: booking.bookingStatus === BookingStatus.CANCELLED ? 'booking_cancelled' : 'booking',
        message:
          booking.bookingStatus === BookingStatus.CANCELLED
            ? `Booking cancelled: ${booking.bookingId}`
            : `Booking created: ${booking.bookingId}`,
        createdAt: booking.createdAt,
      })),
      ...recentVendorAdds.map((vendor) => ({
        id: this.docId(vendor),
        type: 'vendor',
        message: `Vendor added: ${vendor.name || vendor.title}`,
        createdAt: vendor.createdAt,
      })),
      ...recentVenueAdds.map((venue) => ({
        id: this.docId(venue),
        type: 'venue',
        message: `Venue ${venue.isActive ? 'added' : 'pending approval'}: ${venue.name || venue.title}`,
        createdAt: venue.createdAt,
      })),
      ...latestReviews.map((rating) => ({
        id: this.docId(rating),
        type: 'review',
        message: `Review submitted (${rating.score}/5) for ${rating.entityType}`,
        createdAt: rating.createdAt,
      })),
      ...latestNotifications
        .filter((n) => /payment|paid/i.test(n.message || n.title || ''))
        .map((notification) => ({
          id: this.docId(notification),
          type: 'payment',
          message: notification.message || notification.title,
          createdAt: notification.createdAt,
        })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);

    return {
      kpis: {
        totalUsers,
        totalEmployees,
        totalVendors,
        totalVenues,
        totalBookings,
        totalRevenue: Math.round(totalRevenueRows[0]?.total || 0),
        totalEvents,
        activeVendors,
        activeVenues,
        pendingApprovals: pendingVendorApprovals + pendingVenueApprovals,
        upcomingBookings,
        completedBookings,
        cancelledBookings,
        newUsersThisMonth,
        newVendorsThisMonth,
      },
      quickStats: {
        todaysBookings,
        thisWeekRevenue: Math.round(weekRevenueRows[0]?.total || 0),
        thisMonthRevenue: Math.round(monthRevenueRows[0]?.total || 0),
        averageBookingValue: Math.round(avgBookingRows[0]?.avg || 0),
        averageRating: Number((avgRatingRows[0]?.avg || 0).toFixed(1)),
      },
      monthlyBookingsTrend,
      monthlyRevenueTrend,
      bookingStatusDistribution: statusDistribution.map((item) => ({
        name: this.formatStatusLabel(item._id),
        value: item.count,
      })),
      vendorCategoryDistribution: vendorCategoryRows.map((item) => ({
        name: item.name || 'Uncategorized',
        value: item.value,
      })),
      venueCategoryDistribution: venueCategoryRows.map((item) => ({
        name: item.name || 'Uncategorized',
        value: item.value,
      })),
      topVendors: topVendorRows.map((row) => ({
        id: row._id,
        name: row.name || 'Unknown Vendor',
        bookings: row.bookings,
        revenue: Math.round(row.revenue || 0),
      })),
      topVenues: topVenueRows.map((row) => ({
        id: row._id,
        name: row.name || 'Unknown Venue',
        bookings: row.bookings,
        revenue: Math.round(row.revenue || 0),
      })),
      recentUsers: recentUsers.map((user) => ({
        id: this.docId(user),
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.organizationName || 'User',
        email: user.email,
        createdAt: user.createdAt,
      })),
      recentBookings: recentBookings.map((booking) => ({
        id: this.docId(booking),
        bookingId: booking.bookingId,
        status: booking.bookingStatus,
        amount: Number(booking.paymentDetails?.amount || booking.budgetRange || 0),
        eventDate: booking.eventDate,
        createdAt: booking.createdAt,
      })),
      latestReviews: latestReviews.map((rating) => ({
        id: this.docId(rating),
        entityType: rating.entityType,
        entityId: rating.entityId,
        score: rating.score,
        review: rating.review,
        createdAt: rating.createdAt,
      })),
      latestNotifications: latestNotifications.map((notification) => ({
        id: this.docId(notification),
        title: notification.title,
        message: notification.message,
        status: notification.status,
        createdAt: notification.createdAt,
      })),
      recentActivity,
    };
  }

  private docId(doc: any) {
    return doc?._id?.toString?.() || doc?.id?.toString?.() || '';
  }
}
