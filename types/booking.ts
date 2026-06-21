export type BookingStatus = 'Chờ xác nhận' | 'Đã xác nhận' | 'Đã đến' | 'Đang dùng' | 'Chờ đến' | 'Chờ thanh toán' | 'Đã thanh toán' | 'Đã hủy';

export interface Service {
  name: string;
  qty: number;
  price: number;
  quantity?: number;
}

export interface AppliedVoucher {
  code: string;
  title: string;
  discountAmount?: number;
  discountRate?: number;
  minTotal?: number;
}

export interface AppliedReward {
  id: string;
  title: string;
  description?: string;
  discountAmount?: number;
  discountRate?: number;
  minTotal?: number;
}

export interface Booking {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  room?: string;
  roomType: string;
  facilityId?: string;
  facilityName?: string;
  facilityType?: string;
  guests: number;
  time: string;
  duration: string;
  date?: string;
  status: BookingStatus;
  totalEst?: number;
  paidAmount?: number;
  paidAt?: number;
  paymentStatus?: 'pending' | 'paid';
  services: Service[];
  note?: string;
  arrivalTime?: string;
  endTime?: string; // Giờ kết thúc - lưu khi nhấn "Kết thúc & Tính tiền"
  startTime?: string; // Giờ bắt đầu sử dụng phòng
  updatedAt?: number;
  // Voucher & Reward
  appliedVoucher?: AppliedVoucher;
  appliedRewardId?: string;
  finalAmount?: number;
  roomPrice?: number;
}

export interface RoomItem {
  id: string;
  name: string;
  type?: string;
  category?: string;
  capacity?: number;
  price?: number;
  priceNote?: string;
  status?: string;
  facilityId?: string;
  facilityName?: string;
}

export interface FacilityData {
  id: string;
  name: string;
  type: 'karaoke' | 'massage' | 'restaurant';
  rooms: Record<string, any>;
  roomCount: number;
}