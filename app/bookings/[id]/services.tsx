"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { rtdb, auth } from '../../../firebase';
import { ref as dbRef, onValue, update, off } from 'firebase/database';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { Service as BookingServiceItem } from '@/types/booking'; // Rename to avoid conflict
import { formatPrice } from '@/utils/formatters';
import {
  ChevronLeft, Plus, Minus, Trash2, ShoppingBag,
  Loader2, CheckCircle, XCircle, Search, Tag
} from 'lucide-react';

/* ─────────────────────────── Types ─────────────────────────── */
interface CatalogItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  unit?: string;
}

/* ─────────────────────── Fallback catalog ───────────────────── */
const FALLBACK_CATALOG: CatalogItem[] = [
  { id: 'nuoc-suoi',    name: 'Nước suối',       price: 10000,  category: 'Đồ uống', unit: 'chai' },
  { id: 'nuoc-ngot',    name: 'Nước ngọt',        price: 15000,  category: 'Đồ uống', unit: 'lon'  },
  { id: 'bia-333',      name: 'Bia 333',           price: 25000,  category: 'Đồ uống', unit: 'lon'  },
  { id: 'bia-tiger',    name: 'Bia Tiger',         price: 30000,  category: 'Đồ uống', unit: 'lon'  },
  { id: 'bia-heineken', name: 'Bia Heineken',      price: 35000,  category: 'Đồ uống', unit: 'lon'  },
  { id: 'tra-da',       name: 'Trà đá',            price: 5000,   category: 'Đồ uống', unit: 'ly'   },
  { id: 'ca-phe',       name: 'Cà phê',            price: 20000,  category: 'Đồ uống', unit: 'ly'   },
  { id: 'snack',        name: 'Snack',             price: 20000,  category: 'Ăn nhẹ',  unit: 'gói'  },
  { id: 'hat-dieu',     name: 'Hạt điều',          price: 50000,  category: 'Ăn nhẹ',  unit: 'đĩa'  },
  { id: 'kho-bo',       name: 'Khô bò',            price: 60000,  category: 'Ăn nhẹ',  unit: 'đĩa'  },
  { id: 'muc-que',      name: 'Mực que',           price: 30000,  category: 'Ăn nhẹ',  unit: 'gói'  },
  { id: 'banh-mi',      name: 'Bánh mì',           price: 25000,  category: 'Ăn nhẹ',  unit: 'cái'  },
  { id: 'micro',        name: 'Micro thêm',        price: 50000,  category: 'Thiết bị', unit: 'cái' },
  { id: 'loa',          name: 'Loa ngoài',         price: 100000, category: 'Thiết bị', unit: 'cái' },
  { id: 'den-vu-truong', name: 'Đèn vũ trường',   price: 80000,  category: 'Thiết bị', unit: 'set' },
  { id: 'banh-kem',     name: 'Bánh kem sinh nhật',price: 250000, category: 'Đặc biệt', unit: 'cái' },
  { id: 'hoa',          name: 'Hoa trang trí',     price: 150000, category: 'Đặc biệt', unit: 'bó'  },
];

/* ═══════════════════════════ Page ══════════════════════════════ */
export default function AddService() {
  const params    = useParams();
  const router    = useRouter();
  const bookingId = params?.id as string;

  /* ── State ── */
  const [bookingServices, setBookingServices] = useState<BookingServiceItem[]>([]);
  const [catalog,         setCatalog]         = useState<CatalogItem[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [saved,           setSaved]           = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  // Cart: items being added this session (id → qty)
  const [cart, setCart] = useState<Record<string, number>>({});

  // Custom item form
  const [showCustom,    setShowCustom]    = useState(false);
  const [customName,    setCustomName]    = useState('');
  const [customPrice,   setCustomPrice]   = useState('');
  const [customQty,     setCustomQty]     = useState(1);

  const [query,         setQuery]         = useState('');
  const [activeCategory,setActiveCategory]= useState<string>('Tất cả');

  /* ── Firebase listeners ── */
  useEffect(() => {
    if (!bookingId || !rtdb || !auth) {
      setCatalog(FALLBACK_CATALOG);
      setLoading(false);
      return;
    }

    const bookingRef = dbRef(rtdb, `bookings/${bookingId}`);
    const catalogRef = dbRef(rtdb, 'services');          // optional catalog in DB
    let unsubAuth: (() => void) | undefined;

    const attach = () => {
      // Booking services
      onValue(bookingRef, snap => {
        const raw = snap.val();
        if (!raw) { setError('Không tìm thấy đơn đặt phòng.'); setLoading(false); return; }
        setBookingServices(Array.isArray(raw.services) ? raw.services : []);
        setLoading(false);
      }, () => { setError('Lỗi khi tải dữ liệu.'); setLoading(false); });

      // Catalog (optional — use fallback if not in DB)
      onValue(catalogRef, snap => {
        const val = snap.val();
        if (val) {
          const list: CatalogItem[] = Object.entries(val).map(([key, v]: any) => ({
            id:       key,
            name:     v.name || key,
            price:    Number(v.price || 0),
            category: v.category || 'Khác',
            unit:     v.unit || 'cái',
          }));
          setCatalog(list);
        } else {
          setCatalog(FALLBACK_CATALOG);
        }
      }, () => setCatalog(FALLBACK_CATALOG));
    };

    unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) { try { await signInAnonymously(auth); return; } catch {} }
      attach();
    });

    return () => {
      unsubAuth?.();
      off(bookingRef);
      off(dbRef(rtdb, 'services'));
    };
  }, [bookingId]);

  /* ── Derived ── */
  const categories = useMemo(() => {
    const cats = [...new Set(catalog.map(c => c.category || 'Khác'))];
    return ['Tất cả', ...cats];
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const matchQ = item.name.toLowerCase().includes(query.toLowerCase());
      const matchC = activeCategory === 'Tất cả' || item.category === activeCategory;
      return matchQ && matchC;
    });
  }, [catalog, query, activeCategory]);

  const cartTotal = useMemo(() =>
    Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = catalog.find(c => c.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0),
  [cart, catalog]);

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

  const existingTotal = bookingServices.reduce((s, i) => s + i.price * i.qty, 0);

  /* ── Cart handlers ── */
  const addToCart = (id: string) =>
    setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));

  const removeFromCart = (id: string) =>
    setCart(c => {
      const next = { ...c };
      if ((next[id] || 0) <= 1) delete next[id]; else next[id]--;
      return next;
    });

  const clearCart = () => setCart({});

  /* ── Remove existing service ── */
  const handleRemoveExisting = async (idx: number) => { // Use BookingServiceItem
    if (!rtdb || !bookingId) return;
    setSaving(true);
    try {
      const updated = bookingServices.filter((_, i) => i !== idx);
      await update(dbRef(rtdb, `bookings/${bookingId}`), { services: updated, updatedAt: Date.now() });
    } catch { alert('Không thể xóa dịch vụ.'); }
    finally { setSaving(false); }
  };

  /* ── Save cart to Firebase ── */
  const handleSave = async () => {
    if (!rtdb || !bookingId) return;
    const cartItems: BookingServiceItem[] = Object.entries(cart).map(([id, qty]) => {
      const item = catalog.find(c => c.id === id);
      return { name: item?.name || id, qty, price: item?.price || 0 };
    });

    if (showCustom && customName.trim()) {
      cartItems.push({
        name:  customName.trim(),
        qty:   customQty,
        price: Number(customPrice.replace(/\D/g, '')) || 0,
      });
    }

    if (cartItems.length === 0) return;

    setSaving(true);
    try {
      await update(dbRef(rtdb, `bookings/${bookingId}`), {
        services:  [...bookingServices, ...cartItems],
        updatedAt: Date.now(),
      });
      clearCart();
      setShowCustom(false);
      setCustomName(''); setCustomPrice(''); setCustomQty(1);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Không thể lưu dịch vụ. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  /* ─────────── Render states ─────────── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-gray-500 text-sm">Đang tải...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center space-y-4">
        <XCircle className="w-12 h-12 text-red-400 mx-auto" />
        <p className="text-gray-700 font-semibold">{error}</p>
        <button onClick={() => router.back()} className="px-5 py-2 bg-gray-100 rounded-xl text-gray-700 font-medium hover:bg-gray-200 transition">
          Quay lại
        </button>
      </div>
    </div>
  );

  /* ─────────── Main ─────────── */
  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-44">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-base text-gray-800">Dịch vụ</h1>
            <p className="text-xs text-gray-400">{bookingServices.length} dịch vụ đã đặt</p>
          </div>
          {cartCount > 0 && (
            <div className="relative">
              <ShoppingBag className="w-6 h-6 text-indigo-600" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-4 pb-2 max-w-lg mx-auto">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Tìm dịch vụ..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="bg-transparent flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar max-w-lg mx-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">

        {/* ── Already added services ── */}
        {bookingServices.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3"> {/* Use formatPrice */}
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Đã đặt</h2>
              <span className="text-xs font-semibold text-gray-600">{formatPrice(existingTotal)}</span>
            </div>
            <div className="space-y-2">
              {bookingServices.map((svc, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{svc.name}</p>
                    <p className="text-xs text-gray-400">x{svc.qty} · {formatPrice(svc.price)}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-2">
                    <span className="text-sm font-bold text-gray-700">{formatPrice(svc.qty * svc.price)}</span>
                    <button // Use formatPrice
                      onClick={() => handleRemoveExisting(i)}
                      disabled={saving}
                      className="text-red-400 hover:text-red-600 transition disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Catalog grid ── */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 px-1">Chọn thêm dịch vụ</h2>

          {filteredCatalog.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Không tìm thấy dịch vụ</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {filteredCatalog.map(item => {
                const qty = cart[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border p-3 shadow-sm transition-all ${
                      qty > 0 ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-gray-100'
                    }`}
                  >
                    {/* Category badge */}
                    <span className="inline-block text-[9px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full mb-1.5">
                      {item.category}
                    </span>

                    <p className="font-bold text-gray-800 text-sm leading-tight">{item.name}</p>
                    {item.unit && (
                      <p className="text-[10px] text-gray-400 mt-0.5">/{item.unit}</p>
                    )}
                    <p className="font-bold text-indigo-600 text-sm mt-1">{formatPrice(item.price)}</p>

                    {/* Qty controls */}
                    <div className="flex items-center justify-between mt-2.5">
                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(item.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
                        >
                          <Plus className="w-3.5 h-3.5" /> Thêm
                        </button>
                      ) : (
                        <div className="w-full flex items-center justify-between bg-indigo-50 rounded-xl px-1">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 flex items-center justify-center text-indigo-600 hover:text-indigo-800 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-indigo-700 text-sm">{qty}</span>
                          <button
                            onClick={() => addToCart(item.id)}
                            className="w-8 h-8 flex items-center justify-center text-indigo-600 hover:text-indigo-800 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Custom item ── */}
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-4">
          <button
            onClick={() => setShowCustom(v => !v)}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition"
          >
            <Plus className="w-4 h-4" />
            {showCustom ? 'Ẩn form' : 'Thêm dịch vụ khác (tự nhập)'}
          </button>

          {showCustom && (
            <div className="mt-4 space-y-2">
              <input
                type="text"
                placeholder="Tên dịch vụ *"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Số lượng"
                  min={1}
                  value={customQty}
                  onChange={e => setCustomQty(Number(e.target.value))}
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  type="text"
                  placeholder="Đơn giá (đ)"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Fixed Bottom Bar ── */}
      {(cartCount > 0 || (showCustom && customName.trim())) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-30">
          <div className="max-w-lg mx-auto px-4 py-3 pb-8">

            {/* Cart preview */}
            {cartCount > 0 && (
              <div className="mb-3 space-y-1.5 max-h-32 overflow-y-auto">
                {Object.entries(cart).map(([id, qty]) => {
                  const item = catalog.find(c => c.id === id);
                  if (!item) return null;
                  return (
                    <div key={id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate flex-1">{item.name}</span> {/* Use formatPrice */}
                      <span className="text-gray-400 mx-2">×{qty}</span>
                      <span className="font-semibold text-gray-800">{formatPrice(item.price * qty)}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between border-t border-gray-100 pt-1.5">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tổng thêm</span> {/* Use formatPrice */}
                  <span className="font-bold text-indigo-700">{formatPrice(cartTotal)}</span>
                </div>
              </div>
            )}

            {/* Action row */}
            <div className="flex gap-3">
              <button
                onClick={() => { clearCart(); setShowCustom(false); }}
                className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition text-lg"
              >
                ✕
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                ) : saved ? (
                  <><CheckCircle className="w-4 h-4" /> Đã lưu!</>
                ) : (
                  <>Lưu dịch vụ ({cartCount} món · {formatPrice(cartTotal)})</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
