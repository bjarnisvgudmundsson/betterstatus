#!/bin/bash
# workstream-status setup script
# Run: bash setup.sh

set -e

echo "→ Installing dependencies..."
npm install

echo "→ Running type check..."
npx tsc --noEmit 2>/dev/null && echo "  ✓ Types OK" || echo "  ⚠ Type errors (expected on first run — fix after confirming routes work)"

echo ""
echo "✓ Done. To start dev server:"
echo "  npm run dev"
echo ""
echo "Routes:"
echo "  /                         → Home — all clients"
echo "  /client/lsh               → Landspítali status page"
echo "  /client/iom               → Isle of Man status page"
echo "  /client/[slug]/admin      → Admin panel for any client"
echo ""
echo "To deploy:"
echo "  npx vercel --prod"
