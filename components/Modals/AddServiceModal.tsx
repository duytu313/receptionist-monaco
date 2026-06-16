import React from 'react';

interface NewService {
  name: string;
  qty: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bookingStatus: string;
  newServices: NewService[];
  setNewServices: React.Dispatch<React.SetStateAction<NewService[]>>;
}

export function AddServiceModal({ isOpen, onClose, onConfirm, bookingStatus, newServices, setNewServices }: Props) {
  if (!isOpen) return null;

  const handleAdd = () => {
    const nameInput = document.getElementById('tempServiceName') as HTMLInputElement;
    const qtyInput = document.getElementById('tempServiceQty') as HTMLInputElement;
    const name = nameInput?.value.trim();
    const qty = Math.max(1, parseInt(qtyInput?.value) || 1);
    if (name) {
      setNewServices([...newServices, { name, qty }]);
      nameInput.value = '';
      qtyInput.value = '1';
      nameInput?.focus();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center sm:items-center z-50">
      <div className="w-full sm:w-[480px] bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-0 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Thêm dịch vụ</h3>
        {bookingStatus !== 'Đã đến' && (
          <div className="mb-3 text-sm text-yellow-800 bg-yellow-100 px-3 py-2 rounded">
            ⚠️ Khách chưa được xác nhận đến
          </div>
        )}
        <div className="mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-sm text-gray-600 block mb-1">Tên dịch vụ</label>
            <input
              type="text"
              id="tempServiceName"
              placeholder="Ví dụ: Bia Heineken"
              className="w-full border rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <div className="w-20">
            <label className="text-sm text-gray-600 block mb-1">S.lượng</label>
            <input
              type="number"
              id="tempServiceQty"
              min={1}
              defaultValue={1}
              className="w-full border rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-2"
          >
            <span className="text-lg">+</span>
          </button>
        </div>
        {newServices.length > 0 && (
          <div className="mb-4 bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-2 font-semibold">Dịch vụ được thêm:</p>
            <div className="space-y-2">
              {newServices.map((service, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                  <span className="text-sm text-gray-700">{service.qty} x {service.name}</span>
                  <button
                    onClick={() => setNewServices(newServices.filter((_, i) => i !== idx))}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => { onClose(); setNewServices([]); }}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={newServices.length === 0}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Thêm ({newServices.length})
          </button>
        </div>
      </div>
    </div>
  );
}