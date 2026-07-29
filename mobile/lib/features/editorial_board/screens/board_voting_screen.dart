import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/app_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/app_models.dart';
import '../../../services/studio_services.dart';
import '../../../widgets/studio_components.dart';
import '../providers/board_provider.dart';

class BoardVotingScreen extends ConsumerWidget {
  const BoardVotingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final submissions = ref.watch(boardSubmissionsProvider);
    final directives = ref.watch(boardDirectivesProvider);

    return StudioPage(
      onRefresh: () async {
        ref.invalidate(boardSubmissionsProvider);
        ref.invalidate(boardDirectivesProvider);
      },
      children: [
        StudioHeaderCard(
            title: l10n.board,
            subtitle: l10n.proposalReview,
            icon: Icons.how_to_vote_rounded),
        const SizedBox(height: 18),
        submissions.when(
          data: (items) {
            final votesCast =
                items.fold<int>(0, (total, item) => total + item.votes.length);
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _BoardStats(
                    pending: items.length,
                    votesCast: votesCast,
                    thresholdLabel: '51%'),
                const SizedBox(height: 24),
                SectionHeader(title: l10n.proposals, subtitle: l10n.boardQueue),
                const SizedBox(height: 12),
                if (items.isEmpty)
                  EmptyState(
                      message: l10n.noData, icon: Icons.how_to_vote_outlined)
                else
                  ...items.map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _SubmissionCard(item: item))),
              ],
            );
          },
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
              error: error,
              onRetry: () => ref.invalidate(boardSubmissionsProvider)),
        ),
        const SizedBox(height: 22),
        SectionHeader(title: 'Board directives'),
        const SizedBox(height: 12),
        directives.when(
          data: (items) => items.isEmpty
              ? EmptyState(message: l10n.noData, icon: Icons.gavel_outlined)
              : Column(
                  children: items
                      .take(3)
                      .map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _DirectiveCard(item: item)))
                      .toList()),
          loading: () => const LoadingPanel(),
          error: (error, _) => ErrorState(
              error: error,
              onRetry: () => ref.invalidate(boardDirectivesProvider)),
        ),
      ],
    );
  }
}

class _BoardStats extends StatelessWidget {
  const _BoardStats(
      {required this.pending,
      required this.votesCast,
      required this.thresholdLabel});

  final int pending;
  final int votesCast;
  final String thresholdLabel;

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Expanded(
          child: _BoardStatTile(
              label: 'Pending', value: pending.toString().padLeft(2, '0'))),
      const SizedBox(width: 8),
      Expanded(
          child: _BoardStatTile(
              label: 'Votes cast',
              value: votesCast.toString().padLeft(2, '0'))),
      const SizedBox(width: 8),
      Expanded(
          child: _BoardStatTile(
              label: 'Threshold',
              value: thresholdLabel,
              color: AppColors.red,
              foreground: Colors.white)),
    ]);
  }
}

class _BoardStatTile extends StatelessWidget {
  const _BoardStatTile(
      {required this.label,
      required this.value,
      this.color = AppColors.paper,
      this.foreground = AppColors.ink});

  final String label;
  final String value;
  final Color color;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return StudioCard(
      padding: const EdgeInsets.all(11),
      color: color,
      shadowColor: AppColors.ink,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
                color: foreground.withValues(alpha: 0.72),
                fontSize: 9,
                letterSpacing: 0.6,
                fontWeight: FontWeight.w900)),
        const SizedBox(height: 5),
        Text(value,
            style: TextStyle(
                color: foreground,
                fontSize: 22,
                height: 1,
                fontWeight: FontWeight.w900)),
      ]),
    );
  }
}

class _SubmissionCard extends ConsumerWidget {
  const _SubmissionCard({required this.item});

  final BoardSubmission item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final accept = item.votes.where((vote) => vote.decision == 'ACCEPT').length;
    final reject = item.votes.where((vote) => vote.decision == 'REJECT').length;
    final total = item.votes.length;
    final requiredVotes =
        item.requiredVotes == 0 ? math.max(total, 1) : item.requiredVotes;

    return StudioCard(
      padding: const EdgeInsets.all(14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _MangaCover(seed: item.title),
          const SizedBox(width: 14),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Row(children: [
                  Expanded(
                      child: Text(item.title.toUpperCase(),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 20,
                              height: 1.04,
                              letterSpacing: -0.4))),
                  const SizedBox(width: 8),
                  StatusPill(status: item.status),
                ]),
                const SizedBox(height: 5),
                Text('By ${item.authorName}',
                    style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 12,
                        fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.canvas,
                    border: Border.all(color: AppColors.line),
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: Text('$total/$requiredVotes BOARD MEMBERS CAST',
                      style: const TextStyle(
                          color: AppColors.ink,
                          fontSize: 9,
                          letterSpacing: 0.4,
                          fontWeight: FontWeight.w900)),
                ),
              ])),
        ]),
        if (item.synopsis.isNotEmpty) ...[
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.warmWhite,
              border: Border.all(color: AppColors.ink, width: 1.2),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(item.synopsis,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style:
                    const TextStyle(height: 1.38, fontWeight: FontWeight.w600)),
          ),
        ],
        const SizedBox(height: 14),
        _VoteTally(
            accept: accept,
            reject: reject,
            total: total,
            requiredVotes: requiredVotes),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => downloadManuscriptFile(item.title, context),
              icon: const Icon(Icons.download_rounded, size: 18),
              label: Text(l10n.downloadProposal),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: FilledButton.icon(
              onPressed: () => _vote(context, ref),
              icon: const Icon(Icons.how_to_vote_rounded, size: 18),
              label: Text(l10n.vote.toUpperCase()),
            ),
          ),
        ]),
      ]),
    );
  }

  Future<void> _vote(BuildContext context, WidgetRef ref) async {
    final vote = await showModalBottomSheet<_BoardVoteRequest>(
        context: context,
        isScrollControlled: true,
        builder: (_) => const _BoardVoteSheet());
    if (vote == null) return;
    try {
      await ref.read(studioServiceProvider).submitProposalVote(
          submissionId: item.id,
          decision: vote.decision,
          comment: vote.comment,
          schedule: vote.schedule);
      ref.invalidate(boardSubmissionsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Vote submitted.')));
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(readableApiError(error))));
      }
    }
  }
}

class _MangaCover extends StatelessWidget {
  const _MangaCover({required this.seed});

  final String seed;

  @override
  Widget build(BuildContext context) {
    final initial = seed.trim().isEmpty ? 'M' : seed.trim()[0].toUpperCase();
    return Container(
      width: 64,
      height: 94,
      decoration: BoxDecoration(
        color: AppColors.surfaceHigh,
        border: Border.all(color: AppColors.ink, width: 2),
        borderRadius: BorderRadius.circular(4),
      ),
      child: CustomPaint(
        painter: const _CoverTonePainter(),
        child: Center(
          child: Text(initial,
              style: const TextStyle(
                  color: AppColors.ink,
                  fontWeight: FontWeight.w900,
                  fontSize: 26)),
        ),
      ),
    );
  }
}

class _VoteTally extends StatelessWidget {
  const _VoteTally(
      {required this.accept,
      required this.reject,
      required this.total,
      required this.requiredVotes});

  final int accept;
  final int reject;
  final int total;
  final int requiredVotes;

  @override
  Widget build(BuildContext context) {
    final awaiting = math.max(requiredVotes - total, 0);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.warmWhite,
        border: Border.all(color: AppColors.ink, width: 1.4),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Column(children: [
        Row(children: [
          Expanded(
              child: _TallyNumber(
                  label: 'Accept',
                  value: accept.toString(),
                  color: AppColors.green)),
          const SizedBox(width: 6),
          Expanded(
              child: _TallyNumber(
                  label: 'Reject',
                  value: reject.toString(),
                  color: AppColors.red)),
          const SizedBox(width: 6),
          Expanded(
              child: _TallyNumber(
                  label: 'Awaiting',
                  value: awaiting.toString(),
                  color: AppColors.amber)),
          const SizedBox(width: 6),
          Expanded(
              child: _TallyNumber(
                  label: 'Cast',
                  value: '$total/$requiredVotes',
                  color: AppColors.ink)),
        ]),
        const SizedBox(height: 12),
        Container(
          height: 13,
          decoration: BoxDecoration(
            color: AppColors.paper,
            border: Border.all(color: AppColors.ink, width: 1.4),
          ),
          child: Row(children: [
            if (accept > 0)
              Expanded(flex: accept, child: Container(color: AppColors.green)),
            if (awaiting > 0)
              Expanded(
                  flex: awaiting, child: Container(color: AppColors.paper)),
            if (reject > 0)
              Expanded(flex: reject, child: Container(color: AppColors.red)),
            if (accept == 0 && reject == 0 && awaiting == 0)
              Expanded(child: Container(color: AppColors.paper)),
          ]),
        ),
      ]),
    );
  }
}

class _TallyNumber extends StatelessWidget {
  const _TallyNumber(
      {required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        border: Border.all(color: color.withValues(alpha: 0.65), width: 1.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Column(children: [
        Text(value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
                color: color,
                fontWeight: FontWeight.w900,
                fontSize: 18,
                height: 1)),
        const SizedBox(height: 4),
        Text(label.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
                color: color,
                fontSize: 8,
                letterSpacing: 0.4,
                fontWeight: FontWeight.w900)),
      ]),
    );
  }
}

class _DirectiveCard extends StatelessWidget {
  const _DirectiveCard({required this.item});

  final Directive item;

  @override
  Widget build(BuildContext context) {
    return StudioCard(
      color: AppColors.warmWhite,
      child: Row(children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: AppColors.red.withValues(alpha: 0.10),
            border: Border.all(color: AppColors.red, width: 1.3),
            borderRadius: BorderRadius.circular(6),
          ),
          child: const Icon(Icons.gavel_outlined, color: AppColors.red),
        ),
        const SizedBox(width: 12),
        Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(item.seriesTitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w900)),
          const SizedBox(height: 3),
          Text('${item.actionType} • ${item.reason}',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  color: AppColors.muted,
                  fontSize: 12,
                  fontWeight: FontWeight.w700)),
        ])),
        StatusPill(status: item.status),
      ]),
    );
  }
}

class _BoardVoteRequest {
  const _BoardVoteRequest(this.decision, this.comment, this.schedule);
  final String decision;
  final String comment;
  final String? schedule;
}

class _BoardVoteSheet extends StatefulWidget {
  const _BoardVoteSheet();

  @override
  State<_BoardVoteSheet> createState() => _BoardVoteSheetState();
}

class _BoardVoteSheetState extends State<_BoardVoteSheet> {
  String _decision = 'ACCEPT';
  String _schedule = 'WEEKLY';
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
          20, 16, 20, 20 + MediaQuery.viewInsetsOf(context).bottom),
      child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(width: 46, height: 4, color: AppColors.ink),
            ),
            const SizedBox(height: 18),
            Text(l10n.vote.toUpperCase(),
                style:
                    const TextStyle(fontWeight: FontWeight.w900, fontSize: 22)),
            const SizedBox(height: 12),
            SegmentedButton<String>(
                segments: [
                  ButtonSegment(value: 'ACCEPT', label: Text(l10n.accept)),
                  ButtonSegment(value: 'REJECT', label: Text(l10n.reject))
                ],
                selected: {
                  _decision
                },
                onSelectionChanged: (value) =>
                    setState(() => _decision = value.first)),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
                initialValue: _schedule,
                decoration: const InputDecoration(labelText: 'Schedule'),
                items: const [
                  DropdownMenuItem(value: 'WEEKLY', child: Text('Weekly')),
                  DropdownMenuItem(value: 'MONTHLY', child: Text('Monthly'))
                ],
                onChanged: (value) =>
                    setState(() => _schedule = value ?? 'WEEKLY')),
            const SizedBox(height: 12),
            TextField(
                controller: _comment,
                minLines: 2,
                maxLines: 4,
                decoration: InputDecoration(labelText: l10n.comment)),
            const SizedBox(height: 16),
            FilledButton(
                onPressed: () => Navigator.pop(
                    context,
                    _BoardVoteRequest(_decision, _comment.text.trim(),
                        _decision == 'ACCEPT' ? _schedule : null)),
                child: Text(l10n.sendVote.toUpperCase())),
          ]),
    );
  }
}

class _CoverTonePainter extends CustomPainter {
  const _CoverTonePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final line = Paint()
      ..color = AppColors.ink.withValues(alpha: 0.18)
      ..strokeWidth = 1;
    for (var i = -size.height; i < size.width; i += 9) {
      canvas.drawLine(
          Offset(i.toDouble(), size.height), Offset(i + size.height, 0), line);
    }
    final red = Paint()..color = AppColors.red.withValues(alpha: 0.14);
    canvas.drawRect(Rect.fromLTWH(0, size.height * 0.68, size.width, 12), red);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
