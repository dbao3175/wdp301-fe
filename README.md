# WDP301 Manga Board - Frontend Realtime Dashboard

Dự án Frontend được xây dựng hoàn chỉnh bằng **React 19**, **Vite**, **Tailwind CSS v4** và **Socket.io Client** để kết nối trực tiếp với backend **WDP301_BE** (MongoDB + Express + Socket.io Server).

---

## ⚡ GIẢI THÍCH LỖI "Cannot GET /" & ĐỤNG ĐỘ CỔNG (PORT 3000)

Khi bạn chạy dự án dưới máy local qua lệnh `npm run dev` và mở `http://localhost:3000/`, bạn sẽ thấy lỗi **`Cannot GET /`**. Lý do như sau:

1. **Cả 2 dự án đang cùng đòi chạy ở cổng 3000:**
   - **Backend (WDP301_BE):** Đang listen trực tiếp ở cổng `3000` (`httpServer.listen(3000)`).
   - **Frontend (WDP301_FE / dev script):** Trong file `package.json` cài mặc định lệnh `"dev": "vite --port=3000 --host=0.0.0.0"` để tương thích với môi trường Preview của AI Studio sandbox.
2. **Hậu quả:** Khi bạn khởi chạy cả hai dự án dưới máy tính của mình, cổng 3000 bị tranh chấp. Trình duyệt của bạn đang truy cập thẳng vào **Backend (Express)** thay vì Frontend. Vì Backend không định cấu hình route gốc `/` (chỉ có `/tasks` và `/chapters`), Express sẽ trả về lỗi mặc định: **`Cannot GET /`**.

---

## 🚀 HƯỚNG DẪN KHẮC PHỤC & CHẠY LOCAL KHÔNG BỊ XUNG ĐỘT

Để chạy song song và kết nối thành công 100% FE và BE trên máy cá nhân của bạn, hãy làm theo các bước sau:

### Bước 1: Khởi động Backend (WDP301_BE) ở cổng 3000
1. Di chuyển vào thư mục dự án Backend của bạn:
   ```bash
   cd WDP301_BE
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Đảm bảo bạn đã bật cơ sở dữ liệu **MongoDB** cục bộ (`mongodb://127.0.0.1:27017/manga_demo`).
4. Khởi động Backend:
   ```bash
   npm run dev  # hoặc node src/server.js tùy kịch bản của bạn
   ```
   *Backend sẽ chạy tại: `http://localhost:3000`*

---

### Bước 2: Chạy Frontend (wdp301-fe) ở cổng khác (ví dụ: cổng 5173)
Đổi cổng chạy dev của FE dưới local để tránh đè cổng 3000 của Backend:

1. Di chuyển vào thư mục dự án Frontend:
   ```bash
   cd wdp301-fe
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Khởi động Frontend trên cổng `5173` (hoặc cổng bất kỳ khác 3000):
   ```bash
   npx vite --port 5173
   ```
   *(Hoặc bạn có thể sửa trực tiếp trong `package.json` dòng `"dev": "vite --port=3000"` thành `"dev": "vite --port=5173"` trên máy của bạn).*

Ảnh hiển thị của Vite lúc này:
`-> Local: http://localhost:5173/`

---

### Bước 3: Kết nối FE với BE trên trình duyệt
1. Mở trình duyệt và truy cập: **`http://localhost:5173/`** (Bạn sẽ thấy giao diện Dashboard vô cùng đẹp mắt hiện ra!).
2. Bấm vào nút **⚙️ (Răng cưa cấu hình)** ở trên thanh Header (góc trên cùng bên phải).
3. Tại phần cấu hình kết nối:
   - Chọn chế độ: **Kết nối Backend thật (Real connection)**.
   - Địa chỉ Backend API: Điền đúng địa chỉ Backend của bạn bên trên: **`http://localhost:3000`**.
   - Bấm **Lưu URL**.
4. **Xong!** Hệ thống sẽ ngay lập tức thiết lập kết nối WebSocket (Socket.io) đến Backend, tự động đồng bộ hóa các Chapters và Tasks từ database MongoDB về giao diện.

---

## 🎨 CÁC TÍNH NĂNG ĐÃ HOÀN THIỆN TRÊN FE
* **Realtime Sockets Broadcast:** Đồng bộ hóa tức thời các sự kiện `task_assigned` (giao việc mới) và `task_done` (thành viên nộp bài) giữa các tab/thành viên hoạt động.
* **Smart Member Filter:** Cho phép chuyển đổi vai trò thành viên đang xem (Ví dụ: Quân Nguyễn - Editor, Lan Chi - Translator). Giao diện sẽ tự động làm nổi bật và lọc các công việc thuộc trách nhiệm của bạn.
* **REST API integration:** Tích hợp gọi API tạo Chapter (`POST /chapters`), giao việc (`POST /tasks`), nộp bài (`PUT /tasks/:id/submit`) đầy đủ, chuẩn xác theo thiết kế Router của BE.
* **Sandbox Mode:** Có sẵn chế độ giả lập cục bộ siêu mượt mà để bạn thuyết trình demo trực tiếp trên Web Preview mà không cần chạy server backend.
