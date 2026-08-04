import '../../../core/constants/app_constants.dart';
import '../../../models/app_models.dart';

String readerMediaUrl(dynamic value) {
  final raw = textOf(value);
  if (raw.isEmpty) return '';
  final uri = Uri.tryParse(raw);
  if (uri != null && uri.hasScheme) return raw;
  return Uri.parse(AppConstants.apiBaseUrl).resolve(raw).toString();
}

class ReaderSeries {
  const ReaderSeries({
    required this.id,
    required this.title,
    required this.synopsis,
    required this.author,
    required this.genre,
    required this.tags,
    required this.coverUrl,
    required this.bannerUrl,
    required this.status,
    required this.chapterCount,
    required this.pageCount,
    required this.chapters,
    this.publicationYear,
    this.schedule,
  });

  final String id;
  final String title;
  final String synopsis;
  final String author;
  final String genre;
  final List<String> tags;
  final String coverUrl;
  final String bannerUrl;
  final String status;
  final int chapterCount;
  final int pageCount;
  final int? publicationYear;
  final String? schedule;
  final List<ReaderChapterSummary> chapters;

  bool get hasReadableContent => chapterCount > 0 && pageCount > 0;

  factory ReaderSeries.fromJson(Json json) {
    final tags = json['tags'] is List
        ? (json['tags'] as List)
            .map(textOf)
            .where((tag) => tag.isNotEmpty)
            .toList(growable: false)
        : const <String>[];
    return ReaderSeries(
      id: idOf(json['_id'] ?? json['id']),
      title: textOf(
          json['localizedTitle'], textOf(json['title'], 'Untitled series')),
      synopsis: textOf(json['synopsis']),
      author: textOf(json['originalAuthor'], 'Manga Studio'),
      genre: textOf(json['genre'], 'Manga'),
      tags: tags,
      coverUrl: readerMediaUrl(json['imageUrl']),
      bannerUrl: readerMediaUrl(json['bannerUrl']),
      status: textOf(json['status'], 'PUBLISHED'),
      chapterCount: intOf(json['chapterCount']),
      pageCount: intOf(json['pageCount']),
      publicationYear: json['publicationYear'] == null
          ? null
          : intOf(json['publicationYear']),
      schedule: json['pubSchedule']?.toString(),
      chapters: jsonListOf(json['chapters'])
          .map(ReaderChapterSummary.fromJson)
          .toList(growable: false),
    );
  }
}

class ReaderChapterSummary {
  const ReaderChapterSummary({
    required this.id,
    required this.number,
    required this.title,
    required this.status,
    required this.pageCount,
    this.publishedAt,
  });

  final String id;
  final int number;
  final String title;
  final String status;
  final int pageCount;
  final DateTime? publishedAt;

  factory ReaderChapterSummary.fromJson(Json json) {
    final number = intOf(json['chapterNumber']);
    return ReaderChapterSummary(
      id: idOf(json['_id'] ?? json['id']),
      number: number,
      title: textOf(json['title'], 'Chapter $number'),
      status: textOf(json['status'], 'PUBLISHED'),
      pageCount: intOf(json['pageCount']),
      publishedAt: dateOf(json['publishedAt']),
    );
  }
}

class ReaderPage {
  const ReaderPage({
    required this.id,
    required this.number,
    required this.imageUrl,
  });

  final String id;
  final int number;
  final String imageUrl;

  factory ReaderPage.fromJson(Json json) => ReaderPage(
        id: idOf(json['_id'] ?? json['id']),
        number: intOf(json['pageNumber']),
        imageUrl: readerMediaUrl(json['imageUrl']),
      );
}

class ReaderChapter {
  const ReaderChapter({
    required this.id,
    required this.seriesId,
    required this.seriesTitle,
    required this.number,
    required this.title,
    required this.pages,
  });

  final String id;
  final String seriesId;
  final String seriesTitle;
  final int number;
  final String title;
  final List<ReaderPage> pages;

  factory ReaderChapter.fromJson(Json json) {
    final series = jsonOf(json['series']);
    final number = intOf(json['chapterNumber']);
    return ReaderChapter(
      id: idOf(json['_id'] ?? json['id']),
      seriesId: idOf(series),
      seriesTitle:
          textOf(series['localizedTitle'], textOf(series['title'], 'Series')),
      number: number,
      title: textOf(json['title'], 'Chapter $number'),
      pages: jsonListOf(json['pages'])
          .map(ReaderPage.fromJson)
          .where((page) => page.imageUrl.isNotEmpty)
          .toList(growable: false),
    );
  }
}

class ReaderResume {
  const ReaderResume({required this.chapterId, required this.pageIndex});

  final String chapterId;
  final int pageIndex;
}
