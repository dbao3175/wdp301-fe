import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../widgets/studio_components.dart';
import '../providers/editor_provider.dart';

class EditorProposalsScreen extends ConsumerWidget {
  const EditorProposalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final proposals = ref.watch(editorProposalsProvider);
    return StudioPage(
      onRefresh: () async => ref.invalidate(editorProposalsProvider),
      children: [
        StudioHeaderCard(
          title: l10n.proposals,
          subtitle: l10n.isVi
              ? 'Xem trực tiếp bản thảo proposal trên mobile.'
              : 'View proposal manuscripts directly on mobile.',
          icon: Icons.visibility_rounded,
        ),
        const SizedBox(height: 12),
        StudioCard(
          color: AppColors.warmWhite,
          child: Row(children: [
            const Icon(Icons.info_outline_rounded, color: AppColors.red),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                l10n.isVi
                    ? 'Duyệt, yêu cầu sửa và bình luận được thực hiện trên bản Web.'
                    : 'Review, revision requests and comments are available on Web.',
                style: const TextStyle(fontSize: 12, height: 1.35),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 14),
        proposals.when(
          data: (items) => items.isEmpty
              ? EmptyState(
                  message: l10n.noData,
                  icon: Icons.rate_review_outlined,
                )
              : Column(
                  children: items
                      .map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _ProposalCard(proposal: item),
                          ))
                      .toList(),
                ),
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
            error: error,
            onRetry: () => ref.invalidate(editorProposalsProvider),
          ),
        ),
      ],
    );
  }
}

class _ProposalCard extends StatelessWidget {
  const _ProposalCard({required this.proposal});

  final SeriesProposal proposal;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return StudioCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
            child: Text(
              proposal.title,
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
            ),
          ),
          StatusPill(status: proposal.status),
        ]),
        const SizedBox(height: 6),
        Text(
          '${proposal.authorName} · ${proposal.genre}',
          style: const TextStyle(color: AppColors.muted, fontSize: 12),
        ),
        if (proposal.synopsis.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(
            proposal.synopsis,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
        const SizedBox(height: 12),
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
    if (proposal.id.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(isVi
              ? 'Proposal này thiếu mã định danh nên chưa thể mở.'
              : 'This proposal is missing its identifier.'),
        ),
      );
      return;
    }
    context.push('/proposal/${proposal.id}/preview');
  }
}
