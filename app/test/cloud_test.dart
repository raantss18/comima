import 'dart:convert';

import 'package:comima/core/cloud.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

/// Réponse JSON en UTF-8, comme le vrai serveur (les accents doivent traverser).
http.Response jr(Object body, int status) =>
    http.Response.bytes(utf8.encode(jsonEncode(body)), status, headers: {'content-type': 'application/json; charset=utf-8'});

const cfg = CloudConfig(url: 'https://x.supabase.co', key: 'anon-key');

Map<String, dynamic> token({String access = 'acc', String refresh = 'ref', String id = 'user-1'}) => {
      'access_token': access,
      'refresh_token': refresh,
      'expires_in': 3600,
      'user': {'id': id, 'email': 'a@b.mg'},
    };

void main() {
  test('PKCE : vecteur de la RFC 7636', () {
    final p = Pkce.fromVerifier('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
    expect(p.challenge, 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  test('PKCE : secret aléatoire, sans remplissage, empreinte cohérente', () {
    final a = Pkce.create(), b = Pkce.create();
    expect(a.verifier, isNot(b.verifier));
    expect(a.verifier.length, greaterThanOrEqualTo(43));
    expect(a.verifier.contains('='), isFalse);
    expect(Pkce.fromVerifier(a.verifier).challenge, a.challenge);
  });

  test('adresse Google : retour vers l\'application, PKCE, pas de secret', () {
    final u = Cloud(cfg).oauthUrl('google', Pkce.fromVerifier('v' * 50));
    expect(u.host, 'x.supabase.co');
    expect(u.path, '/auth/v1/authorize');
    expect(u.queryParameters['provider'], 'google');
    expect(u.queryParameters['redirect_to'], 'mg.comima.app://login-callback');
    expect(u.queryParameters['code_challenge_method'], 's256');
    expect(u.toString().contains('anon-key'), isFalse);
  });

  test('connexion e-mail : requête et session', () async {
    late http.Request seen;
    final c = Cloud(cfg, client: MockClient((r) async {
      seen = r;
      return jr(token(), 200);
    }));
    final s = await c.signIn('a@b.mg', 'secret1');
    expect(seen.url.path, '/auth/v1/token');
    expect(seen.url.queryParameters['grant_type'], 'password');
    expect(seen.headers['apikey'], 'anon-key');
    expect(jsonDecode(seen.body), {'email': 'a@b.mg', 'password': 'secret1'});
    expect(s.userId, 'user-1');
    expect(s.expiresSoon, isFalse);
  });

  test('inscription : sans session tant que l\'e-mail n\'est pas confirmé', () async {
    final c = Cloud(cfg, client: MockClient((r) async => jr({'id': 'user-2', 'email': 'a@b.mg'}, 200)));
    expect(await c.signUp('a@b.mg', 'secret1', displayName: 'Rova'), isNull);
  });

  test('erreurs lisibles : mauvais mot de passe, e-mail non confirmé, compte existant', () async {
    Cloud failing(int st, Map<String, dynamic> b) => Cloud(cfg, client: MockClient((r) async => jr(b, st)));
    Future<CloudException> caught(Future<Object?> f) async {
      try {
        await f;
      } on CloudException catch (e) {
        return e;
      }
      fail('une erreur était attendue');
    }

    final bad = await caught(failing(400, {'error_code': 'invalid_credentials', 'msg': 'Invalid login credentials'}).signIn('a@b.mg', 'x'));
    expect(bad.invalidLogin, isTrue);
    final nc = await caught(failing(400, {'error_code': 'email_not_confirmed', 'msg': 'Email not confirmed'}).signIn('a@b.mg', 'x'));
    expect(nc.notConfirmed, isTrue);
    final off = await caught(failing(422, {'code': 422, 'error_code': 'email_provider_disabled', 'msg': 'Email logins are disabled'}).signIn('a@b.mg', 'x'));
    expect(off.emailDisabled, isTrue);
    final ex = await caught(failing(422, {'error_code': 'user_already_exists', 'msg': 'User already registered'}).signUp('a@b.mg', 'secret1'));
    expect(ex.exists, isTrue);
  });

  test('données : schéma comima et envoi sans doublon', () async {
    late http.Request seen;
    final c = Cloud(cfg, client: MockClient((r) async {
      seen = r;
      return http.Response('', 201);
    }));
    final s = Session(access: 'acc', refresh: 'ref', exp: 4102444800, userId: 'user-1');
    await c.pushAttempts(s, [
      {'id': 'e1', 'user_id': 'user-1', 'question_id': 'rs-01', 'ok': true, 'answered_at': '2026-10-25T10:00:00Z'},
    ]);
    expect(seen.url.path, '/rest/v1/attempts');
    expect(seen.headers['Content-Profile'], 'comima');
    expect(seen.headers['Prefer'], contains('ignore-duplicates'));
    expect(seen.headers['Authorization'], 'Bearer acc');
  });

  test('inscription du profil : le rôle demandé part, jamais un rôle accordé', () async {
    late Map<String, dynamic> body;
    final c = Cloud(cfg, client: MockClient((r) async {
      body = jsonDecode(r.body) as Map<String, dynamic>;
      return jr({'id': 'user-1', 'role': 'eleve'}, 200);
    }));
    final s = Session(access: 'acc', refresh: 'ref', exp: 4102444800, userId: 'user-1');
    await c.register(s, {'name': 'Rova', 'birthYear': 2010, 'school': 'Lycée', 'region': 'Analamanga', 'centre': 'aucun', 'role': 'encadreur'});
    expect(body['p_requested_role'], 'encadreur');
    expect(body['p_centre_id'], isNull);
    expect(body.containsKey('role'), isFalse);
  });
}
