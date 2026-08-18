import { createRemoteJWKSet, jwtVerify } from "npm:jose@6.1.0";

const ISSUER = "https://token.actions.githubusercontent.com";
const DISCOVERY_URL = `${ISSUER}/.well-known/openid-configuration`;
const AUDIENCE = "steven-os-github-ingest:v1";
const REPOSITORY = "stevetodman/stevetodman.com";
const REPOSITORY_ID = "1121860459";
const WORKFLOW_REF = "stevetodman/stevetodman.com/.github/workflows/steven-os-ingest.yml@refs/heads/main";
const ALLOWED_EVENTS = new Set(["workflow_run", "schedule", "workflow_dispatch"]);

let jwksPromise: Promise<ReturnType<typeof createRemoteJWKSet>> | null = null;

async function getJwks() {
  if (!jwksPromise) {
    jwksPromise = (async () => {
      const response = await fetch(DISCOVERY_URL, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`GitHub OIDC discovery failed: ${response.status}`);
      const discovery = await response.json();
      if (typeof discovery.jwks_uri !== "string" || !discovery.jwks_uri.startsWith(`${ISSUER}/`)) {
        throw new Error("GitHub OIDC discovery returned an unexpected JWKS URI");
      }
      return createRemoteJWKSet(new URL(discovery.jwks_uri));
    })();
  }
  return await jwksPromise;
}

function bearer(req: Request) {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error("Missing GitHub OIDC bearer token");
  return match[1];
}

function stringClaim(payload: Record<string, unknown>, name: string) {
  const value = payload[name];
  if (typeof value !== "string" || !value) throw new Error(`Missing GitHub OIDC claim: ${name}`);
  return value;
}

async function verifyGitHubOidc(req: Request) {
  const jwks = await getJwks();
  const { payload, protectedHeader } = await jwtVerify(bearer(req), jwks, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ["RS256"],
  });

  if (protectedHeader.typ && protectedHeader.typ !== "JWT") throw new Error("Unexpected GitHub OIDC token type");
  if (stringClaim(payload, "repository") !== REPOSITORY) throw new Error("GitHub OIDC repository mismatch");
  if (stringClaim(payload, "repository_id") !== REPOSITORY_ID) throw new Error("GitHub OIDC repository ID mismatch");
  if (stringClaim(payload, "workflow_ref") !== WORKFLOW_REF) throw new Error("GitHub OIDC workflow ref mismatch");
  const eventName = stringClaim(payload, "event_name");
  if (!ALLOWED_EVENTS.has(eventName)) throw new Error(`GitHub OIDC event not allowed: ${eventName}`);

  return {
    repository: REPOSITORY,
    repositoryId: REPOSITORY_ID,
    workflowRef: WORKFLOW_REF,
    eventName,
    runId: stringClaim(payload, "run_id"),
    runNumber: stringClaim(payload, "run_number"),
    runAttempt: stringClaim(payload, "run_attempt"),
    actor: stringClaim(payload, "actor"),
    actorId: stringClaim(payload, "actor_id"),
    ref: typeof payload.ref === "string" ? payload.ref : null,
    sha: typeof payload.sha === "string" ? payload.sha : null,
    jti: typeof payload.jti === "string" ? payload.jti : null,
  };
}

export default {
  async fetch(req: Request) {
    if (req.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });

    try {
      const identity = await verifyGitHubOidc(req);
      const body = await req.json();
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Body must be a JSON object");

      const source = body.source && typeof body.source === "object" && !Array.isArray(body.source) ? body.source : {};
      const metadata = source.metadata && typeof source.metadata === "object" && !Array.isArray(source.metadata) ? source.metadata : {};
      body.source = {
        ...source,
        metadata: {
          ...metadata,
          githubOidc: identity,
        },
      };

      const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
      const secretKey = secretKeys.default;
      if (typeof secretKey !== "string" || !secretKey.startsWith("sb_secret_")) {
        throw new Error("Default Supabase secret key is unavailable");
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      if (!supabaseUrl) throw new Error("SUPABASE_URL is unavailable");

      const response = await fetch(`${supabaseUrl}/functions/v1/steven-os-ingest`, {
        method: "POST",
        headers: {
          apikey: secretKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const responseBody = await response.text();
      return new Response(responseBody, {
        status: response.status,
        headers: { "content-type": response.headers.get("content-type") || "application/json" },
      });
    } catch (error) {
      console.error("steven-os-github-ingest", error);
      return Response.json({ error: "unauthorized_or_invalid_ingest" }, { status: 401 });
    }
  },
};
