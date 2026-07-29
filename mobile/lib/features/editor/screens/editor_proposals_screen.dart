import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/app_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';
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
            subtitle: l10n.editorQueue,
            icon: Icons.rate_review_rounded),
        const SizedBox(height: 16),
        proposals.when(
          data: (items) => items.isEmpty
              ? EmptyState(
                  message: l10n.noData, icon: Icons.rate_review_outlined)
              : Column(
                  children: items
                      .map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _ProposalCard(proposal: item)))
                      .toList()),
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
              error: error,
              onRetry: () => ref.invalidate(editorProposalsProvider)),
        ),
      ],
    );
  }
}

class _ProposalCard extends ConsumerWidget {
  const _ProposalCard({required this.proposal});

  final SeriesProposal proposal;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return StudioCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
              child: Text(proposal.title,
                  style: const TextStyle(
                      fontWeight: FontWeight.w900, fontSize: 16))),
          StatusPill(status: proposal.status),
        ]),
        const SizedBox(height: 6),
        Text('${proposal.authorName} • ${proposal.genre}',
            style: const TextStyle(color: AppColors.muted, fontSize: 12)),
        if (proposal.synopsis.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(proposal.synopsis, maxLines: 3, overflow: TextOverflow.ellipsis),
        ],
        const SizedBox(height: 12),
        Row(children: [
          Expanded(
              child: OutlinedButton.icon(
                  onPressed: () => _act(context, ref, 'revision'),
                  icon: const Icon(Icons.edit_note),
                  label: const Text('Revision'))),
          const SizedBox(width: 8),
          Expanded(
              child: FilledButton.icon(
                  onPressed: () => _act(context, ref, 'forward'),
                  icon: const Icon(Icons.forward_rounded),
                  label: const Text('Forward'))),
        ]),
      ]),
    );
  }

  Future<void> _act(BuildContext context, WidgetRef ref, String action) async {
    final comment = await showModalBottomSheet<String>(
        context: context,
        isScrollControlled: true,
        builder: (_) => const _CommentSheet());
    if (comment == null) return;
    try {
      final service = ref.read(studioServiceProvider);
      if (action == 'forward') {
        await service.forwardProposal(proposal.id, comment);
      } else {
        await service.requestProposalRevision(proposal.id, comment);
      }
      ref.invalidate(editorProposalsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Proposal updated.')));
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(readableApiError(error))));
      }
    }
  }
}

class _CommentSheet extends StatefulWidget {
  const _CommentSheet();

  @override
  State<_CommentSheet> createState() => _CommentSheetState();
}

class _CommentSheetState extends State<_CommentSheet> {
  final _comment = TextEditingController();

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Padding(
      padding: EdgeInsets.fromLTRB(
          20, 18, 20, 20 + MediaQuery.viewInsetsOf(context).bottom),
      child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(l10n.comment,
                style:
                    const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
            const SizedBox(height: 12),
            TextField(
                controller: _comment,
                minLines: 3,
                maxLines: 5,
                decoration: InputDecoration(labelText: l10n.comment)),
            const SizedBox(height: 16),
            FilledButton(
                onPressed: () => Navigator.pop(context, _comment.text.trim()),
                child: Text(l10n.sendVote)),
          ]),
    );
  }
}
