# Vantage Forums cross-platform integration

IDENTITI does not host forums. It maps a brand or product to a Vantage thread, redirects people to [vantage.withtatva.ai](https://vantage.withtatva.ai), and receives a webhook after a human publishes. Nothing auto-publishes.

## Architecture

1. `GET /forum/go/{type}/{id}` looks up `forum_entity_links`. If a slug exists, 302 to `{VANTAGE}/forums/{slug}`. Otherwise show a pending page.
2. `GET /forum/new/{type}/{id}` (signed in) mints an HS256 JWT (8 minute TTL) and 302 to `{VANTAGE}/forums/new?context={jwt}`.
3. After someone publishes on Vantage, Vantage `POST`s `/api/forum/webhooks/discussion-created`. IDENTITI stores `thread_slug`.

## Environment

```
# Public URLs
NEXT_PUBLIC_VANTAGE_FORUMS_ORIGIN=https://vantage.withtatva.ai
NEXT_PUBLIC_APP_ORIGIN=https://tatva-identity-dev.vercel.app

# Shared HMAC for context JWTs (IDENTITI signs; Vantage verifies with the same value)
IDENTITI_FORUM_PRIVATE_KEY=
# Local copy of that HMAC so operators can see it is set. Vantage stores the same value.
VANTAGE_FORUM_PUBLIC_KEY=

# Vantage → IDENTITI webhook
VANTAGE_FORUM_WRITE_TOKEN=

# Extra return_url origins (localhost and tatva-identity-dev are always allowed)
VANTAGE_ALLOWED_RETURN_ORIGINS=https://tatva-identity-dev.vercel.app

# Planned server API — leave empty until Vantage ships it
VANTAGE_API_BASE_URL=
VANTAGE_FORUM_READ_TOKEN=
```

### What each variable does on IDENTITI

| Variable | Side | Used for |
| --- | --- | --- |
| `NEXT_PUBLIC_VANTAGE_FORUMS_ORIGIN` | Public | Existing thread `{ORIGIN}/forums/{slug}` and new draft `{ORIGIN}/forums/new?context={jwt}` |
| `NEXT_PUBLIC_APP_ORIGIN` | Public | JWT `return_url` and webhook URL shown in admin |
| `IDENTITI_FORUM_PRIVATE_KEY` | Server | HMAC-SHA256 for context JWTs. Required to start a signed discussion |
| `VANTAGE_FORUM_PUBLIC_KEY` | Both | Same HMAC as the private key. IDENTITI does not verify inbound JWTs with this |
| `VANTAGE_FORUM_WRITE_TOKEN` | Server | Bearer token Vantage sends to `/api/forum/webhooks/discussion-created` |
| `VANTAGE_ALLOWED_RETURN_ORIGINS` | Server | Extra origins allowed in `return_url` (open-redirect guard) |
| `VANTAGE_API_BASE_URL` | Planned | `GET {BASE}/forums/hubs` when Vantage ships a read API |
| `VANTAGE_FORUM_READ_TOKEN` | Planned | Bearer for that read API |

`http://localhost:3000` and `https://tatva-identity-dev.vercel.app` are always on the allow-list, plus `NEXT_PUBLIC_APP_ORIGIN`. `http` is only valid for localhost.

## IDENTITI routes (already built)

| Route | Behaviour |
| --- | --- |
| `GET /forum/go/{entityType}/{entityId}` | Mapped → 302 to Vantage. Else pending page |
| `GET /forum/new/{entityType}/{entityId}` | Sign-in → mint JWT → 302. Never publishes |
| `POST /api/forum/webhooks/discussion-created` | Save mapping. Auth: write token or minted `forum:links:create` credential |

`entityType` is `service_brand`, `product_brand`, or `product`.

Webhook URL for this deployment:

```
POST https://tatva-identity-dev.vercel.app/api/forum/webhooks/discussion-created
Authorization: Bearer <VANTAGE_FORUM_WRITE_TOKEN>
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

IDENTITI upserts `forum_entity_links` to `active` when a slug or canonical URL is present. It does not create a forum post.

## JWT (`?context=`)

Header: `{ "alg": "HS256", "typ": "JWT" }`

| Claim | Value |
| --- | --- |
| `iss` | `tatva-identiti` |
| `aud` | `vantage-forums` |
| `sub` | signed-in profile UUID |
| `entity_type` | `service_brand` \| `product_brand` \| `product` |
| `entity_id` | brand or product UUID |
| `brand_id` | organisation UUID |
| `product_id` | present when `entity_type=product` |
| `return_url` | allow-listed IDENTITI URL |
| `iat` / `exp` | now / now + 8 minutes |
| `jti` | stored in `forum_token_jti` |

No API key or HMAC goes in the query string — only this JWT.

## Ask Vantage now

Copy these from `.env.local`. Do not paste them in chat or commit them.

1. HMAC secret — same value as `IDENTITI_FORUM_PRIVATE_KEY` (they store it as `VANTAGE_FORUM_PUBLIC_KEY`)
2. Write token — `VANTAGE_FORUM_WRITE_TOKEN`
3. Webhook URL — `https://tatva-identity-dev.vercel.app/api/forum/webhooks/discussion-created`
4. Return origins — `http://localhost:3000`, `NEXT_PUBLIC_APP_ORIGIN`, plus `VANTAGE_ALLOWED_RETURN_ORIGINS`

Ask them to implement:

- `GET /forums/new?context={jwt}` — verify JWT, pre-fill the composer, do not auto-publish
- After a human publishes — `POST` the webhook with `entity_type`, `entity_id`, and `thread_slug`

`/forums/new` on Vantage does not read `?context=` yet.

## Ask Vantage later (`VANTAGE_API_BASE_URL`)

Leave `VANTAGE_API_BASE_URL` empty. Do not guess. Vantage routes such as `/api/forums` are for Vantage’s own site, not IDENTITI bearer auth.

When they ship partner hub mapping, ask for the **exact** origin only. Expected shape:

```
GET  {BASE}/forums/hubs?entity_type=&entity_id=
POST {BASE}/forums/hubs
Authorization: Bearer {VANTAGE_FORUM_READ_TOKEN}
```

Set `VANTAGE_API_BASE_URL` only after they confirm that base responds with the read token. `VANTAGE_FORUM_READ_TOKEN` can stay generated locally until then. `fetchVantageHub` no-ops while the URL is empty.

## What works today vs planned

| Feature | Status |
| --- | --- |
| Redirect to an existing Vantage thread | Works when a slug is stored |
| Mint JWT and redirect to `/forums/new?context=` | Works on IDENTITI |
| Vantage verifies the context JWT | Not built on Vantage yet |
| Webhook saves mapping | Works on IDENTITI when the write token is set |
| Partner hub API | Not shipped. Keep `VANTAGE_API_BASE_URL` empty |

## Security

- Never put secrets in URLs
- Never iframe Vantage
- Never auto-publish
- Never invent a thread slug
- Validate `return_url` against the allow-list
- Compare bearer tokens with `timingSafeEqual`
- JWT TTL is 8 minutes
