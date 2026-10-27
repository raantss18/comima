import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';

/// Inscription / modification d'un profil : prénom, année de naissance, établissement,
/// région et centre COMIMa. Renvoie les informations saisies, ou null si annulé.
Future<Map<String, dynamic>?> showProfileForm(BuildContext context, {Map<String, dynamic>? initial, bool first = false, String role = 'eleve', bool roleEditable = false}) {
  return Navigator.push<Map<String, dynamic>>(
    context,
    MaterialPageRoute(fullscreenDialog: true, builder: (_) => _ProfileForm(initial: initial, first: first, role: (initial?['role'] as String?) ?? role, roleEditable: roleEditable)),
  );
}

class _ProfileForm extends StatefulWidget {
  const _ProfileForm({this.initial, required this.first, required this.role, this.roleEditable = false});
  final Map<String, dynamic>? initial;
  final bool first;

  /// Élève ou encadreur : choisi à la création. Il reste modifiable tant que le profil n'a jamais été relié à un
  /// compte (un profil déjà ancien, créé élève par défaut, peut ainsi devenir encadreur avant sa première synchronisation).
  final String role;
  final bool roleEditable;

  @override
  State<_ProfileForm> createState() => _ProfileFormState();
}

class _ProfileFormState extends State<_ProfileForm> {
  final _form = GlobalKey<FormState>();
  // Après un premier essai, chaque champ se revérifie dès qu'il change (le message « Obligatoire »
  // disparaît aussitôt le champ rempli).
  bool _tried = false;
  late final _name = TextEditingController(text: widget.initial?['name']?.toString() ?? '');
  late final _school = TextEditingController(text: widget.initial?['school']?.toString() ?? '');
  late int? _birthYear = widget.initial?['birthYear'] as int?;
  late String? _region = widget.initial?['region'] as String?;
  late String? _centre = widget.initial?['centre'] as String?;
  late String _role = widget.role;

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
        title: Text(widget.initial == null ? t('your_profile', l) : t('edit_profile', l)),
      ),
      body: Form(
        key: _form,
        autovalidateMode: _tried ? AutovalidateMode.onUserInteraction : AutovalidateMode.disabled,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(widget.initial == null ? t('signup_intro', l) : (widget.roleEditable ? t('role_editable', l) : t('role_locked', l))),
          ),
          if (widget.roleEditable)
            SegmentedButton<String>(
              segments: [
                ButtonSegment(value: 'eleve', icon: const Icon(Icons.school, size: 18), label: Text(t('role_student', l))),
                ButtonSegment(value: 'encadreur', icon: const Icon(Icons.co_present, size: 18), label: Text(t('role_coach', l))),
              ],
              selected: {_role},
              onSelectionChanged: (v) => setState(() => _role = v.first),
            )
          else
            Align(
              alignment: Alignment.centerLeft,
              child: Chip(
                avatar: Icon(_role == 'encadreur' ? Icons.co_present : Icons.school, size: 18),
                label: Text(_role == 'encadreur' ? t('role_coach', l) : t('role_student', l)),
              ),
            ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _name,
            maxLength: 30,
            textCapitalization: TextCapitalization.words,
            decoration: InputDecoration(labelText: t('name', l), border: const OutlineInputBorder()),
            validator: (v) => (v ?? '').trim().isEmpty ? t('required', l) : null,
          ),
          // Année de naissance : obligatoire pour un élève, facultative pour un encadreur ; de 1950 à il y a 8 ans.
          const SizedBox(height: 8),
          DropdownButtonFormField<int>(
            initialValue: _birthYear,
            decoration: InputDecoration(labelText: t('birth_year', l), border: const OutlineInputBorder()),
            items: [
              for (var y = year - 8; y >= 1950; y--) DropdownMenuItem(value: y, child: Text('$y  (${year - y} ${t('years', l)})')),
            ],
            onChanged: (v) => setState(() => _birthYear = v),
            validator: (v) => _role == 'eleve' && v == null ? t('required', l) : null,
          ),
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
              if (!_form.currentState!.validate()) {
                setState(() => _tried = true);
                return;
              }
              Navigator.pop(context, {
                'name': _name.text.trim(),
                'role': _role,
                'birthYear': _birthYear,
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
