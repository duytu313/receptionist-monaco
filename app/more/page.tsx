"use client";

import React from 'react';
import Link from 'next/link';
import {
  Home as HomeIcon, DoorOpen, MoreVertical, FileText, Settings,
  Calendar, Users, BarChart3, Bell, HelpCircle, ChevronRight,
} from 'lucide-react';
import { useBookingData } from '@/hooks/useBookingData';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  color: string;
}

export default function MorePage() {
  const { facilities, bookings } = useBookingData();

  const waitingCount = bookings.filter(b => b.status === 'Chờ đến').length;

  const menuItems: MenuItem[] = [
    {
      icon: <Calendar className="w-5 h-5" />,
      label: 'Đặt phòng',
      description: 'Tạo đơn đặt phòng mới',
      href: '/dat-phong',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: <DoorOpen className="w-5 h-5" />,
      label: 'Danh sách phòng',
      description: 'Xem trạng thái tất cả phòng',
      href: '/rooms',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Khách hàng',
      description: 'Quản lý thông tin khách hàng',
      href: '/more/khach-hang',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Thống kê',
      description: 'Xem báo cáo doanh thu',
      href: '/more/thong-ke',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: 'Thông báo',
      description: `${waitingCount} thông báo chờ xử lý`,
      href: '/more/thong-bao',
      color: 'bg-red-100 text-red-600',
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Quản trị',
      description: 'Đăng nhập quản trị hệ thống',
      href: '/admin/login',
      color: 'bg-gray-100 text-gray-600',
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      label: 'Hỗ trợ',
      description: 'Hướng dẫn sử dụng',
      href: '/more/huong-dan',
      color: 'bg-teal-100 text-teal-600',
    },
  ];

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center overflow-hidden font-sans">
      <div className="w-full max-w-md bg-white relative h-[100dvh] overflow-hidden shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
          <div className="w-6" />
          <h1 className="font-bold text-lg">Thêm</h1>
          <div className="w-6" />
        </div>

        {/* Facility Summary */}
        {facilities.length > 0 && (
          <div className="px-4 py-4">
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {facilities.map((fac) => (
                <Link
                  key={fac.id}
                  href="/rooms"
                  className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all hover:shadow-md ${
                    fac.type === 'karaoke' ? 'bg-purple-50 border-purple-200' :
                    fac.type === 'massage' ? 'bg-pink-50 border-pink-200' :
                    'bg-orange-50 border-orange-200'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {fac.type === 'karaoke' ? '🎤' : fac.type === 'massage' ? '💆' : '🍽️'}
                  </div>
                  <p className="font-semibold text-sm text-gray-800">{fac.name}</p>
                  <p className="text-xs text-gray-500">{fac.roomCount} phòng</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Menu List */}
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="px-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Chức năng</p>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {menuItems.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors ${
                    index !== menuItems.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="bg-white border-t border-gray-100 flex justify-around px-4 py-3 pb-8 shrink-0 relative z-20">
          <Link href="/bookings" className="flex flex-col items-center text-gray-400 hover:text-green-600 transition-colors">
            <HomeIcon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link href="/dat-phong" className="flex flex-col items-center text-gray-400 hover:text-green-600 transition-colors">
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Đặt phòng</span>
          </Link>
          <Link href="/rooms" className="flex flex-col items-center text-gray-400 hover:text-green-600 transition-colors">
            <DoorOpen className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Phòng</span>
          </Link>
          <div className="flex flex-col items-center text-green-600">
            <MoreVertical className="w-6 h-6 mb-1 rotate-90" />
            <span className="text-[10px] font-medium">Thêm</span>
          </div>
        </div>
      </div>
    </div>
  );
}