import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from '@/types/booking';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectBooking: (id: string) => void;
  bookings: Booking[];
}

export function NotificationsOverlay({ isOpen, onClose, onSelectBooking, bookings }: Props) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between px-4 py-4 bg-white relative shadow-sm z-10 shrink-0">
        <ChevronLeft className="w-6 h-6 text-gray-700 cursor-pointer" onClick={onClose} />
        <h1 className="font-bold text-lg">Thông báo</h1>
        <div className="w-6 h-6" />
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
        {bookings.map(b => (
          <div
            key={`notif-${b.id}`}
            className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100 flex items-center cursor-pointer active:scale-95 transition-transform hover:border-green-300"
            onClick={() => { onClose(); onSelectBooking(b.id); }}
          >
            <div className={`w-3 h-3 rounded-full mr-4 ${b.status === 'Đã đến' ? 'bg-green-400' :
              b.status === 'Đang dùng' ? 'bg-orange-400' :
                b.status === 'Chờ đến' ? 'bg-blue-400' :
                  b.status === 'Chờ thanh toán' ? 'bg-red-400' : 'bg-gray-400'
              }`} />
            <div className="flex-1">
              <div className="font-bold text-sm text-gray-800">Đơn của {b.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                Trạng thái: <span className="font-semibold text-gray-700">{b.status}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
}