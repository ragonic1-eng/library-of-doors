#!/usr/bin/env bash
# For each Aurie shot: 2 unconstrained candidates, then one face-refine of the best-scoring one.
cd "$(dirname "$0")/../app" || exit 1
for i in "$@"; do
  echo "== $i"
  npm run -s gen -- one "kf-$i" --n 2 2>&1 | grep -E "saved|FAILED"
  best=$(cd .. && python -I tools/face_score.py aurie $(ls assets/keyframes/sandman/$i/candidates/kf-$i-v*.png | grep -v -- "-face-") --json 2>/dev/null \
        | python -I -c "import sys,json; t=sys.stdin.read(); r=json.loads(t[t.index('['):]); r=[x for x in r if x.get('score') is not None]; r.sort(key=lambda x:-x['score']); print(r[0]['file'] if r else '')")
  [ -n "$best" ] && echo "   best: $best" && npm run -s gen -- refine "../$best" aurie --n 1
done
