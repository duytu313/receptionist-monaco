import React from 'react';
import { 
  PlayCircle, Flag, PlusCircle, Wallet, FileEdit, 
  Phone, Edit3, Trash2 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddService: () => void;
  onCancelBooking: () => void;
}

export function ActionSheet({ isOpen, onClose, onAddService, onCancelBooking }: Props) {
  if (!isOpen) return null;

  return (
    <>
      <div className="absolute inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="absolute bottom-0 w-full max-w-md bg-white rounded-t-3xl z-50 p-6 animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
        <div className="grid grid-cols-3 gap-y-6 gap-x-4">
          <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
              <PlayCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Bắt đầu sử dụng</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
            <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
              <Flag className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Kết thúc</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
            <div 
              onClick={() => { onClose(); onAddService(); }}
              className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-2 shadow-sm"
            >
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Thêm dịch vụ</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
            <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Thanh toán</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
              <FileEdit className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Ghi chú</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
            <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
              <Phone className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Gọi khách</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
            <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
              <Edit3 className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Chỉnh sửa đơn</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform" onClick={onCancelBooking}>
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Hủy đặt</span>
          </div>
        </div>
      </div>
    </>
  );
}