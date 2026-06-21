"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Menu, Bell, ChevronLeft,
  Home as HomeIcon, MapPin, DoorOpen, MoreVertical, FileText,
} from 'lucide-react';
import { useBookingData } from '@/hooks/useBookingData';
import { facilityTypeIcons } from '@/components/constants';

const roomStatusColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  'Trống': { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-400' },
  'Đang dùng': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Chờ đến': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Chờ thanh toán': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', dot: 'bg-red-500' },
  'Đã xác nhận': { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', dot: 'bg-indigo-500' },
};

const facilityBgColors: Record<string, string> = {
  karaoke: 'bg-purple-50 border-purple-200',
  massage: 'bg-pink-50 border-pink-200',
  restaurant: 'bg-orange-50 border-orange-200',
};

const facilityHeaderColors: Record<string, string> = {
  karaoke: 'bg-purple-600',
  massage: 'bg-pink-600',
  restaurant: 'bg-orange-600',
};

export default function RoomsPage() {
  const { bookings, facilities, rooms } = useBookingData();
  const [selectedFacility, setSelectedFacility] = useState<string>('all');

  // Compute room statuses based on active bookings (today)
  const roomsWithStatus = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    return rooms.map((room) => {
      // Find active bookings for this room today
      const activeBooking = bookings.find((b) => {
        const bookingDate = b.date?.slice(0, 10);
        if (bookingDate !== today) return false;
        if (b.room !== room.name && b.room !== room.id) return false;
        // Only consider active statuses
        return ['Đã xác nhận', 'Đã đến', 'Đang dùng', 'Chờ đến', 'Chờ thanh toán'].includes(b.status);
      });

      let status = 'Trống';
      let bookingInfo: { name: string; time: string; guests: number } | null = null;

      if (activeBooking) {
        status = activeBooking.status;
        bookingInfo = {
          name: activeBooking.name,
          time: activeBooking.time || activeBooking.duration,
          guests: activeBooking.guests,
        };
      }

      return {
        ...room,
        status,
        bookingInfo,
      };
    });
  }, [rooms, bookings]);

  // Filter rooms by selected facility
  const filteredRooms = useMemo(() => {
    if (selectedFacility === 'all') return roomsWithStatus;
    return roomsWithStatus.filter((r) => r.facilityId === selectedFacility);
  }, [roomsWithStatus, selectedFacility]);

  // Group rooms by facility
  const groupedRooms = useMemo(() => {
    const groups: Record<string, typeof filteredRooms> = {};
    filteredRooms.forEach((room) => {
      const groupName = room.facilityName || 'Phòng';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(room);
    });
    return groups;
  }, [filteredRooms]);

  // Stats
  const totalRooms = roomsWithStatus.length;
  const emptyRooms = roomsWithStatus.filter((r) => r.status === 'Trống').length;
  const usingRooms = roomsWithStatus.filter((r) => r.status === 'Đang dùng').length;
  const waitingRooms = roomsWithStatus.filter((r) => r.status === 'Chờ đến' || r.status === 'Đã xác nhận').length;


  return (
    <div className="bg-gray-100 min-h-screen flex justify-center overflow-hidden font-sans">
      <div className="app-container">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
          <Link href="/bookings" className="flex items-center text-gray-700 hover:text-gray-900">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-bold text-lg">Tất cả phòng</h1>
          <div className="w-6" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 px-4 py-4 text-center text-sm font-medium">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col items-center">
            <span className="text-xl font-bold text-gray-800">{totalRooms}</span>
            <span className="text-gray-500 text-xs mt-1">Tổng</span>
          </div>
          <div className="bg-green-50 rounded-xl p-3 border border-green-100 shadow-sm flex flex-col items-center">
            <span className="text-xl font-bold text-green-600">{emptyRooms}</span>
            <span className="text-gray-500 text-xs mt-1">Trống</span>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 shadow-sm flex flex-col items-center">
            <span className="text-xl font-bold text-orange-600">{usingRooms}</span>
            <span className="text-gray-500 text-xs mt-1">Đang dùng</span>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 shadow-sm flex flex-col items-center">
            <span className="text-xl font-bold text-blue-600">{waitingRooms}</span>
            <span className="text-gray-500 text-xs mt-1">Chờ</span>
          </div>
        </div>

        {/* Facility Filter Tabs */}
        {facilities.length > 0 && (
          <div className="px-4 mb-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setSelectedFacility('all')}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition-all flex items-center gap-2 ${
                  selectedFacility === 'all'
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                <DoorOpen size={14} />
                Tất cả
              </button>
              {facilities.map((fac) => {
                const colorClass = fac.type === 'karaoke' ? 'hover:border-purple-300' :
                  fac.type === 'massage' ? 'hover:border-pink-300' :
                  'hover:border-orange-300';
                const activeColorClass = fac.type === 'karaoke' ? 'bg-purple-600 text-white border-purple-600' :
                  fac.type === 'massage' ? 'bg-pink-600 text-white border-pink-600' :
                  'bg-orange-600 text-white border-orange-600';
                return (
                  <button
                    key={fac.id}
                    onClick={() => setSelectedFacility(fac.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition-all flex items-center gap-2 ${
                      selectedFacility === fac.id
                        ? activeColorClass
                        : `bg-white text-gray-600 border-gray-200 ${colorClass}`
                    }`}
                  >
                    {facilityTypeIcons[fac.type]}
                    {fac.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Room List */}
        <div className="flex-1 overflow-y-auto pb-20 px-4">
          {Object.keys(groupedRooms).length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">🏠</div>
              <div className="text-sm font-medium">Không có phòng nào</div>
            </div>
          )}

          {Object.entries(groupedRooms).map(([facilityName, facilityRooms]) => {
            const facility = facilities.find((f) => f.name === facilityName);
            const facilityType = facility?.type || 'karaoke';

            return (
              <div key={facilityName} className="mb-6">
                {/* Facility Header */}
                <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${facilityBgColors[facilityType] || facilityBgColors.karaoke}`}>
                  <span className={`text-white text-xs px-2 py-0.5 rounded ${facilityHeaderColors[facilityType] || facilityHeaderColors.karaoke}`}>
                    {facilityType === 'karaoke' ? '🎤' : facilityType === 'massage' ? '💆' : '🍽️'}
                  </span>
                  <span className="font-semibold text-sm text-gray-700">{facilityName}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {facilityRooms.length} phòng
                  </span>
                </div>

                {/* Room Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {facilityRooms.map((room) => {
                    const statusStyle = roomStatusColors[room.status] || roomStatusColors['Trống'];
                    return (
                      <div
                        key={room.id}
                        className={`border-2 rounded-xl p-4 transition-all hover:shadow-md ${statusStyle.bg} ${statusStyle.border}`}
                      >
                        {/* Room Name & Status Dot */}
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-gray-800 text-base">{room.name}</p>
                          <span className={`w-3 h-3 rounded-full ${statusStyle.dot} ${room.status !== 'Trống' ? 'animate-pulse' : ''}`} />
                        </div>

                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyle.text} ${statusStyle.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          {room.status}
                        </div>

                        {/* Capacity */}
                        {room.capacity ? (
                          <p className="text-xs text-gray-400 mt-2">{room.capacity} người</p>
                        ) : null}

                        {/* Booking Info */}
                        {room.bookingInfo && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-600 truncate">{room.bookingInfo.name}</p>
                            {room.bookingInfo.time && (
                              <p className="text-xs text-gray-400">⏰ {room.bookingInfo.time}</p>
                            )}
                            <p className="text-xs text-gray-400">👥 {room.bookingInfo.guests} khách</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
          <div className="flex flex-col items-center text-green-600">
            <DoorOpen className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Phòng</span>
          </div>
          <Link href="/more" className="flex flex-col items-center text-gray-400 hover:text-green-600 transition-colors">
            <MoreVertical className="w-6 h-6 mb-1 rotate-90" />
            <span className="text-[10px] font-medium">Thêm</span>
          </Link>
        </div>
      </div>
    </div>
  );
}