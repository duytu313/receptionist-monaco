export function ServiceList({ services }: { services: Array<{ name: string; qty: number; price: number }> }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      {services.map((s, i) => (
        <div key={i} className="flex justify-between text-sm text-gray-700">
          <span>{s.name} × {s.qty}</span>
          <span className="font-semibold">{s.price}đ</span>
        </div>
      ))}
    </div>
  );
}
