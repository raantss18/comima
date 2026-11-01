import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:pdfrx/pdfrx.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import 'design.dart';
import 'library.dart';

/// Lecture d'un cours dans l'application, hors ligne : le PDF du chapitre est fourni avec l'APK
/// (`assets/content/cours/<id>.pdf`). S'il manque (chapitre plus récent que l'application), on l'ouvre en ligne.
class CoursePdfPage extends StatefulWidget {
  const CoursePdfPage({super.key, required this.chapter});

  final Map<String, dynamic> chapter;

  @override
  State<CoursePdfPage> createState() => _CoursePdfPageState();
}

class _CoursePdfPageState extends State<CoursePdfPage> {
  late final String _asset = 'assets/content/cours/${widget.chapter['id']}.pdf';
  late final Future<bool> _bundled = rootBundle.load(_asset).then((_) => true, onError: (_) => false);

  @override
  Widget build(BuildContext context) {
    final l = AppScope.of(context).lang;
    return Scaffold(
      appBar: AppBar(title: Text(tr(widget.chapter['titre'], l)), actions: const [LogoMenuButton()]),
      body: SafeArea(
        top: false,
        child: FutureBuilder<bool>(
          future: _bundled,
          builder: (context, snap) {
            if (!snap.hasData) return const Center(child: CircularProgressIndicator());
            if (snap.data!) return PdfViewer.asset(_asset, params: const PdfViewerParams(margin: 4));
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Text(t('course_offline_missing', l), textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    icon: const Icon(Icons.open_in_browser),
                    label: Text(t('course_pdf', l)),
                    onPressed: () => openSite(widget.chapter['pdf'] as String),
                  ),
                ]),
              ),
            );
          },
        ),
      ),
    );
  }
}
