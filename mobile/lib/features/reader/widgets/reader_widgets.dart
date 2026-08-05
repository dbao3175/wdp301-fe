import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class ReaderCover extends StatelessWidget {
  const ReaderCover({
    super.key,
    required this.imageUrl,
    required this.title,
    this.fit = BoxFit.cover,
  });

  final String imageUrl;
  final String title;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    if (imageUrl.isEmpty) return _CoverFallback(title: title);
    return Image.network(
      imageUrl,
      fit: fit,
      filterQuality: FilterQuality.medium,
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return const ColoredBox(
          color: AppColors.inkSoft,
          child: Center(
            child: CircularProgressIndicator(
              color: AppColors.red,
              strokeWidth: 2,
            ),
          ),
        );
      },
      errorBuilder: (_, __, ___) => _CoverFallback(title: title),
    );
  }
}

class _CoverFallback extends StatelessWidget {
  const _CoverFallback({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.ink,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Positioned(
            right: -18,
            top: -20,
            child: Text(
              '漫',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.06),
                fontSize: 110,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(width: 32, height: 5, color: AppColors.red),
                const SizedBox(height: 8),
                Text(
                  title.toUpperCase(),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    height: 1.05,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ReaderCountBadge extends StatelessWidget {
  const ReaderCountBadge({
    super.key,
    required this.icon,
    required this.label,
    this.color = AppColors.ink,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        border: Border.all(color: color.withValues(alpha: 0.5)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 5),
        Text(
          label,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w900,
            fontSize: 10,
          ),
        ),
      ]),
    );
  }
}
