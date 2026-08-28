#!/usr/bin/env bash
set -euo pipefail

URL="${STUDY_CLOUD_URL:-https://lpjvsjezjjasgpkvjjlq.supabase.co/functions/v1/studyhub-save}"
PROJECT_URL="${STUDY_SUPABASE_URL:-https://lpjvsjezjjasgpkvjjlq.supabase.co}"
# Public synthetic credential used only for the canary row. It is intentionally
# unrelated to family data and stable so scheduled checks do not create rows.
TOKEN="studyhub-public-canary-v1-20260826-stable-token"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

request() {
  local name="$1"; shift
  local status
  status="$(curl --silent --show-error --location --connect-timeout 10 --max-time 20 --output "$TMP/$name.body" --write-out '%{http_code}' "$@")"
  printf '%s' "$status" > "$TMP/$name.status"
}

expect_status() {
  local name="$1" expected="$2" actual
  actual="$(cat "$TMP/$name.status")"
  if [[ "$actual" != "$expected" ]]; then
    echo "$name: expected HTTP $expected, got $actual" >&2
    cat "$TMP/$name.body" >&2 || true
    exit 1
  fi
}

json_assert() {
  local name="$1" expression="$2"
  node -e '
    const fs=require("fs");
    const body=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
    const ok=Function("body",`return (${process.argv[2]})`)(body);
    if(!ok){console.error("Assertion failed:",process.argv[2]);console.error(JSON.stringify(body));process.exit(1)}
  ' "$TMP/$name.body" "$expression"
}

# Method and input validation.
request get "$URL"
expect_status get 405
json_assert get 'body.error === "method_not_allowed"'

request bad_json -X POST -H 'content-type: application/json' --data '{' "$URL"
expect_status bad_json 400
json_assert bad_json 'body.error === "bad_json"'

request short_token -X POST -H 'content-type: application/json' \
  --data '{"action":"pull","token":"short"}' "$URL"
expect_status short_token 400
json_assert short_token 'body.error === "bad_token"'

# OPTIONS/CORS contract used by browser clients.
request options -X OPTIONS -D "$TMP/options.headers" "$URL"
expect_status options 200
grep -qi '^access-control-allow-methods:.*POST' "$TMP/options.headers"

# Direct unauthenticated PostgREST access must not expose StudyHub data.
# The browser app carries no Supabase API key, so an uncredentialed request
# should be rejected before any table access is possible.
request direct_rest -H 'Accept-Profile: studyhub' \
  "$PROJECT_URL/rest/v1/saves?select=token_hash&limit=1"
case "$(cat "$TMP/direct_rest.status")" in
  401|403|404) ;;
  *)
    echo "direct_rest: expected 401/403/404, got $(cat "$TMP/direct_rest.status")" >&2
    cat "$TMP/direct_rest.body" >&2 || true
    exit 1
    ;;
esac

# Unknown credentials must never create rows. Use no real family token.
request unprovisioned -X POST -H 'content-type: application/json' \
  --data '{"action":"push","token":"studyhub-unprovisioned-rejection-canary-v1","data":{}}' "$URL"
expect_status unprovisioned 403
json_assert unprovisioned 'body.error === "family_link_required"'

# Real push/pull path against a synthetic family row.
request push_a -X POST -H 'content-type: application/json' \
  --data "{\"action\":\"push\",\"token\":\"$TOKEN\",\"data\":{\"synthetic-canary\":{\"stateStats\":{\"alpha\":{\"streak\":1,\"correct\":1,\"wrong\":0,\"mastered\":true}},\"masteredOrder\":[\"alpha\"],\"bossesDefeated\":1,\"bestStreak\":1,\"game\":{\"version\":1,\"rewards\":{\"canary-a\":{\"xp\":20,\"coins\":8}},\"sessionsCompleted\":1,\"purchases\":{\"copper-blade\":\"owned\"},\"equipped\":{\"weapon\":\"copper-blade\",\"armor\":\"starter-cloak\"}}}}}" \
  "$URL"
expect_status push_a 200
json_assert push_a 'body.ok === true && Number.isFinite(body.revision) && body.revision >= 1'

# A second device contributes independent progress. Server merge must preserve
# both sides rather than replacing the first write.
request push_b -X POST -H 'content-type: application/json' \
  --data "{\"action\":\"push\",\"token\":\"$TOKEN\",\"data\":{\"synthetic-canary\":{\"stateStats\":{\"beta\":{\"streak\":2,\"correct\":2,\"wrong\":0,\"mastered\":true}},\"masteredOrder\":[\"beta\"],\"bossesDefeated\":2,\"bestStreak\":2,\"game\":{\"version\":1,\"rewards\":{\"canary-b\":{\"xp\":50,\"coins\":20}},\"sessionsCompleted\":2,\"purchases\":{\"forest-hood\":\"owned\"},\"equipped\":{\"weapon\":\"starter-sword\",\"armor\":\"forest-hood\"}}}}}" \
  "$URL"
expect_status push_b 200
json_assert push_b 'body.ok === true'

request pull -X POST -H 'content-type: application/json' \
  --data "{\"action\":\"pull\",\"token\":\"$TOKEN\"}" "$URL"
expect_status pull 200
json_assert pull 'body.found === true && body.data && body.data["synthetic-canary"] && body.data["synthetic-canary"].stateStats.alpha.mastered === true && body.data["synthetic-canary"].stateStats.beta.mastered === true && body.data["synthetic-canary"].bossesDefeated >= 2 && body.data["synthetic-canary"].bestStreak >= 2 && body.data["synthetic-canary"].game.rewards["canary-a"].coins === 8 && body.data["synthetic-canary"].game.rewards["canary-b"].xp === 50 && body.data["synthetic-canary"].game.purchases["copper-blade"] && body.data["synthetic-canary"].game.purchases["forest-hood"] && body.data["synthetic-canary"].game.sessionsCompleted >= 2'

echo "Study cloud canary passed: validation, CORS, direct-access rejection, push, pull, and merge are healthy."
