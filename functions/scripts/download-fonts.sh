#!/usr/bin/env bash
# Download font woff2 files for PDF generation.
# Run from the functions/ directory: bash scripts/download-fonts.sh
# Fonts are bundled in functions/fonts/ and committed to the repo.

set -e
FONTS_DIR="$(dirname "$0")/../fonts"
mkdir -p "$FONTS_DIR"

echo "Downloading Inter..."
# Inter 400 (Regular)
curl -sL "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2" -o "$FONTS_DIR/Inter-Regular.woff2"
# Inter 500 (Medium)
curl -sL "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2" -o "$FONTS_DIR/Inter-Medium.woff2"
# Inter 600 (SemiBold)
curl -sL "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2" -o "$FONTS_DIR/Inter-SemiBold.woff2"

echo "Downloading Crimson Text..."
# Crimson Text 400 (Regular)
curl -sL "https://fonts.gstatic.com/s/crimsontext/v19/wlp2gwHKFkZgtmSR3NB0oRJvaA.woff2" -o "$FONTS_DIR/CrimsonText-Regular.woff2"
# Crimson Text 700 (Bold)
curl -sL "https://fonts.gstatic.com/s/crimsontext/v19/wlppgwHKFkZgtmSR3NB0oRJXsCx2C9lR1LI.woff2" -o "$FONTS_DIR/CrimsonText-Bold.woff2"
# Crimson Text 400 Italic
curl -sL "https://fonts.gstatic.com/s/crimsontext/v19/wlpogwHKFkZgtmSR3NB0oRJfaghWIfdd3Kg.woff2" -o "$FONTS_DIR/CrimsonText-Italic.woff2"

echo "Downloading JetBrains Mono..."
# JetBrains Mono 400 (Regular)
curl -sL "https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxTOlOTk6OThhvA.woff2" -o "$FONTS_DIR/JetBrainsMono-Regular.woff2"

echo "Done. Font files written to $FONTS_DIR"
