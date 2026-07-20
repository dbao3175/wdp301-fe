import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:manga_studio_mobile/app.dart';

void main() {
  testWidgets('Manga Studio mobile app boots', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: MangaStudioMobileApp()));
    await tester.pump();
    expect(find.byType(MangaStudioMobileApp), findsOneWidget);
  });
}
