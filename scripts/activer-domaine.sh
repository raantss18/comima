#!/usr/bin/env bash
# Bascule le site sur un domaine personnalisé (par défaut comima.mg).
# À lancer UNE FOIS que le DNS pointe vers GitHub Pages : avant cela,
# github.io/comima redirigerait vers un domaine injoignable.
set -euo pipefail
DOMAIN="${1:-comima.mg}"
REPO="${REPO:-raantss18/comima}"

echo "Vérification DNS de $DOMAIN…"
a=$(curl -s "https://dns.google/resolve?name=$DOMAIN&type=A" | grep -o '185\.199\.10[89]\.153\|185\.199\.11[01]\.153' | sort -u | wc -l)
if [ "$a" -lt 1 ]; then
  echo "✗ $DOMAIN ne pointe pas encore vers GitHub Pages (185.199.108-111.153)." >&2
  echo "  Créer les enregistrements chez le registrar puis relancer." >&2
  exit 1
fi
echo "✓ $DOMAIN → GitHub Pages ($a/4 adresses)"

gh variable set CUSTOM_DOMAIN -R "$REPO" -b "$DOMAIN"
gh api -X PUT "repos/$REPO/pages" -f cname="$DOMAIN" >/dev/null
gh workflow run deploy.yml -R "$REPO"
echo "Déploiement lancé. Activer HTTPS une fois le certificat émis (quelques minutes à 1 h) :"
echo "  gh api -X PUT repos/$REPO/pages -F https_enforced=true"
