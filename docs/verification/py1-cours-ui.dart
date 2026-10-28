import 'dart:convert';
import 'dart:io';
import 'package:comima/ui/math_text.dart';
import 'package:comima/ui/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
void main() {
 final lib=jsonDecode(File('../public/app/v1/library.json').readAsStringSync()) as Map;
 final qs=(lib['exercices'] as List).cast<Map<String,dynamic>>().where((e)=>(e['id'] as String).startsWith('recueil-9-')).toList();
 assert(qs.length==10);
 for(final lang in ['fr','en']) { for(final scale in [1.0,2.0]) { for(final id in qs.map((e)=>e['id'] as String)) {
 testWidgets('texte $id $lang x$scale à 320px', (tester) async {
 tester.view.physicalSize=const Size(320,740); tester.view.devicePixelRatio=1; addTearDown(tester.view.reset);
 final q=qs.firstWhere((q)=>q['id']==id);
 final texts=[MathText.fromLatex(q['enonce'][lang] as String)];
 await tester.pumpWidget(MaterialApp(theme:buildTheme(Brightness.light),builder:(c,w)=>MediaQuery(data:MediaQuery.of(c).copyWith(textScaler:TextScaler.linear(scale)),child:w!),home:Scaffold(body:SingleChildScrollView(child:Padding(padding:const EdgeInsets.all(32),child:Column(children:texts.map((x)=>MathText(x)).toList()))))));
 await tester.pumpAndSettle(); expect(tester.takeException(),isNull);
 });}}}
}
