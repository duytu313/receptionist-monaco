"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, Bell, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useBookingData } from '@/hooks/useBookingData';

export default function NotificationsPage() {
  const { bookings } = useBookingData();

  const notifications = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      message: string;
      time: string;
      type: 'warning' | 'success' | 'info' | 'danger';
    }> = [];

    bookings.forEach((b) => {
      if (b.status === 'Chờ đến') {
        items.push({
          id: b.id + '-waiting',
          title: `${b.name} đang chờ đến`,
          message: `Phòng ${b.room || 'chưa chọn'} - ${b.time || b.duration}`,
          time: b.date || '',
          type: 'warning',
        });
      }
      if (b.status === 'Chờ thanh toán') {
        items.push({
          id: b.id + '-payment',
          title: `${b.name} chờ thanh toán`,
          message: `Phòng ${b.room || 'chưa chọn'} - ${b.totalEst ? b.totalEst.toLocaleString('vi-VN') + 'đ' : 'chưa tính'}`,
          time: b.date || '',
          type: 'danger',
        });
      }
      if (b.status === 'Đã xác nhận') {
        items.push({
          id: b.id + '-confirmed',
          title: `${b.name} đã xác nhận`,
          message: `Phòng ${b.room || 'chưa chọn'} - ${b.time || b.duration}`,
          time: b.date || '',
          type: 'info',
        });
      }
      if (b.status === 'Đã thanh toán') {
        items.push({
          id: b.id + '-paid',
          title: `${b.name} đã thanh toán`,
          message: `Phòng ${b.room || ''} - ${(b.paidAmount || 0).toLocaleString('vi-VN')}đ`,
          time: b.date || '',
          type: 'success',
        });
      }
    });

    return items.sort((a, b) => (b.time > a.time ? 1 : -1));
  }, [bookings]);

  const iconMap = {
    warning: <Clock className="w-5 h-5 text-yellow-500" />,
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    info: <Bell className="w-5 h-5 text-blue-500" />,
    danger: <AlertTriangle className="w-5 h-5 text-red-500" />,
  };

  const bgMap = {
    warning: 'bg-yellow-50 border-yellow-100',
    success: 'bg-green-50 border-green-100',
    info: 'bg-blue-50 border-blue-100',
    danger: 'bg-red-50 border-red-100',
  };

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center overflow-hidden font-sans">
      <div className="app-container">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
          <Link href="/more" className="flex items-center text-gray-700 hover:text-gray-900">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-bold text-lg">Thông báo</h1>
          <div className="w-6" />
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
          {notifications.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">🔔</div>
              <div className="text-sm font-medium">Không có thông báo mới</div>
            </div>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`border rounded-xl p-4 mb-3 ${bgMap[n.type]}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{iconMap[n.type]}</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                </div>
                <XCircle className="w-4 h-4 text-gray-300 cursor-pointer hover:text-gray-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}