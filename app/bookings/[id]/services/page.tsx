"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { rtdb } from '@/firebase';
import { ref, get } from 'firebase/database';
import { ChevronLeft, ShoppingBag, Loader2, Plus } from 'lucide-react';

interface Service {
  name: string;
  qty: number;
  price?: number;
}

export default function BookingServicesPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingName, setBookingName] = useState('');

  useEffect(() => {
    if (!bookingId || !rtdb) return;

    const fetchBookingData = async () => {
      try {
        const snapshot = await get(ref(rtdb, `bookings/${bookingId}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setBookingName(data.name || 'Khách hàng');
          setServices(data.services || []);
        } else {
          setError('Không tìm thấy thông tin đặt phòng.');
        }
      } catch (err) {
        console.error(err);
        setError('Lỗi khi tải dữ liệu dịch vụ.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
        <p className="text-gray-500 text-sm">Đang tải dịch vụ...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex justify-center overflow-hidden font-sans">
      <div className="app-container">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-lg">Dịch vụ sử dụng</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{bookingName}</p>
          </div>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error ? (
            <div className="text-center py-10">
              <p className="text-red-500 font-medium">{error}</p>
              <button onClick={() => router.back()} className="mt-4 text-blue-600 font-semibold text-sm">Quay lại</button>
            </div>
          ) : services.length > 0 ? (
            <div className="space-y-3">
              {services.map((svc, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{svc.name}</span>
                    <span className="text-xs text-gray-400">Số lượng: {svc.qty || (svc as any).quantity || 1}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-blue-600 font-bold">
                      {svc.price ? (svc.price * (svc.qty || (svc as any).quantity || 1)).toLocaleString() : '---'}đ
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-gray-200" />
              </div>
              <h3 className="text-gray-800 font-bold">Chưa có dịch vụ</h3>
              <p className="text-gray-400 text-sm max-w-[200px] mt-1">
                Khách hàng này chưa sử dụng thêm dịch vụ nào.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-100 pb-8">
          <button 
            onClick={() => router.push(`/bookings/${bookingId}/services/add`)}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Thêm dịch vụ mới
          </button>
        </div>
      </div>
    </div>
  );
}