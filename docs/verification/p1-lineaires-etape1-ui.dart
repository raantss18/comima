import 'dart:convert';
import 'dart:io';
import 'package:comima/ui/math_text.dart';
import 'package:comima/ui/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
void main() {
 final pack=jsonDecode(File('../public/app/v1/packs/algebre-4.json').readAsStringSync()) as Map;
 final n=(pack['notions'] as List).cast<Map>().firstWhere((n)=>n['id']=='suites-lineaires');
 final qs=(n['questions'] as List).cast<Map<String,dynamic>>();
 for(final lang in ['fr','en']) { for(final scale in [1.0,2.0]) { for(final id in ['sl-26','sl-27','sl-28','sl-29']) {
 testWidgets('texte $id $lang x$scale à 320px', (tester) async {
 tester.view.physicalSize=const Size(320,740); tester.view.devicePixelRatio=1; addTearDown(tester.view.reset);
 final q=qs.firstWhere((q)=>q['id']==id);
 final texts=[q['enonce'][lang] as String, for(final step in (q['etapes'] as List? ?? [])) step[lang] as String];
 await tester.pumpWidget(MaterialApp(theme:buildTheme(Brightness.light),builder:(c,w)=>MediaQuery(data:MediaQuery.of(c).copyWith(textScaler:TextScaler.linear(scale)),child:w!),home:Scaffold(body:SingleChildScrollView(child:Padding(padding:const EdgeInsets.all(32),child:Column(children:texts.map((x)=>MathText(x)).toList()))))));
 await tester.pumpAndSettle(); expect(tester.takeException(),isNull);
 });}}}
}
