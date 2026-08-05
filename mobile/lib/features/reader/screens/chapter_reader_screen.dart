import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart' show ScrollCacheExtent;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';
import '../models/reader_models.dart';
import '../providers/reader_providers.dart';
import '../services/reader_progress_storage.dart';

class ChapterReaderScreen extends ConsumerStatefulWidget {
  const ChapterReaderScreen({super.key, required this.chapterId});

  final String chapterId;

  @override
  ConsumerState<ChapterReaderScreen> createState() =>
      _ChapterReaderScreenState();
}

class _ChapterReaderScreenState extends ConsumerState<ChapterReaderScreen> {
  final _scrollController = ScrollController();
  Timer? _saveTimer;
  ReaderChapter? _chapter;
  int _pageIndex = 0;
  bool _restored = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    final chapter = _chapter;
    if (chapter == null || chapter.pages.length < 2) return;
    final max = _scrollController.position.maxScrollExtent;
    if (max <= 0) return;
    final next = ((_scrollController.offset / max) * (chapter.pages.length - 1))
        .round()
        .clamp(0, chapter.pages.length - 1);
    if (next == _pageIndex) return;
    setState(() => _pageIndex = next);
    _queueSave();
  }

  void _queueSave() {
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 450), _saveProgress);
  }

  Future<void> _saveProgress() async {
    final chapter = _chapter;
    if (chapter == null || chapter.seriesId.isEmpty) return;
    await ref.read(readerProgressStorageProvider).save(
          seriesId: chapter.seriesId,
          chapterId: chapter.id,
          pageIndex: _pageIndex,
        );
    ref.invalidate(readerResumeProvider(chapter.seriesId));
  }

  Future<void> _restoreProgress(ReaderChapter chapter) async {
    if (_restored) return;
    _restored = true;
    final saved =
        await ref.read(readerProgressStorageProvider).readPage(chapter.id);
    if (!mounted || chapter.pages.isEmpty) return;
    final target = saved.clamp(0, chapter.pages.length - 1);
    setState(() => _pageIndex = target);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_scrollController.hasClients) return;
      final max = _scrollController.position.maxScrollExtent;
      if (max > 0 && chapter.pages.length > 1) {
        _scrollController.jumpTo(max * target / (chapter.pages.length - 1));
      }
    });
  }

  @override
  void dispose() {
    _saveTimer?.cancel();
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    final chapter = _chapter;
    if (chapter != null && chapter.seriesId.isNotEmpty) {
      ref.read(readerProgressStorageProvider).save(
            seriesId: chapter.seriesId,
            chapterId: chapter.id,
            pageIndex: _pageIndex,
          );
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final chapter = ref.watch(readerChapterProvider(widget.chapterId));
    return Scaffold(
      backgroundColor: const Color(0xFF0E0E0E),
      appBar: AppBar(
        backgroundColor: AppColors.ink,
        foregroundColor: Colors.white,
        leading: IconButton(
          tooltip: l10n.isVi ? 'Quay lại' : 'Back',
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/splash');
            }
          },
          icon: const Icon(Icons.arrow_back_rounded),
        ),
        titleSpacing: 0,
        title: chapter.maybeWhen(
          data: (data) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                data.seriesTitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                '${l10n.isVi ? 'Chapter' : 'Chapter'} ${data.number} · ${data.title}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.62),
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          orElse: () => Text(l10n.isVi ? 'Đang mở truyện...' : 'Opening...'),
        ),
        actions: [
          chapter.maybeWhen(
            data: (data) => Center(
              child: Container(
                margin: const EdgeInsets.only(right: 12),
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.red,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  data.pages.isEmpty
                      ? '0/0'
                      : '${_pageIndex + 1}/${data.pages.length}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
      ),
      body: chapter.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.red),
        ),
        error: (error, _) => _ReaderError(
          message: error.toString(),
          onRetry: () => ref.invalidate(
            readerChapterProvider(widget.chapterId),
          ),
        ),
        data: (data) {
          _chapter = data;
          _restoreProgress(data);
          if (data.pages.isEmpty) {
            return _ReaderError(
              message: l10n.isVi
                  ? 'Chapter này chưa có trang truyện để đọc.'
                  : 'This chapter has no readable pages.',
              onRetry: () => ref.invalidate(
                readerChapterProvider(widget.chapterId),
              ),
            );
          }
          return Stack(children: [
            ListView.separated(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(0, 12, 0, 88),
              scrollCacheExtent: const ScrollCacheExtent.pixels(1200),
              itemCount: data.pages.length + 1,
              separatorBuilder: (_, index) => index == 0
                  ? const SizedBox(height: 12)
                  : Container(
                      height: 18,
                      color: const Color(0xFF0E0E0E),
                      alignment: Alignment.center,
                      child: Container(
                        width: 38,
                        height: 3,
                        color: AppColors.red,
                      ),
                    ),
              itemBuilder: (context, index) {
                if (index == 0) {
                  return _ReaderGuide(
                    text: l10n.isVi
                        ? 'Cuộn dọc để đọc · Tiến độ được lưu tự động'
                        : 'Scroll vertically · Progress saves automatically',
                  );
                }
                return _PageImage(page: data.pages[index - 1]);
              },
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 14,
              child: IgnorePointer(
                child: Center(
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.ink.withValues(alpha: 0.88),
                      border: Border.all(color: Colors.white24),
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: Text(
                      '${l10n.isVi ? 'TRANG' : 'PAGE'} ${_pageIndex + 1} / ${data.pages.length}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        letterSpacing: 0.6,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ]);
        },
      ),
    );
  }
}

class _ReaderGuide extends StatelessWidget {
  const _ReaderGuide({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 18),
        constraints: const BoxConstraints(maxWidth: 860),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.inkSoft,
          border: Border.all(color: Colors.white24),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.swipe_down_alt_rounded,
              color: AppColors.redBright, size: 20),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              text,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

class _PageImage extends StatefulWidget {
  const _PageImage({required this.page});

  final ReaderPage page;

  @override
  State<_PageImage> createState() => _PageImageState();
}

class _PageImageState extends State<_PageImage> {
  int _attempt = 0;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 900),
        child: Image.network(
          widget.page.imageUrl,
          key: ValueKey('${widget.page.id}-$_attempt'),
          width: double.infinity,
          fit: BoxFit.fitWidth,
          filterQuality: FilterQuality.medium,
          loadingBuilder: (context, child, progress) {
            if (progress == null) return child;
            return AspectRatio(
              aspectRatio: 0.68,
              child: ColoredBox(
                color: AppColors.inkSoft,
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CircularProgressIndicator(
                        color: AppColors.red,
                        strokeWidth: 2,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'PAGE ${widget.page.number}',
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
          errorBuilder: (_, __, ___) => AspectRatio(
            aspectRatio: 0.68,
            child: ColoredBox(
              color: AppColors.inkSoft,
              child: Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.broken_image_outlined,
                      color: AppColors.redBright, size: 42),
                  const SizedBox(height: 10),
                  Text(
                    'PAGE ${widget.page.number}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: () => setState(() => _attempt += 1),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Colors.white54),
                      minimumSize: const Size(130, 42),
                    ),
                    icon: const Icon(Icons.refresh_rounded, size: 18),
                    label: const Text('THỬ LẠI'),
                  ),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ReaderError extends StatelessWidget {
  const _ReaderError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.menu_book_outlined,
              color: AppColors.redBright, size: 52),
          const SizedBox(height: 14),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white70,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: onRetry,
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white,
              side: const BorderSide(color: Colors.white54),
              minimumSize: const Size(160, 46),
            ),
            icon: const Icon(Icons.refresh_rounded),
            label: Text(l10n.retry),
          ),
        ]),
      ),
    );
  }
}
