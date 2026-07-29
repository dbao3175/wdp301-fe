# Manga Studio OS Mobile UI Brief for Google Stitch

> Dùng file này làm brief/prompt cho Google Stitch để thiết kế lại giao diện mobile của dự án Manga Studio OS. Mục tiêu là tạo một bản UI mobile nhìn chuyên nghiệp, giàu chất manga/editorial production, vẫn bám đúng luồng đang có trong dự án FE/BE.

## 1. Project context

Manga Studio OS là hệ thống quản lý quy trình sáng tác và xuất bản manga. Web FE hiện có phong cách mạnh: đen/trắng/đỏ, layout kiểu editorial board, khung viền dày, cảm giác studio vận hành chuyên nghiệp. Mobile hiện mới là bản rút gọn để chạy được trên Android/Chrome/Web, nhưng UI còn đơn giản và thiếu “chất”.

Mobile cần phục vụ các thành viên team có máy yếu, có thể chạy bằng Chrome/Web hoặc mobile emulator. Giao diện cần ưu tiên thao tác nhanh, rõ role, rõ task, rõ trạng thái sản xuất.

## 2. Main design goal

Thiết kế lại mobile UI theo hướng:

- Premium manga production dashboard.
- Editorial studio command center.
- Tối ưu cho màn hình mobile 390x844, nhưng vẫn đẹp khi chạy Chrome/Web dạng mobile viewport.
- Có cảm giác “xịn”, sáng tạo, có chiều sâu thị giác hơn bản hiện tại.
- Giữ nhận diện Manga Studio OS: đỏ, đen, giấy kem, nét manga, viền mạnh.
- Không biến app thành mạng xã hội/truyện đọc; đây là app quản trị quy trình sản xuất manga.

## 3. Visual direction

Style đề xuất:

- Art direction: modern Japanese manga studio operations, editorial dashboard, production board, creative command center.
- Mood: sharp, energetic, premium, slightly playful, not childish.
- Surfaces: warm paper background, black hero panels, red action accents, off-white cards, subtle manga screentone/dot texture.
- Shapes: rounded cards but vẫn có cạnh/viền mạnh, không quá “Material default”.
- Typography: bold condensed headings, clean readable body text.
- Icons: line icons kết hợp manga/editorial symbols như pen nib, storyboard, checklist, clock, crown, vote, upload, notification.
- Motion idea: card stack, swipe actions, bottom sheets, progress rings, status chips.

Color tokens should follow the project:

```text
Ink black:     #161616
Soft black:    #2A2926
Studio red:    #E3424B
Dark red:      #B72530
Paper:         #FFFCF5
Warm white:    #F7F1E8
Canvas beige:  #F2ECE2
Muted text:    #746B60
Line:          #D8D0C4
Sand:          #E9DCC8
Success green: #23875F
Amber:         #B7791F
Blue:          #2D6CDF
Violet:        #7C3AED
```

## 4. Current mobile flows that must be preserved

Do not invent unrelated flows. The mobile app must stay aligned with these roles and screens:

### Auth

- Splash
- Login
- Register
- Language switch VI/EN available before login
- Public registration supports roles during development:
  - MANGAKA
  - ASSISTANT
  - EDITOR
  - BOARD_MEMBER
  - ADMIN

### Studio dashboard

Main landing screen after login. It should show:

- User identity + role.
- Today focus.
- Recent activity.
- Series progress overview.
- Open tasks.
- Pending review counters.
- Fast actions based on role.

### Assistant flow

Screens:

- Assistant Tasks
- Assistant Income

Purpose:

- View assigned production tasks.
- See due date, chapter, series, task status.
- Submit task.
- Track income/payment-like progress.

### Editor flow

Screens:

- Editor Dashboard
- Editor Proposals

Purpose:

- Review manga series proposals.
- Monitor editor queue.
- View recent series.
- Approve/reject/request revision where applicable.

### Editorial Board flow

Screens:

- Board Voting
- Board Publications

Purpose:

- Vote on pending series proposals.
- Review board directives.
- Review chapter publication decisions.
- Show voting tally, accept/reject, total votes, required voters.
- Preserve “majority vote” feel.

### Rankings

Purpose:

- View manga ranking metrics.
- Show votes, rating score, readers, revenue if available.
- Should feel like analytics/leaderboard.

### Notifications

Purpose:

- Show workflow notifications.
- Mark all read.
- Highlight unread or urgent events.

### Profile

Purpose:

- Show user profile, role, email.
- Language switch VI/EN.
- API endpoint info.
- Logout.

### Admin

Purpose:

- Show admin console overview.
- Show audit logs.
- Keep admin screen compact, not overloaded.

## 5. Information architecture

Recommended bottom navigation:

```text
Home      → Studio Dashboard
Work      → Role-based work area
Rankings  → Rankings Dashboard
Inbox     → Notifications
Profile   → Account + Language + Logout
```

Role-based Work tab:

```text
MANGAKA      → Series/tasks overview if available
ASSISTANT    → Assistant Tasks + Income
EDITOR       → Editor Dashboard + Proposals
BOARD_MEMBER → Board Voting + Publications
ADMIN        → Admin Console
```

The UI should make the current role obvious with a role badge and role-colored accent.

## 6. Screen-by-screen design requirements

### 6.1 Login screen

Current issue: too plain, only basic card and fields.

Design a more premium login:

- Top right compact language switch: VI / EN.
- Hero card with Manga Studio OS logo.
- Background with subtle manga paper texture or soft panel shadows.
- Title: “Vào Studio” / “Enter Studio”.
- Subtitle: workflow/productivity focused.
- Email field.
- Password field with visibility toggle.
- Primary red login button.
- Register link.
- Add small trust/status text such as “Studio session secure” or “Workflow sync ready”.
- Avoid clutter.

### 6.2 Register screen

Design a polished onboarding:

- Role selector as beautiful chips/cards, not plain chips.
- Verification code flow should be obvious:
  - Email input
  - Send code button
  - Verification code input
- Role cards should show tiny icons:
  - Mangaka: pen
  - Assistant: checklist
  - Editor: review
  - Board: vote/crown
  - Admin: shield
- CTA: Create account.

### 6.3 Studio Dashboard

Design as a command center:

- Large top greeting card.
- User avatar/initials.
- Role badge.
- “Today focus” horizontal cards:
  - Open tasks
  - Pending reviews
  - Board queue
  - Rankings signal
- Recent activity timeline.
- Series cards with progress bar and status chip.
- Quick actions floating or card-based.

### 6.4 Assistant Tasks

Design as production task board:

- Header: “Production Desk”.
- Filter chips: All, Due soon, Submitted, Revision.
- Task cards:
  - Series title
  - Chapter label
  - Task type
  - Due date urgency
  - Status chip
  - Submit button
- Use timeline/progress treatment instead of plain list.

### 6.5 Assistant Income

Design as earnings dashboard:

- Top balance/income summary card.
- Completed tasks count.
- Pending payment/approved amount.
- Monthly mini chart.
- Payment history rows.

### 6.6 Editor Dashboard

Design as editorial review hub:

- Queue summary.
- Proposal review cards.
- Recent series cards.
- “Needs attention” section.
- Use red/amber priority markers.

### 6.7 Editor Proposals

Design proposal review cards:

- Cover placeholder / thumbnail.
- Title, author, genre.
- Synopsis preview.
- Vote/review status.
- Primary CTA: Review proposal.
- Secondary quick status.

### 6.8 Editorial Board Voting

This is important. Design it as a board decision room:

- Header: “Editorial Board”.
- Subtitle: majority vote required.
- Stats row:
  - Pending proposals
  - Votes cast
  - Majority threshold
- Proposal cards:
  - Cover/thumb.
  - Title.
  - Author.
  - Genre.
  - Voters status like `2 / 4`.
  - Accept/reject tally.
  - CTA: Review & Vote.
- Vote detail bottom sheet/modal:
  - Synopsis.
  - Assigned board members.
  - Existing votes list.
  - Comment input.
  - Accept and Reject buttons.
- Board directives section:
  - Continue / Cancel / Format Change.
  - Status and decision history.

### 6.9 Board Publications

Design publication decision panel:

- Chapter publication queue.
- Chapter cards:
  - Series + chapter title.
  - Editor status.
  - Board vote status.
  - Publish/reschedule action.
- Include decision timeline:
  - Submitted
  - Reviewed
  - Voted
  - Scheduled/Published

### 6.10 Rankings

Design a manga metrics dashboard:

- Leaderboard top 3 with strong visual treatment.
- Ranking cards:
  - Rank number
  - Series title
  - Votes
  - Rating score
  - Reader count
  - Revenue if available
- Filter chips: Weekly, Monthly.
- Small chart or sparkline if possible.

### 6.11 Notifications

Design inbox:

- Group by Today / Earlier.
- Unread red dot.
- Notification type icons:
  - Task assigned
  - Review required
  - Vote required
  - Publication decision
- Mark all read button.

### 6.12 Profile

Design account screen:

- User card with avatar, name, role badge.
- Language switch.
- API endpoint card.
- Session status.
- Logout button.
- Keep it neat and not too empty.

## 7. Component system

Design reusable components:

- StudioHeaderCard
- StudioCard
- StatusPill
- RoleBadge
- TaskCard
- ProposalCard
- VoteTallyCard
- MetricCard
- TimelineItem
- LanguageSegmentedControl
- EmptyState
- ErrorState
- BottomSheetActionPanel

Component style:

- Cards should have layered shadow or offset border, not plain flat rectangles.
- Status chips should be colorful but controlled.
- Primary actions use studio red.
- Destructive/reject actions use red outline or dark red.
- Positive/accept actions use green.
- Warning/revision actions use amber.

## 8. UX improvements to ask Stitch for

Ask Stitch to improve:

- Better visual hierarchy.
- Less empty space on login.
- More distinctive role-based screens.
- Stronger mobile-first layout.
- More expressive empty states.
- Better touch targets.
- More premium dashboard cards.
- Better use of thumbnails/placeholders for manga covers.
- Bottom sheets for detail/vote actions.
- Sticky bottom action on important forms.
- Responsive Chrome/Web mobile viewport.

## 9. Copy style

Tone should be concise and studio-like.

Vietnamese examples:

```text
Vào Studio
Theo dõi series, task, review và quyết định xuất bản ngay trên mobile.
Trọng tâm hôm nay
Hàng chờ hội đồng
Duyệt đề xuất series
Bỏ phiếu
Gửi phiếu
Xuất bản chapter
Đổi lịch xuất bản
Tín hiệu độc giả
Phiên studio đang hoạt động
```

English examples:

```text
Enter Studio
Track series, tasks, reviews and publishing decisions on mobile.
Today focus
Board queue
Series proposal review
Vote
Send vote
Publish chapter
Reschedule publication
Reader signals
Studio session active
```

## 10. Copy-paste prompt for Google Stitch

Use this prompt first:

```text
Design a high-fidelity mobile UI for “Manga Studio OS”, a manga creation workflow and publishing management system.

The app is not a manga reader. It is a professional studio operations app for managing manga series proposals, production tasks, editorial review, board voting, publication decisions, rankings, notifications, and user profile.

Create a premium mobile-first design for 390x844 screens, also suitable for running in Chrome/Web mobile viewport. The style should feel like a modern Japanese manga editorial studio command center: bold, sharp, creative, professional, and visually rich.

Brand direction:
- Ink black #161616
- Studio red #E3424B
- Dark red #B72530
- Warm paper #FFFCF5
- Warm white #F7F1E8
- Canvas beige #F2ECE2
- Muted text #746B60
- Line #D8D0C4
- Use subtle manga paper texture, screentone dots, editorial panel borders, layered cards, role badges, status chips, and strong CTA buttons.

Must include these screens:
1. Login screen with VI/EN language switch before login.
2. Register screen with role selection: Mangaka, Assistant, Editor, Board Member, Admin.
3. Studio Dashboard with today focus, user role badge, recent activity, series progress, quick actions.
4. Assistant Tasks screen as a production task board with due dates and submit actions.
5. Assistant Income screen with income summary and payment/task history.
6. Editor Dashboard with review queue and recent series.
7. Editor Proposals screen with proposal cards and review CTA.
8. Editorial Board Voting screen with majority vote requirement, voters status, proposal cards, vote tally, review & vote action.
9. Board Publications screen with chapter publication queue and decision timeline.
10. Rankings screen with leaderboard, votes, rating score, readers, revenue.
11. Notifications screen grouped by Today/Earlier with unread states.
12. Profile screen with account card, language switch, API endpoint, session status, logout.

Navigation:
- Bottom navigation: Home, Work, Rankings, Inbox, Profile.
- Work tab changes by role:
  - Assistant: Tasks and Income
  - Editor: Dashboard and Proposals
  - Board Member: Voting and Publications
  - Admin: Admin Console

Design requirements:
- Avoid generic Material UI.
- Avoid plain empty cards.
- Use premium dashboard cards, manga cover placeholders, timeline rows, tally cards, action bottom sheets, filter chips, and strong visual hierarchy.
- Keep text readable and touch targets mobile-friendly.
- Vietnamese should render correctly with accents.
- The UI should look much more polished than a simple CRUD app.

Output high-fidelity mobile screens with a consistent component system and design tokens.
```

## 11. Prompt for Editorial Board only

Use this if you want Stitch to focus on the Board flow:

```text
Design the Editorial Board mobile flow for Manga Studio OS.

This flow is for board members who vote on manga series proposals and chapter publication decisions. Majority vote is required.

Create high-fidelity mobile screens:
1. Editorial Board dashboard
2. Pending Series Voting list
3. Review & Vote detail bottom sheet
4. Chapter Publication Review
5. Board Directive Proposals

Use a premium manga editorial command center style: black/red/paper palette, strong panel borders, tally cards, role badges, vote status, assigned voter chips, synopsis cards, timeline history, and clear Accept/Reject actions.

Important data to show:
- Proposal title
- Author
- Genre
- Synopsis
- Assigned board members
- Voters status like 2/4
- Accept count
- Reject count
- Total votes cast
- Majority threshold
- Existing comments
- CTA: Review & Vote
- CTA: Send Vote
- Chapter publication decision: Publish or Reschedule

Make it feel serious, official, and premium, not like a basic list screen.
```

## 12. Prompt for implementation handoff

After Stitch returns a design, use this prompt to convert it into Flutter implementation guidance:

```text
Based on this mobile UI design, create a Flutter implementation plan for an existing Riverpod + GoRouter app.

The existing app has these screens:
- LoginScreen
- RegisterScreen
- StudioDashboardScreen
- AssistantTasksScreen
- AssistantIncomeScreen
- EditorDashboardScreen
- EditorProposalsScreen
- BoardVotingScreen
- BoardPublicationsScreen
- RankingsScreen
- NotificationsScreen
- ProfileScreen
- AdminDashboardScreen

Please break the design into reusable Flutter widgets:
- App theme tokens
- Header cards
- Metric cards
- Task cards
- Proposal cards
- Vote tally cards
- Timeline rows
- Role badges
- Status pills
- Bottom sheets
- Empty/error states

Do not change business logic. Only improve UI structure, components, spacing, visual hierarchy, and responsive behavior.
```

## 13. What not to design

- Do not design manga reading pages.
- Do not design public marketplace/social media features.
- Do not add chat unless it is only a notification/comment concept.
- Do not change the project into a consumer manga app.
- Do not remove role-based workflow.
- Do not hide the Editorial Board flow.

## 14. Success criteria

The resulting UI should feel:

- More premium than the current mobile.
- Clearly connected to Manga Studio OS web design.
- Easy to implement in Flutter.
- Good for Chrome/Web mobile viewport.
- Useful for all project roles.
- Strongest around Assistant, Editor, and Editorial Board workflow.

