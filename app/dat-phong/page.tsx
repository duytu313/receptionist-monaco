"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, User, Phone, Clock, Users, FileText,
  DoorOpen, Calendar, CheckCircle, XCircle,
} from 'lucide-react';
import { rtdb } from '../../firebase';
import { ref as dbRef, push } from 'firebase/database';
import { useBookingData } from '@/hooks/useBookingData';

// Các trạng thái booking chiếm phòng
const OCCUPYING_STATUSES = ['Đang dùng', 'Đã đến', 'Chờ đến', 'Đã xác nhận', 'Chờ thanh toán'];

export default function BookingFormPage() {
  const { facilities, rooms, bookings } = useBookingData();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(1);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedFacility = facilities.find((f) => f.id === facilityId);

  // Xác định phòng nào đang bị chiếm theo ngày đã chọn
  const occupiedRoomNames = useMemo(() => {
    const names = new Set<string>();
    const ids = new Set<string>();
    (bookings || []).forEach((b: any) => {
      if (b.status === 'Đã hủy' || b.status === 'Đã thanh toán') return;
      if (!b.room) return;
      if (b.date && b.date !== date) return;
      names.add(b.room);
      if (b.roomId) ids.add(b.roomId);
    });
    return { names, ids };
  }, [bookings, date]);

  const availableRooms = facilityId
    ? rooms.filter((r) => {
        if (r.facilityId !== facilityId) return false;
        if (occupiedRoomNames.names.has(r.name) || occupiedRoomNames.ids.has(r.id)) return false;
        return true;
      })
    : [];

  const occupiedRooms = facilityId
    ? rooms.filter((r) => {
        if (r.facilityId !== facilityId) return false;
        if (occupiedRoomNames.names.has(r.name) || occupiedRoomNames.ids.has(r.id)) return true;
        return false;
      })
    : [];

  const selectedRoom = rooms.find((r) => r.id === roomId);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      alert('Vui lòng nhập tên và số điện thoại khách hàng');
      return;
    }

    setSubmitting(true);
    try {
      const bookingData = {
        name: name.trim(),
        phone: phone.trim(),
        room: selectedRoom?.name || '',
        roomType: selectedRoom?.type || 'Thường',
        facilityId,
        facilityName: selectedFacility?.name || '',
        facilityType: selectedFacility?.type || 'karaoke',
        guests,
        time,
        date,
        status: 'Chờ xác nhận',
        services: [],
        note: note.trim(),
        createdAt: Date.now(),
      };

      if (rtdb) {
        await push(dbRef(rtdb, 'bookings'), bookingData);
      }

      setSuccess(true);
      setName('');
      setPhone('');
      setFacilityId('');
      setRoomId('');
      setTime('');
      setGuests(1);
      setNote('');

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to create booking:', error);
      alert('Không thể tạo đơn đặt phòng. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center overflow-hidden font-sans">
      <div className="w-full max-w-md bg-white relative h-[100dvh] overflow-hidden shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
          <Link href="/bookings" className="flex items-center text-gray-700 hover:text-gray-900">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-bold text-lg">Đặt phòng</h1>
          <div className="w-6" />
        </div>

        {/* Success Toast */}
        {success && (
          <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-slide-in">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-800 text-sm">Tạo đơn thành công!</p>
              <p className="text-xs text-green-600">Đơn đã được gửi và chờ xác nhận</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
          {/* Customer Info */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Thông tin khách hàng
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tên khách hàng *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  placeholder="Số điện thoại *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Facility Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <DoorOpen className="w-4 h-4" /> Chọn cơ sở
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {facilities.map((fac) => (
                <button
                  key={fac.id}
                  onClick={() => { setFacilityId(fac.id); setRoomId(''); }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    facilityId === fac.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">
                      {fac.type === 'karaoke' ? '🎤' : fac.type === 'massage' ? '💆' : '🍽️'}
                    </span>
                    <span className="font-semibold text-sm text-gray-800">{fac.name}</span>
                  </div>
                  <p className="text-xs text-gray-500">{fac.roomCount} phòng</p>
                </button>
              ))}
            </div>
          </div>

          {/* Room Selection */}
          {facilityId && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <DoorOpen className="w-4 h-4" /> Chọn phòng
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {availableRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setRoomId(room.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      roomId === room.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-sm text-gray-800">{room.name}</p>
                    {room.capacity && (
                      <p className="text-xs text-gray-500">{room.capacity} người</p>
                    )}
                    {room.price ? (
                      <p className="text-xs text-green-600 font-medium">
                        {room.price.toLocaleString('vi-VN')}đ/h
                      </p>
                    ) : null}
                  </button>
                ))}
                {/* Hiển thị phòng đang bị chiếm (đã lọc ra availableRooms) */}
                {occupiedRooms.length > 0 && (
                  <div className="col-span-2 mt-2">
                    <p className="text-xs text-red-500 font-semibold mb-2">Phòng đang sử dụng:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {occupiedRooms.map((room) => (
                        <div
                          key={room.id}
                          className="p-3 rounded-xl border-2 border-red-200 bg-red-50 text-left opacity-70"
                        >
                          <div className="flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-500" />
                            <p className="font-semibold text-sm text-red-700">{room.name}</p>
                          </div>
                          {room.capacity && (
                            <p className="text-xs text-red-500">{room.capacity} người</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {availableRooms.length === 0 && occupiedRooms.length === 0 && (
                  <div className="col-span-2 text-center py-4 text-gray-400 text-sm">
                    Không có phòng khả dụng
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Ngày giờ
            </h3>
            <div className="space-y-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="Giờ bắt đầu"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Guests */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Số khách
            </h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-bold hover:bg-gray-200"
              >
                -
              </button>
              <span className="text-xl font-bold text-gray-800 w-12 text-center">{guests}</span>
              <button
                onClick={() => setGuests(Math.min(50, guests + 1))}
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-bold hover:bg-gray-200"
              >
                +
              </button>
            </div>
          </div>

          {/* Note */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Ghi chú
            </h3>
            <textarea
              placeholder="Ghi chú thêm (tùy chọn)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !phone.trim()}
            className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all ${
              submitting || !name.trim() || !phone.trim()
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 active:scale-95 shadow-lg shadow-green-500/20'
            }`}
          >
            {submitting ? 'Đang tạo...' : 'Tạo đơn đặt phòng'}
          </button>
        </div>
      </div>
    </div>
  );
}