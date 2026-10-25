import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';

/// Inscription / modification d'un profil : prénom, année de naissance, établissement,
/// région et centre COMIMa. Renvoie les informations saisies, ou null si annulé.
Future<Map<String, dynamic>?> showProfileForm(BuildContext context, {Map<String, dynamic>? initial, bool first = false}) {
  return Navigator.push<Map<String, dynamic>>(
    context,
    MaterialPageRoute(fullscreenDialog: true, builder: (_) => _ProfileForm(initial: initial, first: first)),
  );
}

class _ProfileForm extends StatefulWidget {
  const _ProfileForm({this.initial, required this.first});
  final Map<String, dynamic>? initial;
  final bool first;

  @override
  State<_ProfileForm> createState() => _ProfileFormState();
}

class _ProfileFormState extends State<_ProfileForm> {
  final _form = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.initial?['name']?.toString() ?? '');
  late final _school = TextEditingController(text: widget.initial?['school']?.toString() ?? '');
  late int? _birthYear = widget.initial?['birthYear'] as int?;
  late String? _region = widget.initial?['region'] as String?;
  late String? _centre = widget.initial?['centre'] as String?;
  late String _role = (widget.initial?['role'] as String?) ?? 'eleve';

  @override
  void dispose() {
    _name.dispose();
    _school.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    final l = s.lang;
    final lib = s.content.libraryMeta;
    final regions = [...((lib['regions'] as List?) ?? const []).cast<String>(), t('other', l)];
    final centres = ((lib['centres'] as List?) ?? const []).cast<Map<String, dynamic>>();
    final year = DateTime.now().year;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.first ? t('welcome_title', l) : (widget.initial == null ? t('add_profile', l) : t('edit_profile', l))),
        automaticallyImplyLeading: !widget.first,
      ),
      body: Form(
        key: _form,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          if (widget.first) Padding(padding: const EdgeInsets.only(bottom: 16), child: Text(t('signup_intro', l))),
          SegmentedButton<String>(
            segments: [
              ButtonSegment(value: 'eleve', label: Text(t('role_student', l)), icon: const Icon(Icons.school)),
              ButtonSegment(value: 'encadreur', label: Text(t('role_coach', l)), icon: const Icon(Icons.co_present)),
            ],
            selected: {_role},
            onSelectionChanged: (v) => setState(() => _role = v.first),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _name,
            maxLength: 30,
            textCapitalization: TextCapitalization.words,
            decoration: InputDecoration(labelText: t('name', l), border: const OutlineInputBorder()),
            validator: (v) => (v ?? '').trim().isEmpty ? t('required', l) : null,
          ),
          if (_role == 'eleve') ...[
            const SizedBox(height: 8),
            DropdownButtonFormField<int>(
              initialValue: _birthYear,
              decoration: InputDecoration(labelText: t('birth_year', l), border: const OutlineInputBorder()),
              items: [
                for (var y = year - 8; y >= year - 25; y--)
                  DropdownMenuItem(value: y, child: Text('$y  (${year - y} ${t('years', l)})')),
              ],
              onChanged: (v) => setState(() => _birthYear = v),
              validator: (v) => v == null ? t('required', l) : null,
            ),
          ],
          const SizedBox(height: 16),
          TextFormField(
            controller: _school,
            maxLength: 80,
            textCapitalization: TextCapitalization.words,
            decoration: InputDecoration(
              labelText: _role == 'eleve' ? t('school', l) : t('school_coach', l),
              border: const OutlineInputBorder(),
            ),
            validator: (v) => _role == 'eleve' && (v ?? '').trim().isEmpty ? t('required', l) : null,
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            initialValue: regions.contains(_region) ? _region : null,
            isExpanded: true,
            decoration: InputDecoration(labelText: t('region', l), border: const OutlineInputBorder()),
            items: [for (final r in regions) DropdownMenuItem(value: r, child: Text(r))],
            onChanged: (v) => setState(() => _region = v),
            validator: (v) => v == null ? t('required', l) : null,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _centre,
            isExpanded: true,
            decoration: InputDecoration(labelText: t('centre', l), border: const OutlineInputBorder()),
            items: [
              for (final c in centres) DropdownMenuItem(value: c['id'] as String, child: Text(c['nom'] as String)),
              DropdownMenuItem(value: 'aucun', child: Text(t('no_centre', l))),
            ],
            onChanged: (v) => setState(() => _centre = v),
            validator: (v) => v == null ? t('required', l) : null,
          ),
          const SizedBox(height: 8),
          Text(t('privacy_note', l), style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () {
              if (!_form.currentState!.validate()) return;
              Navigator.pop(context, {
                'name': _name.text.trim(),
                'role': _role,
                'birthYear': _role == 'eleve' ? _birthYear : null,
                'school': _school.text.trim(),
                'region': _region,
                'centre': _centre,
              });
            },
            child: Text(t('ok', l)),
          ),
        ]),
      ),
    );
  }
}
