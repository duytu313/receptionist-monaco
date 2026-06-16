"use client";

import React, { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { rtdb } from '../firebase';
import { ref as dbRef, onValue } from 'firebase/database';

export default function Home() {
  const [count, setCount] = useState<number | null>(null); 

  useEffect(() => {
    // if the app should redirect immediately, keep original behavior
    // but also attempt to subscribe briefly to bookings to ensure realtime
    if (!rtdb) {
      return redirect('/bookings');
    }
    const bookingsRef = dbRef(rtdb, 'bookings');
    const unsub = onValue(bookingsRef, (snap) => {
      const val = snap.val();
      setCount(val ? Object.keys(val).length : 0);
    }, (err) => {
      console.error('RTDB home onValue error', err);
    });
    // don't redirect immediately so user can see live count briefly
    const t = setTimeout(() => redirect('/bookings'), 800);
    return () => { unsub(); clearTimeout(t); };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Đang chuyển đến Trang Đặt phòng...</h1>
        <p className="mt-2 text-sm text-gray-600">Số đơn hiện tại: {count === null ? '—' : count}</p>
      </div>
    </div>
  );
}
