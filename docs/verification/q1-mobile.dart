// From app/: copy to test/q1_mobile_test.dart, flutter test test/q1_mobile_test.dart,
// then remove that temporary copy. Reads the packs built by npm run app-packs.
import 'dart:convert';
import 'dart:io';
import 'package:comima/ui/math_text.dart';
import 'package:comima/ui/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
void main() {
 final notions=<Map<String,dynamic>>[];
 for(final f in Directory('../public/app/v1/packs').listSync().whereType<File>()) {
  if(!f.path.endsWith('.json')) continue;
  final p=jsonDecode(f.readAsStringSync()) as Map;
  for(final n in (p['notions'] as List? ?? [])) {
   if(RegExp(r'^(polynomes|fonctionnelles|jeux|strategies|suites)-').hasMatch(n['id'] as String)) notions.add(Map<String,dynamic>.from(n as Map));
  }
 }
 assert(notions.length==15);
 for(final notion in notions) { for(final lang in ['fr','en']) { for(final scale in [1.0,2.0]) {
  testWidgets('${notion['id']} $lang at 320px x$scale',(tester) async {
   tester.view.physicalSize=const Size(320,740);tester.view.devicePixelRatio=1;
   addTearDown(tester.view.reset);
   final texts=<String>[notion['titre'][lang] as String,notion['fiche'][lang] as String];
   for(final q in notion['questions'] as List) {
    texts.add(q['enonce'][lang] as String);texts.add(q['explication'][lang] as String);
    if(q['texte']!=null) texts.add(q['texte'][lang] as String);
    for(final field in ['choix','etapes','intrus']) {for(final t in (q[field] as List? ?? [])) {texts.add(t[lang] as String);}}
   }
   await tester.pumpWidget(MaterialApp(theme:buildTheme(Brightness.light),builder:(c,w)=>MediaQuery(data:MediaQuery.of(c).copyWith(textScaler:TextScaler.linear(scale)),child:w!),home:Scaffold(body:SingleChildScrollView(child:Padding(padding:const EdgeInsets.all(24),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:texts.map((t)=>MathText(t)).toList()))))));
   await tester.pumpAndSettle();expect(tester.takeException(),isNull);
  });
 }}}
}
