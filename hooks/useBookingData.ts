"use client";

import { useState, useEffect } from 'react';
import { rtdb, auth } from '../firebase';
import { ref as dbRef, get, onValue, update } from 'firebase/database';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { Booking, BookingStatus, FacilityData, RoomItem } from '@/types/booking';
import { pickString, findStringByKeys } from '@/utils/formatters';

export function useBookingData() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [facilities, setFacilities] = useState<FacilityData[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeStatus = (status?: string): BookingStatus => {
    const normalized = status?.trim().toLowerCase();
    if (!normalized || normalized === 'pending' || normalized === 'new') return 'Chờ xác nhận';
    if (normalized === 'waiting') return 'Chờ đến';
    if (normalized === 'confirmed' || normalized === 'da xac nhan' || normalized === 'đã xác nhận') return 'Đã xác nhận';
    if (normalized === 'arrived') return 'Đã đến';
    if (normalized === 'using' || normalized === 'in_use') return 'Đang dùng';
    if (normalized === 'checkout' || normalized === 'finished' || normalized === 'payment_pending' || normalized === 'unpaid') return 'Chờ thanh toán';
    if (normalized === 'paid' || normalized === 'completed') return 'Đã thanh toán';
    if (normalized === 'cancelled' || normalized === 'canceled') return 'Đã hủy';
    if (status === 'Chờ xác nhận' || status === 'Đã xác nhận' || status === 'Đã đến' || status === 'Đang dùng' || status === 'Chờ đến' || status === 'Chờ thanh toán' || status === 'Đã thanh toán' || status === 'Đã hủy') {
      return status;
    }
    return 'Chờ xác nhận';
  };

  const normalizeBooking = (id: string, raw: any, user?: any): Booking => ({
    id,
    userId: raw?.userId,
    name: pickString(
      raw?.name, raw?.fullName, raw?.displayName, raw?.userName,
      raw?.customerName, raw?.customer_name, raw?.clientName,
      raw?.contactName, raw?.guestName, raw?.tenKhach, raw?.ten_khach,
      raw?.hoTen, raw?.ho_ten, raw?.customer, raw?.customer?.name,
      raw?.customer?.fullName, raw?.customer?.displayName, raw?.customer?.phoneName,
      raw?.customerInfo?.name, raw?.customerInfo?.fullName, raw?.customerInfo?.displayName,
      raw?.user?.name, raw?.user?.fullName, raw?.user?.displayName,
      raw?.userInfo?.name, raw?.userInfo?.fullName, raw?.profile?.name,
      raw?.profile?.fullName, raw?.guest?.name, raw?.guest?.fullName,
      raw?.client?.name, raw?.contact?.name, raw?.khachHang?.ten,
      raw?.khachHang?.name, raw?.booking?.name, raw?.booking?.customerName,
      user?.name, user?.username, user?.fullName, user?.displayName
    ) || findStringByKeys(raw, ['name', 'fullname', 'displayname', 'username', 'customername', 'customer_name', 'clientname', 'contactname', 'guestname', 'ten', 'tenkhach', 'ten_khach', 'hoten', 'ho_ten', 'khachhang']) || 'Khách chưa có tên',
    phone: pickString(
      raw?.phone, raw?.phoneNumber, raw?.customerPhone, raw?.customer_phone,
      raw?.clientPhone, raw?.contactPhone, raw?.guestPhone, raw?.soDienThoai,
      raw?.sdt, raw?.customer?.phone, raw?.customer?.phoneNumber,
      raw?.customerInfo?.phone, raw?.customerInfo?.phoneNumber,
      raw?.user?.phone, raw?.userInfo?.phone, raw?.profile?.phone,
      raw?.guest?.phone, raw?.client?.phone, raw?.contact?.phone,
      raw?.khachHang?.sdt, raw?.khachHang?.phone, raw?.booking?.phone,
      raw?.booking?.customerPhone, user?.phoneNumber, user?.phone, user?.sdt
    ) || findStringByKeys(raw, ['phone', 'phonenumber', 'customerphone', 'customer_phone', 'clientphone', 'contactphone', 'guestphone', 'sodienthoai', 'sdt', 'tel', 'mobile']),
    room: raw?.room || raw?.roomName,
    roomType: raw?.roomType || raw?.type || 'Thường',
    facilityId: raw?.facilityId,
    facilityName: raw?.facilityName,
    facilityType: raw?.facilityType,
    guests: Number(raw?.guests || raw?.guestCount || 1),
    time: raw?.time || raw?.bookingTime || raw?.startTime || '',
    duration: raw?.duration || raw?.timeRange || '',
    date: raw?.date || raw?.bookingDate || raw?.createdDate,
    status: normalizeStatus(raw?.status || raw?.paymentStatus),
    totalEst: raw?.totalEst,
    paidAmount: raw?.paidAmount,
    paidAt: raw?.paidAt,
    paymentStatus: raw?.paymentStatus,
    services: Array.isArray(raw?.services) ? raw.services : [],
    note: raw?.note,
    arrivalTime: raw?.arrivalTime,
    updatedAt: raw?.updatedAt,
  });

  const normalizeRoom = (id: string, raw: any, facilityName?: string): RoomItem => ({
    id,
    name: pickString(raw?.name, raw?.roomName, raw?.title, id) || id,
    type: raw?.type,
    category: raw?.category || raw?.floor || raw?.area || raw?.type,
    capacity: Number(raw?.capacity || 0),
    price: Number(raw?.price || 0),
    priceNote: raw?.priceNote || '',
    status: raw?.status,
    facilityId: raw?.facilityId || '',
    facilityName: raw?.facilityName || facilityName || '',
  });

  const fetchUserProfileByUid = async (userId?: string) => {
    if (!rtdb || !userId) return null;
    try {
      const uidMapSnapshot = await get(dbRef(rtdb, `users/uidMap/${userId}`));
      const nameKey = uidMapSnapshot.val();
      if (!nameKey) return null;
      const profileSnapshot = await get(dbRef(rtdb, `users/profiles/${nameKey}`));
      return profileSnapshot.val();
    } catch (error) {
      console.warn('Cannot read customer profile for booking userId:', userId);
      return null;
    }
  };

  useEffect(() => {
    if (!rtdb) return;
    if (!auth) return;
    let unsubscribeBookings: (() => void) | undefined;
    let unsubscribeFacilities: (() => void) | undefined;
    let syncVersion = 0;

    const remove = onAuthStateChanged(auth, async (user) => {
      unsubscribeBookings?.();
      unsubscribeBookings = undefined;
      unsubscribeFacilities?.();
      unsubscribeFacilities = undefined;

      if (!user) {
        try {
          await signInAnonymously(auth);
          return;
        } catch (error) {
          console.error('Anonymous sign-in failed; trying RTDB listener without auth', error);
        }
      } else if (!user.isAnonymous) {
        try {
          const mapSnap = await get(dbRef(rtdb, `users/uidMap/${user.uid}`));
          const nameKey = mapSnap.val();
          if (nameKey) {
            const profSnap = await get(dbRef(rtdb, `users/profiles/${nameKey}`));
            setCurrentUserRole(profSnap.val()?.role || 'user');
          }
        } catch (e) {
          console.warn('Failed to fetch user role', e);
        }
      }

      try {
        // Listen to facilities
        const facilitiesRef = dbRef(rtdb, 'facilities');
        const unsubFacilities = onValue(facilitiesRef, (snapshot) => {
          const val = snapshot.val();
          const facilityList: FacilityData[] = [];
          const roomList: RoomItem[] = [];
          if (val) {
            Object.entries(val).forEach(([facId, facVal]: [string, any]) => {
              const facilityName = facVal.name || facId;
              facilityList.push({
                id: facId,
                name: facilityName,
                type: facVal.type || 'karaoke',
                rooms: facVal.rooms || {},
                roomCount: facVal.rooms ? Object.keys(facVal.rooms).length : 0,
              });
              if (facVal.rooms) {
                Object.entries(facVal.rooms).forEach(([roomId, roomVal]: [string, any]) => {
                  roomList.push(normalizeRoom(roomId, {
                    ...(roomVal as object),
                    facilityId: facId,
                    facilityName: facilityName,
                  }, facilityName));
                });
              }
            });
          }
          setFacilities(facilityList);
          setRooms(roomList);
        }, (err) => {
          console.error('RTDB facilities onValue error', err);
        });

        // Listen to bookings
        const syncBookings = async (val: any) => {
          const version = ++syncVersion;
          const data: Booking[] = [];
          if (val) {
            Object.entries(val).forEach(([key, v]) => {
              const item = v as any;
              data.push(normalizeBooking(key, item));
            });
          }
          setBookings(data);

          const enrichedData = await Promise.all(
            data.map(async (booking) => {
              if (booking.name !== 'Khách chưa có tên' && booking.phone) return booking;
              const profile = await fetchUserProfileByUid(booking.userId);
              return profile ? normalizeBooking(booking.id, val?.[booking.id], profile) : booking;
            })
          );

          if (version === syncVersion) {
            setBookings(enrichedData);
          }
        };

        const bookingsRef = dbRef(rtdb, 'bookings');
        const unsubBookings = onValue(bookingsRef, (snapshot) => {
          const bookingsValue = snapshot.val();
          console.log('[RTDB] bookings received, keys:', bookingsValue ? Object.keys(bookingsValue).length : 0);
          void syncBookings(bookingsValue);
        }, (err) => {
          console.error('RTDB bookings onValue error', err);
        });

        unsubscribeBookings = () => { unsubBookings(); };
        unsubscribeFacilities = () => { unsubFacilities(); };
      } catch (e) {
        console.error('Failed to start RTDB listener', e);
      }
    });

    return () => {
      unsubscribeBookings?.();
      unsubscribeFacilities?.();
      remove();
    };
  }, []);

  const saveBookingUpdate = async (id: string, updates: Partial<Booking>) => {
    const previous = bookings;
    const nextUpdates = { ...updates, updatedAt: Date.now() };
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...nextUpdates } : b));
    if (!rtdb) {
      alert('Firebase chưa được khởi tạo, không thể đồng bộ đơn.');
      setBookings(previous);
      return;
    }
    try {
      await update(dbRef(rtdb, `bookings/${id}`), nextUpdates);
    } catch (error) {
      console.error('Failed to update booking', error);
      setBookings(previous);
      alert('Không thể đồng bộ đơn lên Firebase. Vui lòng thử lại.');
    }
  };

  return { bookings, facilities, rooms, currentUserRole, loading, saveBookingUpdate };
}