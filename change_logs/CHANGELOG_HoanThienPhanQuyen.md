# NHẬT KÝ THAY ĐỔI (CHANGELOG)
## HOÀN THIỆN HỆ THỐNG PHÂN QUYỀN (RBAC) & CÁC LỖI LIÊN QUAN

Tài liệu này ghi nhận toàn bộ các thay đổi đã được thực hiện đối với dự án **Web Quản Lý Sinh Viên theo Hệ Tín Chỉ** nhằm hoàn thiện hệ thống phân quyền (Role-Based Access Control - RBAC) và khắc phục các lỗi nghiêm trọng về logic, kết nối API ở cả phía Backend và Frontend.

---

### TỔNG QUAN CÁC THÀNH PHẦN THAY ĐỔI

Hệ thống phân quyền được củng cố dựa trên 3 vai trò (Roles) chính:
1. **PGV (Phòng Giáo Vụ):** Quyền cao nhất, quản lý danh mục toàn bộ hệ thống (Khoa, Lớp, Giảng viên, Sinh viên, Lớp tín chỉ, Nhập điểm, Báo cáo).
2. **KHOA (Trợ lý Khoa):** Chỉ quản lý các chức năng liên quan trực tiếp đến khoa của mình (Nhập điểm, Xem báo cáo/thống kê) và xem Dashboard tổng quan. Không được phép xem hoặc chỉnh sửa danh mục chung của các khoa khác.
3. **SINHVIEN (Sinh viên):** Chỉ xem được Dashboard cá nhân, thực hiện đăng ký tín chỉ và xem phiếu điểm cá nhân của chính mình.

Dưới đây là chi tiết các file đã chỉnh sửa so với phiên bản trước đó:

---

### CHI TIẾT THAY ĐỔI THEO TỪNG FILE

#### 1. [backend/src/middleware/role.middleware.js](file:///c:/Users/TOAN%20PHUC/Desktop/HQTCSDL/WebQuanLySinhVien/backend/src/middleware/role.middleware.js)
* **Trước khi thay đổi:**
  * Chỉ có middleware `authorize` chung dựa trên danh sách quyền tĩnh (`PERMISSIONS`).
  * Thiếu cơ chế kiểm tra tự truy cập dữ liệu cá nhân (Self-Access Control). Điều này dẫn đến lỗ hổng bảo mật: Sinh viên có quyền `VIEW_REGISTER` hoặc `VIEW_GRADE` có thể gọi API để xem đăng ký hoặc phiếu điểm của sinh viên khác bằng cách thay đổi mã sinh viên (`maSV`) trên URL.
* **Thay đổi đã thực hiện:**
  * Bổ sung thêm middleware `checkSelfAccess` để kiểm soát truy cập dữ liệu cá nhân.
  * Xuất bổ sung middleware này cùng các hằng số phân quyền: `module.exports = { authorize, PERMISSIONS, checkSelfAccess };`.
* **Lý do thay đổi:**
  * Đối với vai trò `PGV` hoặc `KHOA`, hệ thống tự động bỏ qua kiểm tra tự truy cập (được quyền xem tất cả).
  * Đối với vai trò `SINHVIEN`, hệ thống sẽ so khớp mã sinh viên được yêu cầu trong URL (`req.params.maSV` hoặc tương đương) với `req.user.username` (mã sinh viên của user đang đăng nhập). Nếu không trùng khớp (không phân biệt hoa thường), yêu cầu sẽ bị chặn lại với lỗi `403 Forbidden`.

#### 2. [backend/src/routes/dangky.routes.js](file:///c:/Users/TOAN%20PHUC/Desktop/HQTCSDL/WebQuanLySinhVien/backend/src/routes/dangky.routes.js)
* **Trước khi thay đổi:**
  * API lấy danh sách đăng ký của một sinh viên (`GET /sinhvien/:maSV`) chỉ sử dụng middleware kiểm tra quyền cơ bản `authorize(PERMISSIONS.DK_TIN_CHI.VIEW)`.
* **Thay đổi đã thực hiện:**
  * Import middleware `checkSelfAccess`.
  * Áp dụng `checkSelfAccess` ngay sau middleware kiểm tra quyền tại route `GET /sinhvien/:maSV`.
* **Lý do thay đổi:**
  * Ngăn chặn triệt để việc một sinh viên này dùng tài khoản của mình để gọi API lấy danh sách lớp tín chỉ đã đăng ký của sinh viên khác.

#### 3. [backend/src/routes/diem.routes.js](file:///c:/Users/TOAN%20PHUC/Desktop/HQTCSDL/WebQuanLySinhVien/backend/src/routes/diem.routes.js)
* **Trước khi thay đổi:**
  * Các API truy xuất thông tin điểm số theo cá nhân (`GET /sinhvien/:maSV` và `GET /report/phieu-diem/:maSV`) chỉ có kiểm tra quyền xem điểm tổng quát.
* **Thay đổi đã thực hiện:**
  * Import middleware `checkSelfAccess`.
  * Áp dụng `checkSelfAccess` vào cả 2 routes: `GET /sinhvien/:maSV` (lấy điểm sinh viên) và `GET /report/phieu-diem/:maSV` (kết xuất phiếu điểm báo cáo).
* **Lý do thay đổi:**
  * Đảm bảo tính riêng tư dữ liệu điểm số học tập. Sinh viên chỉ có quyền xem điểm và tải báo cáo phiếu điểm của chính mình, trong khi PGV và Giáo vụ Khoa vẫn có toàn quyền kiểm tra điểm của tất cả sinh viên.

#### 4. [frontend/js/sidebar.js](file:///c:/Users/TOAN%20PHUC/Desktop/HQTCSDL/WebQuanLySinhVien/frontend/js/sidebar.js)
* **Trước khi thay đổi:**
  * Danh sách menu hiển thị trên thanh điều hướng bên trái (`MENU_ITEMS`) chưa phân tách đúng phân quyền thực tế. 
  * Tài khoản vai trò `KHOA` vẫn nhìn thấy và click được vào các menu hệ thống như Khoa, Lớp, Giảng viên, Sinh viên, Lớp tín chỉ (dù Backend sẽ từ chối truy cập).
* **Thay đổi đã thực hiện:**
  * Cấu hình lại thuộc tính `roles` cho từng mục menu trong `MENU_ITEMS`:
    * Menu `Tổng quan (dashboard)`: Cho phép cả `PGV`, `KHOA`, `SINHVIEN`.
    * Menu `Khoa`, `Lớp`, `Giảng viên`, `Sinh viên`, `Lớp Tín Chỉ`: Chỉ cho phép `PGV` truy cập.
    * Menu `Nhập Điểm`: Cho phép `PGV`, `KHOA`.
    * Menu `Đăng ký tín chỉ`: Chỉ cho phép `SINHVIEN` (Sinh viên).
    * Menu `Xem Điểm Cá Nhân` (đổi tên từ Phiếu điểm): Chỉ hiển thị đối với `SINHVIEN`.
    * Menu `Báo cáo`: Cho phép `PGV`, `KHOA`.
* **Lý do thay đổi:**
  * Cải thiện trải nghiệm người dùng (UX) tối đa, ẩn các chức năng không thuộc phạm vi quyền hạn để tránh gây nhầm lẫn và nâng cao tính chuyên nghiệp của giao diện tương ứng với từng nhóm đối tượng người dùng.

#### 5. [frontend/js/modules/nhapdiem.js](file:///c:/Users/TOAN%20PHUC/Desktop/HQTCSDL/WebQuanLySinhVien/frontend/js/modules/nhapdiem.js)
* **Trước khi thay đổi:**
  * Gặp lỗi cú pháp cực kỳ nghiêm trọng khiến trang web bị crash hoàn toàn: Khai báo module trống (`window. = {}`).
  * Toàn bộ mã nguồn sử dụng dữ liệu tĩnh (mock data) được code cứng bên trong file. Các thao tác lọc dữ liệu lớp tín chỉ, danh sách sinh viên hay lưu điểm đều không tương tác với cơ sở dữ liệu thực thông qua Backend.
  * Chưa tích hợp cơ chế bảo vệ phân quyền ở phía Client để chặn người dùng không hợp lệ truy cập trực tiếp qua URL.
* **Thay đổi đã thực hiện:**
  * Sửa lỗi khai báo module thành tên chính xác: `window.NhapDiemModule = {}`.
  * Thay thế toàn bộ logic mock data bằng các lời gọi API thực tế:
    * Sử dụng `API.get('/loptinchi')` để tải danh mục lớp tín chỉ thực tế của hệ thống.
    * Lọc danh sách lớp tín chỉ dựa trên vai trò người dùng (nếu là `KHOA`, chỉ hiển thị lớp tín chỉ thuộc khoa của tài khoản đó dựa trên thông tin mã khoa từ token hoặc cấu trúc dữ liệu trả về).
    * Sử dụng `API.get('/diem/loptinchi/' + maLTC)` để tải danh sách sinh viên thực tế cùng điểm số đã nhập của lớp tín chỉ được chọn.
    * Sử dụng API cập nhật điểm hàng loạt `API.put('/diem/update-batch', { maLTC, danhSachDiem })` để lưu thông tin điểm của toàn bộ sinh viên trong lớp tín chỉ về Database chỉ với một click.
  * Thêm kiểm tra quyền ở hàm khởi tạo: Nếu người dùng có vai trò là `SINHVIEN`, hệ thống sẽ hiển thị thông báo lỗi cảnh báo và chuyển hướng ngược lại trang Dashboard.
* **Lý do thay đổi:**
  * Đưa chức năng nhập điểm đi vào hoạt động thực tế với cơ sở dữ liệu SQL Server thông qua API Backend. Đồng thời, bảo vệ trang nhập điểm khỏi sự truy cập trái phép của tài khoản sinh viên.

#### 6. [frontend/pages/dangky.html](file:///c:/Users/TOAN%20PHUC/Desktop/HQTCSDL/WebQuanLySinhVien/frontend/pages/dangky.html)
* **Trước khi thay đổi:**
  * Giao diện sơ sài, thiếu các trường nhập liệu bộ lọc cần thiết cho sinh viên như chọn Niên khóa, Học kỳ để tìm kiếm lớp tín chỉ phù hợp.
  * Bảng hiển thị danh sách lớp tín chỉ thiếu nhiều cột thông tin nghiệp vụ quan trọng theo hệ thống tín chỉ (Số SV đã đăng ký, Số SV tối thiểu, Trạng thái lớp học).
  * Thiếu phần hiển thị thông tin sinh viên đang thực hiện đăng ký tín chỉ (Mã SV, Họ tên, Lớp, Khoa).
* **Thay đổi đã thực hiện:**
  * Thiết kế lại giao diện hiện đại và trực quan:
    * Thêm Thẻ thông tin sinh viên (Student Info Card) nổi bật ở đầu trang để hiển thị thông tin tài khoản sinh viên hiện tại.
    * Bổ sung hàng công cụ lọc (Filter Bar) gồm ô nhập Niên khóa (ví dụ: `2023-2024`) và ô chọn Học kỳ (1, 2, 3) trực quan.
    * Nâng cấp cấu trúc bảng danh sách lớp tín chỉ đầy đủ cột: *Mã LTC, Tên môn học, Số tín chỉ, Giảng viên, Số SV tối thiểu, Đã đăng ký, Trạng thái lớp, Thao tác*.
    * Thêm thanh công cụ thực hiện đăng ký đồng loạt ở phía dưới bảng lớp tín chỉ.
* **Lý do thay đổi:**
  * Đáp ứng đầy đủ quy trình nghiệp vụ đăng ký tín chỉ thực tế trong nhà trường, giúp sinh viên dễ dàng theo dõi trạng thái sĩ số lớp và thực hiện đăng ký nhanh chóng.

#### 7. [frontend/js/modules/dangky.js](file:///c:/Users/TOAN%20PHUC/Desktop/HQTCSDL/WebQuanLySinhVien/frontend/js/modules/dangky.js)
* **Trước khi thay đổi:**
  * Chỉ sử dụng dữ liệu giả lập (mock data), không có tương tác API thực tế với cơ sở dữ liệu SQL Server.
  * Chưa có logic tự động nhận diện mã sinh viên của tài khoản đang đăng nhập để tải danh sách lớp tín chỉ tương ứng.
  * Chưa có tính năng kiểm tra điều kiện đăng ký hoặc hủy đăng ký lớp tín chỉ trực tiếp.
* **Thay đổi đã thực hiện:**
  * Viết lại toàn bộ logic module kết nối trực tiếp với Backend API:
    * Tự động lấy thông tin sinh viên từ token đăng nhập để hiển thị lên thẻ thông tin cá nhân.
    * Gọi API `API.get('/dangky/sinhvien/' + maSV)` để lấy danh sách các lớp tín chỉ mà sinh viên hiện tại ĐÃ đăng ký trước đó.
    * Gọi API `API.get('/loptinchi')` kết hợp bộ lọc Niên khóa & Học kỳ để hiển thị danh sách lớp tín chỉ đang mở phù hợp với nhu cầu đăng ký.
    * Xử lý trạng thái động cho từng lớp tín chỉ: Nếu lớp đã được sinh viên đăng ký trước đó, nút thao tác sẽ hiển thị "Hủy đăng ký" màu đỏ; nếu chưa đăng ký, hiển thị hộp kiểm (checkbox) để sinh viên tích chọn đăng ký nhiều môn cùng lúc.
    * Xử lý gửi yêu cầu đăng ký hàng loạt thông qua API: `API.post('/dangky/register-multi', { maSV, maLTCList })` và cập nhật tức thì giao diện sau khi đăng ký thành công.
    * Xử lý hủy đăng ký từng môn riêng lẻ thông qua API: `API.delete('/dangky/cancel', { data: { maSV, maLTC } })`.
    * Thêm cơ chế bảo vệ phân quyền Client: Nếu người dùng không phải là `SINHVIEN`, hệ thống sẽ từ chối truy cập trang đăng ký tín chỉ và chuyển hướng về Dashboard.
* **Lý do thay đổi:**
  * Chuyển đổi toàn bộ quy trình đăng ký môn học của sinh viên từ mô hình giao diện tĩnh sang xử lý nghiệp vụ động thời gian thực với Backend và Database.

---

### HƯỚNG DẪN KIỂM TRA HỆ THỐNG PHÂN QUYỀN

Để kiểm nghiệm các thay đổi về phân quyền và bảo mật ở trên, bạn có thể thực hiện kiểm tra bằng 3 tài khoản mẫu tương ứng với 3 vai trò:

1. **Đăng nhập với vai trò Phòng Giáo Vụ (PGV):**
   * **Tài khoản:** `admin` / **Mật khẩu:** `123`
   * **Kết quả:** Hiển thị đầy đủ tất cả các menu trên Sidebar. Có toàn quyền xem và thao tác ở mọi trang danh mục, quản lý điểm và báo cáo hệ thống.

2. **Đăng nhập với vai trò Trợ lý Khoa (KHOA):**
   * **Tài khoản:** `khoa` / **Mật khẩu:** `123`
   * **Kết quả:** Sidebar chỉ hiển thị 3 menu: `Tổng quan`, `Nhập Điểm` và `Báo cáo`. Không thể nhìn thấy các trang quản lý danh mục (Khoa, Lớp, Giảng viên, Sinh viên, Lớp tín chỉ).

3. **Đăng nhập với vai trò Sinh viên (SINHVIEN):**
   * **Tài khoản:** Nhập mã sinh viên bất kỳ có trong Database (ví dụ: `N19DCCN001`) / **Mật khẩu:** `123456`
   * **Kết quả:** Sidebar chỉ hiển thị: `Tổng quan`, `Đăng ký tín chỉ`, `Xem Điểm Cá Nhân`.
   * **Kiểm tra bảo mật:** Thử cố ý truy cập trực tiếp vào URL nhập điểm (`/pages/nhapdiem.html`) hoặc dùng công cụ kiểm tra API gửi request xem đăng ký/điểm của sinh viên khác bằng cách đổi mã sinh viên trên URL API. Hệ thống Backend và Client sẽ tự động chặn và trả về thông báo lỗi phân quyền `403`.
