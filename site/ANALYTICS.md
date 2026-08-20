# Analytics Policy

## Current decision

Use **Cloudflare Web Analytics** for aggregate page/performance measurement once enabled in the Pages dashboard. Do not add Google Analytics, advertising pixels, third-party tag managers, or user-level tracking.

Cloudflare Web Analytics activation is an external Pages setting and is not enabled by this repository change.

## Custom events

`site/telemetry.js` and `site/telemetry-events.json` define a future first-party custom-event contract. The helper is intentionally **disabled by default**: it sends nothing unless a same-origin endpoint is explicitly configured in page metadata.

Before enabling custom events:

1. choose and document a first-party endpoint;
2. define data retention;
3. confirm the endpoint does not persist IP addresses, user agents, family tokens, free text, or identifiable learner data;
4. limit properties to the allowlist in `telemetry-events.json`;
5. add automated payload tests;
6. update this document with the activation date and endpoint.

## Intended product questions

Aggregate measurement should answer questions such as:

- Which education modules are opened and completed?
- Do learners reach the assessment?
- Does Pin Sprint lead to another round?
- Which broad learning modes are used?
- Are real-user performance metrics degrading?

It should **not** create learner profiles, track children across sites, record patient information, or retain answer-level histories centrally.
