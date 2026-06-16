"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, rtdb } from '../../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref as dbRef, set } from 'firebase/database';

export default function AdminRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function makeNameKey(e: string) {
    return e.split('@')[0].replace(/[^a-z0-9_-]/gi, '').toLowerCase();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!auth || !rtdb) return setError('Firebase not initialized');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const nameKey = makeNameKey(email) || uid;
      const profile = {
        authUid: uid,
        username: nameKey,
        name: name || nameKey,
        email,
        role: 'receptionist',
        points: 0,
        createdAt: Date.now(),
      };

      // write uidMap and profile — rules allow new user to write their own profile
      await set(dbRef(rtdb, `users/uidMap/${uid}`), nameKey);
      await set(dbRef(rtdb, `users/profiles/${nameKey}`), profile);

      // redirect to home after successful registration
      router.push('/');
    } catch (err: any) {
      console.error('Register failed', err);
      setError(err?.message || 'Register failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Đăng ký Lễ tân</h2>
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <label className="block mb-2 text-sm">Họ và tên</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mb-3 p-2 border rounded" type="text" required />
        <label className="block mb-2 text-sm">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-3 p-2 border rounded" type="email" required />
        <label className="block mb-2 text-sm">Mật khẩu</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mb-4 p-2 border rounded" type="password" required minLength={6} />
        <button disabled={loading} className="w-full bg-green-600 text-white py-2 rounded">{loading ? 'Đang tạo...' : 'Tạo tài khoản lễ tân'}</button>
      </form>
    </div>
  );
}
