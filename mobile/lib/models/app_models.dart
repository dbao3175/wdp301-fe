typedef Json = Map<String, dynamic>;

String textOf(dynamic value, [String fallback = '']) {
  final valueText = value?.toString().trim();
  if (valueText == null || valueText.isEmpty) return fallback;
  return valueText;
}

String idOf(dynamic value) {
  if (value is Json) return textOf(value['_id'] ?? value['id']);
  return textOf(value);
}

Json jsonOf(dynamic value) => value is Json ? value : <String, dynamic>{};

List<Json> jsonListOf(dynamic value) {
  if (value is List) return value.whereType<Json>().toList(growable: false);
  return const [];
}

DateTime? dateOf(dynamic value) => DateTime.tryParse(textOf(value));

int intOf(dynamic value, [int fallback = 0]) {
  if (value is num) return value.toInt();
  return int.tryParse(textOf(value)) ?? fallback;
}

double doubleOf(dynamic value, [double fallback = 0]) {
  if (value is num) return value.toDouble();
  return double.tryParse(textOf(value)) ?? fallback;
}

String ownerName(dynamic value, [String fallback = 'Studio member']) {
  if (value is Json) return textOf(value['name'] ?? value['email'], fallback);
  return textOf(value, fallback);
}

enum StudioRole {
  admin,
  mangaka,
  assistant,
  editor,
  boardMember,
  unknown;

  static StudioRole fromApi(String value) => switch (value.toUpperCase()) {
        'ADMIN' => StudioRole.admin,
        'MANGAKA' => StudioRole.mangaka,
        'ASSISTANT' => StudioRole.assistant,
        'EDITOR' => StudioRole.editor,
        'BOARD_MEMBER' => StudioRole.boardMember,
        _ => StudioRole.unknown,
      };

  String get apiValue => switch (this) {
        StudioRole.admin => 'ADMIN',
        StudioRole.mangaka => 'MANGAKA',
        StudioRole.assistant => 'ASSISTANT',
        StudioRole.editor => 'EDITOR',
        StudioRole.boardMember => 'BOARD_MEMBER',
        StudioRole.unknown => 'UNKNOWN',
      };

  String get fallbackLabel => switch (this) {
        StudioRole.admin => 'Admin',
        StudioRole.mangaka => 'Mangaka',
        StudioRole.assistant => 'Assistant',
        StudioRole.editor => 'Tantou Editor',
        StudioRole.boardMember => 'Editorial Board',
        StudioRole.unknown => 'Studio member',
      };

  bool get canReviewPublication =>
      this == StudioRole.admin || this == StudioRole.boardMember;
  bool get canSeeRankings =>
      this == StudioRole.admin ||
      this == StudioRole.boardMember ||
      this == StudioRole.mangaka ||
      this == StudioRole.editor;
}

class StudioUser {
  const StudioUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.avatar,
    this.isActive = true,
  });

  final String id;
  final String name;
  final String email;
  final StudioRole role;
  final String? avatar;
  final bool isActive;

  factory StudioUser.fromJson(Json json) => StudioUser(
        id: textOf(json['_id'] ?? json['id']),
        name: textOf(json['name'], 'Studio member'),
        email: textOf(json['email']),
        role: StudioRole.fromApi(textOf(json['role'])),
        avatar: json['avatar']?.toString(),
        isActive: json['isActive'] != false,
      );

  Json toJson() => {
        '_id': id,
        'name': name,
        'email': email,
        'role': role.apiValue,
        'avatar': avatar,
        'isActive': isActive,
      };
}

class StudioSession {
  const StudioSession({required this.token, required this.user});

  final String token;
  final StudioUser user;
}

class StudioSeries {
  const StudioSeries({
    required this.id,
    required this.title,
    required this.status,
    required this.synopsis,
    required this.authorName,
    this.schedule,
    this.createdAt,
  });

  final String id;
  final String title;
  final String status;
  final String synopsis;
  final String authorName;
  final String? schedule;
  final DateTime? createdAt;

  factory StudioSeries.fromJson(Json json) => StudioSeries(
        id: idOf(json['_id'] ?? json['id']),
        title: textOf(json['title'], 'Untitled series'),
        status: textOf(json['status'], 'PENDING'),
        synopsis: textOf(json['synopsis']),
        authorName: ownerName(
            json['mangakaId'] ?? json['author'] ?? json['createdBy'],
            'Unknown author'),
        schedule: json['pubSchedule']?.toString(),
        createdAt: dateOf(json['createdAt']),
      );
}

class StudioChapter {
  const StudioChapter({
    required this.id,
    required this.seriesId,
    required this.seriesTitle,
    required this.number,
    required this.title,
    required this.status,
    this.deadline,
  });

  final String id;
  final String seriesId;
  final String seriesTitle;
  final int number;
  final String title;
  final String status;
  final DateTime? deadline;

  factory StudioChapter.fromJson(Json json) {
    final series = jsonOf(json['seriesId'] ?? json['series']);
    final number = intOf(json['chapterNumber']);
    return StudioChapter(
      id: idOf(json['_id'] ?? json['id']),
      seriesId: idOf(json['seriesId'] ?? json['series']),
      seriesTitle: textOf(series['title'], 'Series'),
      number: number,
      title: textOf(json['title'], number > 0 ? 'Chapter $number' : 'Chapter'),
      status: textOf(json['status'], 'IN_PROGRESS'),
      deadline: dateOf(json['deadline'] ?? json['dueAt']),
    );
  }
}

class StudioTask {
  const StudioTask({
    required this.id,
    required this.title,
    required this.status,
    required this.seriesTitle,
    required this.chapterLabel,
    required this.description,
    this.dueAt,
    this.progress = 0,
    this.pageCount = 0,
    this.reviewNote = '',
  });

  final String id;
  final String title;
  final String status;
  final String seriesTitle;
  final String chapterLabel;
  final String description;
  final DateTime? dueAt;
  final int progress;
  final int pageCount;
  final String reviewNote;

  factory StudioTask.fromJson(Json json) {
    final series = jsonOf(json['seriesId'] ?? json['series']);
    final chapter = jsonOf(json['chapterId'] ?? json['chapter']);
    final status = textOf(json['status'], 'PENDING');
    final chapterNumber = textOf(chapter['chapterNumber']);
    final pageIds = json['pageIds'];
    final pages = pageIds is List ? pageIds.length : intOf(json['pageCount']);
    return StudioTask(
      id: idOf(json['_id'] ?? json['id']),
      title: textOf(json['title'], 'Untitled task'),
      status: status,
      seriesTitle: textOf(series['title'], 'Series'),
      chapterLabel: chapterNumber.isNotEmpty
          ? 'Chapter $chapterNumber'
          : textOf(chapter['title'], 'Chapter'),
      description: textOf(json['description']),
      dueAt: dateOf(json['dueAt'] ?? json['deadline']),
      progress: taskProgressFor(status),
      pageCount: pages,
      reviewNote: textOf(json['reviewNote']),
    );
  }
}

int taskProgressFor(String status) {
  final normalized = status.toUpperCase();
  if (normalized == 'APPROVED' || normalized == 'COMPLETED') return 100;
  if (normalized == 'SUBMITTED' || normalized == 'MANGAKA_APPROVED') return 78;
  if (normalized == 'REVISION_REQUESTED' || normalized == 'REVISING') return 55;
  if (normalized == 'IN_PROGRESS') return 35;
  return 16;
}

class StudioNotification {
  const StudioNotification({
    required this.id,
    required this.title,
    required this.content,
    required this.type,
    required this.isRead,
    this.createdAt,
  });

  final String id;
  final String title;
  final String content;
  final String type;
  final bool isRead;
  final DateTime? createdAt;

  factory StudioNotification.fromJson(Json json) => StudioNotification(
        id: idOf(json['_id'] ?? json['id']),
        title: textOf(json['title'], 'Notification'),
        content: textOf(json['content'] ?? json['message']),
        type: textOf(json['type'], 'INFO'),
        isRead: json['isRead'] == true,
        createdAt: dateOf(json['createdAt']),
      );
}

class SeriesProposal {
  const SeriesProposal({
    required this.id,
    required this.title,
    required this.genre,
    required this.synopsis,
    required this.status,
    required this.authorName,
    this.createdAt,
  });

  final String id;
  final String title;
  final String genre;
  final String synopsis;
  final String status;
  final String authorName;
  final DateTime? createdAt;

  factory SeriesProposal.fromJson(Json json) => SeriesProposal(
        id: idOf(json['_id'] ?? json['id']),
        title: textOf(json['title'], 'Untitled proposal'),
        genre: textOf(json['genre'], 'General'),
        synopsis: textOf(json['synopsis']),
        status: textOf(json['status'], 'SUBMITTED'),
        authorName: ownerName(
            json['mangakaId'] ?? json['authorId'] ?? json['createdBy'],
            'Mangaka'),
        createdAt: dateOf(json['createdAt'] ?? json['submittedAt']),
      );
}

class BoardVote {
  const BoardVote(
      {required this.id,
      required this.voterName,
      required this.decision,
      required this.comment});

  final String id;
  final String voterName;
  final String decision;
  final String comment;

  factory BoardVote.fromJson(Json json) => BoardVote(
        id: idOf(json['_id'] ?? json['id']),
        voterName: ownerName(json['voterId'] ?? json['userId'], 'Board member'),
        decision: textOf(json['decision'], 'ACCEPT'),
        comment: textOf(json['comment']),
      );
}

class BoardSubmission {
  const BoardSubmission({
    required this.id,
    required this.title,
    required this.authorName,
    required this.status,
    required this.synopsis,
    required this.votes,
    this.requiredVotes = 0,
    this.createdAt,
  });

  final String id;
  final String title;
  final String authorName;
  final String status;
  final String synopsis;
  final List<BoardVote> votes;
  final int requiredVotes;
  final DateTime? createdAt;

  factory BoardSubmission.fromJson(Json json) {
    final proposal = jsonOf(json['proposalId'] ?? json['proposal']);
    final series = jsonOf(json['seriesId'] ?? json['series']);
    final source = proposal.isNotEmpty
        ? proposal
        : series.isNotEmpty
            ? series
            : json;
    final requiredVoters = json['requiredVoters'];
    return BoardSubmission(
      id: idOf(json['_id'] ?? json['id']),
      title: textOf(source['title'], 'Series proposal'),
      authorName: ownerName(
          source['mangakaId'] ?? source['authorId'] ?? source['createdBy'],
          'Mangaka'),
      status: textOf(
          json['status'] ?? json['decisionStatus'] ?? source['status'],
          'PENDING'),
      synopsis: textOf(source['synopsis'] ?? json['reason']),
      votes: jsonListOf(json['votes'])
          .map(BoardVote.fromJson)
          .toList(growable: false),
      requiredVotes: requiredVoters is List
          ? requiredVoters.length
          : intOf(json['requiredVotes']),
      createdAt: dateOf(json['createdAt']),
    );
  }
}

class BoardPublication {
  const BoardPublication({
    required this.chapterId,
    required this.title,
    required this.seriesTitle,
    required this.status,
    required this.votes,
    this.sessionId,
    this.totalVotes = 0,
    this.requiredVotes = 0,
    this.finalDecision,
  });

  final String chapterId;
  final String title;
  final String seriesTitle;
  final String status;
  final String? sessionId;
  final int totalVotes;
  final int requiredVotes;
  final String? finalDecision;
  final List<BoardVote> votes;

  factory BoardPublication.fromJson(Json json) {
    final chapter =
        jsonOf(json['chapter']).isNotEmpty ? jsonOf(json['chapter']) : json;
    final session = jsonOf(json['session']);
    final series = jsonOf(chapter['seriesId'] ?? chapter['series']);
    final tally = jsonOf(json['tally']);
    final rawVotes = json['votes'] is List ? json['votes'] : session['votes'];
    final votes =
        jsonListOf(rawVotes).map(BoardVote.fromJson).toList(growable: false);
    final finalDecision = textOf(session['finalDecision']);
    return BoardPublication(
      chapterId: idOf(chapter['_id'] ?? chapter['id']),
      title: textOf(
          chapter['title'], 'Chapter ${textOf(chapter['chapterNumber'])}'),
      seriesTitle: textOf(series['title'], 'Series'),
      status: textOf(session['decisionStatus'] ?? chapter['status'], 'READY'),
      sessionId: session.isEmpty ? null : idOf(session['_id'] ?? session['id']),
      totalVotes: intOf(tally['total'], votes.length),
      requiredVotes: intOf(
          tally['required'], jsonListOf(session['requiredVoters']).length),
      finalDecision: finalDecision.isEmpty ? null : finalDecision,
      votes: votes,
    );
  }
}

class RankingEntry {
  const RankingEntry(
      {required this.id,
      required this.title,
      required this.rank,
      required this.score,
      required this.votes,
      required this.status});

  final String id;
  final String title;
  final int rank;
  final double score;
  final int votes;
  final String status;

  factory RankingEntry.fromJson(Json json) {
    final series = jsonOf(json['seriesId'] ?? json['series']);
    return RankingEntry(
      id: idOf(json['_id'] ?? series['_id'] ?? json['id']),
      title: textOf(series['title'] ?? json['title'], 'Unknown series'),
      rank: intOf(json['rank'] ?? json['position']),
      score: doubleOf(json['ratingScore'] ?? json['score']),
      votes: intOf(json['voteCount'] ?? json['votes']),
      status: textOf(series['status'] ?? json['status'], 'ACTIVE'),
    );
  }
}

class Directive {
  const Directive(
      {required this.id,
      required this.seriesTitle,
      required this.actionType,
      required this.reason,
      required this.status,
      required this.votes});

  final String id;
  final String seriesTitle;
  final String actionType;
  final String reason;
  final String status;
  final List<BoardVote> votes;

  factory Directive.fromJson(Json json) => Directive(
        id: idOf(json['_id'] ?? json['id']),
        seriesTitle: textOf(
            json['seriesTitle'] ?? jsonOf(json['seriesId'])['title'], 'Series'),
        actionType: textOf(json['actionType'], 'CONTINUE'),
        reason: textOf(json['reason']),
        status: textOf(json['status'], 'PENDING'),
        votes: jsonListOf(json['votes'])
            .map(BoardVote.fromJson)
            .toList(growable: false),
      );
}

class StudioOverview {
  const StudioOverview(
      {required this.series,
      required this.chapters,
      required this.tasks,
      required this.publications,
      required this.proposals});

  final List<StudioSeries> series;
  final List<StudioChapter> chapters;
  final List<StudioTask> tasks;
  final List<BoardPublication> publications;
  final List<SeriesProposal> proposals;
}
