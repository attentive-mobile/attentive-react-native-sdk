#!/usr/bin/env bash
set -euo pipefail

# Builds a Slack Block Kit payload announcing a successful SDK release and exports
# it as SLACK_RELEASE_PAYLOAD to BASH_ENV for the slack orb (mirrors the iOS/Android
# "release published" notifications to #eng-mobile-sdk-releases).
#
# Required env vars (exported by the release job): RELEASE_VERSION, IS_PRERELEASE
# Optional env vars: CIRCLE_PROJECT_USERNAME, CIRCLE_PROJECT_REPONAME

VERSION="${RELEASE_VERSION:-}"
IS_PRERELEASE="${IS_PRERELEASE:-false}"
REPO_OWNER="${CIRCLE_PROJECT_USERNAME:-attentive-mobile}"
REPO_NAME="${CIRCLE_PROJECT_REPONAME:-attentive-react-native-sdk}"
RELEASE_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${VERSION}"
NPM_URL="https://www.npmjs.com/package/@attentive-mobile/attentive-react-native-sdk/v/${VERSION}"

if [ "${IS_PRERELEASE}" = "true" ]; then
  HEADER="🧪 RN SDK prerelease published"
  TAG_NOTE=" (npm dist-tag: beta)"
else
  HEADER="🚀 RN SDK released"
  TAG_NOTE=""
fi

PAYLOAD=$(jq -n \
  --arg header "$HEADER" \
  --arg version "$VERSION" \
  --arg release_url "$RELEASE_URL" \
  --arg npm_url "$NPM_URL" \
  --arg tag_note "$TAG_NOTE" \
  --arg repo "$REPO_NAME" \
  '{
    "blocks": [
      {"type":"header","text":{"type":"plain_text","text":$header,"emoji":true}},
      {"type":"section","fields":(
        [{"type":"mrkdwn","text":("*Version:*\n<" + $release_url + "|" + $version + ">" + $tag_note)}]
        + [{"type":"mrkdwn","text":("*Package:*\n<" + $npm_url + "|npm>")}]
        + [{"type":"mrkdwn","text":("*Project:*\n" + $repo)}]
      )}
    ]
  }')

echo "export SLACK_RELEASE_PAYLOAD='$(echo "$PAYLOAD" | sed "s/'/'\\\\''/g")'" >> "$BASH_ENV"
