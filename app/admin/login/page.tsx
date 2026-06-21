"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    if (!auth) {
      setCheckingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCheckingAuth(false);
      if (user) {
        // User is already logged in, redirect to bookings
        console.log('User already logged in:', user.email);
        router.push('/bookings');
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    // Check if Firebase is configured
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    };
    
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your_api_key_here') {
      setError('Firebase chưa được cấu hình. Vui lòng cập nhật file .env với thông tin Firebase của bạn.');
      return;
    }
    
    if (!auth) {
      setError('Firebase chưa được khởi tạo. Vui lòng kiểm tra file .env');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Attempting login with:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user.email);
      
      // Wait a bit for the auth state to update, then redirect
      setTimeout(() => {
        router.push('/bookings');
      }, 100);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
        ? 'Email hoặc mật khẩu không chính xác. Vui lòng thử lại.'
        : 'Đăng nhập thất bại. Vui lòng thử lại sau.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Show loading while checking auth state
  if (checkingAuth) {
    return (
      <div className="bg-gray-100 min-h-screen flex justify-center overflow-hidden font-sans">
        <div className="app-container flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-semibold">Đang kiểm tra đăng nhập...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center overflow-hidden font-sans">
      <div className="app-container flex items-center justify-center">
        <form onSubmit={handleSubmit} className="w-full bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Đăng nhập Lễ tân</h2>
          
          {error && <div className="text-sm text-red-600 mb-3 p-2 bg-red-50 border border-red-200 rounded">{error}</div>}
          <label className="block mb-2 text-sm">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-3 p-2 border rounded" type="email" required />
          <label className="block mb-2 text-sm">Mật khẩu</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mb-4 p-2 border rounded" type="password" required />
          <button type="submit" disabled={loading || !auth} className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
          
          {!auth && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <p className="font-semibold">Lưu ý:</p>
              <p>Firebase chưa được cấu hình. Vui lòng cập nhật file <code className="bg-red-100 px-1 rounded">.env</code> với thông tin Firebase thực tế.</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
