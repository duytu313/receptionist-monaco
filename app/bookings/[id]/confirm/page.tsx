"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useBookingData } from '@/hooks/useBookingData';
import { ChevronLeft, CheckCircle, Loader2, Clock, Minus, Plus } from 'lucide-react';

export default function ConfirmTimePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = params?.id as string;
  const selectedRoom = searchParams?.get('room') || '';
  
  const { bookings, facilities, loading, saveBookingUpdate } = useBookingData();
  const currentBooking = bookings?.find(b => b.id === bookingId);

  const [note, setNote] = useState('');
  const [guests, setGuests] = useState(currentBooking?.guests || 1);
  const [startTime, setStartTime] = useState(
    currentBooking?.startTime || currentBooking?.arrivalTime || 
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (p: number) => p.toLocaleString('vi-VN') + 'đ';

  useEffect(() => {
    if (currentBooking?.note) {
      setNote(currentBooking.note);
    }
    if (currentBooking?.guests) {
      setGuests(currentBooking.guests);
    }
    if (currentBooking?.startTime || currentBooking?.arrivalTime) {
      setStartTime(currentBooking.startTime || currentBooking.arrivalTime || '');
    }
  }, [currentBooking?.note, currentBooking?.guests, currentBooking?.startTime, currentBooking?.arrivalTime]);

  const handleConfirm = async () => {
    if (!bookingId || !selectedRoom || !saveBookingUpdate) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await saveBookingUpdate(bookingId, {
        room: selectedRoom,
        status: 'Đang dùng',
        startTime: startTime,
        arrivalTime: startTime,
        updatedAt: Date.now(),
        guests: guests,
        note: note || currentBooking?.note || '',
      });
      
      // Navigate back to booking detail
      router.push(`/bookings/${bookingId}`);
    } catch (err) {
      setError('Không thể xác nhận. Vui lòng thử lại.');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/bookings/${bookingId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-gray-500 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!currentBooking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center space-y-4">
          <p className="text-gray-700 font-semibold">Không tìm thấy đơn đặt</p>
          <button onClick={() => router.push('/bookings')} className="px-5 py-2 bg-gray-100 rounded-xl text-gray-700 font-medium hover:bg-gray-200 transition">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex justify-center overflow-hidden font-sans">
      <div className="app-container">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 px-4 pt-12 pb-3">
            <button onClick={handleCancel} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-base text-gray-800">Xác nhận sử dụng</h1>
              <p className="text-xs text-gray-400">Xác nhận thời gian bắt đầu sử dụng phòng</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Room Info Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Phòng đã chọn</div>
                <div className="font-bold text-gray-800 text-lg">{selectedRoom}</div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Khách hàng</span>
                <span className="font-medium text-gray-800">{currentBooking.name}</span>
              </div>
              
              {/* Số người */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Số người</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-gray-800 w-8 text-center">{guests}</span>
                  <button
                    onClick={() => setGuests(guests + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Thời gian bắt đầu */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Thời gian bắt đầu</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Note Input */}
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 border border-gray-100">
            <label className="text-xs text-gray-500 mb-2 block">Ghi chú (tùy chọn)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Thêm ghi chú..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <p className="text-xs text-blue-700 leading-relaxed">
              Xác nhận để bắt đầu sử dụng phòng. Thời gian bắt đầu sẽ được ghi nhận tự động theo thời gian hiện tại.
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-gray-100 bg-white p-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] shrink-0 relative z-20">
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl border border-gray-200 font-bold text-gray-600 text-sm hover:bg-gray-50 transition disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Xác nhận sử dụng
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}