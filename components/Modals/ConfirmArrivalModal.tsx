import React from 'react';
import { X, Check, Clock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bookingName: string;
  roomName: string;
}

export function ConfirmArrivalModal({ isOpen, onClose, onConfirm, bookingName, roomName }: Props) {
  if (!isOpen) return null;
  const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-[320px] p-6 pt-8 relative animate-in fade-in zoom-in duration-200">
        <div className="absolute top-4 right-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={onClose}>
          <X className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Xác nhận khách đã đến</h3>
          <p className="text-sm text-gray-600 font-medium mb-6">
            {bookingName} - {roomName || 'Chưa xếp phòng'}
          </p>
          <div className="w-full bg-gray-50 rounded-xl p-4 mb-4 text-left border border-gray-100 flex justify-between items-center">
            <div>
              <div className="text-xs text-gray-500 mb-1">Giờ đến</div>
              <div className="text-gray-400"><Clock className="w-5 h-5" /></div>
            </div>
            <div className="font-bold text-xl text-gray-800">{nowTime}</div>
          </div>
          <div className="w-full text-left mb-6">
            <div className="text-xs text-gray-500 mb-2 px-1">Ghi chú (tùy chọn)</div>
            <input
              type="text"
              placeholder="Ví dụ: Đi cùng 2 bạn, ..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <div className="flex w-full gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 text-sm transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3.5 rounded-xl bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20 font-bold text-white text-sm transition-colors"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}