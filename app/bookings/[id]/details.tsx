"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { rtdb, auth } from '../../../firebase';
import { ref as dbRef, onValue, update, off } from 'firebase/database';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { Booking, BookingStatus, Service } from '@/types/booking';
import { formatPrice } from '@/utils/formatters';
import {
  ChevronLeft, User, Phone, MapPin, Clock, Users, FileText,
  Plus, Trash2, CheckCircle, XCircle, Loader2, ShoppingBag,
  Wallet, Edit3, Save, X
} from 'lucide-react';

const statusColors: Record<BookingStatus, string> = {
  'Chờ xác nhận': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Đã xác nhận':  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Đã đến':       'bg-green-100 text-green-700 border-green-200',
  'Đang dùng':    'bg-orange-100 text-orange-700 border-orange-200',
  'Chờ đến':      'bg-blue-100 text-blue-700 border-blue-200',
  'Chờ thanh toán': 'bg-red-100 text-red-700 border-red-200',
  'Đã thanh toán': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Đã hủy':       'bg-gray-100 text-gray-500 border-gray-200',
};

const normalizeStatus = (raw?: string): BookingStatus => {
  const s = raw?.trim() ?? '';
  const map: Record<string, BookingStatus> = {
    'pending': 'Chờ xác nhận', 'new': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận',
    'waiting': 'Chờ đến',
    'arrived': 'Đã đến',
    'using': 'Đang dùng', 'in_use': 'Đang dùng',
    'checkout': 'Chờ thanh toán', 'payment_pending': 'Chờ thanh toán', 'unpaid': 'Chờ thanh toán',
    'paid': 'Đã thanh toán', 'completed': 'Đã thanh toán',
    'cancelled': 'Đã hủy', 'canceled': 'Đã hủy',
  };
  return map[s.toLowerCase()] ??
    (['Chờ xác nhận','Đã xác nhận','Đã đến','Đang dùng','Chờ đến','Chờ thanh toán','Đã thanh toán','Đã hủy'].includes(s)
      ? s as BookingStatus
      : 'Chờ xác nhận');
};

const pick = (...vals: unknown[]): string => {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v.trim();
  return '';
};

export default function BookingDetails() {
  const params  = useParams();
  const router  = useRouter();
  const id      = params?.id as string;

  const [booking,  setBooking]  = useState<Booking | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  /* ── add-service panel ── */
  const [showAdd,     setShowAdd]     = useState(false);
  const [newSvcName,  setNewSvcName]  = useState('');
  const [newSvcQty,   setNewSvcQty]   = useState(1);
  const [newSvcPrice, setNewSvcPrice] = useState('');

  /* ── edit note ── */
  const [editNote,  setEditNote]  = useState(false);
  const [noteVal,   setNoteVal]   = useState('');

  /* ─── Firebase realtime listener ─── */
  useEffect(() => {
    if (!id || !rtdb || !auth) {
      setError('Không tìm thấy dữ liệu đặt phòng.');
      setLoading(false);
      return;
    }

    const bookingRef = dbRef(rtdb, `bookings/${id}`);
    let unsubAuth: (() => void) | undefined;

    const attachListener = () => {
      onValue(bookingRef, (snap) => {
        const raw = snap.val();
        if (!raw) {
          setError('Không tìm thấy đơn đặt phòng.');
          setLoading(false);
          return;
        }
        const b: Booking = {
          id,
          name:      pick(raw.name, raw.fullName, raw.customerName, raw.guestName) || 'Khách',
          phone:     pick(raw.phone, raw.phoneNumber, raw.customerPhone),
          room:      raw.room,
          roomType:  raw.roomType || raw.type || 'Thường',
          guests:    Number(raw.guests || raw.guestCount || 1),
          time:      pick(raw.time, raw.bookingTime, raw.startTime),
          duration:  pick(raw.duration, raw.timeRange),
          date:      pick(raw.date, raw.bookingDate, raw.createdDate),
          status:    normalizeStatus(raw.status),
          totalEst:  raw.totalEst,
          paidAmount:raw.paidAmount,
          services:  Array.isArray(raw.services) ? raw.services : [],
          note:      raw.note || '',
          arrivalTime: raw.arrivalTime,
          updatedAt: raw.updatedAt,
        };
        setBooking(b);
        setNoteVal(b.note || '');
        setLoading(false);
      }, (err) => {
        console.error(err);
        setError('Lỗi khi tải dữ liệu.');
        setLoading(false);
      });
    };

    unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try { await signInAnonymously(auth); return; } catch { /* fallthrough */ }
      }
      attachListener();
    });

    return () => {
      unsubAuth?.();
      off(bookingRef);
    };
  }, [id]);

  /* ─── Helpers ─── */
  const saveField = async (fields: Partial<Booking>) => {
    if (!rtdb || !id) return;
    setSaving(true);
    try {
      await update(dbRef(rtdb, `bookings/${id}`), { ...fields, updatedAt: Date.now() });
    } catch {
      alert('Không thể lưu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const totalServices = (list: Service[]) =>
    list.reduce((s, i) => s + i.qty * i.price, 0);

  const handleAddService = async () => {
    if (!booking || !newSvcName.trim()) return;
    const svc: Service = { name: newSvcName.trim(), qty: newSvcQty, price: Number(newSvcPrice.replace(/\D/g,'')) || 0 };
    await saveField({ services: [...booking.services, svc] });
    setNewSvcName(''); setNewSvcQty(1); setNewSvcPrice(''); setShowAdd(false);
  };

  const handleRemoveService = async (idx: number) => {
    if (!booking) return;
    await saveField({ services: booking.services.filter((_, i) => i !== idx) });
  };

  const handleSaveNote = async () => {
    await saveField({ note: noteVal });
    setEditNote(false);
  };

  const handleStatusChange = async (next: BookingStatus) => {
    await saveField({ status: next });
  };

  /* ─── States ─── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-gray-500 text-sm">Đang tải...</p>
      </div>
    </div>
  );

  if (error || !booking) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center space-y-4">
        <XCircle className="w-12 h-12 text-red-400 mx-auto" />
        <p className="text-gray-700 font-semibold">{error || 'Không tìm thấy đơn.'}</p>
        <button onClick={() => router.back()} className="px-5 py-2 bg-gray-100 rounded-xl text-gray-700 font-medium hover:bg-gray-200 transition">
          Quay lại
        </button>
      </div>
    </div>
  );

  const svcTotal  = totalServices(booking.services);
  const grandTotal = booking.totalEst ?? svcTotal;
  const isPaid     = booking.status === 'Đã thanh toán';
  const isCancelled = booking.status === 'Đã hủy';

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-32">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 pt-12 pb-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-base text-gray-800">Chi tiết đặt phòng</h1>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusColors[booking.status]}`}>
            {booking.status}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* ── Customer Card ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Thông tin khách</h2>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="font-bold text-gray-800">{booking.name}</p>
              {booking.arrivalTime && (
                <p className="text-xs text-green-600 font-medium">✓ Đến lúc {booking.arrivalTime}</p>
              )}
            </div>
          </div>

          {booking.phone && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-gray-500" />
              </div>
              <a href={`tel:${booking.phone}`} className="font-medium text-gray-700 hover:text-indigo-600 transition">
                {booking.phone}
              </a>
            </div>
          )}
        </div>

        {/* ── Room Info ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Thông tin phòng</h2>
          <div className="grid grid-cols-3 gap-3">
            <InfoCell icon={<MapPin className="w-4 h-4" />} label="Phòng"
              value={booking.room || <span className="text-gray-400 italic text-xs">Chưa xếp</span>} />
            <InfoCell icon={<ShoppingBag className="w-4 h-4" />} label="Loại" value={booking.roomType} />
            <InfoCell icon={<Users className="w-4 h-4" />} label="Số người" value={`${booking.guests} người`} />
          </div>
          {(booking.time || booking.duration) && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium">
                {booking.time}{booking.duration ? ` · ${booking.duration}` : ''}
              </span>
              {booking.date && <span className="text-gray-400 ml-auto text-xs">{booking.date}</span>}
            </div>
          )}
        </div>

        {/* ── Services ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Dịch vụ</h2>
            {!isCancelled && !isPaid && (
              <button
                onClick={() => setShowAdd(v => !v)}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm
              </button>
            )}
          </div>

          {booking.services.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-3">Chưa có dịch vụ nào</p>
          ) : (
            <div className="space-y-2">
              {booking.services.map((svc, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{svc.name}</p>
                    <p className="text-xs text-gray-400">x{svc.qty} · {formatPrice(svc.price)} / cái</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-700">{formatPrice(svc.qty * svc.price)}</span>
                    {!isCancelled && !isPaid && (
                      <button onClick={() => handleRemoveService(i)} className="text-red-400 hover:text-red-600 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add service panel */}
          {showAdd && (
            <div className="mt-3 bg-indigo-50 rounded-xl p-3 space-y-2 border border-indigo-100">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Thêm dịch vụ mới</p>
              <input
                type="text"
                placeholder="Tên dịch vụ"
                value={newSvcName}
                onChange={e => setNewSvcName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Số lượng"
                  min={1}
                  value={newSvcQty}
                  onChange={e => setNewSvcQty(Number(e.target.value))}
                  className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="text"
                  placeholder="Đơn giá (đ)"
                  value={newSvcPrice}
                  onChange={e => setNewSvcPrice(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAdd(false); setNewSvcName(''); setNewSvcQty(1); setNewSvcPrice(''); }}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddService}
                  disabled={!newSvcName.trim() || saving}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Lưu'}
                </button>
              </div>
            </div>
          )}

          {/* Total */}
          {booking.services.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">Tổng dịch vụ</span>
              <span className="font-bold text-gray-800">{formatPrice(svcTotal)}</span>
            </div>
          )}
        </div>

        {/* ── Payment Summary ── */}
        {(booking.totalEst || booking.paidAmount) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Thanh toán</h2>
            <div className="space-y-2">
              {booking.totalEst && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tổng ước tính</span>
                  <span className="font-semibold text-gray-800">{formatPrice(booking.totalEst)}</span>
                </div>
              )}
              {booking.paidAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Đã thanh toán</span>
                  <span className="font-bold text-emerald-600">{formatPrice(booking.paidAmount)}</span>
                </div>
              )}
            </div>
            {isPaid && (
              <div className="mt-3 flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-emerald-700">Đã thanh toán đầy đủ</span>
              </div>
            )}
          </div>
        )}

        {/* ── Note ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Ghi chú</h2>
            {!editNote && !isCancelled && (
              <button onClick={() => setEditNote(true)} className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition">
                <Edit3 className="w-3.5 h-3.5" /> Sửa
              </button>
            )}
          </div>
          {editNote ? (
            <div className="space-y-2">
              <textarea
                value={noteVal}
                onChange={e => setNoteVal(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="flex gap-2">
                <button onClick={() => { setEditNote(false); setNoteVal(booking.note || ''); }}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
                  <X className="w-4 h-4 inline mr-1" />Hủy
                </button>
                <button onClick={handleSaveNote} disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><Save className="w-4 h-4 inline mr-1" />Lưu</>}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {booking.note ? booking.note : <span className="italic text-gray-400">Không có ghi chú</span>}
            </p>
          )}
        </div>

        {/* ── Status Actions ── */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Thao tác nhanh</h2>
            {booking.status === 'Đã xác nhận' && (
              <QuickAction label="✓ Xác nhận khách đến" color="green" onClick={() => handleStatusChange('Đã đến')} saving={saving} />
            )}
            {booking.status === 'Đã đến' && (
              <QuickAction label="▶ Bắt đầu sử dụng phòng" color="orange" onClick={() => handleStatusChange('Đang dùng')} saving={saving} />
            )}
            {booking.status === 'Đang dùng' && (
              <QuickAction label="⏹ Kết thúc · Chờ thanh toán" color="red" onClick={() => handleStatusChange('Chờ thanh toán')} saving={saving} />
            )}
            {booking.status === 'Chờ thanh toán' && (
              <QuickAction label="💳 Đã thanh toán" color="emerald" onClick={() => handleStatusChange('Đã thanh toán')} saving={saving} />
            )}
            {/* Cancel always visible unless completed */}
            {!isPaid && booking.status !== 'Đã hủy' && (
              <button
                onClick={() => handleStatusChange('Đã hủy')}
                disabled={saving}
                className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50"
              >
                Hủy đơn
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Small helpers ─── */
function InfoCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
      <div className="text-gray-400">{icon}</div>
      <p className="text-[10px] text-gray-400 font-medium">{label}</p>
      <p className="text-sm font-bold text-gray-800 leading-tight">{value}</p>
    </div>
  );
}

const colorMap: Record<string, string> = {
  green:   'bg-green-500 hover:bg-green-600 shadow-green-500/25',
  orange:  'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25',
  red:     'bg-red-500 hover:bg-red-600 shadow-red-500/25',
  emerald: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25',
};

function QuickAction({ label, color, onClick, saving }: {
  label: string; color: string; onClick: () => void; saving: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`w-full py-3 rounded-xl text-white text-sm font-bold shadow-md transition disabled:opacity-50 ${colorMap[color]}`}
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : label}
    </button>
  );
}
