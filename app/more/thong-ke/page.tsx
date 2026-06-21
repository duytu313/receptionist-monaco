"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useBookingData } from '@/hooks/useBookingData';
import { parseHoursFromDuration, calculateTotalServices, formatPrice } from '@/utils/formatters';

export default function StatsPage() {
  const { bookings } = useBookingData();

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayBookings = bookings.filter((b) => b.date?.slice(0, 10) === today && b.status !== 'Chờ xác nhận');
    const allTimeBookings = bookings.filter((b) => b.status !== 'Chờ xác nhận');

    // Revenue from paid bookings
    const paidBookings = allTimeBookings.filter((b) => b.status === 'Đã thanh toán');
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.paidAmount || b.totalEst || 0), 0);

    // Today's stats
    const todayPaid = todayBookings.filter((b) => b.status === 'Đã thanh toán');
    const todayRevenue = todayPaid.reduce((sum, b) => sum + (b.paidAmount || b.totalEst || 0), 0);

    // Status distribution
    const statusCounts: Record<string, number> = {};
    allTimeBookings.forEach((b) => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    });

    // Room usage
    const usingBookings = allTimeBookings.filter((b) => b.status === 'Đang dùng');
    const avgDuration = usingBookings.length > 0
      ? usingBookings.reduce((sum, b) => sum + parseHoursFromDuration(b.duration), 0) / usingBookings.length
      : 0;

    return {
      totalBookings: allTimeBookings.length,
      todayBookings: todayBookings.length,
      totalRevenue,
      todayRevenue,
      paidCount: paidBookings.length,
      cancelledCount: statusCounts['Đã hủy'] || 0,
      avgDuration: avgDuration.toFixed(1),
      statusCounts,
    };
  }, [bookings]);

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center overflow-hidden font-sans">
      <div className="app-container">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
          <Link href="/more" className="flex items-center text-gray-700 hover:text-gray-900">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-bold text-lg">Thống kê</h1>
          <div className="w-6" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
          {/* Revenue Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <DollarSign className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-lg font-bold text-green-700">{formatPrice(stats.todayRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">Doanh thu hôm nay</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <TrendingUp className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-lg font-bold text-blue-700">{formatPrice(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">Tổng doanh thu</p>
            </div>
          </div>

          {/* Booking Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <CheckCircle className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-purple-700">{stats.todayBookings}</p>
              <p className="text-xs text-gray-500 mt-1">Đơn hôm nay</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <Clock className="w-6 h-6 text-orange-600 mb-2" />
              <p className="text-2xl font-bold text-orange-700">{stats.totalBookings}</p>
              <p className="text-xs text-gray-500 mt-1">Tổng đơn</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Tóm tắt</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Đã thanh toán</span>
                <span className="font-semibold text-green-600">{stats.paidCount} đơn</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Đã hủy</span>
                <span className="font-semibold text-red-600">{stats.cancelledCount} đơn</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Thời gian TB</span>
                <span className="font-semibold text-gray-700">{stats.avgDuration}h</span>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Phân loại trạng thái</h3>
            <div className="space-y-2">
              {Object.entries(stats.statusCounts).map(([status, count]) => {
                const pct = stats.totalBookings > 0 ? (count / stats.totalBookings) * 100 : 0;
                const colors: Record<string, string> = {
                  'Chờ xác nhận': 'bg-yellow-400',
                  'Đã xác nhận': 'bg-indigo-400',
                  'Đã đến': 'bg-green-400',
                  'Đang dùng': 'bg-orange-400',
                  'Chờ đến': 'bg-blue-400',
                  'Chờ thanh toán': 'bg-red-400',
                  'Đã thanh toán': 'bg-emerald-400',
                  'Đã hủy': 'bg-gray-400',
                };
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{status}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colors[status] || 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}