# Vantage Forums integration

IDENTITI does not host discussions. It maps a service brand, product brand, or product to a Vantage thread and can start a **signed draft**. Nothing is auto-published.

Vantage is a separate site: `https://vantage.withtatva.ai`.

## Environment

Set these on IDENTITI only. Leave them empty until Vantage is connected. Profiles, mappings, and pending states still ship.

```
NEXT_PUBLIC_VANTAGE_FORUMS_ORIGIN=https://vantage.withtatva.ai
NEXT_PUBLIC_APP_ORIGIN=https://tatva-identity-dev.vercel.app
VANTAGE_API_BASE_URL=
VANTAGE_FORUM_READ_TOKEN=
VANTAGE_FORUM_WRITE_TOKEN=
VANTAGE_FORUM_PUBLIC_KEY=
IDENTITI_FORUM_PRIVATE_KEY=
VANTAGE_ALLOWED_RETURN_ORIGINS=
```

`IDENTITI_FORUM_PRIVATE_KEY` is the HMAC secret for HS256 context tokens. Do not put this key in a query string.

## IDENTITI routes

| Route | Behaviour |
| --- | --- |
| `GET /forum/go/{entityType}/{entityId}` | If `forum_entity_links` has a `thread_slug` or `canonical_url`, 302 to that Vantage URL. Otherwise show an honest pending page. |
| `GET /forum/new/{entityType}/{entityId}` | Requires sign-in. Mints a short-lived JWT and 302 to Vantage ` /forums/new?context={token} `. Never publishes. |
| `POST /api/forum/webhooks/discussion-created` | Vantage callback that stores the thread slug. |

`entityType` is `service_brand`, `product_brand`, or `product`.

## Existing thread (no token in the URL)

When a mapping is active:

```
302 Location: https://vantage.withtatva.ai/forums/{thread-slug}
```

or the stored `canonical_url` if present. No API key, JWT, or write token is appended.

## New discussion (signed context)

IDENTITI redirects to:

```
https://vantage.withtatva.ai/forums/new?context={jwt}
```

JWT header: `{ "alg": "HS256", "typ": "JWT" }`

Claims:

| Claim | Value |
| --- | --- |
| `iss` | `tatva-identiti` |
| `aud` | `vantage-forums` |
| `sub` | signed-in IDENTITI profile UUID |
| `entity_type` | `service_brand` \| `product_brand` \| `product` |
| `entity_id` | brand or product UUID |
| `brand_id` | organisation UUID |
| `product_id` | product UUID when `entity_type=product` |
| `return_url` | allow-listed IDENTITI URL |
| `iat` / `exp` | issued now, expires in 8 minutes |
| `jti` | unique id, stored in `forum_token_jti` |

Vantage should verify HMAC-SHA256 with the shared `IDENTITI_FORUM_PRIVATE_KEY` (IDENTITI side) / `VANTAGE_FORUM_PUBLIC_KEY` placeholder until Vantage publishes a verify endpoint. Reject expired `jti` reuse if Vantage asks IDENTITI to check it.

`return_url` must match `http://localhost:3000`, `https://tatva-identity-dev.vercel.app`, or an origin in `VANTAGE_ALLOWED_RETURN_ORIGINS`.

## Webhook Vantage must call

```
POST https://<identiti-origin>/api/forum/webhooks/discussion-created
Authorization: Bearer <VANTAGE_FORUM_WRITE_TOKEN or minted write credential>
Content-Type: application/json
```

```json
{
  "entity_type": "service_brand",
  "entity_id": "b0000000-0000-4000-8000-000000000007",
  "forum_hub_id": "hub_optional",
  "forum_thread_id": "thread_optional",
  "thread_slug": "aurum-habitat-interiors",
  "canonical_url": "https://vantage.withtatva.ai/forums/aurum-habitat-interiors"
}
```

IDENTITI stores the mapping on `forum_entity_links` and does not create a forum post.

Mint a write credential in `/admin` → Settings. Only the hash is stored; the plaintext is shown once. Required write scope: `forum:links:create`.

## Expected Vantage endpoints (not implemented here)

These are the URLs IDENTITI already aims at. If they 404, IDENTITI still shows pending or a signed start URL.

| Method | URL | Purpose |
| --- | --- | --- |
| `GET` | `{VANTAGE}/forums/{thread-slug}` | Open an existing mapped discussion |
| `GET` | `{VANTAGE}/forums/new?context={jwt}` | Open a draft composer with IDENTITI context. Must not publish on arrival. |
| `POST` | IDENTITI `/api/forum/webhooks/discussion-created` | Vantage tells IDENTITI the slug after a human publishes |

Optional later, only when `VANTAGE_API_BASE_URL` is set:

| Method | URL | Purpose |
| --- | --- | --- |
| `GET` | `{VANTAGE_API_BASE_URL}/forums/hubs?entity_type=&entity_id=` | Read hub mapping |
| `POST` | `{VANTAGE_API_BASE_URL}/forums/hubs` | Create hub (never a published thread) |

Do not invent a live integration while those env values are empty.

## What IDENTITI never does

- iframe Vantage
- put secrets in query strings
- scrape Google
- auto-publish a discussion
- invent a thread slug to look finished
