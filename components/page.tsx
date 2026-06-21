"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { rtdb } from '@/firebase';
import { ref, get, update } from 'firebase/database';
import { ChevronLeft, Search, Plus, Minus, Check, Loader2, ShoppingCart } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem extends MenuItem {
  qty: number;
}

export default function AddServiceSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Tải danh mục thực đơn từ Firebase
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const snapshot = await get(ref(rtdb, 'menu'));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const items: MenuItem[] = [];
          const cats = new Set<string>(['Tất cả']);
          
          Object.entries(data).forEach(([id, item]: [string, any]) => {
            items.push({ id, ...item });
            if (item.category) cats.add(item.category);
          });
          
          setMenu(items);
          setCategories(Array.from(cats));
        }
      } catch (err) {
        console.error("Lỗi tải menu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart(prev => ({
      ...prev,
      [item.id]: { ...item, qty: (prev[item.id]?.qty || 0) + 1 }
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId].qty > 1) {
        newCart[itemId].qty -= 1;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  // 2. Lưu vào database
  const handleSave = async () => {
    if (Object.keys(cart).length === 0) return;
    setSaving(true);
    try {
      const bookingSnap = await get(ref(rtdb, `bookings/${bookingId}/services`));
      const currentServices = bookingSnap.exists() ? bookingSnap.val() : [];
      
      const newItems = Object.values(cart).map(item => ({
        name: item.name,
        price: item.price,
        qty: item.qty
      }));
      
      await update(ref(rtdb, `bookings/${bookingId}`), {
        services: [...currentServices, ...newItems]
      });
      
      router.back();
    } catch (err) {
      console.error("Lỗi lưu dịch vụ:", err);
      alert("Không thể lưu dịch vụ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const filteredMenu = menu.filter(item => {
    const matchesCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalAmount = Object.values(cart).reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex justify-center font-sans">
      <div className="w-full max-w-md bg-white shadow-xl flex flex-col h-[100dvh]">
        {/* Header Section */}
        <div className="px-4 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="font-bold text-lg">Thêm dịch vụ</h1>
            <div className="w-10" />
          </div>
          
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Tìm món ăn, đồ uống..."
              className="w-full bg-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredMenu.map(item => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">{item.name}</h3>
                <p className="text-blue-600 font-bold text-sm">{item.price.toLocaleString()}đ</p>
              </div>
              
              <div className="flex items-center gap-3">
                {cart[item.id] ? (
                  <div className="flex items-center bg-gray-100 rounded-full p-1">
                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600"><Minus className="w-4 h-4" /></button>
                    <span className="font-bold text-sm w-8 text-center">{cart[item.id].qty}</span>
                    <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full shadow-sm text-white"><Plus className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(item)}
                    className="px-5 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-full hover:bg-blue-100 transition-colors"
                  >
                    Thêm
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cart Button */}
        {cartCount > 0 && (
          <div className="p-4 bg-white border-t border-gray-100 pb-8 animate-in slide-in-from-bottom duration-300">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-4 px-6 flex items-center justify-between shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg relative">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] w-4 h-4 flex items-center justify-center rounded-full border border-white font-bold">{cartCount}</span>
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-blue-100 font-medium uppercase tracking-wider">Xác nhận đơn món</p>
                  <p className="font-bold">{totalAmount.toLocaleString()}đ</p>
                </div>
              </div>
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-6 h-6" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}