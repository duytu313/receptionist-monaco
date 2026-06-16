// RoomGrid component - displays rooms grouped by facility
// Now compatible with the new facilities structure
const colors: Record<string, string> = {
  "Trống": "bg-white border-gray-300",
  "Đang dùng": "bg-yellow-100 border-yellow-400",
  "Chờ đến": "bg-blue-100 border-blue-400",
  "Chờ thanh toán": "bg-red-100 border-red-400",
};

interface RoomGridRoom {
  id: string;
  name: string;
  status?: string;
  capacity?: number;
  facilityName?: string;
  facilityType?: string;
}

export function RoomGrid({ rooms, facilities, onSelect }: { 
  rooms: RoomGridRoom[]; 
  facilities?: { id: string; name: string; type: string }[];
  onSelect: (room: RoomGridRoom) => void;
}) {
  // Group rooms by facility
  const grouped = rooms.reduce<Record<string, RoomGridRoom[]>>((acc, room) => {
    const groupName = room.facilityName || 'Phòng';
    acc[groupName] = acc[groupName] || [];
    acc[groupName].push(room);
    return acc;
  }, {});

  return (
    <div className="space-y-6 mt-4">
      {Object.keys(grouped).length === 0 && rooms.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {rooms.map(r => (
            <div
              key={r.id}
              onClick={() => onSelect(r)}
              className={`border p-4 rounded-lg cursor-pointer hover:shadow-md transition ${colors[r.status || 'Trống']}`}
            >
              <p className="font-semibold text-gray-800">{r.name || r.id}</p>
              <p className="text-sm text-gray-600">{r.status || 'Trống'}</p>
            </div>
          ))}
        </div>
      ) : (
        Object.entries(grouped).map(([facilityName, facilityRooms]) => {
          const fac = facilities?.find(f => f.name === facilityName);
          return (
            <div key={facilityName}>
              <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                {fac && (
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    fac.type === 'karaoke' ? 'bg-purple-100 text-purple-700' :
                    fac.type === 'massage' ? 'bg-pink-100 text-pink-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {fac.type === 'karaoke' ? '🎤' : fac.type === 'massage' ? '💆' : '🍽️'} {facilityName}
                  </span>
                )}
                {!fac && facilityName}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {facilityRooms.map(r => (
                  <div
                    key={r.id}
                    onClick={() => onSelect(r)}
                    className={`border p-4 rounded-lg cursor-pointer hover:shadow-md transition ${colors[r.status || 'Trống']}`}
                  >
                    <p className="font-semibold text-gray-800">{r.name || r.id}</p>
                    <p className="text-sm text-gray-600">{r.status || 'Trống'}</p>
                    {r.capacity && <p className="text-xs text-gray-400">{r.capacity} người</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
