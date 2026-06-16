// app/api/bookings/route.ts
import { NextResponse } from "next/server";

let bookings = [
    { id: 1, name: "Nguyễn Văn Minh", room: "A101", status: "Chờ xác nhận", time: "10:00" },
    { id: 2, name: "Trần Quốc Bảo", room: "A102", status: "Đang dùng", time: "10:00" },
];

export async function GET() {
    return NextResponse.json(bookings);
}

export async function PUT(req: Request) {
    const data = await req.json();
    bookings = bookings.map(b => b.id === data.id ? { ...b, ...data } : b);
    return NextResponse.json({ success: true });
}
