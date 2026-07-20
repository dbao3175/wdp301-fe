import '../../models/app_models.dart';

class RoleHome {
  RoleHome._();

  static String pathFor(StudioRole role) => switch (role) {
        StudioRole.assistant => '/assistant/tasks',
        StudioRole.editor => '/editor/dashboard',
        StudioRole.boardMember => '/board/voting',
        StudioRole.admin => '/admin',
        StudioRole.mangaka => '/app',
        StudioRole.unknown => '/app',
      };
}
