import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/app_state.dart';
import '../core/content.dart';
import '../core/i18n.dart';

/// À propos : le QR code de téléchargement (à montrer à un camarade), le site, les partenaires.
class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  static const appUrl = '$siteUrl/app/';

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(t('about_app', l))),
      body: ListView(padding: const EdgeInsets.fromLTRB(20, 4, 20, 32), children: [
        Center(child: ClipOval(child: Image.asset('assets/logo.png', width: 88, height: 88))),
        const SizedBox(height: 12),
        Text('COMIMa', textAlign: TextAlign.center, style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
        Text(t('club_name', l), textAlign: TextAlign.center, style: theme.textTheme.bodyMedium),
        const SizedBox(height: 4),
        Text('${t('app_version', l)} ${s.updater.version} (${s.updater.build})', textAlign: TextAlign.center, style: theme.textTheme.bodySmall),
        const SizedBox(height: 20),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(children: [
              Text(t('share_app', l), style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              Text(t('share_app_text', l), textAlign: TextAlign.center, style: theme.textTheme.bodyMedium),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                child: Image.asset('assets/qr.png', width: 220, height: 220, filterQuality: FilterQuality.none),
              ),
              const SizedBox(height: 10),
              SelectableText(appUrl.replaceFirst('https://', ''), style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w700)),
              const SizedBox(height: 10),
              Wrap(spacing: 8, children: [
                OutlinedButton.icon(
                  onPressed: () async {
                    await Clipboard.setData(const ClipboardData(text: appUrl));
                    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t('link_copied', l))));
                  },
                  icon: const Icon(Icons.copy),
                  label: Text(t('copy_link', l)),
                ),
                FilledButton.icon(
                  onPressed: () => launchUrl(Uri.parse('$siteUrl/${l == 'en' ? 'en' : 'fr'}/'), mode: LaunchMode.externalApplication),
                  icon: const Icon(Icons.language),
                  label: Text(t('open_site', l)),
                ),
              ]),
            ]),
          ),
        ),
        const SizedBox(height: 18),
        Text(t('partners', l), style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text(t('partners_text', l), style: theme.textTheme.bodySmall),
        const SizedBox(height: 10),
        const _Partners(),
        const SizedBox(height: 18),
        Text(t('about_free', l), style: theme.textTheme.bodySmall, textAlign: TextAlign.center),
      ]),
    );
  }
}

class _Partners extends StatelessWidget {
  const _Partners();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<dynamic>>(
      future: rootBundle.loadString('assets/partners/partners.json').then((j) => jsonDecode(j) as List<dynamic>),
      builder: (context, snap) {
        final list = (snap.data ?? const []).cast<Map<String, dynamic>>();
        return Wrap(spacing: 10, runSpacing: 10, children: [
          for (final p in list)
            Tooltip(
              message: p['name'] as String,
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => launchUrl(Uri.parse(p['url'] as String), mode: LaunchMode.externalApplication),
                child: Container(
                  width: 104,
                  height: 62,
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: Theme.of(context).colorScheme.outlineVariant)),
                  child: Image.asset('assets/partners/${p['file']}', fit: BoxFit.contain, semanticLabel: p['name'] as String),
                ),
              ),
            ),
        ]);
      },
    );
  }
}
