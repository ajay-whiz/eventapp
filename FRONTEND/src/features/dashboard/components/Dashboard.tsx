import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Building2,
  Calendar,
  CalendarCheck,
  DollarSign,
  RefreshCw,
  Star,
  Store,
  TrendingUp,
  Users,
  UserCheck,
  X,
  XCircle,
  Clock,
  Bell,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import Layout from '../../../layouts/Layout';
import { Button } from '../../../components/atoms/Button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../../../components/ui/chart';
import { useDashboard } from '../hooks/useDashboard';
import type { ActivityItem } from '../types/dashboard';

const PIE_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(value || 0);

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
}> = ({ title, value, subtitle, icon, iconBg }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>{icon}</div>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
    <div className="h-8 bg-gray-200 rounded w-2/3 mb-2" />
    <div className="h-3 bg-gray-100 rounded w-1/3" />
  </div>
);

const ChartCard: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
  empty?: boolean;
  emptyMessage?: string;
}> = ({ title, children, className = '', empty, emptyMessage = 'No data available' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {empty ? (
      <div className="flex items-center justify-center h-48 text-sm text-gray-500">{emptyMessage}</div>
    ) : (
      children
    )}
  </div>
);

const ActivityIcon: React.FC<{ type: string }> = ({ type }) => {
  const base = 'w-4 h-4';
  switch (type) {
    case 'user':
      return <Users className={base} />;
    case 'vendor':
      return <Store className={base} />;
    case 'venue':
      return <Building2 className={base} />;
    case 'booking_cancelled':
      return <XCircle className={base} />;
    case 'booking':
      return <Calendar className={base} />;
    case 'review':
      return <Star className={base} />;
    case 'payment':
      return <DollarSign className={base} />;
    default:
      return <Bell className={base} />;
  }
};

const activityColor = (type: string) => {
  switch (type) {
    case 'booking_cancelled':
      return 'bg-red-100 text-red-600';
    case 'payment':
    case 'booking':
      return 'bg-green-100 text-green-600';
    case 'review':
      return 'bg-amber-100 text-amber-600';
    default:
      return 'bg-sky-100 text-sky-600';
  }
};

const RecentActivityList: React.FC<{ items: ActivityItem[] }> = ({ items }) => {
  if (!items.length) {
    return <p className="text-sm text-gray-500 text-center py-8">No recent activity yet.</p>;
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {items.map((activity) => (
        <div
          key={`${activity.type}-${activity.id}`}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${activityColor(activity.type)}`}>
            <ActivityIcon type={activity.type} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-900">{activity.message}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatRelativeTime(activity.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { data, loading, error, refresh } = useDashboard();
  const [showUnauthorizedMessage, setShowUnauthorizedMessage] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { error?: string } | null;

  useEffect(() => {
    if (state?.error) {
      setShowUnauthorizedMessage(true);
      const timer = setTimeout(() => setShowUnauthorizedMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const kpis = data?.kpis;
  const quick = data?.quickStats;

  const kpiCards = kpis
    ? [
        { title: 'Total Users', value: formatNumber(kpis.totalUsers), subtitle: `+${kpis.newUsersThisMonth} this month`, icon: <Users className="w-5 h-5 text-white" />, iconBg: 'bg-sky-500' },
        { title: 'Total Employees', value: formatNumber(kpis.totalEmployees), icon: <UserCheck className="w-5 h-5 text-white" />, iconBg: 'bg-indigo-500' },
        { title: 'Total Vendors', value: formatNumber(kpis.totalVendors), subtitle: `${kpis.activeVendors} active`, icon: <Store className="w-5 h-5 text-white" />, iconBg: 'bg-violet-500' },
        { title: 'Total Venues', value: formatNumber(kpis.totalVenues), subtitle: `${kpis.activeVenues} active`, icon: <Building2 className="w-5 h-5 text-white" />, iconBg: 'bg-emerald-500' },
        { title: 'Total Bookings', value: formatNumber(kpis.totalBookings), subtitle: `${kpis.upcomingBookings} upcoming`, icon: <Calendar className="w-5 h-5 text-white" />, iconBg: 'bg-orange-500' },
        // { title: 'Completed Bookings', value: formatNumber(kpis.completedBookings), icon: <CalendarCheck className="w-5 h-5 text-white" />, iconBg: 'bg-green-500' },
        { title: 'Cancelled Bookings', value: formatNumber(kpis.cancelledBookings), icon: <XCircle className="w-5 h-5 text-white" />, iconBg: 'bg-red-500' },
        { title: 'Total Revenue', value: formatCurrency(kpis.totalRevenue), icon: <DollarSign className="w-5 h-5 text-white" />, iconBg: 'bg-purple-500' },
        // { title: 'Pending Approvals', value: formatNumber(kpis.pendingApprovals), icon: <Clock className="w-5 h-5 text-white" />, iconBg: 'bg-amber-500' },
        // { title: 'Total Events', value: formatNumber(kpis.totalEvents), icon: <TrendingUp className="w-5 h-5 text-white" />, iconBg: 'bg-cyan-500' },
        // { title: 'New Vendors (Month)', value: formatNumber(kpis.newVendorsThisMonth), icon: <Store className="w-5 h-5 text-white" />, iconBg: 'bg-pink-500' },
        // { title: 'Avg. Rating', value: quick?.averageRating?.toFixed(1) ?? '0.0', subtitle: 'Platform average', icon: <Star className="w-5 h-5 text-white" />, iconBg: 'bg-yellow-500' },
      ]
    : [];

  const quickStats = quick
    ? [
        { label: "Today's Bookings", value: formatNumber(quick.todaysBookings) },
        { label: "This Week's Revenue", value: formatCurrency(quick.thisWeekRevenue) },
        { label: "This Month's Revenue", value: formatCurrency(quick.thisMonthRevenue) },
        // { label: 'Avg. Booking Value', value: formatCurrency(quick.averageBookingValue) },
      ]
    : [];

  return (
    <Layout>
      <div className="space-y-6">
        {showUnauthorizedMessage && state?.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
                <p className="text-sm text-red-700 mt-1">{state.error}</p>
              </div>
            </div>
            <button onClick={() => setShowUnauthorizedMessage(false)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-1">Real-time overview of platform performance and activity.</p>
          </div>
          <Button variant="muted" onClick={() => refresh()} disabled={loading} className="flex items-center gap-2 self-start">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="primary" size="sm" onClick={() => refresh()}>
              Retry
            </Button>
          </div>
        )}

        {/* Quick stats strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading && !data
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : quickStats.map((item) => (
                <div key={item.label} className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 rounded-xl p-4">
                  <p className="text-xs font-medium text-sky-700 uppercase tracking-wide">{item.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{item.value}</p>
                </div>
              ))}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {loading && !data
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : kpiCards.map((card) => (
                <StatCard key={card.title} {...card} />
              ))}
        </div>

        {/* Trends */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartCard title="Monthly Bookings Trend" empty={!data?.monthlyBookingsTrend?.length}>
            {data?.monthlyBookingsTrend?.length ? (
              <ChartContainer
                config={{ bookings: { label: 'Bookings', color: '#0ea5e9' } }}
                className="h-64 w-full"
              >
                <BarChart data={data.monthlyBookingsTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : null}
          </ChartCard>

          <ChartCard title="Monthly Revenue Trend" empty={!data?.monthlyRevenueTrend?.length}>
            {data?.monthlyRevenueTrend?.length ? (
              <ChartContainer
                config={{ revenue: { label: 'Revenue', color: '#8b5cf6' } }}
                className="h-64 w-full"
              >
                <LineChart data={data.monthlyRevenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `₹${v}`} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ChartContainer>
            ) : null}
          </ChartCard>
        </div>

        {/* Distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard title="Booking Status" empty={!data?.bookingStatusDistribution?.length}>
            {data?.bookingStatusDistribution?.length ? (
              <ChartContainer config={{ value: { label: 'Count' } }} className="h-64 w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={data.bookingStatusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {data.bookingStatusDistribution.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : null}
          </ChartCard>

          <ChartCard title="Vendor Categories" empty={!data?.vendorCategoryDistribution?.length}>
            {data?.vendorCategoryDistribution?.length ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.vendorCategoryDistribution.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-sm text-gray-700 flex-1 truncate">{item.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </ChartCard>

          <ChartCard title="Venue Categories" empty={!data?.venueCategoryDistribution?.length}>
            {data?.venueCategoryDistribution?.length ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {data.venueCategoryDistribution.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-sm text-gray-700 flex-1 truncate">{item.name}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </ChartCard>
        </div>

        {/* Top performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Top Performing Vendors" empty={!data?.topVendors?.length} emptyMessage="No vendor booking data yet.">
            {data?.topVendors?.length ? (
              <div className="space-y-3">
                {data.topVendors.map((vendor, index) => (
                  <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 text-sm font-semibold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{vendor.name}</p>
                        <p className="text-sm text-gray-500">{vendor.bookings} bookings</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 shrink-0 ml-2">{formatCurrency(vendor.revenue)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </ChartCard>

          <ChartCard title="Top Performing Venues" empty={!data?.topVenues?.length} emptyMessage="No venue booking data yet.">
            {data?.topVenues?.length ? (
              <div className="space-y-3">
                {data.topVenues.map((venue, index) => (
                  <div key={venue.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{venue.name}</p>
                        <p className="text-sm text-gray-500">{venue.bookings} bookings</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 shrink-0 ml-2">{formatCurrency(venue.revenue)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </ChartCard>
        </div>

        {/* Recent data + activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <ChartCard title="Recent Activity">
              {loading && !data ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <RecentActivityList items={data?.recentActivity ?? []} />
              )}
            </ChartCard>

            <ChartCard title="Recent Bookings" empty={!data?.recentBookings?.length}>
              {data?.recentBookings?.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="pb-2 pr-4">Booking ID</th>
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2 pr-4">Amount</th>
                        <th className="pb-2">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentBookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-gray-100 last:border-0">
                          <td className="py-2 pr-4 font-medium text-gray-900">{booking.bookingId}</td>
                          <td className="py-2 pr-4 capitalize">{booking.status}</td>
                          <td className="py-2 pr-4">{formatCurrency(booking.amount)}</td>
                          <td className="py-2 text-gray-500">{formatRelativeTime(booking.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </ChartCard>
          </div>

          <div className="space-y-6">
            <ChartCard title="Recent Users" empty={!data?.recentUsers?.length}>
              {data?.recentUsers?.length ? (
                <div className="space-y-3">
                  {data.recentUsers.map((user) => (
                    <div key={user.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(user.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </ChartCard>

            <ChartCard title="Latest Reviews" empty={!data?.latestReviews?.length}>
              {data?.latestReviews?.length ? (
                <div className="space-y-3">
                  {data.latestReviews.map((review) => (
                    <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-1 text-amber-500 mb-1">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-semibold text-gray-900">{review.score}/5</span>
                        <span className="text-xs text-gray-500 capitalize ml-1">· {review.entityType}</span>
                      </div>
                      {review.review && <p className="text-sm text-gray-700 line-clamp-2">{review.review}</p>}
                      <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(review.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </ChartCard>

            {/* <ChartCard title="Quick Actions">
              <div className="space-y-2">
                <Button variant="primary" className="w-full" onClick={() => navigate('/booking-management')}>
                  View Bookings
                </Button>
                <Button variant="muted" className="w-full" onClick={() => navigate('/venue-management')}>
                  Manage Venues
                </Button>
                <Button variant="muted" className="w-full" onClick={() => navigate('/vendor-management')}>
                  Manage Vendors
                </Button>
                <Button variant="muted" className="w-full" onClick={() => navigate('/user-management')}>
                  Manage Users
                </Button>
              </div>
            </ChartCard> */}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
