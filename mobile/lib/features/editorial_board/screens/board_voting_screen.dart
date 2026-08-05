import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../widgets/studio_components.dart';
import '../providers/board_provider.dart';

class BoardVotingScreen extends ConsumerWidget {
  const BoardVotingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final submissions = ref.watch(boardSubmissionsProvider);
    return StudioPage(
      onRefresh: () async => ref.invalidate(boardSubmissionsProvider),
      children: [
        StudioHeaderCard(
          title: l10n.board,
          subtitle: l10n.isVi
              ? 'Danh sách proposal dành cho Hội đồng xem trên mobile.'
              : 'Read-only proposal list for the Editorial Board.',
          icon: Icons.menu_book_rounded,
        ),
        const SizedBox(height: 12),
        StudioCard(
          color: AppColors.warmWhite,
          child: Row(children: [
            const Icon(Icons.lock_outline_rounded, color: AppColors.red),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                l10n.isVi
                    ? 'Mobile chỉ dùng để xem. Bỏ phiếu, bình luận và quyết định thực hiện trên Web.'
                    : 'Mobile is view-only. Voting, comments and decisions remain on Web.',
                style: const TextStyle(fontSize: 12, height: 1.35),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 14),
        submissions.when(
          data: (items) => items.isEmpty
              ? EmptyState(
                  message: l10n.noData,
                  icon: Icons.inventory_2_outlined,
                )
              : Column(
                  children: items
                      .map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _SubmissionCard(item: item),
                          ))
                      .toList(),
                ),
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
            error: error,
            onRetry: () => ref.invalidate(boardSubmissionsProvider),
          ),
        ),
      ],
    );
  }
}

class _SubmissionCard extends StatelessWidget {
  const _SubmissionCard({required this.item});

  final BoardSubmission item;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return StudioCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 54,
            height: 68,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.ink,
              borderRadius: BorderRadius.circular(6),
              boxShadow: const [
                BoxShadow(
                  color: AppColors.red,
                  offset: Offset(3, 3),
                  blurRadius: 0,
                ),
              ],
            ),
            child: Text(
              item.title.isEmpty ? 'M' : item.title[0].toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 17,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  item.authorName,
                  style: const TextStyle(
                    color: AppColors.muted,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 7),
                StatusPill(status: item.status),
              ],
            ),
          ),
        ]),
        if (item.synopsis.isNotEmpty) ...[
          const SizedBox(height: 14),
          Text(
            item.synopsis,
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(height: 1.4),
          ),
        ],
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => _openPreview(context, l10n.isVi),
            icon: const Icon(Icons.visibility_outlined, size: 18),
            label: Text(l10n.isVi ? 'XEM TRỰC TIẾP' : 'PREVIEW'),
          ),
        ),
      ]),
    );
  }

  void _openPreview(BuildContext context, bool isVi) {
    if (item.proposalId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(isVi
              ? 'Proposal này thiếu mã định danh nên chưa thể mở.'
              : 'This proposal is missing its identifier.'),
        ),
      );
      return;
    }
    context.push('/proposal/${item.proposalId}/preview');
  }
}
