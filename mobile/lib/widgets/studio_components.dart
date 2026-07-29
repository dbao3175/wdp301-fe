import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import '../core/utils/app_utils.dart';
import '../l10n/app_localizations.dart';

const _hardShadow = [
  BoxShadow(color: AppColors.ink, offset: Offset(4, 4), blurRadius: 0),
];

class StudioLogo extends StatelessWidget {
  const StudioLogo({super.key, this.compact = false, this.light = false});

  final bool compact;
  final bool light;

  @override
  Widget build(BuildContext context) {
    final textColor = light ? Colors.white : AppColors.ink;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          height: compact ? 34 : 48,
          width: compact ? 34 : 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: light ? Colors.white : AppColors.red,
            border: Border.all(
                color: light ? Colors.white : AppColors.ink, width: 2),
            borderRadius: BorderRadius.circular(8),
            boxShadow: compact ? null : _hardShadow,
          ),
          child: Text('M',
              style: TextStyle(
                  color: light ? AppColors.red : Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: compact ? 19 : 26)),
        ),
        if (!compact) ...[
          const SizedBox(width: 12),
          Text('MANGA\nSTUDIO OS',
              style: TextStyle(
                  color: textColor,
                  fontWeight: FontWeight.w900,
                  height: 1.02,
                  letterSpacing: -0.3,
                  fontSize: 15)),
        ],
      ],
    );
  }
}

class StudioPage extends StatelessWidget {
  const StudioPage(
      {super.key,
      required this.children,
      this.padding = const EdgeInsets.fromLTRB(20, 14, 20, 32),
      this.onRefresh});

  final List<Widget> children;
  final EdgeInsetsGeometry padding;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    final list = CustomPaint(
      painter: const _ScreentonePainter(),
      child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: padding,
          children: children),
    );
    if (onRefresh == null) return list;
    return RefreshIndicator(
        color: AppColors.red, onRefresh: onRefresh!, child: list);
  }
}

class StudioCard extends StatelessWidget {
  const StudioCard(
      {super.key,
      required this.child,
      this.padding = const EdgeInsets.all(16),
      this.color,
      this.onTap,
      this.shadowColor = AppColors.ink,
      this.borderColor = AppColors.ink});

  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? color;
  final VoidCallback? onTap;
  final Color shadowColor;
  final Color borderColor;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(8);
    return Container(
      margin: const EdgeInsets.only(right: 4, bottom: 4),
      decoration: BoxDecoration(
        borderRadius: radius,
        boxShadow: [
          BoxShadow(
              color: shadowColor, offset: const Offset(4, 4), blurRadius: 0),
        ],
      ),
      child: ClipRRect(
        borderRadius: radius,
        child: Material(
          color: Colors.transparent,
          child: Ink(
            decoration: BoxDecoration(
              color: color ?? AppColors.paper,
              border: Border.all(color: borderColor, width: 1.6),
              borderRadius: radius,
            ),
            child: InkWell(
              onTap: onTap,
              child: Padding(padding: padding, child: child),
            ),
          ),
        ),
      ),
    );
  }
}

class StudioHeaderCard extends StatelessWidget {
  const StudioHeaderCard(
      {super.key,
      required this.title,
      required this.subtitle,
      required this.icon,
      this.trailing});

  final String title;
  final String subtitle;
  final IconData icon;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 6, bottom: 6),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.ink,
        border: Border.all(color: AppColors.ink, width: 2),
        borderRadius: BorderRadius.circular(10),
        boxShadow: const [
          BoxShadow(color: AppColors.red, offset: Offset(6, 6), blurRadius: 0),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            top: -8,
            right: -2,
            child: Text('#OS',
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.08),
                    fontWeight: FontWeight.w900,
                    fontSize: 54,
                    letterSpacing: -3)),
          ),
          Row(
            children: [
              Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                      color: AppColors.red,
                      border: Border.all(color: Colors.white, width: 1.6),
                      borderRadius: BorderRadius.circular(8)),
                  child: Icon(icon, color: Colors.white)),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(3),
                        ),
                        child: const Text('COMMAND PANEL',
                            style: TextStyle(
                                color: AppColors.ink,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.7)),
                      ),
                      const SizedBox(height: 10),
                      Text(title.toUpperCase(),
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              height: 1.02,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5)),
                      const SizedBox(height: 6),
                      Text(subtitle,
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.72),
                              height: 1.35,
                              fontWeight: FontWeight.w600)),
                    ]),
              ),
              if (trailing != null) trailing!,
            ],
          ),
        ],
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader(
      {super.key, required this.title, this.subtitle, this.action});

  final String title;
  final String? subtitle;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Container(width: 8, height: 26, color: AppColors.red),
        const SizedBox(width: 10),
        Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title.toUpperCase(),
                style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: AppColors.ink,
                    letterSpacing: -0.2)),
            if (subtitle != null) ...[
              const SizedBox(height: 3),
              Text(subtitle!,
                  style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.4)),
            ],
          ]),
        ),
        if (action != null) action!,
      ],
    );
  }
}

class MetricTile extends StatelessWidget {
  const MetricTile(
      {super.key,
      required this.label,
      required this.value,
      required this.icon,
      this.color = AppColors.red});

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return StudioCard(
      padding: const EdgeInsets.all(14),
      shadowColor: color,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  border: Border.all(color: color, width: 1.2),
                  borderRadius: BorderRadius.circular(6)),
              child: Icon(icon, size: 18, color: color)),
          const Spacer(),
          Text(value,
              style: TextStyle(
                  fontSize: 26, fontWeight: FontWeight.w900, color: color)),
        ]),
        const SizedBox(height: 12),
        Text(label.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
                color: AppColors.ink,
                fontSize: 10,
                letterSpacing: 0.7,
                fontWeight: FontWeight.w900)),
      ]),
    );
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.status});

  final String status;

  Color _color(String normalized) {
    if (normalized.contains('APPROV') ||
        normalized.contains('PUBLISH') ||
        normalized.contains('COMPLETE') ||
        normalized.contains('ACCEPT')) {
      return AppColors.green;
    }
    if (normalized.contains('REJECT') || normalized.contains('REVISION')) {
      return AppColors.red;
    }
    if (normalized.contains('SUBMITTED') || normalized.contains('REVIEW')) {
      return AppColors.violet;
    }
    if (normalized.contains('PENDING') || normalized.contains('ASSIGNED')) {
      return AppColors.amber;
    }
    return AppColors.ink;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final color = _color(status.toUpperCase());
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
          color: color.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(3),
          border: Border.all(color: color, width: 1.2)),
      child: Text(l10n.statusLabel(status).toUpperCase(),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
              color: color,
              fontSize: 10,
              letterSpacing: 0.4,
              fontWeight: FontWeight.w900)),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState(
      {super.key, required this.message, this.icon = Icons.inbox_outlined});

  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return StudioCard(
      color: AppColors.warmWhite,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 22),
        child: Column(children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.canvas,
              border: Border.all(color: AppColors.ink, width: 1.4),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: AppColors.muted, size: 28),
          ),
          const SizedBox(height: 12),
          Text(message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  color: AppColors.muted, fontWeight: FontWeight.w800)),
        ]),
      ),
    );
  }
}

class ErrorState extends StatelessWidget {
  const ErrorState({super.key, required this.error, this.onRetry});

  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return StudioCard(
      color: AppColors.paper,
      shadowColor: AppColors.redDark,
      borderColor: AppColors.redDark,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: AppColors.red.withValues(alpha: 0.10),
              border: Border.all(color: AppColors.redDark, width: 1.4),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Icon(Icons.error_outline,
                color: AppColors.redDark, size: 21),
          ),
          const SizedBox(width: 12),
          Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('CONNECTION ISSUE',
                  style: TextStyle(
                      color: AppColors.redDark,
                      fontSize: 10,
                      letterSpacing: 0.7,
                      fontWeight: FontWeight.w900)),
              const SizedBox(height: 4),
              Text(readableApiError(error),
                  style: const TextStyle(
                      color: AppColors.ink,
                      height: 1.35,
                      fontWeight: FontWeight.w800)),
            ]),
          ),
        ]),
        if (onRetry != null) ...[
          const SizedBox(height: 14),
          OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: Text(l10n.retry)),
        ],
      ]),
    );
  }
}

class LoadingPanel extends StatelessWidget {
  const LoadingPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return const StudioCard(
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 28),
        child: Center(child: CircularProgressIndicator(color: AppColors.red)),
      ),
    );
  }
}

class AvatarBadge extends StatelessWidget {
  const AvatarBadge(
      {super.key, required this.name, this.imageUrl, this.size = 42});

  final String name;
  final String? imageUrl;
  final double size;

  @override
  Widget build(BuildContext context) {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return Container(
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.ink, width: 1.6),
          borderRadius: BorderRadius.circular(8),
          boxShadow: const [
            BoxShadow(
                color: AppColors.ink, offset: Offset(2, 2), blurRadius: 0),
          ],
        ),
        child: ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: Image.network(imageUrl!,
                width: size, height: size, fit: BoxFit.cover)),
      );
    }
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
          color: AppColors.ink,
          border: Border.all(color: AppColors.ink, width: 1.6),
          borderRadius: BorderRadius.circular(8),
          boxShadow: const [
            BoxShadow(
                color: AppColors.red, offset: Offset(2, 2), blurRadius: 0),
          ]),
      child: Text(initials(name),
          style: const TextStyle(
              color: Colors.white, fontWeight: FontWeight.w900)),
    );
  }
}

class _ScreentonePainter extends CustomPainter {
  const _ScreentonePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = AppColors.line.withValues(alpha: 0.42);
    const gap = 8.0;
    for (var y = 0.0; y < size.height; y += gap) {
      for (var x = 0.0; x < size.width; x += gap) {
        canvas.drawCircle(Offset(x, y), 0.75, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Manga Studio OS - Mobile Web Companion Notice Banner
class WebWorkspaceBanner extends StatelessWidget {
  const WebWorkspaceBanner({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return StudioCard(
      color: AppColors.paper,
      shadowColor: AppColors.red,
      borderColor: AppColors.red,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.red,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(Icons.devices_outlined,
                    color: Colors.white, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.webNoticeTitle.toUpperCase(),
                      style: const TextStyle(
                        color: AppColors.red,
                        fontWeight: FontWeight.w900,
                        fontSize: 12,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      l10n.openWebHint,
                      style: const TextStyle(
                        color: AppColors.ink,
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (!compact) ...[
            const SizedBox(height: 10),
            Text(
              l10n.webNoticeBody,
              style: const TextStyle(
                color: AppColors.muted,
                fontSize: 11.5,
                height: 1.35,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// All Roles Workflow Status Overview Component
class RoleStatusSummaryCard extends StatelessWidget {
  const RoleStatusSummaryCard({
    super.key,
    required this.seriesCount,
    required this.openTasksCount,
    required this.pendingProposalsCount,
    required this.pendingVotesCount,
  });

  final int seriesCount;
  final int openTasksCount;
  final int pendingProposalsCount;
  final int pendingVotesCount;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          title: l10n.roleStatusOverview,
          subtitle: l10n.recentActivity,
        ),
        const SizedBox(height: 10),
        StudioCard(
          color: AppColors.warmWhite,
          child: Column(
            children: [
              _RoleStatusRow(
                roleName: 'MANGAKA',
                icon: Icons.draw_outlined,
                color: AppColors.red,
                statusText: '$seriesCount ${l10n.series.toLowerCase()}',
                actionHint: l10n.isVi ? 'Theo dõi series & bản thảo' : 'Track series & drafts',
              ),
              const Divider(height: 18, thickness: 1, color: AppColors.line),
              _RoleStatusRow(
                roleName: 'ASSISTANT',
                icon: Icons.brush_outlined,
                color: AppColors.violet,
                statusText: '$openTasksCount ${l10n.openTasks.toLowerCase()}',
                actionHint: l10n.isVi ? 'Nộp task & cập nhật tiến độ' : 'Submit tasks & progress',
              ),
              const Divider(height: 18, thickness: 1, color: AppColors.line),
              _RoleStatusRow(
                roleName: 'EDITOR',
                icon: Icons.rate_review_outlined,
                color: AppColors.blue,
                statusText: '$pendingProposalsCount ${l10n.pendingReview.toLowerCase()}',
                actionHint: l10n.isVi ? 'Duyệt đề xuất & sắp xếp lịch' : 'Review proposals & queue',
              ),
              const Divider(height: 18, thickness: 1, color: AppColors.line),
              _RoleStatusRow(
                roleName: 'EDITORIAL BOARD',
                icon: Icons.gavel_outlined,
                color: AppColors.amber,
                statusText: '$pendingVotesCount ${l10n.boardQueue.toLowerCase()}',
                actionHint: l10n.isVi ? 'Biểu quyết xuất bản' : 'Cast publication votes',
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _RoleStatusRow extends StatelessWidget {
  const _RoleStatusRow({
    required this.roleName,
    required this.icon,
    required this.color,
    required this.statusText,
    required this.actionHint,
  });

  final String roleName;
  final IconData icon;
  final Color color;
  final String statusText;
  final String actionHint;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            border: Border.all(color: color, width: 1.2),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                roleName,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w900,
                  fontSize: 11,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                actionHint,
                style: const TextStyle(
                  color: AppColors.muted,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.paper,
            border: Border.all(color: AppColors.ink, width: 1.2),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            statusText.toUpperCase(),
            style: const TextStyle(
              color: AppColors.ink,
              fontWeight: FontWeight.w900,
              fontSize: 10,
            ),
          ),
        ),
      ],
    );
  }
}

