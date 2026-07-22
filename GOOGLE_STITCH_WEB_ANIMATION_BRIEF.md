# Manga Studio OS — Web UI & Animation Brief for Google Stitch

> Tài liệu này mô tả **đúng frontend web hiện tại** của Manga Studio OS. Dùng tài liệu làm input cho Google Stitch để đề xuất giao diện và animation. Không tự thêm chức năng ngoài phạm vi.

## 1. Mục tiêu thiết kế

Thiết kế lại và nâng cấp UI/UX cho một hệ thống quản lý quy trình sản xuất manga chuyên nghiệp, mang cảm giác:

- Manga editorial command center.
- Hiện đại, cao cấp, sáng tạo nhưng vẫn dễ đọc.
- Có cá tính Nhật Bản/manga thông qua khung panel, nét mực, halftone và hard shadow.
- Animation sinh động có mục đích, không biến dashboard thành landing page quảng cáo.
- Ưu tiên desktop web, nhưng phải responsive tốt trên tablet và màn hình laptop nhỏ.

## 2. Nguyên tắc bắt buộc

1. Không thêm chatbot, AI generator, social feed, marketplace, gamification hoặc chức năng không tồn tại.
2. Không đổi workflow nghiệp vụ hiện tại.
3. Không dùng ảnh manga có bản quyền do AI tự tạo hoặc sao chép. Dùng ảnh đã có trong dự án, thumbnail placeholder hoặc abstract manga texture.
4. Các nút, form và dữ liệu phải giữ đúng mục đích hiện có.
5. Animation không được cản thao tác, gây chóng mặt hoặc làm nội dung khó đọc.
6. Phải có loading, empty, error, success và disabled state.
7. Phải hỗ trợ `prefers-reduced-motion`.
8. Không thiết kế glassmorphism quá nhiều; giao diện chính vẫn là panel manga rõ nét.

## 3. Design language hiện tại

### Màu sắc

| Token | Giá trị | Mục đích |
|---|---:|---|
| Ink Black | `#141414` | Viền, header, sidebar, typography chính |
| Paper White | `#FFFFFF` | Panel và surface |
| Manuscript Gray | `#F5F5F0` | Nền giấy |
| Action Red | `#E63946` | CTA, active state, điểm nhấn |
| Creative Orange | `#F39C12` | Warning, trạng thái cần chú ý |
| Success Green | `#2ECC71` | Approved, completed |
| Dark Assistant BG | `#121214` | Khu vực Assistant |
| Dark Surface | `#1E1E24` | Card của Assistant/Admin |

### Typography

- UI chính: `Inter`.
- Heading mạnh: `Space Grotesk`.
- Metadata, badge, số liệu: `JetBrains Mono`.
- Editorial accent: `Playfair Display`.

### Hình khối

- Viền đen 2–4 px.
- Góc vuông hoặc bo rất nhẹ.
- Hard shadow lệch 4–8 px.
- Background chấm halftone/grid rất nhẹ.
- Badge trạng thái nhỏ, uppercase, mono.
- Icon dạng line icon, hiện dùng Lucide.

## 4. Người dùng và màn hình hiện có

### Public Authentication

- Đăng nhập bằng email và mật khẩu.
- Đăng ký tài khoản.
- Khi đăng ký: họ tên, email, mã xác minh, mật khẩu và chọn role.
- Role đăng ký hiện có: `MANGAKA`, `ASSISTANT`, `EDITOR`, `BOARD_MEMBER`, `ADMIN`.
- Hiển thị trạng thái kết nối backend.

### Mangaka

- Manga Workspace.
- Chapter Production.
- Series Proposals.
- Rankings Dashboard.
- Notifications và thông tin tài khoản trong navigation.

### Assistant

- Task Management: danh sách task được giao, trạng thái, deadline.
- Workspace: làm việc trên task/trang manga được giao.
- Income & Earnings: thu nhập từ task đã được duyệt.
- Notification dropdown.
- Sidebar có thể thu gọn.

### Editor

- Dashboard: thống kê, proposal gần đây, series đang sản xuất, activity.
- Proposals: hàng đợi đề xuất, tìm kiếm/lọc, review và download storyboard.
- Proposal Review: xem thông tin đề xuất, duyệt, yêu cầu sửa hoặc từ chối.
- Series Management: catalogue series, thống kê, top ranked, most voted, fastest growing.
- Series Detail: thông tin series, tiến độ và danh sách chapter.
- Manuscript Review: trình xem trang truyện, comment và hành động review.
- Sidebar có thể thu gọn.

### Editorial Board

- Chapter Publication Review.
- Pending Series Voting.
- Gán board member bắt buộc bỏ phiếu.
- Hiển thị số Accept, Reject, Awaiting và tổng số phiếu.
- Reader Metrics và nhập CSV/JSON.
- Board Directive Proposals: continue, cancel hoặc đổi lịch phát hành.
- Rankings Dashboard.

### Admin

- Quản lý người dùng/tài khoản.
- Theo dõi dữ liệu và hoạt động hệ thống.
- Gửi thông báo.
- Các panel/form quản trị dạng dark dashboard.

## 5. Navigation architecture

```text
Authentication
├── Login
└── Register

MANGAKA
├── Manga Workspace
├── Chapter Production
├── Series Proposals
└── Rankings Dashboard

ASSISTANT
├── Task Management
├── Workspace
└── Income & Earnings

EDITOR
├── Dashboard
├── Proposals
│   └── Proposal Review
├── Series
│   └── Series Detail
└── Manuscript Review

BOARD_MEMBER
├── Editorial Board
└── Rankings Dashboard

ADMIN
└── Admin Panel
```

## 6. Animation direction

### 6.1 Page transition

- Khi đổi trang/tab: cả content canvas fade-in và dịch lên khoảng 12–18 px.
- Duration: 500–720 ms.
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` hoặc `outExpo`.
- Header/sidebar đứng yên để giữ cảm giác ổn định.
- Có một đường “ink sweep” đỏ/đen chạy nhanh ở cạnh trên content trong khoảng 600–750 ms.

### 6.2 Card stagger

- Summary card, series card, proposal row và task card xuất hiện lần lượt.
- Delay giữa các phần tử: 40–60 ms.
- Chỉ animate tối đa khoảng 24–36 phần tử trong một lượt.
- Dữ liệu tải sau từ API cũng cần reveal nhẹ.

### 6.3 Hover interaction

- Card có hard shadow: dịch lên/trái 2 px và shadow tăng từ 4 px lên 7 px.
- Cover/thumbnail bên trong zoom tối đa `1.035`.
- Không xoay card và không dùng 3D tilt mạnh.
- Button nhấn xuống 1 px và scale khoảng `0.975`.
- Navigation active state có red indicator trượt vào nhanh.

### 6.4 Modal

- Backdrop fade-in 180–220 ms.
- Modal đi lên 16–20 px, scale từ `0.965` lên `1`.
- Có overshoot rất nhẹ, tổng duration khoảng 380–440 ms.
- Không bounce mạnh.

### 6.5 Status animation

- Success: checkmark draw hoặc stamp nhẹ một lần.
- Error: viền đỏ pulse một lần; không rung liên tục.
- Loading: skeleton dạng panel manga hoặc ink-line progress.
- Empty state: icon/illustration tĩnh, chỉ fade-in.
- Notification mới: chấm đỏ pulse tối đa 2 lần.

### 6.6 Background

- Halftone/grid có thể dịch rất chậm theo chu kỳ 24–32 giây.
- Độ tương phản thấp, không tranh chấp với nội dung.
- Không dùng particle dày đặc.

### 6.7 Accessibility

Khi người dùng bật reduced motion:

- Tắt page translation, stagger, zoom và background drift.
- Nội dung hiển thị ngay với opacity 1.
- Giữ focus ring rõ ràng cho keyboard.

## 7. Màn hình ưu tiên để Stitch thiết kế

### A. Login/Register

- Một auth card trung tâm như bìa tạp chí manga.
- Logo Manga Studio OS.
- Form rõ ràng, CTA đỏ nổi bật.
- Background halftone và abstract panel vừa đủ.
- Có animation chuyển Login ↔ Register nhưng giữ nguyên vị trí card.

### B. Editor — Series Management

- Header với title, subtitle và Refresh.
- 4 summary cards: Total Series, Active, On Hiatus, Total Votes.
- 3 bảng highlight: Top Ranked, Most Voted, Fastest Growing.
- Thanh search, status filter, sort và grid/list toggle.
- Grid catalogue phải ưu tiên cover, title, author, trạng thái và production progress.
- Đây là màn hình quan trọng nhất để người xem thấy rõ catalogue manga.

### C. Editor — Dashboard

- Tổng quan việc cần xử lý ngay.
- Proposal gần đây và series đang sản xuất.
- Số liệu rõ nhưng không biến thành dashboard tài chính chung chung.
- Card stagger khi dữ liệu tải xong.

### D. Editorial Board

- Ưu tiên tính minh bạch của biểu quyết.
- Các chỉ số Accept, Reject, Awaiting, Total Cast phải nhìn hiểu ngay.
- Assigned voter là người bắt buộc bỏ phiếu; dấu X nghĩa là chưa bỏ phiếu, không phải Reject.
- Vote detail modal phải hiển thị từng phiếu thực tế.
- Reader Metrics và Board Directive là panel phụ, không được lấn át voting queue.

### E. Assistant — Task Management

- Dark command center nhưng không quá tối.
- Task card hiển thị series, chapter, loại task, deadline, status và progress.
- Animation ưu tiên deadline/status thay đổi, không dùng hiệu ứng trang trí thừa.

### F. Manuscript Review

- Trang manga là trọng tâm thị giác.
- Comment sidebar và review action bar luôn dễ tiếp cận.
- Chuyển trang manga nhanh, nhẹ, không blur nội dung tranh.

## 8. Component states cần Stitch thể hiện

Mỗi màn hình quan trọng nên có ít nhất các trạng thái sau:

- Default/populated.
- Loading/skeleton.
- Empty data.
- API/network error với nút Retry.
- Modal open.
- Hovered card hoặc focused control.
- Success feedback sau khi submit.
- Disabled action khi chưa đủ điều kiện.

## 9. Responsive requirements

- Desktop target: `1440 × 900` hoặc `1536 × 960`.
- Laptop: từ `1024 px` trở lên vẫn phải dùng được.
- Tablet: sidebar chuyển sang rail hoặc drawer.
- Bảng lớn được phép scroll ngang; không ép chữ quá nhỏ.
- Grid series: 3 cột desktop, 2 cột tablet, 1 cột mobile web.
- Modal không vượt quá `90vh` và nội dung bên trong có scroll.

## 10. Những điều không nên làm

- Không neon cyberpunk.
- Không gradient tím/xanh kiểu SaaS AI thông thường.
- Không glass card khắp màn hình.
- Không animation liên tục trên mọi thành phần.
- Không autoplay carousel.
- Không làm sidebar/header nảy hoặc chuyển động khi người dùng đang đọc.
- Không thay dữ liệu thật bằng số liệu giả chỉ để trang trí.
- Không thêm nút hoặc workflow chưa có API hỗ trợ.
- Không thay chữ Manga Studio OS/MangaFlow bằng thương hiệu khác.

## 11. Master prompt — Copy vào Google Stitch

```text
Redesign the existing Manga Studio OS web application as a premium manga editorial and production command center. This is a real workflow management product, not a marketing landing page.

Keep the existing functionality and information architecture exactly as described in this brief. Do not invent AI generators, chatbots, social feeds, marketplaces, gamification, or unsupported actions.

Visual direction:
- Japanese manga editorial system with a modern professional dashboard structure.
- Off-white manuscript paper background (#F5F5F0), white panels, deep ink black (#141414), action red (#E63946), warning orange (#F39C12), and success green (#2ECC71).
- Use Inter for UI, Space Grotesk for strong headings, JetBrains Mono for metadata and numbers, and Playfair Display only for editorial accents.
- Use bold 2–4 px black borders, restrained square corners, offset hard shadows, subtle halftone textures, editorial labels, and clean Lucide-style line icons.
- Keep layouts readable, spacious, and data-focused. Avoid generic AI SaaS gradients and excessive glassmorphism.

Create coherent desktop screens for:
1. Login and Register.
2. Editor Dashboard.
3. Editor Proposals and Proposal Review.
4. Editor Series Management catalogue and Series Detail.
5. Manuscript Review.
6. Editorial Board voting and publication review.
7. Assistant Task Management and Workspace.
8. Admin Panel.

The Series Management catalogue and Editorial Board voting screen are the two highest-priority showcase screens.

Animation and interaction direction:
- Page content fades in while moving upward 12–18 px over 500–720 ms with an out-expo easing.
- Use a short red-and-black ink sweep across the top edge when changing screens.
- Stagger summary cards, series cards, proposal rows, and task cards by 40–60 ms.
- Hard-shadow cards lift up-left by 2 px on hover and deepen their shadow. Cover images zoom no more than 1.035.
- Buttons compress slightly on press.
- Modals fade the backdrop and enter upward with subtle scale and a very small overshoot.
- New notification dots may pulse twice, never infinitely.
- Loading uses manga-panel skeletons or an ink-line progress treatment.
- Support prefers-reduced-motion by disabling translations, stagger, zoom, and background drift.

Show default, loading, empty, network error, modal, hover/focus, success, and disabled states. Prioritize desktop at 1440x900 while remaining responsive for laptop and tablet.

Use only existing or placeholder manga assets. Do not generate or copy copyrighted manga pages or covers.
```

## 12. Prompt bổ sung riêng cho animation prototype

```text
Create an interactive motion prototype for the selected Manga Studio OS screen. Preserve all existing content and controls. Demonstrate only these transitions:

1. Initial page reveal with 16 px upward movement and fade.
2. 48 ms stagger for visible cards.
3. Manga hard-shadow card hover with a 2 px lift.
4. Cover image zoom capped at 1.035.
5. Button press feedback at scale 0.975.
6. Modal backdrop fade and panel entrance from 18 px below.
7. One-time success stamp and one-time error border pulse.
8. Reduced-motion version with no translation or zoom.

Keep the motion polished and restrained. Do not add decorative motion that repeats forever, except for an extremely subtle low-contrast halftone background drift.
```

## 13. Checklist đánh giá thiết kế Stitch

- [ ] Có đúng các màn hình và role hiện tại.
- [ ] Không xuất hiện chức năng bịa thêm.
- [ ] Series cover và catalogue đủ nổi bật.
- [ ] Voting state không nhầm “chưa vote” với “Reject”.
- [ ] Animation thống nhất giữa các màn hình.
- [ ] Hover/press/focus được thể hiện rõ.
- [ ] Có loading, empty và error state.
- [ ] Modal không vượt viewport.
- [ ] Reduced motion được mô tả.
- [ ] UI vẫn dễ đọc khi bỏ toàn bộ animation.
- [ ] Không sử dụng nội dung manga có bản quyền ngoài asset do dự án cung cấp.

## 14. Cách gửi kết quả Stitch lại để triển khai

Ưu tiên xuất một trong các dạng sau:

1. File `.zip` chứa HTML/CSS/JS và assets.
2. Link Figma có quyền xem.
3. Ảnh PNG độ phân giải đầy đủ của từng màn hình kèm prototype video/GIF.
4. Design tokens và motion specification nếu Stitch cho phép copy.

Khi gửi lại, ghi rõ màn hình nào thay thế màn hình hiện tại và animation nào là bắt buộc. Không cần xuất code backend.
