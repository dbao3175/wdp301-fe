import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../widgets/studio_components.dart';
import '../models/reader_models.dart';
import '../providers/reader_providers.dart';
import '../widgets/reader_widgets.dart';

class ReaderSeriesScreen extends ConsumerWidget {
  const ReaderSeriesScreen({super.key, required this.seriesId});

  final String seriesId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final series = ref.watch(readerSeriesProvider(seriesId));
    return series.when(
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppColors.red),
      ),
      error: (error, _) => Padding(
        padding: const EdgeInsets.all(20),
        child: ErrorState(
          error: error,
          onRetry: () => ref.invalidate(readerSeriesProvider(seriesId)),
        ),
      ),
      data: (data) => _SeriesBody(series: data),
    );
  }
}

class _SeriesBody extends ConsumerWidget {
  const _SeriesBody({required this.series});

  final ReaderSeries series;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final resume = ref.watch(readerResumeProvider(series.id)).valueOrNull;
    final readable = series.chapters
        .where((chapter) => chapter.pageCount > 0)
        .toList(growable: false);
    final resumeChapter = resume == null
        ? null
        : readable.cast<ReaderChapterSummary?>().firstWhere(
              (chapter) => chapter?.id == resume.chapterId,
              orElse: () => null,
            );

    return RefreshIndicator(
      color: AppColors.red,
      onRefresh: () async =>
          ref.refresh(readerSeriesProvider(series.id).future),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 860),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(18, 14, 18, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextButton.icon(
                        onPressed: () => context.go('/library'),
                        icon: const Icon(Icons.arrow_back_rounded),
                        label: Text(
                          l10n.isVi ? 'Quay lại thư viện' : 'Back to library',
                        ),
                      ),
                      const SizedBox(height: 6),
                      _SeriesHero(series: series),
                      const SizedBox(height: 18),
                      if (series.synopsis.isNotEmpty) ...[
                        SectionHeader(
                          title: l10n.isVi ? 'Giới thiệu' : 'Synopsis',
                        ),
                        const SizedBox(height: 10),
                        StudioCard(
                          child: Text(
                            series.synopsis,
                            style: const TextStyle(
                              color: AppColors.inkSoft,
                              height: 1.55,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(height: 22),
                      ],
                      SectionHeader(
                        title: l10n.isVi ? 'Danh sách chapter' : 'Chapters',
                        subtitle: l10n.isVi
                            ? '${readable.length} chapter có trang truyện'
                            : '${readable.length} chapters with pages',
                      ),
                      const SizedBox(height: 12),
                      if (resumeChapter != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: FilledButton.icon(
                            onPressed: () =>
                                context.push('/reader/${resumeChapter.id}'),
                            icon: const Icon(Icons.play_arrow_rounded),
                            label: Text(
                              l10n.isVi
                                  ? 'ĐỌC TIẾP CHAPTER ${resumeChapter.number} · TRANG ${resume!.pageIndex + 1}'
                                  : 'CONTINUE CHAPTER ${resumeChapter.number} · PAGE ${resume!.pageIndex + 1}',
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          if (series.chapters.isEmpty)
            SliverToBoxAdapter(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 860),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(18, 0, 18, 36),
                    child: EmptyState(
                      message: l10n.isVi
                          ? 'Series chưa có chapter để hiển thị.'
                          : 'This series has no chapters yet.',
                      icon: Icons.menu_book_outlined,
                    ),
                  ),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 0, 18, 36),
              sliver: SliverList.separated(
                itemCount: series.chapters.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final chapter = series.chapters[index];
                  return Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 824),
                      child: _ChapterCard(
                        chapter: chapter,
                        onTap: chapter.pageCount == 0
                            ? null
                            : () => context.push('/reader/${chapter.id}'),
                      ),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}

class _SeriesHero extends StatelessWidget {
  const _SeriesHero({required this.series});

  final ReaderSeries series;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Container(
      decoration: BoxDecoration(
        color: AppColors.ink,
        border: Border.all(color: AppColors.ink, width: 2),
        borderRadius: BorderRadius.circular(10),
        boxShadow: const [
          BoxShadow(color: AppColors.red, offset: Offset(6, 6)),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: IntrinsicHeight(
        child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          SizedBox(
            width: 138,
            child: ReaderCover(
              imageUrl: series.coverUrl,
              title: series.title,
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(17),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    color: AppColors.red,
                    child: Text(
                      series.genre.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        letterSpacing: 0.5,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    series.title,
                    maxLines: 4,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 23,
                      height: 1.02,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 9),
                  Text(
                    series.author,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  Wrap(spacing: 7, runSpacing: 7, children: [
                    ReaderCountBadge(
                      icon: Icons.menu_book_outlined,
                      label: '${series.chapterCount} chapter',
                      color: Colors.white,
                    ),
                    ReaderCountBadge(
                      icon: Icons.image_outlined,
                      label:
                          '${series.pageCount} ${l10n.isVi ? 'trang' : 'pages'}',
                      color: Colors.white,
                    ),
                  ]),
                ],
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

class _ChapterCard extends StatelessWidget {
  const _ChapterCard({required this.chapter, this.onTap});

  final ReaderChapterSummary chapter;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final available = chapter.pageCount > 0;
    return StudioCard(
      onTap: onTap,
      shadowColor: available ? AppColors.ink : AppColors.line,
      child: Row(children: [
        Container(
          width: 50,
          height: 56,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: available ? AppColors.red : AppColors.surfaceHigh,
            border: Border.all(color: AppColors.ink, width: 1.4),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            '${chapter.number}'.padLeft(2, '0'),
            style: TextStyle(
              color: available ? Colors.white : AppColors.muted,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        const SizedBox(width: 13),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                chapter.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 5),
              Text(
                available
                    ? '${chapter.pageCount} ${l10n.isVi ? 'trang truyện' : 'pages'}'
                    : (l10n.isVi
                        ? 'Chưa có trang truyện'
                        : 'No pages available'),
                style: TextStyle(
                  color: available ? AppColors.green : AppColors.muted,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
        Icon(
          available ? Icons.play_circle_fill_rounded : Icons.lock_clock_rounded,
          color: available ? AppColors.red : AppColors.muted,
          size: 28,
        ),
      ]),
    );
  }
}
