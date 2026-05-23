# Hướng Dẫn Cài Đặt và Chạy Dự Án

Dự án này là hệ thống Quản lý Điểm Sinh Viên chạy mô hình Phân Tán / Đồng bộ hóa dữ liệu giữa 2 Server Database độc lập (Server 1 và Server 2).

---

## 1. Yêu cầu hệ thống
*   **NodeJS** (Phiên bản LTS)
*   **VS Code** + Extension **Live Server** (dành cho Frontend)
*   **SQL Server** (Đã tạo 2 Database: Ví dụ `QLDSV_HTC` trên Server 1 và `QLDSV` trên Server 2)

---

## 2. Cấu hình Backend

### Bước 1: Di chuyển vào thư mục backend và cài đặt thư viện
```bash
cd backend
npm install
```

### Bước 2: Cấu hình môi trường `.env`
Tạo hoặc cập nhật file `.env` tại thư mục gốc của `backend`:

```env
# SERVER CONFIG
PORT=5000
NODE_ENV=development

# DATABASE SERVER 1 (Primary - Thường chạy ở port 1433)
DB_SERVER_1=localhost
DB_PORT_1=1433
DB_DATABASE_1=QLDSV_HTC
DB_USER_1=sa
DB_PASSWORD_1=123
DB_ENCRYPT_1=false
DB_TRUST_SERVER_CERTIFICATE_1=true
DB_NAME_1=Khoa CNTT (Server 1)

# DATABASE SERVER 2 (Replica - Thường chạy ở port 1434 hoặc máy khác)
DB_SERVER_2=localhost
DB_PORT_2=1434
DB_DATABASE_2=QLDSV
DB_USER_2=sa
DB_PASSWORD_2=123
DB_ENCRYPT_2=false
DB_TRUST_SERVER_CERTIFICATE_2=true
DB_NAME_2=Khoa Viễn thông (Server 2)

# JWT CONFIG
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_REFRESH_EXPIRES_IN=7d

# CORS CONFIG (Đường dẫn chạy Live Server của Frontend)
CORS_ORIGIN=http://127.0.0.1:5500
```

### Bước 3: Khởi chạy Backend API
```bash
npm run dev
```

---

## 3. Khởi chạy Frontend
1. Mở thư mục dự án trong VS Code.
2. Click chuột phải vào file `frontend/index.html` hoặc `frontend/login.html`.
3. Chọn **Open with Live Server**.
4. Trình duyệt sẽ mở ứng dụng tại cổng `http://127.0.0.1:5500` (hoặc cổng Live Server tương ứng, hãy cập nhật `CORS_ORIGIN` ở backend nếu cổng khác 5500).

---

## 4. Cơ chế Đồng bộ hóa & Đăng nhập

### Đăng nhập & Chọn Server
*   Ở giao diện đăng nhập, người dùng có thể chọn **Server 1** hoặc **Server 2** để kết nối.
*   Hệ thống sẽ kiểm tra trạng thái kết nối (🟢 hoạt động / 🔴 lỗi) để cảnh báo trực quan.
*   **Mật khẩu test mặc định**:
    *   Giảng viên/Admin: `123`
    *   Sinh viên: `123456`

### Cơ chế đồng bộ (Dual-Write)
*   **Thao tác đọc (Read)**: Hệ thống chỉ truy vấn dữ liệu từ đúng Server mà người dùng đã chọn lúc đăng nhập.
*   **Thao tác ghi (Write - Thêm/Sửa/Xóa)**: Mọi thay đổi dữ liệu sẽ được thực thi đồng thời trên cả Server 1 và Server 2, đảm bảo dữ liệu ở 2 server luôn đồng bộ hai chiều thời gian thực (realtime).