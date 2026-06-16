"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!auth) return setError('Firebase not initialized');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Sau khi đăng nhập thành công, chuyển hướng về giao diện chính (Dashboard)
      router.push('/admin');
    } catch (err: any) {
      setError('Email hoặc mật khẩu không chính xác. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Đăng nhập Lễ tân</h2>
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <label className="block mb-2 text-sm">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-3 p-2 border rounded" type="email" required />
        <label className="block mb-2 text-sm">Mật khẩu</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mb-4 p-2 border rounded" type="password" required />
        <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
    </div>
  );
}
