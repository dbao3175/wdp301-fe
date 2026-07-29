# BẢN PROMPT GỬI NHÓM BACKEND (BE) - TÍCH HỢP TÍNH NĂNG ADMIN (CRUD USER, NOTIFICATION, AUDIT LOGS)

## 📌 Bối cảnh & Mục tiêu
Để vận hành đầy đủ trang Quản trị (Admin Panel) trên Frontend, chúng ta cần bổ sung và hoàn thiện một số API endpoints và Schema trên Backend liên quan đến:
1. **CRUD User:** Hỗ trợ lưu trữ thông tin thanh toán (ngân hàng) của Assistant và kích hoạt/khóa tài khoản.
2. **Quản lý Thông báo (Notification CRUD):** Cho phép Admin lấy toàn bộ thông báo hệ thống và xóa thông báo.
3. **Nhật ký hoạt động (Audit Logs):** Ghi lại lịch sử hoạt động chính trên hệ thống để Admin theo dõi.

---

## 🛠 YÊU CẦU CHI TIẾT CHO NHÓM BE

### 1. Nâng cấp CRUD User & Trạng thái tài khoản
Hiện tại, `userController.js` đã có các hàm cơ bản, cần đảm bảo các điểm sau hoạt động chính xác:
- **Thông tin ngân hàng:** Khi Admin tạo (`POST /api/users`) hoặc cập nhật (`PUT /api/users/:id`) một Assistant, đảm bảo Schema `User.js` lưu trữ các trường:
  - `bankName` (String)
  - `accountNumber` (String)
  - `cardholder` (String)
- **API kích hoạt/khóa:** Đảm bảo endpoint `PUT /api/users/:id/status` thực hiện đổi trạng thái `isActive = !isActive` và hoạt động đúng logic (kiểm tra phân quyền Admin).

---

### 2. Bổ sung các API Quản lý Thông báo (Notifications)
Thêm các endpoints mới trong file `routes/notification.js`:
- **Lấy toàn bộ thông báo hệ thống (Admin Only):**
  - **HTTP Method:** `GET /api/notifications`
  - **Controller handler:** `getAllNotifications`
  - **Mô tả:** Lấy danh sách tất cả thông báo của mọi User trong database để Admin kiểm tra. Sắp xếp theo `createdAt` giảm dần.
- **Xóa thông báo (Admin Only):**
  - **HTTP Method:** `DELETE /api/notifications/:id`
  - **Controller handler:** `deleteNotification`
  - **Mô tả:** Admin có quyền xóa thông báo bất kỳ ra khỏi hệ thống.

**Ví dụ code gợi ý cho `notifcationController.js`:**
```javascript
// Lấy toàn bộ thông báo (Admin)
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa thông báo
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndDelete(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.status(200).json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

### 3. Xây dựng Tính năng Nhật ký Hoạt động (Audit Logs)
Admin cần xem toàn bộ lịch sử hoạt động để giám sát hệ thống.

#### A. Định nghĩa Schema `AuditLog.js` (Mới)
Tạo file `src/models/AuditLog.js`:
```javascript
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Có thể null nếu hệ thống tự thực hiện hành động
  },
  user: {
    type: String, // Lưu tên user text fallback (ví dụ: "Takeshi (Mangaka)")
    required: true
  },
  action: {
    type: String, // Ví dụ: "Uploaded Storyboard", "Cast Vote: ACCEPT", "Submitted Work"
    required: true
  },
  target: {
    type: String, // Đối tượng tác động, ví dụ: "Chapter 1 Proposal"
    required: true
  },
  details: {
    type: String
  }
}, {
  timestamps: true // Tự động tạo createdAt làm Timestamp
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
```

#### B. API Endpoints cho Audit Logs (Mới)
Tạo file route `src/routes/auditLog.js` và khai báo trong `app.js`:
- **Lấy danh sách Audit Logs (Admin Only):**
  - **HTTP Method:** `GET /api/audit-logs`
  - **Mô tả:** Trả về danh sách log lịch sử hệ thống, sắp xếp theo thời gian mới nhất.

**Ví dụ Route & Controller gợi ý:**
```javascript
// routes/auditLog.js
const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const logs = await AuditLog.find({})
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```
Khai báo trong `app.js`:
```javascript
const auditLogRoutes = require('./routes/auditLog.js');
app.use('/api/audit-logs', protect, auditLogRoutes);
```

#### C. Ghi nhận logs tự động (Trigger)
Nhóm BE vui lòng bổ sung hàm lưu vết (Helper function hoặc Middleware) để tự động ghi log vào collection `auditlogs` khi thực hiện các hành động quan trọng sau:
1. **Đăng nhập:** Ghi log khi user đăng nhập thành công.
2. **Series Proposal:** Tạo proposal mới, Duyệt/Từ chối proposal, Chuyển lên Board.
3. **Voting Session:** Board Member tham gia vote và cast vote.
4. **Task (Trợ lý):** Giao task mới cho Assistant, Assistant submit task, Mangaka/Editor phê duyệt hoặc yêu cầu sửa đổi task.
5. **Publish Chapter:** Editor hoặc Mangaka xuất bản chương mới.

**Ví dụ Helper ghi log:**
```javascript
const AuditLog = require('./models/AuditLog');

const logSystemAction = async (userId, userName, action, target, details = '') => {
  try {
    await AuditLog.create({
      userId,
      user: userName,
      action,
      target,
      details
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};
```
Các controllers khác chỉ cần import và gọi hàm này sau khi xử lý thành công.
