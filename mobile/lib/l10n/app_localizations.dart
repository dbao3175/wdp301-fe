import 'package:flutter/material.dart';

class AppLocalizations {
  const AppLocalizations(this.locale);

  final Locale locale;

  static const supportedLocales = [Locale('vi'), Locale('en')];
  static const delegate = _AppLocalizationsDelegate();

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  bool get isVi => locale.languageCode == 'vi';

  String get appName => 'Manga Studio OS';
  String get appSubtitle => isVi
      ? 'Quản lý sáng tác và xuất bản manga'
      : 'Manga creation and publishing workflow';
  String get loginTitle => isVi ? 'Vào Studio' : 'Enter Studio';
  String get loginSubtitle => isVi
      ? 'Theo dõi series, task, review và quyết định xuất bản ngay trên mobile.'
      : 'Track series, tasks, reviews and publishing decisions on mobile.';
  String get email => 'Email';
  String get password => isVi ? 'Mật khẩu' : 'Password';
  String get fullName =>
      isVi ? 'Họ tên / nhóm studio' : 'Full name / studio group';
  String get verificationCode => isVi ? 'Mã xác thực' : 'Verification code';
  String get sendCode => isVi ? 'Gửi mã' : 'Send code';
  String get signIn => isVi ? 'Đăng nhập' : 'Sign in';
  String get register => isVi ? 'Đăng ký' : 'Register';
  String get createAccount => isVi ? 'Tạo tài khoản' : 'Create account';
  String get haveAccount =>
      isVi ? 'Đã có tài khoản? Đăng nhập' : 'Already have an account? Sign in';
  String get noAccount =>
      isVi ? 'Chưa có tài khoản? Đăng ký' : 'No account? Register';
  String get role => isVi ? 'Vai trò' : 'Role';
  String get studio => 'Studio';
  String get workspace => isVi ? 'Công việc' : 'Work';
  String get assistant => 'Assistant';
  String get editor => 'Editor';
  String get board => 'Board';
  String get rankings => isVi ? 'Xếp hạng' : 'Rankings';
  String get inbox => isVi ? 'Thông báo' : 'Inbox';
  String get profile => isVi ? 'Tài khoản' : 'Account';
  String get admin => 'Admin';
  String get dashboard => isVi ? 'Bảng điều khiển' : 'Dashboard';
  String get todayFocus => isVi ? 'Trọng tâm hôm nay' : 'Today focus';
  String get series => 'Series';
  String get chapters => isVi ? 'Chapter' : 'Chapters';
  String get tasks => 'Task';
  String get proposals => isVi ? 'Đề xuất' : 'Proposals';
  String get publications => isVi ? 'Xuất bản' : 'Publication';
  String get pendingReview => isVi ? 'Chờ review' : 'Pending review';
  String get openTasks => isVi ? 'Task đang mở' : 'Open tasks';
  String get dueSoon => isVi ? 'Gần deadline' : 'Due soon';
  String get noData =>
      isVi ? 'Chưa có dữ liệu phù hợp.' : 'No matching data yet.';
  String get retry => isVi ? 'Thử lại' : 'Retry';
  String get submitTask => isVi ? 'Nộp task' : 'Submit task';
  String get taskSubmitted =>
      isVi ? 'Đã nộp task để kiểm duyệt.' : 'Task submitted for review.';
  String get proposalReview =>
      isVi ? 'Duyệt đề xuất series' : 'Series proposal review';
  String get publicationReview =>
      isVi ? 'Duyệt xuất bản chapter' : 'Chapter publication review';
  String get vote => isVi ? 'Bỏ phiếu' : 'Vote';
  String get openReview => isVi ? 'Mở review' : 'Open review';
  String get accept => isVi ? 'Đồng ý' : 'Accept';
  String get reject => isVi ? 'Từ chối' : 'Reject';
  String get publish => isVi ? 'Xuất bản' : 'Publish';
  String get reschedule => isVi ? 'Đổi lịch' : 'Reschedule';
  String get comment => isVi ? 'Nhận xét' : 'Comment';
  String get sendVote => isVi ? 'Gửi phiếu' : 'Send vote';
  String get language => isVi ? 'Ngôn ngữ' : 'Language';
  String get vietnamese => isVi ? 'Tiếng Việt' : 'Vietnamese';
  String get english => isVi ? 'Tiếng Anh' : 'English';
  String get logout => isVi ? 'Đăng xuất' : 'Sign out';
  String get apiEndpoint => 'API endpoint';
  String get accountActive =>
      isVi ? 'Phiên studio đang hoạt động' : 'Studio session active';
  String get markAllRead => isVi ? 'Đọc tất cả' : 'Mark all read';
  String get recentActivity => isVi ? 'Hoạt động gần đây' : 'Recent activity';
  String get readerSignals => isVi ? 'Tín hiệu độc giả' : 'Reader signals';
  String get adminConsole => isVi ? 'Bảng quản trị' : 'Admin console';
  String get income => isVi ? 'Thu nhập' : 'Income';
  String get production => isVi ? 'Sản xuất' : 'Production';
  String get recentSeries => isVi ? 'Series gần đây' : 'Recent series';
  String get editorQueue => isVi ? 'Hàng chờ editor' : 'Editor queue';
  String get boardQueue => isVi ? 'Hàng chờ hội đồng' : 'Board queue';
  String get webNoticeTitle => isVi
      ? 'Chế độ Mobile Companion'
      : 'Mobile Companion Mode';
  String get webNoticeBody => isVi
      ? 'App mobile tập trung theo dõi thông báo và trạng thái các bên. Đăng nhập bản Web để thực hiện thao tác canvas & chỉnh sửa phức tạp.'
      : 'Mobile app is optimized for real-time notifications & status monitoring. Log into Web for full canvas & complex editing.';
  String get openWebHint => isVi
      ? 'Mở bản Web khi cần thao tác chi tiết'
      : 'Open Web app for complex tasks';
  String get roleStatusOverview => isVi
      ? 'Trạng thái quy trình các bên'
      : 'Role Workflow Status Overview';
  String get downloadProposal => isVi ? 'Tải bản thảo' : 'Download Proposal';
  String get downloadingProposal => isVi
      ? 'Đang tải bản thảo...'
      : 'Downloading manuscript...';


  String roleLabel(String role) => switch (role) {
        'ADMIN' => isVi ? 'Quản trị viên' : 'Admin',
        'MANGAKA' => 'Mangaka',
        'ASSISTANT' => isVi ? 'Trợ lý' : 'Assistant',
        'EDITOR' => isVi ? 'Biên tập viên' : 'Editor',
        'BOARD_MEMBER' => isVi ? 'Hội đồng biên tập' : 'Editorial Board',
        _ => isVi ? 'Thành viên studio' : 'Studio member',
      };

  String statusLabel(String status) {
    final normalized = status.toUpperCase().replaceAll(' ', '_');
    return switch (normalized) {
      'PENDING' => isVi ? 'Đang chờ' : 'Pending',
      'SUBMITTED' => isVi ? 'Đã nộp' : 'Submitted',
      'IN_PROGRESS' => isVi ? 'Đang làm' : 'In progress',
      'ASSIGNED' => isVi ? 'Đã giao' : 'Assigned',
      'APPROVED' => isVi ? 'Đã duyệt' : 'Approved',
      'MANGAKA_APPROVED' => isVi ? 'Mangaka duyệt' : 'Mangaka approved',
      'COMPLETED' => isVi ? 'Hoàn tất' : 'Completed',
      'REVISION_REQUESTED' => isVi ? 'Cần sửa' : 'Revision requested',
      'REVISING' => isVi ? 'Đang sửa' : 'Revising',
      'REJECTED' => isVi ? 'Bị từ chối' : 'Rejected',
      'ACTIVE' => isVi ? 'Đang hoạt động' : 'Active',
      'PUBLISHED' => isVi ? 'Đã xuất bản' : 'Published',
      'SENT_TO_EDITORIAL' => isVi ? 'Gửi hội đồng' : 'Sent to board',
      'PUBLISH' => isVi ? 'Xuất bản' : 'Publish',
      'RESCHEDULE' => isVi ? 'Đổi lịch' : 'Reschedule',
      'ACCEPT' => isVi ? 'Đồng ý' : 'Accept',
      'REJECT' => isVi ? 'Từ chối' : 'Reject',
      _ => status.replaceAll('_', ' '),
    };
  }
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => ['vi', 'en'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async =>
      AppLocalizations(locale);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
