"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, Search, Phone, User } from 'lucide-react';
import { useBookingData } from '@/hooks/useBookingData';

export default function CustomerPage() {
  const { bookings } = useBookingData();
  const [search, setSearch] = useState('');

  // Extract unique customers from bookings
  const customers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; visitCount: number; lastVisit: string; rooms: string[] }>();
    bookings.forEach((b) => {
      const key = b.phone || b.name;
      if (!key) return;
      const existing = map.get(key);
      if (existing) {
        existing.visitCount++;
        if (b.date && b.date > existing.lastVisit) existing.lastVisit = b.date;
        if (b.room && !existing.rooms.includes(b.room)) existing.rooms.push(b.room);
      } else {
        map.set(key, {
          name: b.name,
          phone: b.phone,
          visitCount: 1,
          lastVisit: b.date || '',
          rooms: b.room ? [b.room] : [],
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.visitCount - a.visitCount);
  }, [bookings]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center overflow-hidden font-sans">
      <div className="app-container">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-white sticky top-0 z-10 border-b border-gray-100">
          <Link href="/more" className="flex items-center text-gray-700 hover:text-gray-900">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-bold text-lg">Khách hàng</h1>
          <div className="w-6" />
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 mb-4">
          <div className="flex gap-3">
            <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-blue-600">{customers.length}</p>
              <p className="text-xs text-gray-500">Tổng khách</p>
            </div>
            <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-green-600">
                {customers.filter((c) => c.visitCount > 1).length}
              </p>
              <p className="text-xs text-gray-500">Quay lại</p>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto px-4 pb-20">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">👥</div>
              <div className="text-sm font-medium">Không tìm thấy khách hàng</div>
            </div>
          )}
          {filtered.map((c, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 mb-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                  {c.phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {c.phone}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{c.visitCount} lần</p>
                  <p className="text-xs text-gray-400">{c.rooms.join(', ')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}