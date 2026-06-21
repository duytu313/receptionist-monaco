"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu, Bell, ChevronRight, Home as HomeIcon,
  ChevronDown, MoreVertical, DoorOpen, X, Settings, User, FileText, LogOut,
} from 'lucide-react';
import { Booking, FacilityData, RoomItem } from '@/types/booking';
import { useBookingData } from '@/hooks/useBookingData';
import { getFormattedDate, parseBookingDate, parseHoursFromDuration, formatPrice } from '@/utils/formatters';
import { statusColors, facilityTypeIcons, TabFilter } from '@/components/constants';
import { BookingCard } from '@/components/BookingCard';
import { BookingDetailView } from '@/components/BookingDetailView';
import { RoomSelectionOverlay } from '@/components/RoomSelectionOverlay';
import { ConfirmArrivalModal } from '@/components/Modals/ConfirmArrivalModal';
import { CheckoutModal } from '@/components/Modals/CheckoutModal';
import { ActionSheet } from '@/components/Modals/ActionSheet';
import { NotificationsOverlay } from '@/components/Modals/NotificationsOverlay';

export default function BookingApp() {
  const router = useRouter();
  const { bookings, facilities, rooms, currentUserRole, loading, saveBookingUpdate } = useBookingData();

  // Hàm tính tổng dịch vụ an toàn tránh NaN
  const safeCalculateTotalServices = (services: any[]) =>
    (services || []).reduce((acc, s) => {
      const price = Number(s.price);
      const quantity = Number(s.qty || s.quantity || 1);
      const effectivePrice = isNaN(price) ? 0 : price;
      const effectiveQuantity = isNaN(quantity) ? 1 : quantity;
      return acc + (effectivePrice * effectiveQuantity);
    }, 0);

  // Hàm lấy ngày hiện tại theo giờ địa phương (YYYY-MM-DD)
  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // UI State
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayStr);
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [followRealTime, setFollowRealTime] = useState(true);

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showRoomSelection, setShowRoomSelection] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [checkoutAmount, setCheckoutAmount] = useState('');
  const [pendingRoomSelection, setPendingRoomSelection] = useState<string | null>(null);

  // Derived data
  const selectedBooking = bookings.find(b => b.id === selectedId);
  const isPaid = selectedBooking?.status === 'Đã thanh toán';
  const isCancelled = selectedBooking?.status === 'Đã hủy';

  // Realtime date sync
  useEffect(() => {
    if (!followRealTime) return;
    const tick = () => {
      const today = getTodayStr();
      setSelectedDate(prev => (prev === today ? prev : today));
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [followRealTime]);

  // Filter bookings
  const filteredBookings = bookings.filter(b => {
    if (selectedDate) {
      const sel = new Date(selectedDate + 'T00:00:00');
      const book = parseBookingDate(b.date);
      if (!book) return false;
      if (sel.getFullYear() !== book.getFullYear() || sel.getMonth() !== book.getMonth() || sel.getDate() !== book.getDate()) return false;
    }
    if (b.status === 'Chờ xác nhận') return false;
    if (selectedFacility !== 'all') {
      const directMatch = b.facilityId === selectedFacility || b.facilityName === selectedFacility || b.facilityType === selectedFacility;
      if (!directMatch) {
        // Also check if the booking's room belongs to the selected facility
        const roomBelongsToFacility = rooms.some(r => r.facilityId === selectedFacility && (r.name === b.room || r.id === b.room));
        if (!roomBelongsToFacility) return false;
      }
    }
    if (activeTab === 'all') return true;
    if (activeTab === 'confirmed') return b.status === 'Đã xác nhận';
    if (activeTab === 'waiting') return b.status === 'Chờ đến';
    if (activeTab === 'arrived') return b.status === 'Đã đến';
    if (activeTab === 'using') return b.status === 'Đang dùng';
    return true;
  });

  // Stats
  const countByStatus = (status: string) => filteredBookings.filter(b => b.status === status).length;
  const todayCount = filteredBookings.length;
  const arrivedCount = countByStatus('Đã đến');
  const usingCount = countByStatus('Đang dùng');
  const waitingCount = countByStatus('Chờ đến');
  const paymentCount = countByStatus('Chờ thanh toán');

  // Get facility info
  const getFacilityInfo = (facilityIdOrName?: string) => {
    if (!facilityIdOrName) return null;
    return facilities.find(f =>
      f.id === facilityIdOrName ||
      f.name === facilityIdOrName ||
      f.type === facilityIdOrName
    ) || null;
  };

  // Handlers
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setFollowRealTime(false);
  };

  const handleBookingClick = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedId(null);
    setShowConfirmModal(false);
    setShowActionSheet(false);
    setShowRoomSelection(false);
    setShowCheckoutModal(false);
    setShowNotifications(false);
  };

  const handleConfirmArrival = async (note: string, time: string) => {
    if (selectedId) {
      await saveBookingUpdate(selectedId, { status: 'Đã đến', arrivalTime: time, note: note });
      setShowConfirmModal(false);
    }
  };

  const handleRoomSelect = async (roomName: string) => {
    if (selectedId) {
      // First save the room selection
      await saveBookingUpdate(selectedId, { room: roomName });
      setShowRoomSelection(false);
      // Then show confirmation modal for start time
      setPendingRoomSelection(roomName);
      setShowConfirmModal(true);
    }
  };

  const handleConfirmStartTime = async (note: string, time: string) => {
    if (selectedId && pendingRoomSelection) {
      await saveBookingUpdate(selectedId, { status: 'Đang dùng', arrivalTime: time, startTime: time });
      setShowConfirmModal(false);
      setPendingRoomSelection(null);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (selectedId) {
      const amount = parseInt(checkoutAmount.replace(/\D/g, ''), 10) || 0;
      const now = new Date();
      const endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      await saveBookingUpdate(selectedId, {
        status: 'Chờ thanh toán',
        totalEst: amount,
        endTime: endTime,
        paymentStatus: 'pending',
      });
      setShowCheckoutModal(false);
      setCheckoutAmount('');
    }
  };

  const handleCancelBooking = async () => {
    if (selectedId) {
      await saveBookingUpdate(selectedId, { status: 'Đã hủy' });
      setShowActionSheet(false);
    }
  };

  const handleMarkPaid = async (bookingId?: string, booking?: Booking, amount?: number) => {
    const targetId = bookingId || selectedId;
    const targetBooking = booking || selectedBooking;
    if (!targetId || !targetBooking) return;
    
    // Sử dụng amount từ UI (đã tính discount) hoặc fallback tính toán cơ bản
    const finalAmount = amount !== undefined ? amount : 
      (Number(targetBooking.totalEst) || 0) + safeCalculateTotalServices(targetBooking.services);

    await saveBookingUpdate(targetId, {
      status: 'Đã thanh toán',
      paidAmount: finalAmount,
      paidAt: Date.now(),
      paymentStatus: 'paid',
    });
  };

  const handleRemoveService = async (idx: number) => {
    if (!selectedId || !selectedBooking) return;
    await saveBookingUpdate(selectedId, {
      services: selectedBooking.services.filter((_, i) => i !== idx),
    });
  };

  const handleUpdateServiceQty = async (idx: number, delta: number) => {
    if (!selectedId || !selectedBooking) return;
    const newServices = [...selectedBooking.services];
    const current = newServices[idx];
    const newQty = (current.qty || current.quantity || 1) + delta;
    if (newQty <= 0) {
      newServices.splice(idx, 1);
    } else {
      newServices[idx] = { ...current, qty: newQty };
    }
    await saveBookingUpdate(selectedId, { services: newServices });
  };

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center overflow-hidden font-sans">
      <div className="app-container">

        {/* LIST VIEW */}
        {view === 'list' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pb-20">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white sticky top-0 z-10">
                <Menu className="w-6 h-6 text-gray-700 cursor-pointer" onClick={() => setShowMenu(true)} />
                <div className="flex items-center font-bold text-lg">
                  {selectedDate === getTodayStr()
                    ? 'Hôm nay'
                    : getFormattedDate(selectedDate)
                  }
                  <ChevronRight className="w-4 h-4 ml-1 rotate-90" />
                </div>
                <div className="relative cursor-pointer" onClick={() => setShowNotifications(true)}>
                  <Bell className="w-6 h-6 text-gray-700" />
                  {waitingCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-4 h-4 px-1 flex items-center justify-center rounded-full font-bold animate-pulse">
                      {waitingCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Facility Filter Tabs */}
              {facilities.length > 0 && (
                <div className="px-4 mb-4">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button
                      onClick={() => setSelectedFacility('all')}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition-all flex items-center gap-2 ${
                        selectedFacility === 'all'
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <DoorOpen size={14} />
                      Tất cả
                    </button>
                    {facilities.map((fac) => {
                      const colorClass = fac.type === 'karaoke' ? 'hover:border-purple-300' :
                        fac.type === 'massage' ? 'hover:border-pink-300' :
                        'hover:border-orange-300';
                      const activeColorClass = fac.type === 'karaoke' ? 'bg-purple-600 text-white border-purple-600' :
                        fac.type === 'massage' ? 'bg-pink-600 text-white border-pink-600' :
                        'bg-orange-600 text-white border-orange-600';
                      return (
                        <button
                          key={fac.id}
                          onClick={() => setSelectedFacility(fac.id)}
                          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition-all flex items-center gap-2 ${
                            selectedFacility === fac.id
                              ? activeColorClass
                              : `bg-white text-gray-600 border-gray-200 ${colorClass}`
                          }`}
                        >
                          {facilityTypeIcons[fac.type]}
                          {fac.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-2 px-4 mb-6 text-center text-sm font-medium">
                <div className="bg-blue-50/50 rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1">📅</div>
                  <span className="text-xl font-bold text-gray-800">{todayCount}</span>
                  <span className="text-gray-500 text-xs mt-1">Hôm nay</span>
                </div>
                <div className="bg-green-50/50 rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-1">✅</div>
                  <span className="text-xl font-bold text-gray-800">{arrivedCount}</span>
                  <span className="text-gray-500 text-xs mt-1">Đã đến</span>
                </div>
                <div className="bg-orange-50/50 rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-1">🔄</div>
                  <span className="text-xl font-bold text-gray-800">{usingCount}</span>
                  <span className="text-gray-500 text-xs mt-1">Đang dùng</span>
                </div>
                <div className="bg-red-50/50 rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-1">👤</div>
                  <span className="text-xl font-bold text-gray-800">{paymentCount}</span>
                  <span className="text-gray-500 text-xs mt-1">Chờ TT</span>
                </div>
              </div>

              {/* Date Header */}
              <div className="flex items-center px-4 mb-4">
                <h2 className="font-bold text-lg mr-3">Lịch đặt phòng</h2>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  />
                  <div className="flex items-center text-black bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm border border-blue-100">
                    {getFormattedDate(selectedDate)}
                    <ChevronDown className="w-4 h-4 ml-1 text-gray-600" />
                  </div>
                </div>
                {selectedDate !== getTodayStr() && (
                  <button
                    onClick={() => { setSelectedDate(getTodayStr()); setFollowRealTime(true); }}
                    className="ml-auto text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md"
                  >
                    Về hôm nay
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 px-4 mb-5 overflow-x-auto no-scrollbar pb-1">
                {([
                  { key: 'all' as TabFilter, label: `Tất cả (${filteredBookings.length})` },
                  { key: 'confirmed' as TabFilter, label: `Đã xác nhận (${filteredBookings.filter(b => b.status === 'Đã xác nhận').length})` },
                  { key: 'waiting' as TabFilter, label: `Chờ đến (${filteredBookings.filter(b => b.status === 'Chờ đến').length})` },
                  { key: 'arrived' as TabFilter, label: `Đã đến (${filteredBookings.filter(b => b.status === 'Đã đến').length})` },
                  { key: 'using' as TabFilter, label: `Đang dùng (${filteredBookings.filter(b => b.status === 'Đang dùng').length})` },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition-all ${activeTab === tab.key
                      ? 'bg-green-600 text-white border-green-600 shadow-sm shadow-green-500/20'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Bookings List */}
              <div className="px-4 space-y-4">
                {filteredBookings.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-3">📭</div>
                    <div className="text-sm font-medium">Không có đơn nào</div>
                  </div>
                )}
                {filteredBookings.map((b) => (
                  <BookingCard key={b.id} booking={b} onClick={() => handleBookingClick(b.id)} statusColors={statusColors} />
                ))}
              </div>
            </div>

            {/* Bottom Nav */}
              <div className="bg-white border-t border-gray-100 flex justify-around px-4 py-3 pb-8 shrink-0 relative z-20">
              <Link href="/bookings" className="flex flex-col items-center text-green-600">
                <HomeIcon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Home</span>
              </Link>
              <Link href="/dat-phong" className="flex flex-col items-center text-gray-400 hover:text-green-600 transition-colors">
                <FileText className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Đặt phòng</span>
              </Link>
              <Link href="/rooms" className="flex flex-col items-center text-gray-400 hover:text-green-600 transition-colors">
                <DoorOpen className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Phòng</span>
              </Link>
              <Link href="/more" className="flex flex-col items-center text-gray-400 hover:text-green-600 transition-colors">
                <MoreVertical className="w-6 h-6 mb-1 rotate-90" />
                <span className="text-[10px] font-medium">Thêm</span>
              </Link>
            </div>
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === 'detail' && selectedBooking && (
          <BookingDetailView
            booking={selectedBooking}
            isPaid={isPaid}
            isCancelled={isCancelled}
            currentUserRole={currentUserRole}
            statusColors={statusColors}
            formatPrice={formatPrice}
            calculateTotalServices={safeCalculateTotalServices}
            onBack={handleBack}
            onSaveUpdate={saveBookingUpdate}
            setShowActionSheet={setShowActionSheet}
            setShowConfirmModal={setShowConfirmModal}
            setShowRoomSelection={setShowRoomSelection}
            setShowCheckoutModal={setShowCheckoutModal}
            setShowAddService={() => selectedId && router.push(`/bookings/${selectedId}/services/add`)}
            handleRemoveService={handleRemoveService}
            handleUpdateServiceQty={handleUpdateServiceQty}
            handleMarkPaid={handleMarkPaid}
            getFacilityInfo={getFacilityInfo}
          />
        )}

        {/* MODALS */}
        <ConfirmArrivalModal
          isOpen={showConfirmModal}
          onClose={async () => {
            setShowConfirmModal(false);
            if (pendingRoomSelection && selectedId) {
              await saveBookingUpdate(selectedId, { room: '' });
              setPendingRoomSelection(null);
            }
          }}
          onConfirm={pendingRoomSelection ? handleConfirmStartTime : handleConfirmArrival}
          bookingName={selectedBooking?.name || ''}
          roomName={selectedBooking?.room || ''}
          mode={pendingRoomSelection ? 'start' : 'arrival'}
        />

        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          onConfirm={handleCheckoutSubmit}
          bookingName={selectedBooking?.name || ''}
          roomName={selectedBooking?.room || ''}
          amount={checkoutAmount}
          onAmountChange={setCheckoutAmount}
        />

        <ActionSheet
          isOpen={showActionSheet}
          onClose={() => setShowActionSheet(false)}
          onAddService={() => { setShowActionSheet(false); if (selectedId) router.push(`/bookings/${selectedId}/services/add`); }}
          onCancelBooking={handleCancelBooking}
        />

        {showRoomSelection && (
          <RoomSelectionOverlay
            selectedBooking={selectedBooking || null}
            facilities={facilities}
            rooms={rooms}
            bookings={bookings}
            selectedFacility={selectedFacility}
            setSelectedFacility={setSelectedFacility}
            onClose={() => setShowRoomSelection(false)}
            onRoomSelect={handleRoomSelect}
          />
        )}

        <NotificationsOverlay
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          onSelectBooking={handleBookingClick}
          bookings={bookings.filter(b => b.status !== 'Chờ xác nhận')}
        />

        {/* Menu Overlay */}
        {showMenu && (
          <div className="absolute inset-0 z-50 flex flex-col">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowMenu(false)} />
            <div className="relative bg-white w-full h-full flex flex-col animate-slide-in">
              {/* Menu Header */}
              <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-gray-100">
                <h2 className="font-bold text-lg">Menu</h2>
                <button onClick={() => setShowMenu(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto py-2">
                <Link
                  href="/bookings"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <HomeIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Home</p>
                    <p className="text-xs text-gray-500">Trang chủ đặt phòng</p>
                  </div>
                </Link>

                <Link
                  href="/rooms"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <DoorOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Phòng</p>
                    <p className="text-xs text-gray-500">Xem trạng thái tất cả phòng</p>
                  </div>
                </Link>

                <Link
                  href="/dat-phong"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Đặt phòng</p>
                    <p className="text-xs text-gray-500">Tạo đơn đặt phòng mới</p>
                  </div>
                </Link>

                <Link
                  href="/admin/login"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Quản trị</p>
                    <p className="text-xs text-gray-500">Đăng nhập quản trị</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}