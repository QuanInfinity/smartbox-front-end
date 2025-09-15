---
type: "manual"
---

src/
├── assets/                 # Hình ảnh, icon, font
├── components/             # Các component dùng chung toàn hệ thống
├── layouts/
│   └── MainLayout.tsx      # Layout tổng
├── pages/
│   ├── Dashboard/
│   │   ├── index.tsx       # hoặc Dashboard.tsx
│   │   └── components/
│   │       └── StatsCard.tsx
│   ├── Locker/
│   │   ├── index.tsx       # hoặc Locker.tsx
│   │   └── components/
│   ├── Login/
│   │   ├── index.tsx
│   │   └── components/
│   └── Users/
│       ├── index.tsx
│       └── components/
├── routes/                 # Định nghĩa các route
│   └── index.tsx
├── services/               # Gọi API, axios, hooks
│   └── lockerService.ts
├── types/                  # Kiểu dữ liệu dùng chung (interface, type)
├── utils/                  # Các hàm tiện ích (formatDate, validate...)
├── App.tsx
├── main.tsx
└── index.css