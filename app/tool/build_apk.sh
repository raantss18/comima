#!/usr/bin/env bash
# Construit les APK de l'application COMIMa :
#   1. paquets de questions (validés) et illustrations interactives copiés dans l'APK pour fonctionner hors ligne dès l'installation ;
#   2. cœur Rust (moteur de correction) compilé pour armeabi-v7a, arm64-v8a et x86_64 ;
#   3. APK par processeur (plus légers, utilisés par la mise à jour automatique) + APK universel.
# Sortie : app/build/release/ (APK + SHA256SUMS + release.json prêt à publier).
# La signature de release vient de app/android/key.properties (ou des variables COMIMA_*).
set -euo pipefail
APP="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(dirname "$APP")"
export PATH="$HOME/.cargo/bin:$PATH"

(cd "$ROOT" && node scripts/build-index.mjs >/dev/null && node scripts/build-app-packs.mjs)
rm -rf "$APP/assets/content"
mkdir -p "$APP/assets/content"
cp -r "$ROOT/public/app/v1/." "$APP/assets/content/"
# Les illustrations interactives (pages HTML autonomes) sont dans public/app/v1/figures/, copiées ci-dessus.

(cd "$APP/native" && cargo test --quiet && cargo ndk --platform 24 \
  -t armeabi-v7a -t arm64-v8a -t x86_64 -o "$APP/android/app/src/main/jniLibs" build --release)

# Comptes : URL du projet Supabase et clé publique `anon` (release-keys/accounts.env, ignoré par
# Git). Sans ce fichier, l'application est construite sans comptes (100 % locale).
DEFINES=()
if [ -f "$ROOT/release-keys/accounts.env" ]; then
  set -a; . "$ROOT/release-keys/accounts.env"; set +a
  DEFINES+=("--dart-define=SUPABASE_URL=${COMIMA_SUPABASE_URL:?}" "--dart-define=SUPABASE_KEY=${COMIMA_SUPABASE_KEY:?}")
  echo "✓ Comptes activés (projet $COMIMA_SUPABASE_URL)"
else
  echo "⚠ release-keys/accounts.env absent : application construite SANS comptes"
fi

cd "$APP"
flutter test
VERSION=$(grep '^version:' pubspec.yaml | sed 's/version: //')
NAME=${VERSION%+*}
BUILD=${VERSION#*+}
# Même numéro de build pour tous les APK : la mise à jour ne dépend pas du processeur.
flutter build apk --release --split-per-abi -P force-version-code-ignoring-abi=true ${DEFINES[@]+"${DEFINES[@]}"}
flutter build apk --release ${DEFINES[@]+"${DEFINES[@]}"}

OUT="$APP/build/release"
rm -rf "$OUT" && mkdir -p "$OUT"
for abi in armeabi-v7a arm64-v8a x86_64; do
  cp "build/app/outputs/flutter-apk/app-$abi-release.apk" "$OUT/comima-$NAME-$abi.apk"
done
cp build/app/outputs/flutter-apk/app-release.apk "$OUT/comima-$NAME-universal.apk"
# Copies sans numéro de version : le site pointe vers
# https://github.com/raantss18/comima/releases/latest/download/comima-<abi>.apk
for abi in arm64-v8a armeabi-v7a x86_64 universal; do
  cp "$OUT/comima-$NAME-$abi.apk" "$OUT/comima-$abi.apk"
done
(cd "$OUT" && sha256sum *.apk > SHA256SUMS)
echo "✓ $NAME (build $BUILD) → $OUT"
ls -la "$OUT"
