#!/bin/sh
# CI only: runs a download step up to 8 times, because downloads from GitHub sometimes fail for a while.
for attempt in 1 2 3 4 5 6 7 8; do
  "$@" > retry.log 2>&1 && exit 0
  echo "Attempt $attempt failed: $(tail -n 3 retry.log | tr '\n' ' ' | cut -c1-300)"
  sleep $((attempt * 20))
done
echo "::error::$* kept failing: $(grep -A4 -E 'error|Could not' retry.log | tail -n 12 | tr '\n' ' ' | cut -c1-800)"
exit 1
