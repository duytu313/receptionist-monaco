"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBookingData } from '@/hooks/useBookingData';
import { BookingDetailView } from '@/components/BookingDetailView';
import { statusColors } from '@/components/constants';
import { Loader2, AlertCircle } from 'lucide-react';
import { Booking } from '@/types/booking';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;
  const { bookings, facilities, currentUserRole, loading, saveBookingUpdate } = useBookingData();

  const booking = bookings.find(b => b.id === bookingId);

  const formatPrice = (p: number) => p.toLocaleString('vi-VN') + 'đ';
  const calculateTotalServices = (services: any[]) =>
    services.reduce((acc, s) => {
      const price = Number(s.price); // Chuyển đổi giá thành số
      const quantity = Number(s.qty || s.quantity || 1); // Chuyển đổi số lượng thành số
      const effectivePrice = isNaN(price) ? 0 : price; // Nếu price là NaN, dùng 0
      const effectiveQuantity = isNaN(quantity) ? 1 : quantity; // Nếu quantity là NaN, dùng 1
      return acc + (effectivePrice * effectiveQuantity);
    }, 0);
  
  const getFacilityInfo = (id: string) => facilities.find(f => f.id === id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Không tìm thấy đơn đặt</h2>
        <button onClick={() => router.back()} className="mt-4 text-indigo-600 font-semibold">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white shadow-xl relative overflow-hidden">
        <BookingDetailView
          booking={booking}
          isPaid={booking.status === 'Đã thanh toán'}
          isCancelled={booking.status === 'Đã hủy'}
          currentUserRole={currentUserRole}
          statusColors={statusColors}
          formatPrice={formatPrice}
          calculateTotalServices={calculateTotalServices}
          onBack={() => router.push('/bookings')}
          onSaveUpdate={saveBookingUpdate}
          getFacilityInfo={getFacilityInfo}
          // Simple placeholder handlers to avoid errors
          setShowActionSheet={() => {}}
          setShowConfirmModal={() => {
            if (booking.status === 'Đã xác nhận' || booking.status === 'Chờ đến') {
              saveBookingUpdate(booking.id, { status: 'Đã đến', arrivalTime: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) });
            }
          }}
          setShowRoomSelection={() => router.push(`/bookings/${booking.id}/rooms`)}
          setShowCheckoutModal={() => {
             saveBookingUpdate(booking.id, { status: 'Chờ thanh toán' });
          }}
          setShowAddService={() => router.push(`/bookings/${booking.id}/services/add`)}
          handleRemoveService={(idx) => {
            const newSvcs = [...(booking.services || [])];
            newSvcs.splice(idx, 1);
            saveBookingUpdate(booking.id, { services: newSvcs });
          }}
          handleUpdateServiceQty={(idx, delta) => {
            const newSvcs = [...(booking.services || [])];
            const current = newSvcs[idx];
            const newQty = (current.qty || current.quantity || 1) + delta;
            if (newQty <= 0) {
              newSvcs.splice(idx, 1);
            } else {
              newSvcs[idx] = { ...current, qty: newQty };
            }
            saveBookingUpdate(booking.id, { services: newSvcs });
          }}
          handleMarkPaid={async (bookingId?: string, booking?: Booking, amount?: number) => {
            if (!booking) return;
            const finalAmountFromDetailView = amount || (Number(booking.totalEst) || 0);
            await saveBookingUpdate(booking.id, {
              status: 'Đã thanh toán',
              paidAmount: finalAmountFromDetailView,
              paidAt: Date.now(),
              paymentStatus: 'paid'
            });
          }}
        />
      </div>
    </div>
  );
}