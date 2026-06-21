"use client";

import React, { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { rtdb, auth } from '../firebase';
import { ref as dbRef, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const [count, setCount] = useState<number | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (!auth) {
      setCheckingAuth(false);
      return redirect('/admin/login');
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCheckingAuth(false);
      if (!user) {
        // User is not logged in, redirect to login page
        redirect('/admin/login');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Only load bookings data if user is authenticated
    if (checkingAuth || !rtdb) return;

    const bookingsRef = dbRef(rtdb, 'bookings');
    const unsub = onValue(bookingsRef, (snap) => {
      const val = snap.val();
      setCount(val ? Object.keys(val).length : 0);
    }, (err) => {
      console.error('RTDB home onValue error', err);
    });

    // Redirect to bookings page after showing count briefly
    const t = setTimeout(() => redirect('/bookings'), 800);
    return () => { unsub(); clearTimeout(t); };
  }, [checkingAuth]);

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Đang kiểm tra đăng nhập...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Đang chuyển đến Trang Đặt phòng...</h1>
        <p className="mt-2 text-sm text-gray-600">Số đơn hiện tại: {count === null ? '—' : count}</p>
      </div>
    </div>
  );
}
