# Mobile Source Code Defense Guide

Tai lieu nay dung de di demo lan 2 va tra loi khi hoi dong hoi ve source code phan mobile. Muc tieu cua mobile trong du an hien tai la: dang nhap theo role, xem nhanh cac luong chinh tren man hinh mobile, xem proposal/storyboard truc tiep, va doc truyen/chapter/page truc tiep tren mobile thay vi tai file ve.

## 1. Cach mo nhanh code khi dang demo

Khi hoi dong chi vao mot nut tren man hinh va hoi "code nut nay o dau?", dung 3 cach sau:

1. Mo nhanh bang file path trong IDE:
   - Nhan `Ctrl + P`
   - Dan ten file, vi du: `chapter_reader_screen.dart`
   - Nhan `Ctrl + G`, nhap so dong, vi du: `315`

2. Tim nhanh bang keyword:
   - Nhan `Ctrl + Shift + F`
   - Tim text tren nut, vi du: `PREVIEW`, `CONTINUE CHAPTER`, `submitTask`, `/reader/`
   - IDE se nhay toi dung widget hoac ham xu ly.

3. Dung Flutter Widget Inspector:
   - Chay app o debug mode: `flutter run -d chrome`
   - Mo Flutter DevTools theo link terminal hien ra.
   - Vao tab `Inspector`.
   - Bat che do select widget, sau do click vao nut/card tren man hinh.
   - DevTools se hien cay widget; tu do bam jump/open source de xem widget gan nhat.

Noi voi hoi dong: "Phan mobile duoc tach theo feature folder. Moi man hinh co file screen rieng, data duoc lay qua provider, provider goi service, service goi API backend bang Dio."

## 2. Tong quan cau truc mobile

Thu muc chinh:

- `lib/main.dart`: diem khoi dong app Flutter.
- `lib/app.dart`: cau hinh `MaterialApp.router`, theme, localization, router.
- `lib/core/router/app_router.dart`: khai bao tat ca route va dieu kien phan quyen theo role.
- `lib/core/router/role_home.dart`: mapping role sau khi dang nhap se vao man nao.
- `lib/core/network/api_client.dart`: cau hinh Dio, gan token vao header `Authorization`.
- `lib/core/storage/session_storage.dart`: luu token/user bang `FlutterSecureStorage`.
- `lib/services/studio_services.dart`: service chung goi API backend cho auth, task, proposal, board, ranking, notification, admin.
- `lib/features/...`: moi role/luong nghiep vu co folder rieng.
- `lib/features/reader/...`: phan xem truyen tren mobile.
- `lib/widgets/studio_components.dart`: cac UI component dung chung nhu logo, card, header, metric, error, empty state.

Luong code chung:

```text
main.dart
  -> ProviderScope
  -> MangaStudioMobileApp
  -> MaterialApp.router
  -> appRouterProvider
  -> screen theo route
  -> provider
  -> service
  -> ApiClient
  -> Backend API
```

## 3. App khoi dong va router

### Diem khoi dong app

File: `lib/main.dart`

Y nghia:

- Khoi tao Flutter app.
- Boc app trong `ProviderScope` de Riverpod provider hoat dong toan app.
- Goi `MangaStudioMobileApp`.

Khi hoi dong hoi "vi sao dung ProviderScope?", tra loi:

"Em dung Riverpod de quan ly state va API async. ProviderScope la root container giup cac provider nhu auth, user session, reader data, task data duoc truy cap o moi man hinh."

### App root

File: `lib/app.dart`

Class chinh: `MangaStudioMobileApp`

Y nghia:

- Lay router tu `appRouterProvider`.
- Cau hinh theme mobile.
- Gan localization.
- Dung `MaterialApp.router` de app dieu huong bang `go_router`.

### Router va phan quyen

File: `lib/core/router/app_router.dart`

Nhung dong quan trong:

- Dong 27: `appRouterProvider` tao `GoRouter`.
- Dong 30: `initialLocation: '/splash'`.
- Dong 34-37: route auth: splash, login, register.
- Dong 38-43: route doc chapter: `/reader/:chapterId`.
- Dong 44-49: route xem proposal truc tiep: `/proposal/:proposalId/preview`.
- Dong 50-88: `ShellRoute`, cac man sau dang nhap dung chung top bar va bottom menu.
- Dong 154-167: ham `redirect` xu ly neu chua login thi day ve login, login roi thi day ve home theo role.
- Dong 169-193: ham `_allowed` chan role vao sai man.

Noi voi hoi dong:

"Mobile khong de user tu do vao moi man. Route nao cung di qua `_allowed`. Vi du assistant chi vao `/assistant`, editor vao `/editor`, board vao `/board`, admin vao `/admin`. Cac route doc truyen va xem proposal duoc mo read-only cho cac role can xem."

## 4. Dang nhap, dang ky va dieu huong theo role

### Login

File: `lib/features/auth/screens/login_screen.dart`

Nhung dong quan trong:

- Dong 21-23: controller cho email/password.
- Dong 33: ham `_submit()` xu ly dang nhap.
- Dong 39-40: sau khi login thanh cong, lay role va `context.go(RoleHome.pathFor(session.user.role))`.
- Dong 44-49: `build()` lay auth state tu Riverpod.
- Dong 178: nut chuyen sang register.

Neu hoi "nut Dang nhap goi API o dau?", tra loi:

"Nut dang nhap goi `_submit()` trong `login_screen.dart`. Ham nay goi `authControllerProvider.notifier.login()`. Controller goi `AuthService.login()` trong `studio_services.dart`, API la `/api/auth/login`."

Chuoi code:

```text
login_screen.dart
  -> authControllerProvider.notifier.login()
  -> auth_provider.dart
  -> AuthService.login()
  -> studio_services.dart /api/auth/login
  -> session_storage.dart luu token
  -> role_home.dart chon man home theo role
```

### Register

File: `lib/features/auth/screens/register_screen.dart`

Nhung dong quan trong:

- Dong 21-25: controller cho name, email, password, verification code.
- Dong 38: `_sendCode()` gui ma xac thuc.
- Dong 59: `_submit()` dang ky user.
- Dong 79-84: danh sach role cho phep chon khi dang ky.
- Dong 167: UI chon role.

Noi voi hoi dong:

"Vi du giai doan phat trien nhom can test nhieu role, mobile cho dang ky Mangaka, Assistant, Editor, Board, Admin. Khi deploy that co the khoa Admin/Board lai ben backend."

### Role home

File: `lib/core/router/role_home.dart`

Y nghia:

- Assistant vao `/assistant/tasks`.
- Editor vao `/editor/dashboard`.
- Board vao `/board/voting`.
- Admin vao `/admin`.
- Mangaka vao `/app`.

## 5. Shell mobile: top bar va bottom menu

File: `lib/features/studio_shell/screens/studio_shell.dart`

Man hinh nao sau khi login cung nam trong `StudioShell`.

Nhung dong quan trong:

- Dong 18: lay session hien tai tu `authControllerProvider`.
- Dong 23: lay route hien tai.
- Dong 24: lay menu theo role bang `_itemsFor`.
- Dong 27-44: top app bar gom logo, nut notification, avatar.
- Dong 46-74: bottom navigation.
- Dong 78-130: danh sach menu theo role.
- Dong 143-181: widget `_NavButton`, ve tung nut bottom menu.

Khi hoi "vi sao menu moi role khac nhau?", tra loi:

"Em tach menu o ham `_itemsFor`. Role assistant co Task/Income/Library/Profile, editor co Dashboard/Proposals/Library/Rankings/Profile, board co Board/Library/Rankings/Profile, admin chi co Admin/Profile. Cach nay giup UI gon va han che role thay chuc nang khong thuoc phan minh."

## 6. Mangaka / Studio Dashboard mobile

File: `lib/features/studio_dashboard/screens/studio_dashboard_screen.dart`

Provider: `lib/features/studio_dashboard/providers/studio_dashboard_provider.dart`

Chuc nang hien tai:

- Hien tong quan studio tren mobile.
- Hien task dang mo, deadline gan, proposal/series lien quan.
- Dung cho Mangaka hoac role mac dinh khi vao `/app`.

Nhung diem can giai thich:

- Screen watch `studioOverviewProvider`.
- Provider goi `StudioService` de lay series, chapter, task, rankings, proposals tuy theo role.
- Day la man dashboard tong hop, khong lam cac thao tac phuc tap nhu ve vung/giao task chi tiet tren mobile. Cac thao tac nang hon duoc lam tren web.

Noi voi hoi dong:

"Mobile cua Mangaka o muc companion app: xem tien do, xem du lieu tong quan, doc truyen/proposal truc tiep. Cac thao tac chi tiet nhu chon vung tren page de giao task van uu tien web vi can man hinh rong va thao tac canvas chinh xac."

## 7. Assistant role

### Danh sach task

File: `lib/features/assistant/screens/assistant_tasks_screen.dart`

Provider: `lib/features/assistant/providers/assistant_provider.dart`

Nhung dong quan trong:

- Dong 27: watch `assistantTasksProvider`.
- Dong 30: pull-to-refresh invalidate provider.
- Dong 41-45: filter task da duyet/chua duyet.
- Dong 76: `_AssistantTaskCard`.
- Dong 81: `_canSubmit` chan submit lai neu task da submitted/approved/completed.
- Dong 137: nut submit task.
- Dong 145-150: `_submit()` goi API submit task va refresh data.

Chuoi code khi bam submit:

```text
assistant_tasks_screen.dart _submit()
  -> studioServiceProvider.submitTask(task.id)
  -> studio_services.dart submitTask()
  -> PUT /api/assistant/tasks/{taskId}/submit
  -> invalidate assistantTasksProvider + studioOverviewProvider
```

Noi voi hoi dong:

"Assistant khong can man hinh qua phuc tap tren mobile. Ban mobile tap trung vao xem task duoc giao va submit trang da lam. Sau khi submit, provider duoc invalidate de UI load lai trang thai moi tu backend."

### Thu nhap assistant

File: `lib/features/assistant/screens/assistant_income_screen.dart`

Provider: `assistantIncomeProvider`

API:

- `GET /api/assistant/income/tasks`
- `GET /api/assistant/income/analytics`

Noi voi hoi dong:

"Thu nhap khong tinh o frontend. Mobile chi lay summary va analytics tu backend, sau do hien approved tasks, monthly analytics va recent approved work."

## 8. Tantou Editor role

### Editor Dashboard

File: `lib/features/editor/screens/editor_dashboard_screen.dart`

Provider: `lib/features/editor/providers/editor_provider.dart`

API:

- `GET /api/editor/dashboard`
- `GET /api/editor/my-series`

Chuc nang:

- Xem tong quan production.
- Xem series gan day.
- Theo doi proposal/series can xu ly.

Noi voi hoi dong:

"Editor mobile la man theo doi nhanh. Viec comment truc tiep/mark tren trang truyen neu can thao tac canvas chi tiet thi duoc uu tien tren web, con mobile cho xem nhanh va dieu huong toi proposal preview."

### Proposal list

File: `lib/features/editor/screens/editor_proposals_screen.dart`

Nhung dong quan trong:

- Dong 17: watch `editorProposalsProvider`.
- Dong 38: noi ro thao tac review/comment nang hon nam tren Web.
- Dong 106: nut `PREVIEW`/`XEM TRUC TIEP`.
- Dong 115-126: `_openPreview()`, neu proposal co id thi `context.push('/proposal/${proposal.id}/preview')`.

Noi voi hoi dong:

"Mobile khong tai proposal ve file nua. Nut preview mo route xem truc tiep `/proposal/:proposalId/preview`, dung de bao ve ban thao va tranh viec tai file ve may."

## 9. Editorial Board role

File: `lib/features/editorial_board/screens/board_voting_screen.dart`

Provider: `lib/features/editorial_board/providers/board_provider.dart`

Nhung dong quan trong:

- Dong 17: watch `boardSubmissionsProvider`.
- Dong 21-25: header noi ro Board xem danh sach proposal tren mobile.
- Dong 70: `_SubmissionCard`.
- Dong 146: nut preview.
- Dong 155-166: `_openPreview()`, mo route proposal preview neu co `proposalId`.

Noi voi hoi dong:

"Board tren mobile chi xem proposal read-only. Cac thao tac vote/cham diem phuc tap co the lam tren web de tranh nhap lieu sai tren man hinh nho. Dieu nay phu hop yeu cau Board/Editor chi xem noi dung, khong download ban thao."

## 10. Admin role

File: `lib/features/admin/screens/admin_dashboard_screen.dart`

Provider: `lib/features/admin/providers/admin_provider.dart`

Chuc nang:

- Quan ly user.
- Xem/thao tac notification he thong.
- Xem audit logs.

Nhung dong quan trong:

- Dong 66: watch `adminUsersProvider`.
- Dong 84: nut them user.
- Dong 135: watch `adminNotificationsProvider`.
- Dong 146: tao notification.
- Dong 184: watch `adminAuditProvider`.
- Dong 216: modal form tao/sua user.
- Dong 314: toggle user status.
- Dong 328: delete user.
- Dong 397-404: gui notification.

Noi voi hoi dong:

"Admin mobile la console rut gon de quan ly nguoi dung/thong bao/nhat ky. Neu hoi vi sao khac web: mobile la ban companion, nen chi giu cac thao tac quan tri can thiet, khong can day tat ca layout desktop len man hinh nho."

## 11. Xem proposal truc tiep, khong tai ve

File: `lib/features/proposals/screens/proposal_preview_screen.dart`

Route: `/proposal/:proposalId/preview`

Provider: `lib/features/proposals/providers/proposal_preview_provider.dart`

API:

- `GET /api/series/proposal/{proposalId}`

Nhung dong quan trong:

- Dong 18: watch `proposalPreviewProvider(proposalId)`.
- Dong 24-34: nut Back.
- Dong 49-52: lay `storyboardImages`, chuyen thanh URL doc duoc bang `readerMediaUrl`.
- Dong 53-77: dung `ListView.builder` de hien tung trang.
- Dong 141-200: `_StoryboardPage`, moi anh ban thao duoc render bang `Image.network`.
- Dong 173: `AbsorbPointer`, chan thao tac cham truc tiep len anh.
- Dong 187-195: fallback neu anh loi.

Noi voi hoi dong:

"Truoc day neu co nut tai file proposal thi de lo file ra may nguoi dung. Em doi sang preview truc tiep. Mobile lay danh sach storyboard image tu API va render bang `Image.network`, khong cung cap nut download. `AbsorbPointer` giup anh chi la noi dung xem, khong co thao tac edit/download trong UI."

Luu y bao mat can noi dung muc:

- Frontend chi han che trai nghiem tai ve, khong the chong 100% viec chup man hinh hay lay network request.
- Bao mat that su phai co backend signed URL, token, role permission, watermark, expire link.
- Mobile hien tai la lop UI read-only de dung demo, khong phai DRM tuyet doi.

## 12. Xem truyen tren mobile

Day la phan quan trong nhat cua mobile.

### Catalogue: danh sach series

File: `lib/features/reader/screens/reader_catalogue_screen.dart`

Route: `/library`

Provider: `readerCatalogueProvider`

API: `GET /api/reader/series`

Nhung dong quan trong:

- Dong 33: watch `readerCatalogueProvider`.
- Dong 46-54: loc tim kiem theo title, author, genre, tags.
- Dong 55-58: pull-to-refresh.
- Dong 91-109: o search.
- Dong 143-148: card series, bam vao `context.go('/series/${filtered[index].id}')`.
- Dong 151-165: neu man rong hon thi chuyen sang grid 2 cot.
- Dong 227-335: `_SeriesCard`, hien cover, title, author, so chapter, so page, trang thai san sang doc.

Noi voi hoi dong:

"Catalogue lay data that tu backend `/api/reader/series`. Frontend khong hardcode truyen; UI chi render danh sach backend tra ve. Search chay local tren danh sach da load de demo nhanh tren mobile."

### Series detail: danh sach chapter

File: `lib/features/reader/screens/reader_series_screen.dart`

Route: `/series/:seriesId`

Provider: `readerSeriesProvider(seriesId)`

API: `GET /api/reader/series/{id}`

Nhung dong quan trong:

- Dong 19: watch `readerSeriesProvider(seriesId)`.
- Dong 44: lay resume progress da luu.
- Dong 45-47: chi tinh chapter co page.
- Dong 71-77: nut back ve library.
- Dong 105-118: nut continue chapter neu co tien do dang doc.
- Dong 145-158: danh sach chapter; chapter co page thi bam vao `/reader/{chapter.id}`.
- Dong 170-260: `_SeriesHero`, hien cover, title, genre, author, chapter/page count.
- Dong 263-333: `_ChapterCard`, hien tung chapter va khoa chapter chua co page.

Noi voi hoi dong:

"Mot series co nhieu chapter. Screen nay lay series detail tu backend, render danh sach chapter. Chapter nao chua co page thi disabled, chapter nao co page thi bam vao reader."

### Chapter reader: doc tung page

File: `lib/features/reader/screens/chapter_reader_screen.dart`

Route: `/reader/:chapterId`

Provider: `readerChapterProvider(chapterId)`

API: `GET /api/reader/chapters/{id}`

Nhung dong quan trong:

- Dong 25: `ScrollController` de theo doi cuon doc.
- Dong 37-48: `_onScroll()` tinh page hien tai theo vi tri scroll.
- Dong 50-64: `_queueSave()` va `_saveProgress()` luu tien do doc.
- Dong 66-80: `_restoreProgress()` doc lai vi tri cu va jump toi page da doc.
- Dong 88-95: khi thoat man hinh van save progress lan cuoi.
- Dong 102: watch `readerChapterProvider(widget.chapterId)`.
- Dong 108-117: nut Back.
- Dong 150-168: badge hien page hien tai/tong so page.
- Dong 197-225: `ListView.separated` render cac page theo chieu doc doc.
- Dong 201: `scrollCacheExtent` preload them anh de scroll muot hon.
- Dong 226-252: floating badge duoi man hinh hien `PAGE x / total`.
- Dong 298-385: `_PageImage`, render tung page bang `Image.network`.
- Dong 315-320: `Image.network`, `fit: BoxFit.fitWidth` giup trang truyen fit ngang man hinh mobile.
- Dong 321-349: loading state tung page.
- Dong 350-380: error state tung page va nut retry.

Noi voi hoi dong:

"Yeu cau mobile la xem truyen scroll/swipe muot. Em dung `ListView.separated` voi `ScrollController`, moi page la `Image.network` fit ngang man hinh. Khi user cuon, `_onScroll()` tinh page hien tai va `_saveProgress()` luu tien do. Lan sau mo lai series se co nut continue."

## 13. Data layer cua reader

### Provider

File: `lib/features/reader/providers/reader_providers.dart`

Provider chinh:

- `readerCatalogueProvider`: lay danh sach series.
- `readerSeriesProvider`: lay chi tiet 1 series.
- `readerChapterProvider`: lay chi tiet 1 chapter va pages.
- `readerResumeProvider`: lay tien do doc local.

Noi voi hoi dong:

"Em dung `FutureProvider` cho API async. UI khong goi API truc tiep ma watch provider. Khi refresh hoac retry thi invalidate provider de load lai data."

### Service

File: `lib/features/reader/services/reader_service.dart`

API:

- `GET /api/reader/series`
- `GET /api/reader/series/{id}`
- `GET /api/reader/chapters/{id}`

Noi voi hoi dong:

"Reader service tach rieng de neu backend doi endpoint thi chi sua o service, khong phai sua toan bo UI."

### Model

File: `lib/features/reader/models/reader_models.dart`

Model chinh:

- `ReaderSeries`: thong tin series, cover, banner, status, chapterCount, pageCount, chapters.
- `ReaderChapterSummary`: thong tin tom tat chapter trong man series detail.
- `ReaderPage`: mot trang truyen, gom id, number, imageUrl.
- `ReaderChapter`: chi tiet chapter, gom seriesId, seriesTitle, number, title, pages.
- `ReaderResume`: chapterId va pageIndex dang doc.

Ham quan trong:

- `readerMediaUrl()`: chuyen relative path tu backend thanh absolute URL dua tren `AppConstants.apiBaseUrl`.

Noi voi hoi dong:

"Backend co the tra image URL tu Cloudinary hoac relative upload path. `readerMediaUrl()` giup frontend chuan hoa URL, neu la relative thi resolve theo base API."

### Luu tien do doc

File: `lib/features/reader/services/reader_progress_storage.dart`

Y nghia:

- Luu page dang doc vao local secure storage/shared storage tuy implementation.
- Moi series co resume rieng.
- Chapter reader goi save khi cuon va khi thoat man.

Noi voi hoi dong:

"Tien do doc la local UX data, khong bat buoc backend. Neu sau nay can dong bo nhieu may thi co the day logic nay len API."

## 14. API va auth token

### ApiClient

File: `lib/core/network/api_client.dart`

Nhung dong quan trong:

- Dong 16: baseUrl lay tu `AppConstants.apiBaseUrl`.
- Dong 25-27: interceptor doc token va gan `Authorization: Bearer <token>`.
- Dong 38-67: helper `getMap`, `getList`, `postMap`, `putMap`, `patchMap`, `deleteMap`.
- Dong 76 tro di: unwrap response data.

Noi voi hoi dong:

"Tat ca API di qua `ApiClient`, khong viet Dio lung tung trong UI. Interceptor tu dong gan Bearer token nen backend co the check role/quyen."

### SessionStorage

File: `lib/core/storage/session_storage.dart`

Nhung dong quan trong:

- Dong 10-17: provider va class `SessionStorage`.
- Dong 19-34: doc token/user.
- Dong 35-40: save token/user sau login/register.
- Dong 41: lay token cho ApiClient.
- Dong 43-45: clear session khi logout.

Noi voi hoi dong:

"Token khong luu trong bien global. Em luu bang `FlutterSecureStorage`, khi app mo lai `AuthController.restore()` doc session de giu dang nhap."

## 15. Giao dien dung chung

File: `lib/widgets/studio_components.dart`

Component hay duoc hoi:

- `StudioLogo`: logo app.
- `StudioPage`: layout page chuan.
- `StudioCard`: card co border/shadow theo style manga studio.
- `StudioHeaderCard`: banner dau moi man hinh.
- `SectionHeader`: tieu de section.
- `MetricTile`: o thong ke.
- `StatusPill`: badge trang thai.
- `EmptyState`, `ErrorState`, `LoadingPanel`: state UI dung lai nhieu noi.
- `AvatarBadge`: avatar top bar.

Noi voi hoi dong:

"Em tach component dung chung de UI dong bo giua cac role. Khi can sua style chung, chi can sua trong `studio_components.dart` thay vi sua tung screen."

## 16. Bang map nhanh: man hinh -> file -> hoi dong hoi gi

| Man hinh tren mobile | Route | File can mo | Neu hoi thi noi ngan gon |
| --- | --- | --- | --- |
| Splash | `/splash` | `lib/features/auth/screens/splash_screen.dart` | Kiem tra session cu, co token thi vao role home, khong co thi login. |
| Login | `/auth/login` | `lib/features/auth/screens/login_screen.dart` | Form email/password, goi auth provider, login xong route theo role. |
| Register | `/auth/register` | `lib/features/auth/screens/register_screen.dart` | Tao account moi, gui verification code, chon role demo. |
| Main shell | Moi route sau login | `lib/features/studio_shell/screens/studio_shell.dart` | Top bar, notification, avatar, bottom nav theo role. |
| Mangaka dashboard | `/app` | `lib/features/studio_dashboard/screens/studio_dashboard_screen.dart` | Tong quan studio, task, series/proposal lien quan. |
| Assistant task | `/assistant/tasks` | `lib/features/assistant/screens/assistant_tasks_screen.dart` | Xem task duoc giao, filter, submit task. |
| Assistant income | `/assistant/income` | `lib/features/assistant/screens/assistant_income_screen.dart` | Xem thu nhap theo task approved va analytics. |
| Editor dashboard | `/editor/dashboard` | `lib/features/editor/screens/editor_dashboard_screen.dart` | Editor theo doi production va series minh phu trach. |
| Editor proposals | `/editor/proposals` | `lib/features/editor/screens/editor_proposals_screen.dart` | Xem proposal list va mo preview truc tiep. |
| Board voting | `/board/voting` | `lib/features/editorial_board/screens/board_voting_screen.dart` | Board xem proposal read-only tren mobile. |
| Admin | `/admin` | `lib/features/admin/screens/admin_dashboard_screen.dart` | User, notification, audit log mobile console. |
| Notifications | `/notifications` | `lib/features/notifications/screens/notifications_screen.dart` | Xem thong bao, mark read, mark all read. |
| Profile | `/profile` | `lib/features/profile/screens/profile_screen.dart` | Xem user/session, logout, endpoint. |
| Reader catalogue | `/library` | `lib/features/reader/screens/reader_catalogue_screen.dart` | Danh sach manga tu backend, search, bam vao series. |
| Series detail | `/series/:seriesId` | `lib/features/reader/screens/reader_series_screen.dart` | Mot series co nhieu chapter, chapter co page thi doc duoc. |
| Chapter reader | `/reader/:chapterId` | `lib/features/reader/screens/chapter_reader_screen.dart` | Cuon doc tung page, fit mobile, auto save progress. |
| Proposal preview | `/proposal/:proposalId/preview` | `lib/features/proposals/screens/proposal_preview_screen.dart` | Xem storyboard/proposal truc tiep, khong download. |

## 17. Cac cau hoi hoi dong hay hoi va cau tra loi

### Cau hoi: "Mobile nay co phai app rieng khong hay chi la web responsive?"

Tra loi:

"Day la Flutter app dat trong `wdp301-fe/mobile`, co cau truc rieng, dependency rieng trong `pubspec.yaml`. App co the chay Android/iOS va Chrome web bang Flutter. No goi chung backend voi web FE."

### Cau hoi: "Tai sao dung Flutter?"

Tra loi:

"Vi nhom can mot app mobile companion co the chay tren Chrome cho may yeu va cung co duong len Android/iOS. Flutter giup dung mot codebase cho mobile va web, UI nhat quan, scroll reader muot hon khi hien nhieu page anh."

### Cau hoi: "State management o dau?"

Tra loi:

"Em dung Riverpod. Moi feature co provider rieng, vi du reader co `reader_providers.dart`, assistant co `assistant_provider.dart`, editor co `editor_provider.dart`. UI chi `ref.watch(provider)` va render loading/error/data."

### Cau hoi: "API goi o dau?"

Tra loi:

"API tap trung trong `StudioService` va `ReaderService`, con `ApiClient` la lop dung chung cau hinh Dio. UI khong goi Dio truc tiep de tranh bi roi va de de test."

### Cau hoi: "Token dang nhap luu o dau?"

Tra loi:

"Token va user duoc luu trong `SessionStorage` bang `FlutterSecureStorage`. `ApiClient` doc token va gan vao header `Authorization` moi request."

### Cau hoi: "Mangaka co chon vung tren page va giao task tren mobile khong?"

Tra loi:

"Hien tai mobile chi o muc basic companion theo scope moi: xem dashboard, xem truyen/proposal, theo doi thong bao. Chon vung tren canvas la thao tac can man hinh rong va do chinh xac cao nen de tren web FE. Mobile co the mo rong sau bang canvas gesture, nhung demo lan nay mobile tap trung vao doc truyen truc tiep va cac role screen co ban."

### Cau hoi: "Board va Editor co download file khong?"

Tra loi:

"Khong. Tren mobile, Board va Editor mo proposal preview truc tiep bang route `/proposal/:proposalId/preview`. UI render storyboard image truc tiep bang `Image.network`, khong co nut download."

### Cau hoi: "Xem truyen co download anh ve may khong?"

Tra loi:

"Nguoi dung khong co nut download. App render anh truc tiep tu URL backend trong `ChapterReaderScreen`. Ve ky thuat, bat ky web/mobile app hien anh deu co request network, nen bao ve tuyet doi phai ket hop backend signed URL, watermark va expire link. Frontend mobile da lam dung lop UI read-only, khong cung cap download."

### Cau hoi: "Doc truyen scroll muot o dau?"

Tra loi:

"Trong `chapter_reader_screen.dart`, em dung `ListView.separated` va `scrollCacheExtent` de preload them vung anh, moi page dung `Image.network` voi `BoxFit.fitWidth`. `ScrollController` theo doi vi tri de tinh page hien tai va luu tien do."

### Cau hoi: "Neu anh loi thi sao?"

Tra loi:

"Widget `_PageImage` co `errorBuilder`, hien trang loi va nut retry. Khi bam retry, state `_attempt` tang len de doi key image, Flutter load lai anh."

### Cau hoi: "Vi sao tach ReaderService rieng khoi StudioService?"

Tra loi:

"Reader la luong doc truyen co model va endpoint rieng, nen tach service giup code ro nghiep vu: studio service cho workflow, reader service cho catalogue/series/chapter/page."

### Cau hoi: "Role nao duoc vao man nao?"

Tra loi:

"Phan quyen route nam trong `_allowed` cua `app_router.dart`. Assistant chi vao assistant, editor vao editor va rankings, board vao board va rankings, admin vao admin, cac route reader/proposal preview la read-only cho role can xem."

## 18. Demo script ngan cho phan mobile

1. Mo app mobile tren Chrome:
   - "Day la mobile companion cua Manga Studio OS, code Flutter nam trong `wdp301-fe/mobile`."

2. Dang nhap:
   - "Man login goi `AuthController`, controller goi `AuthService.login`, token luu bang secure storage."

3. Chuyen role:
   - "Sau login, `RoleHome.pathFor()` dua user ve dung man theo role."

4. Chi vao bottom menu:
   - "Bottom menu nam trong `StudioShell`. Ham `_itemsFor()` tao menu rieng cho tung role."

5. Mo Library:
   - "Danh sach series lay tu `/api/reader/series`, khong hardcode tren UI."

6. Bam mot series:
   - "Series detail lay `/api/reader/series/{id}`, trong series co danh sach chapter."

7. Bam chapter:
   - "Chapter reader lay `/api/reader/chapters/{id}`, moi chapter co nhieu page, moi page la mot image URL."

8. Cuon doc:
   - "ScrollController tinh page hien tai, UI hien PAGE x/total va auto save progress."

9. Quay lai series:
   - "Neu da doc do dang, man series co nut continue chapter/page da luu."

10. Mo editor/board proposal:
   - "Editor va Board chi co preview truc tiep, khong co download. Cac thao tac review phuc tap de tren web."

## 19. Nhung diem nen chu dong note voi hoi dong

- Mobile hien tai la ban basic theo scope moi, uu tien doc truyen va preview truc tiep.
- Cac thao tac can canvas chinh xac nhu chon vung page, comment truc tiep len khung hinh, approve/reject chi tiet nen de web FE.
- FE mobile da co cau truc mo rong tot: feature folder, provider, service, model, router, shared widgets.
- Neu hoi dong yeu cau tang bao mat ban quyen, buoc tiep theo la backend signed URL, watermark user/session, expire image link, block public static path, audit log khi xem.
- Neu hoi dong yeu cau mobile nang cao hon, co the them pinch zoom, page prefetch, offline cache co ma hoa, va mode doc ngang/doc doc.

## 20. Checklist truoc khi demo

- BE dang chay va mobile tro dung `AppConstants.apiBaseUrl`.
- Dang nhap duoc it nhat 4 role: Mangaka, Assistant, Editor, Board.
- Library co series that va chapter co page.
- Bam series -> thay chapter.
- Bam chapter -> anh load duoc, cuon muot.
- Bam proposal preview tu Editor/Board -> co nut back va hien page truc tiep.
- Notification khong crash khi bam.
- Profile logout duoc.
- Neu bi hoi code, mo file bang `Ctrl+P`, hoac dung Flutter Widget Inspector click vao UI.
