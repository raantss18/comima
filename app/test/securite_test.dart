import 'package:comima/core/app_state.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('lien de retour de connexion : un lien abîmé ou étranger est ignoré, sans bloquer le démarrage', () {
    expect(AppState.loginLink('mg.comima.app://login-callback/?code=abc'), isNotNull);
    expect(AppState.loginLink('mg.comima.app://login-callback#access_token=a&refresh_token=b'), isNotNull);
    expect(AppState.loginLink('mg.comima.app://login-callback:abc/'), isNull, reason: 'port invalide : Uri.parse levait une exception');
    expect(AppState.loginLink('mg.comima.app://login-callback:80/'), isNull);
    expect(AppState.loginLink('mg.comima.app://autre-chose/'), isNull);
    expect(AppState.loginLink('https://evil.example/login-callback'), isNull);
    expect(AppState.loginLink('%%%'), isNull);
    expect(AppState.loginLink(42), isNull);
    expect(AppState.loginLink(null), isNull);
  });
}
