# Manga Studio OS — Landing Page Brief for Google Stitch

> Dùng tài liệu này để yêu cầu Google Stitch thiết kế **trang chủ công khai giới thiệu dự án**. Đây là màn hình người dùng nhìn thấy trước khi đăng nhập, không phải dashboard quản trị.

## 1. Bối cảnh dự án

**Manga Studio OS** là hệ thống quản lý toàn bộ quy trình sáng tác và xuất bản manga:

1. Mangaka gửi đề xuất series và storyboard.
2. Editor kiểm duyệt đề xuất.
3. Editorial Board bỏ phiếu quyết định series.
4. Editor lập chapter và phân công công việc.
5. Assistant thực hiện task trên các trang truyện.
6. Editor kiểm duyệt bản thảo.
7. Editorial Board duyệt xuất bản chapter.
8. Hệ thống theo dõi reader metrics, rankings và quyết định tương lai của series.

Các vai trò hiện có:

- Mangaka.
- Assistant.
- Editor.
- Editorial Board Member.
- Admin.

## 2. Mục tiêu Landing Page

Thiết kế một trang chủ giúp giảng viên, mentor hoặc thành viên mới nhìn vào là hiểu ngay:

- Đây là dự án gì.
- Dự án giải quyết vấn đề gì.
- Quy trình manga vận hành như thế nào.
- Những vai trò nào cùng làm việc trong hệ thống.
- Có những series manga nào đang được quản lý.
- Làm thế nào để đăng nhập hoặc đăng ký.

Trang phải tạo cảm giác như một **digital manga editorial magazine kết hợp production command center**, chuyên nghiệp và đáng nhớ.

## 3. Điều hướng và hành vi bắt buộc

### Header

- Logo bên trái: `Manga Studio OS` hoặc `MangaFlow`.
- Navigation giữa/phải:
  - Tổng quan.
  - Quy trình.
  - Vai trò.
  - Series.
  - Tính năng.
- Góc trên bên phải có hai nút:
  - `Đăng nhập` / `Sign in`.
  - `Đăng ký` / `Create account`.
- Header sticky khi cuộn.

### Authentication actions

- Nhấn `Đăng nhập` chuyển sang trang Login hiện tại.
- Nhấn `Đăng ký` chuyển sang cùng trang Authentication nhưng mở sẵn Register mode.
- Không mở form đăng nhập trực tiếp trong Landing Page.
- Không dùng modal đăng nhập.
- Có nút CTA trong Hero: `Khám phá Studio` hoặc `Bắt đầu sáng tác`, dẫn đến Register.
- Có CTA phụ: `Xem quy trình`, cuộn xuống phần workflow.

### Routing đề xuất khi triển khai

```text
/             → Public Landing Page
/login        → Login hiện tại
/register     → Register mode của trang auth hiện tại
/editor/*     → Editor application sau khi đăng nhập
```

Google Stitch chỉ cần thiết kế giao diện và prototype chuyển màn hình. Không cần tự viết backend authentication.

## 4. Design direction

### Phong cách

- Premium manga editorial website.
- Editorial magazine layout kết hợp dashboard aesthetics.
- Có panel truyện, speech bubble geometry, nét mực và halftone texture.
- Bất đối xứng có kiểm soát, không làm nội dung khó đọc.
- Sạch, sắc nét, trưởng thành; không biến thành trang web anime trẻ em.

### Màu sắc

| Token | Giá trị | Cách dùng |
|---|---:|---|
| Ink Black | `#141414` | Typography, header, footer, viền |
| Manuscript Paper | `#F5F5F0` | Background chính |
| Paper White | `#FFFFFF` | Card và panel |
| Action Red | `#E63946` | CTA và điểm nhấn |
| Creative Orange | `#F39C12` | Workflow accent |
| Success Green | `#2ECC71` | Approved/published state |

Không dùng gradient tím/xanh kiểu AI SaaS phổ thông.

### Typography

- Heading: Space Grotesk, đậm và editorial.
- Body: Inter.
- Metadata và số thứ tự: JetBrains Mono.
- Một vài câu accent: Playfair Display Italic.

### Hình khối

- Viền đen 2–4 px.
- Hard shadow lệch 4–8 px.
- Card góc vuông hoặc bo nhẹ.
- Background chấm halftone rất nhẹ.
- Red editorial labels, chapter number và status stamp.

## 5. Cấu trúc Landing Page

### Section 1 — Sticky Header

- Logo dạng biểu tượng chữ `M` kết hợp tên dự án.
- Navigation rõ ràng.
- Hai nút auth ở góc phải.
- `Đăng nhập` dùng button nền trắng, viền đen.
- `Đăng ký` dùng button đỏ, viền đen và hard shadow.
- Trên màn hình nhỏ, navigation thu thành menu; hai action vẫn dễ tìm.

### Section 2 — Hero

Nội dung chính:

**Eyebrow:** `MANGA PRODUCTION WORKFLOW SYSTEM`

**Headline đề xuất:**

> Nơi một ý tưởng manga trở thành một series được xuất bản.

**Supporting text:**

> Kết nối Mangaka, Assistant, Editor và Editorial Board trong một quy trình sáng tác, kiểm duyệt và xuất bản minh bạch.

CTA:

- Primary: `Bắt đầu sáng tác` → Register.
- Secondary: `Xem quy trình` → Workflow section.

Hero visual:

- Một composition dạng manga panel thể hiện chuỗi `Idea → Storyboard → Production → Review → Publish`.
- Có thể dùng thumbnail/cover mà dự án cung cấp hoặc placeholder hợp pháp.
- Có mini status card như `12 Series`, `36 Chapters`, `Editorial Review` nhưng phải xem đây là dữ liệu demo, không trình bày như số liệu realtime nếu chưa kết nối API.
- Không sao chép hoặc tự tạo lại nhân vật manga có bản quyền.

### Section 3 — Project Value

Tiêu đề:

> Một Studio. Một Workflow. Mọi vai trò cùng phối hợp.

Ba hoặc bốn value cards:

1. **Quản lý xuyên suốt** — Theo dõi series, chapter, page và task.
2. **Phân công rõ ràng** — Editor giao việc và Assistant cập nhật tiến độ.
3. **Kiểm duyệt minh bạch** — Mọi proposal và chapter đều có review state.
4. **Quyết định dựa trên dữ liệu** — Voting, reader metrics và rankings.

### Section 4 — End-to-End Workflow

Đây là section quan trọng nhất.

Thiết kế workflow ngang trên desktop và dọc trên mobile:

```text
01 Ý tưởng & Proposal
        ↓
02 Editor Review
        ↓
03 Board Voting
        ↓
04 Chapter Planning
        ↓
05 Task Assignment
        ↓
06 Production
        ↓
07 Manuscript Review
        ↓
08 Publication Decision
        ↓
09 Rankings & Future Direction
```

Mỗi bước có:

- Số thứ tự.
- Icon line đơn giản.
- Tên bước.
- Mô tả tối đa hai dòng.
- Role chịu trách nhiệm.

Không thêm bước AI generation hoặc marketplace.

### Section 5 — Role Ecosystem

Thiết kế 4 panel vai trò chính:

- **Mangaka** — Đề xuất series, theo dõi chapter và workflow sáng tác.
- **Assistant** — Nhận task, thực hiện công việc và theo dõi thu nhập.
- **Editor** — Kiểm duyệt proposal, quản lý series và review manuscript.
- **Editorial Board** — Bỏ phiếu, duyệt xuất bản và đưa ra directive.

Admin có thể xuất hiện dạng nhãn nhỏ bên dưới: quản lý tài khoản và hệ thống.

Khi hover một role card, workflow liên quan có thể được highlight nhẹ.

### Section 6 — Series Showcase

Mục đích: khi mentor mở trang, phải thấy ngay hệ thống có catalogue manga chứ không chỉ là form quản trị.

- Grid hoặc editorial carousel hiển thị 6 series nổi bật.
- Card gồm cover, tên series, tác giả, thể loại và trạng thái.
- Dùng dữ liệu/asset hiện có trong dự án.
- Nếu chưa tải được API, hiển thị skeleton hoặc placeholder đẹp.
- Không tự thêm nút `Read Manga` nếu hệ thống chưa có luồng đọc công khai.
- CTA phù hợp: `Đăng nhập để quản lý Studio`, không phải `Đọc ngay`.

### Section 7 — Feature Highlights

Có thể dùng layout bento editorial, nhưng không quá giống SaaS template.

Các chức năng được phép giới thiệu:

- Series Proposal & Storyboard Review.
- Chapter Production Management.
- Task Assignment & Assistant Workspace.
- Manuscript Review & Comments.
- Editorial Board Voting.
- Reader Metrics & Rankings.
- Notifications.
- Role-based access.

### Section 8 — Final CTA

Headline:

> Sẵn sàng bước vào Studio?

Supporting text:

> Tham gia quy trình sáng tác manga có tổ chức, minh bạch và chuyên nghiệp.

Actions:

- `Tạo tài khoản` → Register.
- `Tôi đã có tài khoản` → Login.

### Section 9 — Footer

- Logo và tên dự án.
- Mô tả ngắn.
- Navigation anchor.
- Dòng ghi chú: `Manga Creation Workflow and Publishing Management System`.
- Không cần social media giả, newsletter hoặc địa chỉ công ty giả.

## 6. Animation specification

### Page load

- Header fade-down nhẹ trong 450–550 ms.
- Hero headline reveal theo từng dòng, không animate từng chữ cái.
- CTA và supporting content stagger 60–90 ms.
- Hero visual đi lên 16–24 px và fade-in.

### Scroll reveal

- Section title và card fade-up khi đi vào viewport.
- Chỉ chạy một lần.
- Khoảng dịch chuyển tối đa 20 px.
- Stagger card khoảng 50–70 ms.
- Không để nội dung biến mất quá lâu trước khi cuộn tới.

### Workflow animation

- Đường nối workflow được vẽ dần khi section vào viewport.
- Các node sáng lần lượt từ Proposal đến Publication.
- Animation chỉ chạy một lần, không loop vô hạn.
- Hover node làm nổi role chịu trách nhiệm.

### Series cards

- Hover: nâng card 2 px, hard shadow sâu hơn.
- Cover zoom tối đa `1.035`.
- Status badge không nhấp nháy.
- Không autoplay carousel.

### Authentication transition

- Khi nhấn Login/Register, thực hiện page transition ngắn:
  - CTA compress nhẹ.
  - Một ink wipe hoặc panel wipe 350–500 ms.
  - Chuyển sang trang Authentication hiện tại.
- Không làm animation dài khiến người dùng tưởng nút không hoạt động.

### Background

- Halftone/grid drift cực nhẹ, chu kỳ 24–32 giây.
- Có thể thêm 1–2 manga panel shape parallax rất nhỏ.
- Không dùng particle field hoặc background video nặng.

### Reduced motion

Khi `prefers-reduced-motion: reduce`:

- Bỏ parallax, scroll translation, ink wipe và cover zoom.
- Dùng opacity transition tối đa 100–150 ms hoặc hiển thị ngay.
- Không làm ảnh hưởng navigation và focus state.

## 7. Responsive requirements

- Thiết kế chính: `1440 × 900`.
- Laptop: `1024–1366 px`.
- Tablet: `768 px`.
- Mobile web tham khảo: `390 × 844`.
- Hero hai cột trên desktop, một cột trên mobile.
- Workflow ngang chuyển thành timeline dọc trên mobile.
- Series grid: 3–4 cột desktop, 2 cột tablet, 1 cột mobile.
- Login/Register luôn dễ truy cập trong mobile menu.

## 8. Các trạng thái cần thiết kế

- Landing page đầy đủ dữ liệu.
- Series showcase đang loading.
- Series showcase API error với nút Retry.
- Header desktop.
- Header mobile menu mở.
- Hover/focus state của Login, Register và CTA.
- Reduced-motion version.
- Transition frame từ Landing Page sang Login.

## 9. Không được thêm

- Manga reader công khai nếu chưa được yêu cầu triển khai.
- Thanh toán hoặc subscription.
- AI manga/image generator.
- Chatbot.
- Social feed, comment cộng đồng hoặc forum.
- Marketplace.
- Tin tức/blog giả.
- Testimonials, đối tác hoặc số liệu người dùng giả.
- Social media link giả.
- Nhân vật/ảnh manga có bản quyền không nằm trong asset dự án.

## 10. Master prompt — Copy trực tiếp vào Google Stitch

```text
Design a premium public landing page for Manga Studio OS, a manga creation workflow and publishing management system. This page appears before authentication and introduces the project to mentors, team members, and new studio users.

The product connects Mangaka, Assistants, Editors, Editorial Board Members, and Admins through a complete workflow: series proposal, editor review, board voting, chapter planning, task assignment, production, manuscript review, publication decision, reader metrics, rankings, and future series directives.

Required navigation behavior:
- Add a sticky header with the Manga Studio OS / MangaFlow logo on the left.
- Add anchor links for Overview, Workflow, Roles, Series, and Features.
- Place Sign in and Create account buttons at the top-right.
- Sign in transitions to the existing Login screen.
- Create account transitions to the existing Authentication screen with Register mode active.
- Do not place the login form inside the landing page and do not use an authentication modal.

Build these sections:
1. Sticky header with authentication actions.
2. Hero explaining that Manga Studio OS turns a manga idea into a publishable series.
3. Project value cards.
4. A clear end-to-end manga production workflow.
5. Role ecosystem for Mangaka, Assistant, Editor, and Editorial Board.
6. A visually strong series catalogue showcase using existing project assets or legal placeholders.
7. Feature highlights for proposals, chapters, tasks, manuscript review, board voting, metrics, rankings, notifications, and role-based access.
8. Final Register/Login call to action.
9. Minimal project footer without fake company or social information.

Visual direction:
- Premium Japanese manga editorial magazine combined with a professional production command center.
- Use manuscript paper (#F5F5F0), white panels, ink black (#141414), action red (#E63946), warning orange (#F39C12), and success green (#2ECC71).
- Use Space Grotesk for headings, Inter for body text, JetBrains Mono for metadata, and restrained Playfair Display editorial accents.
- Use bold 2–4 px black borders, offset hard shadows, subtle halftone textures, red editorial labels, manga-panel composition, and clean line icons.
- Keep it mature, structured, readable, and distinctive. Avoid generic purple/blue AI SaaS gradients, excessive glassmorphism, childish anime styling, and visual clutter.

Motion direction:
- Header fades down gently on load.
- Hero text reveals by line; supporting elements stagger by 60–90 ms.
- Sections fade upward no more than 20 px once when entering the viewport.
- Draw the workflow connector once and highlight workflow nodes in sequence.
- Hard-shadow cards lift 2 px on hover and images zoom no more than 1.035.
- Login/Register actions use a 350–500 ms ink-wipe or manga-panel transition into the existing auth page.
- Do not use looping decorative animations except an extremely subtle halftone background drift.
- Include a prefers-reduced-motion version without translation, parallax, wipe, or zoom.

Design at 1440x900 first, then provide responsive tablet and 390x844 mobile web versions. Use only existing project images or legal placeholders. Do not invent unsupported product features, fake testimonials, fake statistics, public manga reading, payments, AI generators, chatbots, or social feeds.
```

## 11. Prompt tạo riêng transition Landing → Login

```text
Create a short transition prototype from the Manga Studio OS public landing page to the existing Login screen.

Interaction:
1. The user clicks the top-right Sign in button.
2. The button compresses to scale 0.975 for approximately 100 ms.
3. A restrained red-and-black manga ink panel wipes across the viewport in 350–500 ms.
4. The current Manga Studio OS Login card appears with a 16 px upward fade.
5. Keyboard focus moves to the email field after the transition.

Create the same flow for Create account, but open the Register state instead of Login. Do not redesign authentication as a modal. Include a reduced-motion variant using a fast crossfade only.
```

## 12. Nội dung tiếng Việt đề xuất

### Hero

- Label: `MANGA PRODUCTION WORKFLOW SYSTEM`
- Heading: `Nơi một ý tưởng manga trở thành một series được xuất bản.`
- Description: `Kết nối Mangaka, Assistant, Editor và Editorial Board trong một quy trình sáng tác, kiểm duyệt và xuất bản minh bạch.`
- Primary CTA: `Bắt đầu sáng tác`
- Secondary CTA: `Xem quy trình`

### Workflow

- Heading: `Từ bản thảo đầu tiên đến quyết định xuất bản.`
- Description: `Mọi bước, vai trò và trạng thái đều được theo dõi trong cùng một Studio.`

### Series

- Heading: `Series trong Studio`
- Description: `Theo dõi catalogue, tiến độ chapter, lượt bình chọn và tình trạng sản xuất.`

### Final CTA

- Heading: `Sẵn sàng bước vào Studio?`
- Description: `Tham gia quy trình sáng tác manga có tổ chức, minh bạch và chuyên nghiệp.`
- Primary CTA: `Tạo tài khoản`
- Secondary CTA: `Tôi đã có tài khoản`

## 13. Checklist đánh giá kết quả Stitch

- [ ] Người xem hiểu dự án trong 5–10 giây đầu.
- [ ] Login và Register xuất hiện rõ ở góc trên bên phải.
- [ ] Hai nút auth chuyển sang màn Authentication riêng.
- [ ] Workflow manga là nội dung trung tâm.
- [ ] Catalogue series đủ nổi bật để mentor thấy dự án có dữ liệu truyện.
- [ ] Không có chức năng tự bịa thêm.
- [ ] Không có ảnh manga vi phạm bản quyền do Stitch tự lấy.
- [ ] Animation ngắn, có mục đích và không lặp gây mất tập trung.
- [ ] Có bản responsive và reduced-motion.
- [ ] Visual đồng bộ với dashboard Manga Studio OS hiện tại.

## 14. File nên xuất từ Stitch

Ưu tiên một trong các lựa chọn:

1. File `.zip` chứa HTML/CSS/JS và assets.
2. Link Figma có quyền xem.
3. PNG đầy đủ cho desktop, tablet và mobile.
4. Video/GIF thể hiện scroll animation và transition sang Login/Register.
5. Motion specification gồm duration, delay, easing và trigger.

Không cần Stitch tạo backend hoặc thay đổi API.
