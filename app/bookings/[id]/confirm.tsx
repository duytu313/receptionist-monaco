"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { rtdb, auth } from '../../../firebase';
import { ref as dbRef, get, update } from 'firebase/database';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { CheckCircle, XCircle, Clock, User, Phone, MapPin, Loader2 } from 'lucide-react';

interface Booking {
  id: string;
  name: string;
  phone: string;
  room?: string;
  roomType?: string;
  guests?: number;
  time?: string;
  duration?: string;
  date?: string;
  status: string;
  note?: string;
  arrivalTime?: string;
}

export default function ConfirmArrival() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const now = new Date();
  const arrivalTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  useEffect(() => {
    if (!bookingId || !rtdb || !auth) {
      setError('Không tìm thấy thông tin đặt phòng.');
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const fetchBooking = async (userId?: string) => {
      try {
        const snapshot = await get(dbRef(rtdb, `bookings/${bookingId}`));
        const raw = snapshot.val();
        if (!raw) {
          setError('Không tìm thấy đơn đặt phòng.');
          setLoading(false);
          return;
        }

        setBooking({
          id: bookingId,
          name: raw.name || raw.fullName || raw.customerName || raw.guestName || 'Khách',
          phone: raw.phone || raw.phoneNumber || raw.customerPhone || '',
          room: raw.room,
          roomType: raw.roomType || raw.type || 'Thường',
          guests: Number(raw.guests || raw.guestCount || 1),
          time: raw.time || raw.bookingTime || raw.startTime || '',
          duration: raw.duration || '',
          date: raw.date || raw.bookingDate || '',
          status: raw.status || 'Chờ xác nhận',
          note: raw.note || '',
          arrivalTime: raw.arrivalTime,
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch booking:', err);
        setError('Lỗi khi tải dữ liệu. Vui lòng thử lại.');
        setLoading(false);
      }
    };

    unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          await signInAnonymously(auth);
          return;
        } catch {
          // proceed without auth
        }
      }
      fetchBooking(user?.uid);
    });

    return () => unsubscribe?.();
  }, [bookingId]);

  const handleConfirm = async () => {
    if (!bookingId || !rtdb || !booking) return;

    setSaving(true);
    try {
      await update(dbRef(rtdb, `bookings/${bookingId}`), {
        status: 'Đã đến',
        arrivalTime,
        note: note.trim() || booking.note || '',
        updatedAt: Date.now(),
      });
      setSuccess(true);
      setTimeout(() => router.back(), 1800);
    } catch (err) {
      console.error('Failed to confirm booking:', err);
      setError('Không thể cập nhật trạng thái. Vui lòng thử lại.');
      setSaving(false);
    }
  };

  const handleCancel = () => router.back();

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3 shadow-2xl">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-gray-600 font-medium">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  /* ─── Error ─── */
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-gray-800 font-semibold">{error}</p>
          <button
            onClick={handleCancel}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  /* ─── Success ─── */
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-9 h-9 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Đã xác nhận!</h2>
          <p className="text-gray-500 text-sm">
            Khách <span className="font-semibold text-gray-700">{booking?.name}</span> đã được xác nhận đến lúc{' '}
            <span className="font-semibold text-gray-700">{arrivalTime}</span>.
          </p>
        </div>
      </div>
    );
  }

  /* ─── Main ─── */
  const alreadyArrived = booking?.status === 'Đã đến';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">Xác nhận khách đã đến</h2>
              <p className="text-green-100 text-xs mt-0.5">Giờ đến: {arrivalTime}</p>
            </div>
          </div>
        </div>

        {/* Booking Info */}
        <div className="px-6 py-4 space-y-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Khách hàng</p>
              <p className="font-bold text-gray-800">{booking?.name}</p>
            </div>
          </div>

          {booking?.phone && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Số điện thoại</p>
                <p className="font-semibold text-gray-800">{booking.phone}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Phòng</p>
              <p className="font-semibold text-gray-800">
                {booking?.room
                  ? `${booking.room} · ${booking.roomType}`
                  : <span className="italic text-gray-400 font-normal">Chưa xếp phòng</span>}
              </p>
            </div>
          </div>

          {booking?.time && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Giờ đặt · Thời gian</p>
                <p className="font-semibold text-gray-800">
                  {booking.time}{booking.duration ? ` · ${booking.duration}` : ''}
                </p>
              </div>
            </div>
          )}

          {/* Status warning if already arrived */}
          {alreadyArrived && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mt-1">
              <span className="text-amber-500 text-sm">⚠️</span>
              <p className="text-amber-700 text-sm font-medium">Khách này đã được xác nhận đến trước đó.</p>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="px-6 py-4">
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            Ghi chú (tùy chọn)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập ghi chú nếu cần..."
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
          />
        </div>

        {/* Actions */}
        <div className="px-6 pb-8 flex gap-3">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl border border-gray-200 font-bold text-gray-600 text-sm bg-white hover:bg-gray-50 transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm bg-green-500 hover:bg-green-600 shadow-md shadow-green-500/25 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Xác nhận đến'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
