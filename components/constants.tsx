import React from 'react';
import { Mic, Heart, Soup } from 'lucide-react';

export const statusColors: Record<string, string> = {
  'Chờ xác nhận': 'bg-yellow-100 text-yellow-700',
  'Đã xác nhận': 'bg-indigo-100 text-indigo-700',
  'Đã đến': 'bg-green-100 text-green-700',
  'Đang dùng': 'bg-orange-100 text-orange-700',
  'Chờ đến': 'bg-blue-100 text-blue-700',
  'Chờ thanh toán': 'bg-red-100 text-red-700',
  'Đã thanh toán': 'bg-emerald-100 text-emerald-700',
  'Đã hủy': 'bg-gray-100 text-gray-700',
};

export const facilityTypeColors: Record<string, string> = {
  karaoke: 'bg-purple-500/20 text-purple-700 border-purple-500/30',
  massage: 'bg-pink-500/20 text-pink-700 border-pink-500/30',
  restaurant: 'bg-orange-500/20 text-orange-700 border-orange-500/30',
};

export const facilityTypeIcons: Record<string, React.ReactNode> = {
  karaoke: <Mic size={16} />,
  massage: <Heart size={16} />,
  restaurant: <Soup size={16} />,
};

export const facilityTypeLabels: Record<string, string> = {
  karaoke: 'Karaoke',
  massage: 'Massage',
  restaurant: 'Nhà hàng',
};

export type TabFilter = 'all' | 'confirmed' | 'waiting' | 'arrived' | 'using';