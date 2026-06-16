import React from 'react';
import { X, Wallet } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bookingName: string;
  roomName: string;
  amount: string;
  onAmountChange: (value: string) => void;
}

export function CheckoutModal({ isOpen, onClose, onConfirm, bookingName, roomName, amount, onAmountChange }: Props) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-[320px] p-6 pt-8 relative animate-in fade-in zoom-in duration-200">
        <div className="absolute top-4 right-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={onClose}>
          <X className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <Wallet className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Kết thúc & Tính tiền</h3>
          <p className="text-sm text-gray-600 font-medium mb-6">
            {bookingName} - {roomName || 'Chưa xếp phòng'}
          </p>
          <div className="w-full text-left mb-6">
            <div className="text-xs text-gray-500 mb-2 px-1">Tổng tiền thanh toán (VNĐ)</div>
            <input
              type="text"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder="Ví dụ: 500000"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition-colors"
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
              className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 font-bold text-white text-sm transition-colors"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}