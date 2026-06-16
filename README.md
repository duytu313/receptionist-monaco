# Monaco Karaoke - Quản lý Đặt phòng

Ứng dụng quản lý đặt phòng karaoke được xây dựng với **Next.js 16**, **React 19**, **TypeScript** và **Firebase** (Realtime Database + Authentication).

## Tính năng chính

- 🏠 **Quản lý phòng**: Hiển thị danh sách phòng, trạng thái phòng theo thời gian thực
- 📅 **Đặt phòng**: Tạo, sửa, hủy đặt phòng; chọn phòng theo khung giờ
- 💰 **Checkout & Thanh toán**: Tính tiền theo giờ, dịch vụ phát sinh
- 📊 **Thống kê**: Dashboard doanh thu, lượt đặt phòng
- 🔔 **Thông báo**: Nhắc nhở sắp hết giờ, khách đến
- 🔐 **Xác thực Admin**: Đăng nhập bảo vệ trang quản trị

## Yêu cầu hệ thống

- Node.js >= 18
- npm / yarn / pnpm

## Cài đặt & Chạy

```bash
# 1. Clone repository
git clone <your-repo-url>
cd prj-kara

# 2. Cài dependencies
npm install

# 3. Tạo file .env.local
# Sao chép nội dung từ .env.example và điền thông tin Firebase của bạn
cp .env.example .env.local

# 4. Khởi động dev server
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

## Cấu trúc thư mục

```
prj-kara/
├── app/                    # Next.js App Router pages
│   ├── admin/login/        # Trang đăng nhập admin
│   ├── bookings/           # Chi tiết đặt phòng
│   ├── dat-phong/          # Trang đặt phòng mới
│   ├── more/               # Các trang phụ (khách hàng, thống kê, ...)
│   ├── rooms/              # Danh sách phòng
│   ├── layout.tsx          # Layout chính
│   └── page.tsx            # Trang chủ
├── components/             # React components
│   ├── Modals/             # Modal overlay components
│   ├── BookingCard.tsx
│   ├── BookingDetailView.tsx
│   ├── BookingModal.tsx
│   ├── RoomGrid.tsx
│   ├── RoomSelectionOverlay.tsx
│   ├── ServiceList.tsx
│   ├── constants.tsx
│   └── AuthStatus.tsx
├── hooks/                  # Custom React hooks
│   └── useBookingData.ts
├── types/                  # TypeScript type definitions
│   └── booking.ts
├── utils/                  # Utility functions
│   └── formatters.ts
├── firebase.ts             # Firebase initialization
├── database.rules.json     # Firebase Realtime Database rules
├── .env.example            # Mẫu biến môi trường
├── .gitignore
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── postcss.config.js
```

## Môi trường

| Biến | Mô tả |
|------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Realtime Database URL |

## Lưu ý bảo mật

- **Không commit** file `.env.local` — file này đã được thêm vào `.gitignore`
- Sử dụng file `.env.example` để chia sẻ cấu trúc biến môi trường (không chứa giá trị thật)
- Firebase config key (các biến `NEXT_PUBLIC_*`) là **public key** an toàn để đưa vào client, nhưng cần kết hợp với **Firebase Security Rules** (`database.rules.json`) để bảo vệ dữ liệu
- Luôn cập nhật `database.rules.json` để giới hạn quyền truy cập dữ liệu

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy dev server |
| `npm run build` | Build production |
| `npm start` | Chạy production server |
| `npm run lint` | Kiểm tra lint |

## Công nghệ sử dụng

- [Next.js 16](https://nextjs.org/)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Firebase](https://firebase.google.com/) (Realtime Database, Auth, Analytics)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) (icons)