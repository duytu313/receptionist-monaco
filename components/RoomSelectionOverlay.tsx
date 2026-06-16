import React from 'react';
import { ChevronLeft, Key, DoorOpen, Mic, Heart, Soup } from 'lucide-react';
import { Booking, RoomItem, FacilityData } from '@/types/booking';

interface RoomSelectionOverlayProps {
  selectedBooking: Booking | null;
  facilities: FacilityData[];
  rooms: RoomItem[];
  selectedFacility: string;
  setSelectedFacility: (facilityId: string) => void;
  onClose: () => void;
  onRoomSelect: (roomName: string) => Promise<void>;
}

const facilityTypeIcons: Record<string, React.ReactNode> = {
  karaoke: <Mic size={14} />,
  massage: <Heart size={14} />,
  restaurant: <Soup size={14} />,
};

export function RoomSelectionOverlay({
  selectedBooking,
  facilities,
  rooms,
  selectedFacility,
  setSelectedFacility,
  onClose,
  onRoomSelect,
}: RoomSelectionOverlayProps) {

  const activeRoomBookings = rooms.map(room => {
    const booking = selectedBooking; // Assuming we are selecting a room for the selected booking
    if (booking && (booking.room === room.name || booking.room === room.id)) {
      return { ...room, bookingStatus: booking.status, bookingTime: booking.time, bookingName: booking.name };
    }
    return { ...room, bookingStatus: 'Trống', bookingTime: '', bookingName: '' };
  });

  const getRoomBooking = (room: RoomItem) => {
    return activeRoomBookings.find(b => b.id === room.id && b.bookingStatus !== 'Trống');
  };

  const getRoomStatusText = (room: RoomItem, roomBooking?: any) => {
    if (roomBooking?.bookingStatus) return roomBooking.bookingStatus;
    if (room.status === 'maintenance') return 'Bảo trì';
    if (room.status === 'unavailable') return 'Tạm ngưng';
    return 'Trống';
  };

  const getRoomCardClass = (room: RoomItem, roomBooking?: any) => {
    if (roomBooking?.bookingStatus === 'Đang dùng') return 'bg-blue-100/70 border-blue-200';
    if (roomBooking?.bookingStatus === 'Đã đến' || roomBooking?.bookingStatus === 'Chờ đến') return 'bg-orange-100/80 border-orange-200';
    if (room.status === 'maintenance' || room.status === 'unavailable') return 'bg-gray-100 border-gray-200 opacity-70';
    return 'bg-white border-gray-100 hover:border-green-300 cursor-pointer';
  };

  // Build room sections from facilities
  const roomSections = facilities.reduce<Record<string, RoomItem[]>>((acc, facility) => {
    const sectionName = facility.name;
    acc[sectionName] = acc[sectionName] || [];
    if (facility.rooms && typeof facility.rooms === 'object') {
      Object.entries(facility.rooms).forEach(([roomId, roomVal]) => {
        acc[sectionName].push({
          id: roomId,
          name: roomVal.name || roomId,
          type: roomVal.type,
          category: roomVal.category,
          capacity: roomVal.capacity,
          price: roomVal.price,
          priceNote: roomVal.priceNote,
          status: roomVal.status,
          facilityId: facility.id,
          facilityName: facility.name,
        });
      });
    }
    return acc;
  }, {});

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-center px-4 py-4 bg-white relative shadow-sm z-10 shrink-0">
        <ChevronLeft className="w-6 h-6 text-gray-700 absolute left-4 cursor-pointer" onClick={onClose} />
        <h1 className="font-bold text-lg">Tất cả các phòng</h1>
      </div>

      {/* Facility tabs inside room selection */}
      {facilities.length > 1 && (
        <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedFacility('all')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
              selectedFacility === 'all' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            <DoorOpen size={14} /> Tất cả
          </button>
          {facilities.map((fac) => (
            <button
              key={fac.id}
              onClick={() => setSelectedFacility(fac.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                selectedFacility === fac.id
                  ? fac.type === 'karaoke' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                    fac.type === 'massage' ? 'bg-pink-100 text-pink-700 border-pink-200' :
                    'bg-orange-100 text-orange-700 border-orange-200'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {facilityTypeIcons[fac.type]}
              {fac.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 pb-6">
        {Object.keys(roomSections).length === 0 ? (
          <div className="rounded-xl bg-white border border-gray-100 p-5 text-center text-sm text-gray-500">
            Chưa có dữ liệu phòng từ cơ sở
          </div>
        ) : (
          Object.entries(roomSections)
            .filter(([sectionName]) => {
              if (selectedBooking) {
                const targetFac = facilities.find(f =>
                  f.id === selectedBooking.facilityId ||
                  f.name === selectedBooking.facilityName ||
                  f.type === selectedBooking.roomType
                );
                if (targetFac) return sectionName === targetFac.name;
              }
              if (selectedFacility === 'all') return true;
              const fac = facilities.find(f => f.id === selectedFacility);
              return sectionName === (fac?.name || selectedFacility);
            })
            .map(([section, sectionRooms]) => {
              const fac = facilities.find(f => f.name === section);
              return (
                <div key={section} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    {fac && (
                      <span className={`p-1.5 rounded-md border ${
                        fac.type === 'karaoke' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' :
                        fac.type === 'massage' ? 'bg-pink-500/10 text-pink-600 border-pink-500/20' :
                        'bg-orange-500/10 text-orange-600 border-orange-500/20'
                      }`}>
                        {facilityTypeIcons[fac.type]}
                      </span>
                    )}
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{section}</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {sectionRooms.map((room) => {
                      const roomBooking = getRoomBooking(room);
                      const canSelect = !roomBooking && room.status !== 'maintenance' && room.status !== 'unavailable';
                      return (
                        <button
                          key={room.id}
                          type="button"
                          disabled={!canSelect}
                          onClick={() => canSelect && onRoomSelect(room.name)}
                          className={`${getRoomCardClass(room, roomBooking)} rounded-xl p-3 flex flex-col aspect-[4/4.5] border text-left active:scale-95 transition-transform shadow-sm disabled:cursor-not-allowed`}
                        >
                          <div className="font-bold text-gray-800 mb-1 text-[15px] truncate">{room.name}</div>
                          <div>
                            <div className="text-[10px] font-medium text-gray-700 leading-tight">
                              {getRoomStatusText(room, roomBooking)}
                            </div>
                            {roomBooking?.bookingTime && (
                              <div className="text-xs font-bold text-gray-900 mt-0.5">{roomBooking.bookingTime}</div>
                            )}
                          </div>
                          <div className="mt-auto text-[10px] text-gray-500 truncate pt-2 border-t border-black/5">
                            {roomBooking ? roomBooking.bookingName : room.capacity ? `${room.capacity} khách` : 'Sẵn sàng'}
                          </div>
                          {room.price && !roomBooking && (
                            <div className="text-[9px] text-gray-400 mt-0.5">
                              {room.price.toLocaleString('vi-VN')}đ {room.priceNote || ''}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Footer Legend */}
      <div className="bg-white p-4 pb-8 flex justify-center gap-4 text-[10px] font-bold text-gray-600 uppercase shrink-0">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>Trống</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>Đang dùng</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>Chờ đến</div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>Chờ TT</div>
      </div>
    </div>
  );
}