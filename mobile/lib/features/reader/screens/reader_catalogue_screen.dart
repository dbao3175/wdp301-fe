import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../widgets/studio_components.dart';
import '../models/reader_models.dart';
import '../providers/reader_providers.dart';
import '../widgets/reader_widgets.dart';

class ReaderCatalogueScreen extends ConsumerStatefulWidget {
  const ReaderCatalogueScreen({super.key});

  @override
  ConsumerState<ReaderCatalogueScreen> createState() =>
      _ReaderCatalogueScreenState();
}

class _ReaderCatalogueScreenState extends ConsumerState<ReaderCatalogueScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final catalogue = ref.watch(readerCatalogueProvider);
    return catalogue.when(
      loading: () => const Center(
        child: CircularProgressIndicator(color: AppColors.red),
      ),
      error: (error, _) => Padding(
        padding: const EdgeInsets.all(20),
        child: ErrorState(
          error: error,
          onRetry: () => ref.invalidate(readerCatalogueProvider),
        ),
      ),
      data: (series) {
        final query = _query.trim().toLowerCase();
        final filtered = query.isEmpty
            ? series
            : series.where((item) {
                return [item.title, item.author, item.genre, ...item.tags]
                    .join(' ')
                    .toLowerCase()
                    .contains(query);
              }).toList(growable: false);
        return RefreshIndicator(
          color: AppColors.red,
          onRefresh: () async => ref.refresh(readerCatalogueProvider.future),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(18, 14, 18, 18),
                sliver: SliverList.list(children: [
                  StudioHeaderCard(
                    title: l10n.isVi ? 'Thư viện truyện' : 'Manga library',
                    subtitle: l10n.isVi
                        ? 'Chọn series, mở chapter và đọc trực tiếp trên mobile.'
                        : 'Choose a series, open a chapter and read on mobile.',
                    icon: Icons.local_library_outlined,
                  ),
                  const SizedBox(height: 18),
                  Row(children: [
                    Expanded(
                      child: _LibraryMetric(
                        value: '${series.length}',
                        label: l10n.isVi ? 'Series' : 'Series',
                        color: AppColors.red,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _LibraryMetric(
                        value:
                            '${series.where((item) => item.hasReadableContent).length}',
                        label: l10n.isVi ? 'Có thể đọc' : 'Readable',
                        color: AppColors.green,
                      ),
                    ),
                  ]),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _searchController,
                    onChanged: (value) => setState(() => _query = value),
                    decoration: InputDecoration(
                      hintText: l10n.isVi
                          ? 'Tìm theo tên truyện, tác giả, thể loại...'
                          : 'Search title, author or genre...',
                      prefixIcon: const Icon(Icons.search_rounded),
                      suffixIcon: _query.isEmpty
                          ? null
                          : IconButton(
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _query = '');
                              },
                              icon: const Icon(Icons.close_rounded),
                            ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SectionHeader(
                    title: l10n.isVi ? 'Danh mục manga' : 'Manga catalogue',
                    subtitle: l10n.isVi
                        ? '${filtered.length} kết quả từ dữ liệu hệ thống'
                        : '${filtered.length} results from system data',
                  ),
                  const SizedBox(height: 12),
                ]),
              ),
              if (filtered.isEmpty)
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(18, 0, 18, 36),
                  sliver: SliverToBoxAdapter(
                    child: EmptyState(
                      message: l10n.isVi
                          ? 'Không tìm thấy series phù hợp.'
                          : 'No matching series found.',
                      icon: Icons.menu_book_outlined,
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(18, 0, 18, 36),
                  sliver: SliverLayoutBuilder(
                    builder: (context, constraints) {
                      final wide = constraints.crossAxisExtent >= 720;
                      if (!wide) {
                        return SliverList.separated(
                          itemCount: filtered.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 12),
                          itemBuilder: (_, index) => _SeriesCard(
                            series: filtered[index],
                            onTap: () => context.go(
                              '/series/${filtered[index].id}',
                            ),
                          ),
                        );
                      }
                      return SliverGrid.builder(
                        itemCount: filtered.length,
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 14,
                          mainAxisSpacing: 14,
                          childAspectRatio: 2.35,
                        ),
                        itemBuilder: (_, index) => _SeriesCard(
                          series: filtered[index],
                          onTap: () =>
                              context.go('/series/${filtered[index].id}'),
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _LibraryMetric extends StatelessWidget {
  const _LibraryMetric({
    required this.value,
    required this.label,
    required this.color,
  });

  final String value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.paper,
        border: Border.all(color: AppColors.ink, width: 1.5),
        borderRadius: BorderRadius.circular(7),
        boxShadow: [
          BoxShadow(color: color, offset: const Offset(3, 3)),
        ],
      ),
      child: Row(children: [
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 24,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            label.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ]),
    );
  }
}

class _SeriesCard extends StatelessWidget {
  const _SeriesCard({required this.series, required this.onTap});

  final ReaderSeries series;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return StudioCard(
      padding: EdgeInsets.zero,
      onTap: onTap,
      shadowColor: series.hasReadableContent ? AppColors.red : AppColors.muted,
      child: SizedBox(
        height: 164,
        child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          SizedBox(
            width: 112,
            child: ReaderCover(
              imageUrl: series.coverUrl,
              title: series.title,
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(13),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Expanded(
                      child: Text(
                        series.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.ink,
                          fontSize: 16,
                          height: 1.08,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.arrow_forward_rounded, size: 18),
                  ]),
                  const SizedBox(height: 5),
                  Text(
                    series.author,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  Wrap(spacing: 6, runSpacing: 6, children: [
                    ReaderCountBadge(
                      icon: Icons.menu_book_outlined,
                      label: '${series.chapterCount} chapter',
                    ),
                    ReaderCountBadge(
                      icon: Icons.image_outlined,
                      label: '${series.pageCount} trang',
                    ),
                  ]),
                  const Spacer(),
                  Row(children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        color: series.hasReadableContent
                            ? AppColors.green
                            : AppColors.amber,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        series.hasReadableContent
                            ? (l10n.isVi ? 'SẴN SÀNG ĐỌC' : 'READY TO READ')
                            : (l10n.isVi
                                ? 'CHƯA CÓ TRANG TRUYỆN'
                                : 'NO PAGES YET'),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: series.hasReadableContent
                              ? AppColors.green
                              : AppColors.amber,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.4,
                        ),
                      ),
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
