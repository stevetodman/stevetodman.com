# StudyHub Cloud Save — Real Device Acceptance

Status: NOT YET VERIFIED AGAINST THE LIVE ENDPOINT

This is the final acceptance gate for cross-device save. Automated tests cover the merge contract, but this checklist verifies the real iPhone/Safari/share-link path.

## Device A

1. Open `/study/us-states.html` on an iPhone.
2. Choose a player and complete enough questions to create unmistakable progress.
3. Record the visible mastered-state count and one specific mastered state.
4. Use **Use on another device** and share/copy the private link.
5. Confirm the visible URL on device A does not expose the family token during ordinary play.

## Device B

1. Open the private share link in Safari on a second device.
2. Confirm the app adopts the family save without email/password/sign-in.
3. Confirm the share-token fragment is removed from the visible URL/history after adoption.
4. Confirm both player profiles appear and Device A's recorded progress is present.
5. Make different progress on Device B and close/background Safari.

## Back on Device A

1. Resume/reload the game.
2. Confirm Device B progress appears.
3. Confirm no mastered state, boss/trophy progress, or best score regressed.
4. Make one more change on Device A and verify Device B receives it after resume/reload.

## Offline/concurrency check

1. Put both devices offline.
2. Make different progress on each device.
3. Reconnect Device A and allow sync.
4. Reconnect Device B and allow sync.
5. Reload both and verify the union of monotonic progress is preserved.

## Failure evidence to capture

If any step fails, record:

- device + iOS/browser version;
- which player was active;
- visible URL **without copying the private token**;
- before/after mastered counts;
- the action immediately preceding the failure;
- whether the failure happened on initial share adoption, pull, push, resume, or merge.

Never paste the family token into a public issue.
