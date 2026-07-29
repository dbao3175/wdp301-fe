import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/app_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';
import '../../../widgets/studio_components.dart';
import '../providers/board_provider.dart';

class BoardPublicationsScreen extends ConsumerWidget {
  const BoardPublicationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final publications = ref.watch(boardPublicationsProvider);
    return StudioPage(
      onRefresh: () async => ref.invalidate(boardPublicationsProvider),
      children: [
        StudioHeaderCard(
            title: l10n.publicationReview,
            subtitle: 'Majority vote for chapter publication.',
            icon: Icons.newspaper_rounded),
        const SizedBox(height: 16),
        publications.when(
          data: (items) => items.isEmpty
              ? EmptyState(message: l10n.noData, icon: Icons.newspaper_outlined)
              : Column(
                  children: items
                      .map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _PublicationCard(item: item)))
                      .toList()),
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
              error: error,
              onRetry: () => ref.invalidate(boardPublicationsProvider)),
        ),
      ],
    );
  }
}

class _PublicationCard extends ConsumerWidget {
  const _PublicationCard({required this.item});

  final BoardPublication item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    return StudioCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
              child: Text(item.title,
                  style: const TextStyle(
                      fontWeight: FontWeight.w900, fontSize: 16))),
          StatusPill(status: item.status)
        ]),
        const SizedBox(height: 6),
        Text(item.seriesTitle,
            style: const TextStyle(color: AppColors.muted, fontSize: 12)),
        const SizedBox(height: 14),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: item.requiredVotes == 0
                ? 0
                : (item.totalVotes / item.requiredVotes).clamp(0, 1).toDouble(),
            minHeight: 8,
            color: AppColors.green,
            backgroundColor: AppColors.line,
          ),
        ),
        const SizedBox(height: 8),
        Text(
            '${item.totalVotes}/${item.requiredVotes == 0 ? '-' : item.requiredVotes.toString()} votes',
            style: const TextStyle(
                color: AppColors.muted,
                fontSize: 12,
                fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        FilledButton.icon(
            onPressed: () => _action(context, ref),
            icon: Icon(item.sessionId == null
                ? Icons.play_arrow_rounded
                : Icons.how_to_vote_rounded),
            label: Text(item.sessionId == null ? l10n.openReview : l10n.vote)),
      ]),
    );
  }

  Future<void> _action(BuildContext context, WidgetRef ref) async {
    final l10n = AppLocalizations.of(context);
    try {
      if (item.sessionId == null) {
        await ref.read(studioServiceProvider).openPublication(item.chapterId);
      } else {
        final vote = await showModalBottomSheet<_PublicationVoteRequest>(
            context: context,
            isScrollControlled: true,
            builder: (_) => const _PublicationVoteSheet());
        if (vote == null) return;
        await ref.read(studioServiceProvider).votePublication(
            sessionId: item.sessionId!,
            decision: vote.decision,
            comment: vote.comment);
      }
      ref.invalidate(boardPublicationsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${l10n.publicationReview} updated.')));
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(readableApiError(error))));
      }
    }
  }
}

class _PublicationVoteRequest {
  const _PublicationVoteRequest(this.decision, this.comment);
  final String decision;
  final String comment;
}

class _PublicationVoteSheet extends StatefulWidget {
  const _PublicationVoteSheet();

  @override
  State<_PublicationVoteSheet> createState() => _PublicationVoteSheetState();
}

class _PublicationVoteSheetState extends State<_PublicationVoteSheet> {
  String _decision = 'PUBLISH';
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
            Text(l10n.publicationReview,
                style:
                    const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
            const SizedBox(height: 12),
            SegmentedButton<String>(
              segments: [
                ButtonSegment(value: 'PUBLISH', label: Text(l10n.publish)),
                ButtonSegment(
                    value: 'RESCHEDULE', label: Text(l10n.reschedule)),
                ButtonSegment(value: 'REJECT', label: Text(l10n.reject))
              ],
              selected: {_decision},
              onSelectionChanged: (value) =>
                  setState(() => _decision = value.first),
            ),
            const SizedBox(height: 12),
            TextField(
                controller: _comment,
                minLines: 2,
                maxLines: 4,
                decoration: InputDecoration(labelText: l10n.comment)),
            const SizedBox(height: 16),
            FilledButton(
                onPressed: () => Navigator.pop(context,
                    _PublicationVoteRequest(_decision, _comment.text.trim())),
                child: Text(l10n.sendVote)),
          ]),
    );
  }
}
