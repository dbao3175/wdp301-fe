import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../reader/models/reader_models.dart';
import '../providers/proposal_preview_provider.dart';

class ProposalPreviewScreen extends ConsumerWidget {
  const ProposalPreviewScreen({super.key, required this.proposalId});

  final String proposalId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final proposal = ref.watch(proposalPreviewProvider(proposalId));
    return Scaffold(
      backgroundColor: const Color(0xFF101010),
      appBar: AppBar(
        backgroundColor: AppColors.ink,
        foregroundColor: Colors.white,
        leading: IconButton(
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/splash');
            }
          },
          icon: const Icon(Icons.arrow_back_rounded),
          tooltip: l10n.isVi ? 'Quay lại' : 'Back',
        ),
        title: Text(
          l10n.isVi ? 'XEM TRỰC TIẾP BẢN THẢO' : 'PROPOSAL PREVIEW',
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900),
        ),
      ),
      body: proposal.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.red),
        ),
        error: (error, _) => _PreviewError(
          message: error.toString(),
          onRetry: () => ref.invalidate(proposalPreviewProvider(proposalId)),
        ),
        data: (item) {
          final images = item.storyboardImages
              .map(readerMediaUrl)
              .where((url) => url.isNotEmpty)
              .toList(growable: false);
          return SelectionArea(
            child: ListView.builder(
              padding: const EdgeInsets.only(bottom: 32),
              itemCount: images.length + 1,
              itemBuilder: (context, index) {
                if (index == 0) {
                  return _ProposalHeader(
                    title: item.title,
                    author: item.authorName,
                    genre: item.genre,
                    synopsis: item.synopsis,
                    pageCount: images.length,
                    isVi: l10n.isVi,
                  );
                }
                final page = index - 1;
                return _StoryboardPage(
                  url: images[page],
                  page: page + 1,
                  total: images.length,
                  isVi: l10n.isVi,
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _ProposalHeader extends StatelessWidget {
  const _ProposalHeader({
    required this.title,
    required this.author,
    required this.genre,
    required this.synopsis,
    required this.pageCount,
    required this.isVi,
  });

  final String title;
  final String author;
  final String genre;
  final String synopsis;
  final int pageCount;
  final bool isVi;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.paper,
        border: Border.all(color: AppColors.red, width: 2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title.toUpperCase(),
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
        const SizedBox(height: 5),
        Text('$author · $genre',
            style: const TextStyle(
                color: AppColors.muted, fontWeight: FontWeight.w700)),
        if (synopsis.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(synopsis, style: const TextStyle(height: 1.45)),
        ],
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          color: AppColors.ink,
          child: Text(
            pageCount == 0
                ? (isVi ? 'CHƯA CÓ TRANG BẢN THẢO' : 'NO STORYBOARD PAGES')
                : (isVi
                    ? '$pageCount TRANG · CHỈ XEM TRỰC TIẾP'
                    : '$pageCount PAGES · VIEW ONLY'),
            style: const TextStyle(
                color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
          ),
        ),
      ]),
    );
  }
}

class _StoryboardPage extends StatelessWidget {
  const _StoryboardPage({
    required this.url,
    required this.page,
    required this.total,
    required this.isVi,
  });

  final String url;
  final int page;
  final int total;
  final bool isVi;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(10, 0, 10, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.white24),
      ),
      child: Column(children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          color: AppColors.ink,
          child: Text(
            '${isVi ? 'TRANG' : 'PAGE'} $page / $total',
            style: const TextStyle(
                color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900),
          ),
        ),
        AbsorbPointer(
          child: Image.network(
            url,
            width: double.infinity,
            fit: BoxFit.fitWidth,
            filterQuality: FilterQuality.medium,
            loadingBuilder: (context, child, loading) => loading == null
                ? child
                : const SizedBox(
                    height: 260,
                    child: Center(
                      child: CircularProgressIndicator(color: AppColors.red),
                    ),
                  ),
            errorBuilder: (_, __, ___) => SizedBox(
              height: 220,
              child: Center(
                child: Text(
                  isVi ? 'Không thể hiển thị trang này.' : 'Page unavailable.',
                  style: const TextStyle(color: AppColors.muted),
                ),
              ),
            ),
          ),
        ),
      ]),
    );
  }
}

class _PreviewError extends StatelessWidget {
  const _PreviewError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.broken_image_outlined,
              color: AppColors.red, size: 42),
          const SizedBox(height: 12),
          Text(message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70)),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('RETRY'),
          ),
        ]),
      ),
    );
  }
}
