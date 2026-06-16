import { Booking, BookingStatus } from '@/types/booking'; // Import types

interface BookingCardProps { // Use the imported Booking type
  booking: Booking;
  onClick: () => void;
  statusColors: Record<string, string>;
}
export function BookingCard({ booking, onClick, statusColors }: BookingCardProps) {
  return (
    <div className="flex cursor-pointer" onClick={onClick}>
      <div className="w-16 font-bold text-gray-800 text-sm mt-1">{booking.time}</div>
      <div className="flex-1 bg-white border border-gray-100 rounded-xl p-3 shadow-sm relative hover:shadow-md transition-shadow">
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
          booking.status === 'Đã xác nhận' ? 'bg-indigo-400' :
          booking.status === 'Đã đến' ? 'bg-green-400' :
          booking.status === 'Đang dùng' ? 'bg-orange-400' :
          booking.status === 'Chờ đến' ? 'bg-blue-400' : 'bg-red-400'
        }`}></div>
        <div className="flex justify-between items-start mb-1">
          <div className="font-bold text-gray-800">{booking.name}</div>
          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[booking.status] || ''}`}>
            {booking.status}
          </div>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1 mb-2 flex-wrap">
          <span>{booking.room || <span className="italic">Chưa xếp phòng</span>}</span>
          <span className="text-gray-300">•</span> {/* Add facilityName if available */}
          <span>{booking.roomType}</span>
          <span className="text-gray-300">•</span>
          <span>{booking.guests} người</span>
        </div>
      </div>
    </div>
  );
}
