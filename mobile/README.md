# Manga Studio Mobile

Mobile companion cho **Manga Creation Workflow and Publishing Management System**. App nằm trong `wdp301-fe/mobile` để dùng chung repository với web frontend, nhưng chạy độc lập bằng Flutter. App hỗ trợ Android, iOS và Web/Chrome.

## Phạm vi mobile

- Đăng nhập, đăng ký role công khai và lưu JWT an toàn.
- Router chuyển đúng luồng theo role giống web FE.
- Dashboard mobile cho Mangaka/Admin và các vai trò chung.
- Assistant xem task, lọc task đang mở/đã duyệt và nộp task.
- Editor xem dashboard, series được giao và xử lý proposal.
- Editorial Board xem proposal voting, directive, publication review và bỏ phiếu.
- Rankings, notifications, profile/logout.
- Chuyển ngôn ngữ Việt/Anh trong Profile.
- Chạy được trên Chrome cho máy không có Android Studio/emulator.

Canvas/annotation chi tiết vẫn nên làm trên web/desktop; mobile tập trung vào điều phối, review nhanh và theo dõi trạng thái.

## Kiến trúc

Dự án dùng `Feature-First` kết hợp các tầng dùng chung:

```text
lib/
  core/
    constants/
    locale/
    network/
    router/
    storage/
    theme/
    utils/
  features/
    admin/
    assistant/
    auth/
    editor/
    editorial_board/
    notifications/
    profile/
    rankings/
    studio_dashboard/
    studio_shell/
  l10n/
  models/
  services/
  widgets/
  main.dart
web/
  index.html
  manifest.json
```

State dùng `flutter_riverpod`, điều hướng dùng `go_router`, networking dùng `dio`, token lưu bằng `flutter_secure_storage`.

## Chạy trên Chrome

Backend local chạy ở `http://localhost:5000` thì chỉ cần:

```powershell
cd C:\Users\USER\Documents\WDP301\wdp301-fe\mobile
flutter pub get
flutter run -d chrome
```

Nếu backend chạy ở máy khác trong LAN, truyền IP backend vào:

```powershell
flutter run -d chrome --dart-define=API_BASE_URL=http://192.168.1.10:5000
```

## Chạy Android emulator

Android emulator không dùng được `localhost` để gọi backend máy host, nên dùng `10.0.2.2`:

```powershell
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000
```

Với máy thật, thay bằng IP LAN của máy đang chạy backend, ví dụ `http://192.168.1.10:5000`.

## Kiểm tra

```powershell
flutter analyze
flutter test
flutter build web
flutter build apk --debug
```

Trong môi trường Codex, mình dùng trực tiếp `dart.exe` cho `analyze` vì wrapper `dart.bat` có lúc bị treo bởi sandbox.
