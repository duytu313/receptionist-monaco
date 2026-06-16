import React from 'react';
import { 
  ChevronLeft, MoreVertical, Phone, ShoppingBag, PlusCircle, 
  Check, Clock, Key, PlayCircle, Flag, Wallet, FileEdit, 
  Edit3, Trash2, X 
} from 'lucide-react'; // Assuming these are used for icons
import { Booking, BookingStatus, Service, FacilityData } from '@/types/booking'; // Import types

interface BookingDetailViewProps {
  booking: Booking; // Use the imported Booking type
  isPaid: boolean;
  isCancelled: boolean;
  currentUserRole: string | null;
  statusColors: Record<string, string>;
  formatPrice: (p: number) => string;
  calculateTotalServices: (s: any[]) => number;
  onBack: () => void;
  onSaveUpdate: (id: string, updates: any) => Promise<void>;
  setShowActionSheet: (v: boolean) => void;
  setShowConfirmModal: (v: boolean) => void;
  setShowRoomSelection: (v: boolean) => void;
  setShowCheckoutModal: (v: boolean) => void;
  setShowAddService: (v: boolean) => void;
  handleRemoveService: (idx: number) => void;
  handleMarkPaid: (bookingId?: string, booking?: Booking) => Promise<void>;
  getFacilityInfo: (id: string) => any;
}

export function BookingDetailView({
  booking, isPaid, isCancelled, currentUserRole, statusColors,
  formatPrice, calculateTotalServices, onBack, onSaveUpdate,
  setShowActionSheet, setShowConfirmModal, setShowRoomSelection,
  setShowCheckoutModal, setShowAddService, handleRemoveService,
  handleMarkPaid, getFacilityInfo
}: BookingDetailViewProps) {
  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white sticky top-0 z-10 shadow-sm shrink-0">
        <ChevronLeft className="w-6 h-6 text-gray-700 cursor-pointer" onClick={onBack} />
        <h1 className="font-bold text-lg">Chi tiết đặt phòng</h1>
        <MoreVertical className="w-6 h-6 text-gray-700" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-gray-100 flex items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full mr-3 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://i.pravatar.cc/150?img=11")' }}></div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h2 className="font-bold text-base text-gray-800">{booking.name}</h2>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusColors[booking.status]}`}>
                {booking.status}
              </span>
            </div>
            <div className="flex items-center text-gray-500 text-sm mt-1">
              {booking.phone} <Phone className="w-3 h-3 ml-2 text-green-500" />
            </div>
          </div>
        </div>

        {/* Room Info Grid */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-gray-100">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Phòng</div>
              <div className="font-bold text-gray-800">
                {booking.room ? booking.room : <span className="text-gray-400 font-normal italic text-sm">Chưa chọn</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Cơ sở</div>
              <div className="font-bold text-gray-800">
                {getFacilityInfo(booking.facilityId || booking.facilityName || booking.roomType)?.name || booking.facilityName || 'Chưa có'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-50">
            <div>
              <div className="text-xs text-gray-500 mb-1">Số người</div>
              <div className="font-bold text-gray-800">{booking.guests}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Thời gian</div>
              <div className="font-bold text-gray-800">{booking.duration}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{booking.status === 'Đang dùng' ? 'Giờ đến' : 'Ngày đặt'}</div>
              <div className="font-bold text-gray-800">
                {booking.status === 'Đang dùng' && booking.arrivalTime ? booking.arrivalTime : booking.date || 'Chưa có ngày'}
              </div>
            </div>
          </div>
        </div>

        {/* Services Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">
            {booking.status === 'Đang dùng' ? 'Dịch vụ đã dùng (tạm tính)' : 'Dịch vụ dự kiến'}
          </h3>
          {booking.services && booking.services.length > 0 ? (
            <div className="space-y-3 mb-4">
              {booking.services.map((s: any, idx: number) => (
                <div key={s.name + idx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">{s.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-medium">×{s.qty}</span>
                    {!isCancelled && !isPaid && (
                      <button onClick={() => handleRemoveService(idx)} className="text-red-600 text-xs font-medium">Xóa</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Sửa lỗi cú pháp tại đây bằng Fragment */
            <>
              <div className="text-sm text-gray-500 mb-4 text-center">Chưa có dịch vụ</div>
              <div className="flex flex-col items-center py-6">
                <ShoppingBag className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400 mb-4">Chưa có dịch vụ nào</p>
                {!isCancelled && !isPaid && (
                  <button
                    onClick={() => setShowAddService(true)}
                    className="px-6 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold hover:bg-blue-100 transition-colors"
                  >
                    + Thêm dịch vụ
                  </button>
                )}
              </div>
            </>
          )}
          {booking.services && booking.services.length > 0 && (
            <div className="flex justify-between items-center py-3 border-t border-gray-100 font-bold text-sm">
              <span className="text-blue-600">Tổng tạm tính</span>
              <span className="text-blue-600">{formatPrice(calculateTotalServices(booking.services))}</span>
            </div>
          )}
        </div>

        {/* Note */}
        {booking.note && booking.status !== 'Đang dùng' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Ghi chú</div>
            <div className="font-medium text-gray-800 text-sm">{booking.note}</div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 p-4 pb-8 flex gap-3 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        {booking.status === 'Chờ xác nhận' && currentUserRole === 'admin' ? (
          <button
            onClick={() => onSaveUpdate(booking.id, { status: 'Đã xác nhận' })}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-indigo-600 shadow-md shadow-indigo-600/20"
          >
            ✓ Duyệt đơn
          </button>
        ) : booking.status === 'Đã xác nhận' ? (
          <>
            <button onClick={() => setShowActionSheet(true)} className="flex-1 py-3.5 rounded-xl border border-gray-200 font-bold text-gray-600 text-sm">Hủy đơn</button>
            <button onClick={() => setShowConfirmModal(true)} className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm bg-green-600 shadow-md shadow-green-600/20">Xác nhận đến</button>
          </>
        ) : (booking.status === 'Chờ đến' || booking.status === 'Đã đến' || booking.status === 'Chờ xác nhận') ? ( // Added 'Chờ xác nhận' for consistency
          <>
            <button onClick={() => setShowActionSheet(true)} className="flex-1 py-3.5 rounded-xl border border-gray-200 font-bold text-blue-600 text-sm">Chỉnh sửa</button>
            {booking.status === 'Chờ đến' ? (
              <button onClick={() => setShowConfirmModal(true)} className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm bg-green-600 shadow-md shadow-green-600/20">Xác nhận đến</button>
            ) : (
              <button onClick={() => setShowRoomSelection(true)} className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm bg-green-600 shadow-md shadow-green-600/20">Chọn phòng</button>
            )}
          </>
        ) : booking.status === 'Đang dùng' ? (
          <div className="w-full space-y-3">
            <button onClick={() => setShowRoomSelection(true)} className="w-full py-3.5 rounded-xl border-2 border-green-600 font-bold text-green-600 text-sm flex justify-center items-center"><Key className="w-5 h-5 mr-2" /> Chọn phòng</button>
            <button onClick={() => setShowCheckoutModal(true)} className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-green-600 shadow-md shadow-green-600/20">Kết thúc & Tính tiền</button>
          </div>
        ) : booking.status === 'Chờ thanh toán' && !isPaid ? ( // Ensure not already paid
          <button onClick={() => handleMarkPaid()} className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-red-600 shadow-md shadow-red-600/20">Thanh toán</button>
        ) : null}
      </div>
    </div>
  );
}