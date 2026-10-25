# Publier une version de l'application

## Ce qui garantit des mises à jour sûres, même en sautant des versions

| Garantie | Comment |
| --- | --- |
| Android accepte la mise à jour | **Même clé de signature pour toutes les versions** (`comima-release.jks`) et numéro de build qui augmente toujours |
| On peut sauter des versions | L'APK est complet ; `release.json` ne donne que la **dernière** version ; son format ne change jamais |
| Nouveautés de toutes les versions sautées | `release.json` garde l'historique ; l'application affiche les notes des builds plus récents que le sien |
| Données de l'élève conservées | `progress.json` a un numéro de schéma ; migrations enchaînées (`ProgressStore._migrations`), sauvegarde `.bak` avant migration |
| Anciennes applications toujours servies | Contenus publiés par format (`/app/v1/…`) : si le format change, on publie `v2` **sans retirer** `v1` |
| Fichier de mise à jour authentique | `release.json` signé Ed25519 (`release.json.sig`), clé publique dans le cœur Rust (`UPDATE_KEY`) |
| APK intègre | SHA-256 de chaque APK dans le fichier signé, vérifié avant l'installation |
| Forcer une mise à jour (faille…) | `python3 app/tool/release.py --min-build N` : les builds < N ne peuvent plus refuser |

## Règle de version

`X.Y.Z+B` dans `pubspec.yaml`. Chaque chiffre de 0 à 9 (0.1.9 → 0.2.0) ; `B` (build) augmente
de 1 à chaque publication. `tool/release.py` refuse un build ou une version qui n'augmente pas.

## Étapes

1. `pubspec.yaml` : nouvelle version et build + 1.
2. `CHANGELOG.md` : section `## [X.Y.Z] - AAAA-MM-JJ` avec `### fr` et `### en` (affichées
   dans l'application pendant la mise à jour).
3. `app/tool/build_apk.sh` : tests du moteur Rust, paquets, APK signés dans `app/build/release/`.
4. Tester l'APK `x86_64` sur l'émulateur (API 29 et récente) : installation **par-dessus** la
   version précédente, la progression doit être conservée.
5. `python3 app/tool/release.py` : écrit et signe `app/release.json`.
6. Commit + PR + fusion : le site publie `release.json(.sig)` sur comima.mg.
7. Release GitHub `app-vX.Y.Z` avec les 4 APK, `SHA256SUMS` et `release-notes.md` :
   ```bash
   gh release create app-vX.Y.Z app/build/release/*.apk app/build/release/SHA256SUMS \
     --title "Application COMIMa X.Y.Z" --notes-file app/build/release/release-notes.md
   ```
   Publier la release **avant** que le site ne soit déployé (sinon le lien de mise à jour
   pointerait un instant vers un fichier absent ; l'application réessaierait plus tard).

## Clés (dossier `release-keys/` du dépôt, ignoré par Git)

| Fichier | Rôle |
| --- | --- |
| `comima-release.jks` | Signature Android. **Perdue = plus aucune mise à jour possible** (désinstaller / réinstaller, progression perdue) |
| `key.properties` | Mots de passe du keystore ; `app/android/key.properties` est un lien vers lui |
| `update-signing.pem` | Clé privée Ed25519 qui signe `release.json` |
| `signing.env` | Variables `COMIMA_*` : `set -a; . release-keys/signing.env; set +a` avant un build manuel |

Le dossier n'est jamais commité (`.gitignore` : `release-keys/`). Copie de secours :
`~/.config/comima-app/`. **Sauvegardez-le aussi hors de la machine** (clé USB, coffre).
Pour la CI : secrets `COMIMA_KEYSTORE` (fichier), `COMIMA_KEYSTORE_PASSWORD`,
`COMIMA_KEY_ALIAS`, `COMIMA_KEY_PASSWORD`, `COMIMA_UPDATE_KEY`.

Vérifier un APK téléchargé : `sha256sum -c SHA256SUMS --ignore-missing`.
