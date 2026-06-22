"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { rtdb, auth } from '@/firebase';
import { ref as dbRef, onValue, update, off } from 'firebase/database';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import {
  ChevronLeft, CheckCircle, Loader2, XCircle,
  Search, DoorOpen, Users, Clock
} from 'lucide-react';

interface Room {
  id: string;
  name: string;
  type?: string;
  category?: string;
  capacity?: number;
  status?: string;
  facilityId?: string;
  facilityName?: string;
}

interface ActiveBooking {
  bookingId: string;
  guestName: string;
  time?: string;
  duration?: string;
  status: string;
}

type OccupiedMap = Record<string, ActiveBooking>;

const FALLBACK_ROOMS: Room[] = [
  { id: 'A101', name: 'A101', category: 'Tầng 1', capacity: 10 },
  { id: 'A102', name: 'A102', category: 'Tầng 1', capacity: 10 },
  { id: 'A103', name: 'A103', category: 'Tầng 1', capacity: 8  },
  { id: 'A201', name: 'A201', category: 'Tầng 2', capacity: 12 },
  { id: 'A202', name: 'A202', category: 'Tầng 2', capacity: 12 },
  { id: 'A203', name: 'A203', category: 'Tầng 2', capacity: 8  },
  { id: 'VIP1', name: 'VIP 1', category: 'VIP', capacity: 20  },
  { id: 'VIP2', name: 'VIP 2', category: 'VIP', capacity: 20  },
  { id: 'VIP3', name: 'VIP 3', category: 'VIP', capacity: 15  },
];

const ACTIVE_STATUSES = new Set(['Đang dùng', 'Đã đến', 'Chờ đến', 'Đã xác nhận']);

export default function RoomSelect() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [occupied, setOccupied] = useState<OccupiedMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [currentBookingRoom, setCurrentBookingRoom] = useState<string | undefined>();
  const [bookingFacilityType, setBookingFacilityType] = useState<string | undefined>();
  const [facilities, setFacilities] = useState<Map<string, {name: string, type: string}>>(new Map());

  useEffect(() => {
    if (!bookingId || !rtdb || !auth) return;
    let unsub: (() => void) | undefined;

    const run = async (user: any) => {
      const ref = dbRef(rtdb, `bookings/${bookingId}`);
      onValue(ref, snap => {
        const data = snap.val();
        setCurrentBookingRoom(data?.room);
        setBookingFacilityType(data?.facilityType || data?.roomType);
      });
      unsub = () => off(ref);
    };

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try { await signInAnonymously(auth); return; } catch {}
      }
      run(user);
    });

    return () => { unsubAuth(); unsub?.(); };
  }, [bookingId]);

  useEffect(() => {
    if (!rtdb || !auth) {
      setRooms(FALLBACK_ROOMS);
      setLoading(false);
      return;
    }

    const roomsRef = dbRef(rtdb, 'rooms');
    const bookingsRef = dbRef(rtdb, 'bookings');
    let unsubAuth: (() => void) | undefined;

    const attach = () => {
      // Load rooms from facilities to get facility info
      onValue(dbRef(rtdb, 'facilities'), snap => {
        const val = snap.val();
        const facMap = new Map<string, {name: string, type: string}>();
        const roomList: Room[] = [];
        
        if (val) {
          Object.entries(val).forEach(([facId, facData]: [string, any]) => {
            const facName = facData.name || facId;
            const facType = facData.type || 'karaoke';
            facMap.set(facId, { name: facName, type: facType });
            
            // Extract rooms from facility
            if (facData.rooms && typeof facData.rooms === 'object') {
              Object.entries(facData.rooms).forEach(([roomId, roomData]: [string, any]) => {
                roomList.push({
                  id: roomId,
                  name: roomData.name || roomData.roomName || roomId,
                  type: facType,
                  category: roomData.category || facName,
                  capacity: Number(roomData.capacity || 0),
                  status: roomData.status,
                  facilityId: facId,
                  facilityName: facName,
                });
              });
            }
          });
        }
        
        setFacilities(facMap);
        setRooms(roomList.length > 0 ? roomList : FALLBACK_ROOMS);
        setLoading(false);
      });

      onValue(bookingsRef, snap => {
        const val = snap.val();
        const map: OccupiedMap = {};
        if (val) {
          Object.entries(val).forEach(([bid, b]: any) => {
            if (bid === bookingId) return;
            const roomKey = b.room as string | undefined;
            if (!roomKey) return;
            if (ACTIVE_STATUSES.has(b.status)) {
              map[roomKey] = {
                bookingId: bid,
                guestName: b.name || b.customerName || 'Khách',
                time: b.time,
                duration: b.duration,
                status: b.status,
              };
            }
          });
        }
        setOccupied(map);
      });
    };

    unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try { await signInAnonymously(auth); return; } catch {}
      }
      attach();
    });

    return () => {
      unsubAuth?.();
      off(roomsRef);
      off(bookingsRef);
    };
  }, [bookingId]);

  const handleConfirm = async () => {
    if (!selected || !bookingId || !rtdb) return;
    setSaving(true);
    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      await update(dbRef(rtdb, `bookings/${bookingId}`), {
        room: selected,
        status: 'Đang dùng',
        startTime: currentTime,
        updatedAt: Date.now(),
      });
      setDone(true);
      setTimeout(() => router.push(`/bookings/${bookingId}`), 1600);
    } catch {
      setError('Không thể gán phòng. Vui lòng thử lại.');
      setSaving(false);
    }
  };

  const roomList = rooms.length > 0 ? rooms : FALLBACK_ROOMS;
  
  // Always filter by booking type if it exists
  const typeFiltered = bookingFacilityType 
    ? roomList.filter(r => {
        // Primary: check room's type field (set from facility type)
        if (r.type === bookingFacilityType) return true;
        // Secondary: check category
        if (r.category === bookingFacilityType) return true;
        // Tertiary: check by facility ID if facilities are loaded
        if (facilities.size > 0 && r.facilityId) {
          const fac = facilities.get(r.facilityId);
          if (fac && fac.type === bookingFacilityType) return true;
        }
        // Quaternary: check by facility name
        if (facilities.size > 0 && r.facilityName) {
          const facEntry = Array.from(facilities.entries()).find(([_, f]) => f.name === r.facilityName);
          if (facEntry && facEntry[1].type === bookingFacilityType) return true;
        }
        return false;
      })
    : roomList;
  
  const filtered = typeFiltered.filter(r =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
      (r.category || '').toLowerCase().includes(query.toLowerCase())
  );

  // Group rooms by facility
  const sections = filtered.reduce<Record<string, Room[]>>((acc, r) => {
    const sec = r.facilityName || r.facilityId || 'Khác';
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(r);
    return acc;
  }, {});

  // Use sections directly (already filtered by type above)
  const filteredSections = sections;

  // If still no sections after filtering, show a message
  const hasMatchingRooms = Object.keys(filteredSections).length > 0;

  const getRoomState = (room: Room): 'available' | 'occupied' | 'maintenance' | 'selected' | 'current' => {
    if (selected === room.name || selected === room.id) return 'selected';
    if (currentBookingRoom === room.name || currentBookingRoom === room.id) return 'current';
    if (room.status === 'maintenance' || room.status === 'unavailable') return 'maintenance';
    if (occupied[room.name] || occupied[room.id]) return 'occupied';
    return 'available';
  };

  const cardStyle: Record<string, string> = {
    selected: 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-300',
    current: 'border-blue-300 bg-blue-50',
    occupied: 'border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed',
    maintenance: 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed',
    available: 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer',
  };

  const dotStyle: Record<string, string> = {
    selected: 'bg-indigo-500',
    current: 'bg-blue-400',
    occupied: 'bg-red-400',
    maintenance: 'bg-gray-400',
    available: 'bg-green-400',
  };

  const stateLabel: Record<string, string> = {
    selected: 'Đã chọn',
    current: 'Phòng hiện tại',
    occupied: 'Đang có khách',
    maintenance: 'Bảo trì',
    available: 'Trống',
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-gray-500 text-sm">Đang tải danh sách phòng...</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-9 h-9 text-green-500" />
        </div>
        <p className="font-bold text-gray-800 text-lg">Đã gán phòng <span className="text-indigo-600">{selected}</span></p>
        <p className="text-gray-400 text-sm">Đang quay lại...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center space-y-4">
        <XCircle className="w-12 h-12 text-red-400 mx-auto" />
        <p className="text-gray-700 font-semibold">{error}</p>
        <button onClick={() => router.push(`/bookings/${bookingId}`)} className="px-5 py-2 bg-gray-100 rounded-xl text-gray-700 font-medium hover:bg-gray-200 transition">
          Quay lại
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen flex justify-center overflow-hidden font-sans">
      <div className="app-container">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 px-4 pt-12 pb-3">
            <button onClick={() => router.push(`/bookings/${bookingId}`)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-base text-gray-800">Chọn phòng</h1>
              <p className="text-xs text-gray-400">
                {bookingFacilityType 
                  ? `${filtered.filter(r => !occupied[r.name] && !occupied[r.id] && r.status !== 'maintenance').length} phòng ${bookingFacilityType} trống`
                  : `${filtered.filter(r => !occupied[r.name] && !occupied[r.id] && r.status !== 'maintenance').length} phòng trống`
                }
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Tìm phòng..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="bg-transparent flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 px-4 pb-3 overflow-x-auto no-scrollbar">
          {[
            { dot: 'bg-green-400', label: 'Trống' },
            { dot: 'bg-red-400', label: 'Đang dùng' },
            { dot: 'bg-indigo-500', label: 'Đã chọn' },
            { dot: 'bg-gray-400', label: 'Bảo trì' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5 whitespace-nowrap">
              <div className={`w-2 h-2 rounded-full ${l.dot}`} />
              <span className="text-xs text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {!hasMatchingRooms ? (
                <div className="text-center py-16 text-gray-400">
                  <DoorOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Không có phòng {bookingFacilityType} nào khả dụng</p>
                </div>
              ) : (
                Object.entries(filteredSections).map(([facilityName, facilityRooms]) => (
                  <div key={facilityName}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                      <h2 className="text-sm font-bold text-gray-800">{facilityName}</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {facilityRooms.map(room => {
                    const state = getRoomState(room);
                    const isBlocked = state === 'occupied' || state === 'maintenance';
                    const occ = occupied[room.name] || occupied[room.id];

                    return (
                      <button
                        key={room.id}
                        disabled={isBlocked}
                        onClick={() => !isBlocked && setSelected(room.name || room.id)}
                        className={`relative rounded-2xl border p-3 text-left transition-all ${cardStyle[state]}`}
                      >
                        <div className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${dotStyle[state]}`} />
                        <p className="font-bold text-gray-800 text-sm leading-tight pr-3">{room.name}</p>
                        <p className={`text-[10px] font-semibold mt-0.5 ${
                          state === 'selected' ? 'text-indigo-600' :
                          state === 'occupied' ? 'text-red-500' :
                          state === 'maintenance' ? 'text-gray-400' :
                          state === 'current' ? 'text-blue-500' :
                          'text-green-600'
                        }`}>
                          {stateLabel[state]}
                        </p>
                        {room.capacity && room.capacity > 0 && (
                          <div className="flex items-center gap-0.5 mt-1.5">
                            <Users className="w-3 h-3 text-gray-300" />
                            <span className="text-[10px] text-gray-400">{room.capacity}</span>
                          </div>
                        )}
                        {occ && (
                          <div className="mt-1.5 space-y-0.5">
                            <p className="text-[9px] text-gray-500 leading-tight truncate">{occ.guestName}</p>
                            {occ.time && (
                              <div className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5 text-gray-300" />
                                <span className="text-[9px] text-gray-400">{occ.time}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {state === 'selected' && (
                          <CheckCircle className="absolute bottom-2 right-2 w-4 h-4 text-indigo-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {selected && (
          <div className="border-t border-gray-100 bg-white p-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] shrink-0 relative z-20">
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <p className="text-xs text-gray-400">Phòng đã chọn</p>
                <p className="font-bold text-gray-800 text-base">{selected}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition text-gray-500"
              >
                ✕
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Xác nhận phòng</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}