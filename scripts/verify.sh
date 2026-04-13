#!/bin/bash
set -e

# Always run from repo root regardless of where the script is invoked from.
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo ""
echo "════════════════════════════════════════"
echo "  TASKFLOW QUALITY GATE"
echo "════════════════════════════════════════"

PASS=0
FAIL=0

run_check() {
  local name=$1
  local cmd=$2
  echo ""
  echo "▶ $name"
  if eval "$cmd" > /tmp/gate_output 2>&1; then
    echo "  ✅ PASSED"
    PASS=$((PASS + 1))
  else
    echo "  ❌ FAILED"
    cat /tmp/gate_output
    FAIL=$((FAIL + 1))
  fi
}

# ── Backend ──
echo ""
echo "── BACKEND ──────────────────────────────"

run_check "Maven compile" \
  "(cd backend && mvn compile -q)"

run_check "Maven test" \
  "(cd backend && mvn test -q)"

# ── Health endpoint (requires running backend) ──
echo ""
echo "── HEALTH CHECK ─────────────────────────"

run_check "Health endpoint (db: connected)" \
  "curl -sf --max-time 3 http://localhost:8000/health | python3 -c \"import sys, json; d=json.load(sys.stdin); assert d.get('status')=='ok' and d.get('db')=='connected', f'unexpected: {d}'\""

# ── Frontend ──
echo ""
echo "── FRONTEND ─────────────────────────────"

run_check "TypeScript compile" \
  "(cd frontend && npx tsc --noEmit)"

run_check "ESLint" \
  "(cd frontend && npx eslint src/)"

run_check "Vite build" \
  "(cd frontend && npm run build)"

# ── Summary ──
echo ""
echo "════════════════════════════════════════"
echo "  RESULTS: $PASS passed, $FAIL failed"
echo "════════════════════════════════════════"
echo ""

if [ $FAIL -gt 0 ]; then
  echo "❌ Gate failed. Fix all issues before proceeding."
  exit 1
else
  echo "✅ All gates passed. Safe to proceed."
  exit 0
fi
