import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';

/// Illustration animée et interactive (les mêmes figures que sur le site), fournie avec l'APK
/// sous `assets/figures/<nom>.html` par `scripts/build-app-figures.mjs`. Aucun réseau : la page
/// est autonome et affichée dans une WebView. Si l'asset n'existe pas (notion ou chapitre sans
/// illustration), le widget n'occupe aucune place.
///
/// `name` : `fiche-<id de la notion>` ou `cours-<id du chapitre>`.
class FigureView extends StatefulWidget {
  const FigureView({super.key, required this.name});

  final String name;

  @override
  State<FigureView> createState() => _FigureViewState();
}

class _FigureViewState extends State<FigureView> {
  String? _template;
  bool _missing = false;
  WebViewController? _controller;
  String _loadedFor = '';
  double _height = 330;

  @override
  void initState() {
    super.initState();
    // Les illustrations viennent des contenus (fournis avec l'APK, remplacés par les mises à jour en ligne).
    final html = AppScope.read(context).content.figure(widget.name);
    if (html == null) {
      _missing = true;
    } else {
      _template = html;
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _load();
  }

  /// (Re)charge la page quand la langue ou le thème clair/sombre change.
  void _load() {
    final template = _template;
    if (template == null || !mounted) return;
    final lang = AppScope.of(context).lang;
    final dark = Theme.of(context).brightness == Brightness.dark;
    final key = '$lang/$dark';
    if (key == _loadedFor) return;
    _loadedFor = key;
    final html = template.replaceAll('%%COMIMA_LANG%%', lang == 'en' ? 'en' : 'fr').replaceAll('%%COMIMA_THEME%%', dark ? 'dark' : 'light');
    final controller = _controller ??
        (WebViewController()
          ..setJavaScriptMode(JavaScriptMode.unrestricted)
          ..setBackgroundColor(Colors.transparent)
          ..addJavaScriptChannel('Resize', onMessageReceived: (m) {
            final h = double.tryParse(m.message);
            if (h != null && h > 0 && mounted && (h - _height).abs() > 1) setState(() => _height = h);
          })
          // Page autonome : aucune navigation (ni lien, ni réseau) n'est autorisée.
          ..setNavigationDelegate(NavigationDelegate(
            onNavigationRequest: (r) => r.url.startsWith('about:') || r.url.startsWith('data:') ? NavigationDecision.navigate : NavigationDecision.prevent,
          )));
    _controller = controller;
    controller.loadHtmlString(html);
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    if (_missing || controller == null) return const SizedBox.shrink();
    final theme = Theme.of(context);
    final l = AppScope.of(context).lang;
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.draw_outlined, color: theme.colorScheme.primary, size: 20),
            const SizedBox(width: 8),
            Text(t('illustration', l), style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w700)),
          ]),
          const SizedBox(height: 6),
          SizedBox(
            height: _height,
            // La figure garde tous les gestes dans son cadre (points à déplacer, curseurs) ;
            // on fait défiler la page en touchant à côté.
            child: WebViewWidget(
              controller: controller,
              gestureRecognizers: {Factory<OneSequenceGestureRecognizer>(() => EagerGestureRecognizer())},
            ),
          ),
        ]),
      ),
    );
  }
}
