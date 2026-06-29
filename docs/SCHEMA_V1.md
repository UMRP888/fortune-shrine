# Fortune Shrine Attribution JSON Schema V1

Status: architecture design only

All timestamps use UTC ISO 8601 strings.  
All event IDs are globally unique.  
Unknown fields should be rejected during V1 ingestion to prevent silent schema
drift.

## Common Conventions

```text
event_id       UUIDv7 or UUIDv4
attribution_id "atr_" + URL-safe random 128-bit token
visitor_id     "vis_" + URL-safe random 128-bit token
session_id     "ses_" + URL-safe random 128-bit token
blessing_id    corpus ID or SHA-256-derived ID
wallet_hash    one-way server-side hash; never a raw wallet
```

## send-event

Purpose:

Record one human-confirmed outbound blessing.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://fortune-shrine.local/schema/send-event-v1.json",
  "title": "Fortune Shrine Send Event V1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema_version",
    "event_id",
    "event_type",
    "occurred_at",
    "send_event_id",
    "attribution_id",
    "user_id",
    "username",
    "source_platform",
    "source_surface",
    "post_id",
    "blessing_id",
    "blessing_text",
    "status",
    "environment"
  ],
  "properties": {
    "schema_version": { "const": "1.0" },
    "event_id": { "type": "string", "minLength": 16, "maxLength": 80 },
    "event_type": { "const": "send" },
    "occurred_at": { "type": "string", "format": "date-time" },
    "send_event_id": { "type": "string", "minLength": 16, "maxLength": 80 },
    "attribution_id": {
      "type": "string",
      "pattern": "^atr_[A-Za-z0-9_-]{20,64}$"
    },
    "candidate_id": { "type": ["string", "null"], "maxLength": 120 },
    "user_id": { "type": "string", "minLength": 1, "maxLength": 160 },
    "username": { "type": "string", "minLength": 1, "maxLength": 160 },
    "source_platform": {
      "enum": ["X", "Polymarket", "Other"]
    },
    "source_surface": {
      "enum": ["reply", "profile", "comment", "conversation", "other"]
    },
    "source_run_id": { "type": ["string", "null"], "maxLength": 160 },
    "post_id": { "type": "string", "minLength": 1, "maxLength": 200 },
    "post_url": {
      "type": ["string", "null"],
      "format": "uri",
      "maxLength": 2000
    },
    "candidate_category": { "type": ["string", "null"], "maxLength": 120 },
    "state_tags": {
      "type": "array",
      "maxItems": 20,
      "items": { "type": "string", "maxLength": 80 },
      "uniqueItems": true
    },
    "community": { "type": ["string", "null"], "maxLength": 200 },
    "freshness_score": {
      "type": ["string", "null"],
      "enum": ["S", "A", "B", "C", "D", null]
    },
    "blessing_id": { "type": "string", "minLength": 3, "maxLength": 100 },
    "blessing_text": { "type": "string", "minLength": 1, "maxLength": 1000 },
    "generator_version": { "type": ["string", "null"], "maxLength": 80 },
    "attributed_url": { "type": "string", "format": "uri", "maxLength": 2000 },
    "status": { "enum": ["sent", "voided"] },
    "environment": { "enum": ["production", "test", "development"] }
  }
}
```

## visit-event

Purpose:

Record a Shrine landing session without fingerprinting the traveler.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://fortune-shrine.local/schema/visit-event-v1.json",
  "title": "Fortune Shrine Visit Event V1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema_version",
    "event_id",
    "event_type",
    "occurred_at",
    "visitor_id",
    "session_id",
    "source",
    "landing_path",
    "attribution_status",
    "environment"
  ],
  "properties": {
    "schema_version": { "const": "1.0" },
    "event_id": { "type": "string", "minLength": 16, "maxLength": 80 },
    "event_type": { "const": "visit" },
    "occurred_at": { "type": "string", "format": "date-time" },
    "visitor_id": {
      "type": "string",
      "pattern": "^vis_[A-Za-z0-9_-]{20,64}$"
    },
    "session_id": {
      "type": "string",
      "pattern": "^ses_[A-Za-z0-9_-]{20,64}$"
    },
    "attribution_id": {
      "type": ["string", "null"],
      "pattern": "^atr_[A-Za-z0-9_-]{20,64}$"
    },
    "source": {
      "enum": ["x_reply", "x_profile", "polymarket", "direct", "other"]
    },
    "source_platform": {
      "type": ["string", "null"],
      "enum": ["X", "Polymarket", "Other", null]
    },
    "landing_path": {
      "type": "string",
      "pattern": "^/",
      "maxLength": 500
    },
    "referrer_origin": {
      "type": ["string", "null"],
      "maxLength": 500
    },
    "referrer_path": {
      "type": ["string", "null"],
      "maxLength": 1000
    },
    "first_touch_attribution_id": {
      "type": ["string", "null"],
      "pattern": "^atr_[A-Za-z0-9_-]{20,64}$"
    },
    "last_touch_attribution_id": {
      "type": ["string", "null"],
      "pattern": "^atr_[A-Za-z0-9_-]{20,64}$"
    },
    "attribution_status": {
      "enum": ["attributed", "source_only", "direct", "invalid", "orphaned"]
    },
    "environment": { "enum": ["production", "test", "development"] }
  }
}
```

## payment-event

Purpose:

Record one verified or terminal payment result. Revenue reports include only
verified production events.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://fortune-shrine.local/schema/payment-event-v1.json",
  "title": "Fortune Shrine Payment Event V1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema_version",
    "event_id",
    "event_type",
    "occurred_at",
    "payment_intent_id",
    "payment_status",
    "amount",
    "token",
    "chain",
    "offering_id",
    "environment"
  ],
  "properties": {
    "schema_version": { "const": "1.0" },
    "event_id": { "type": "string", "minLength": 16, "maxLength": 80 },
    "event_type": { "const": "payment" },
    "occurred_at": { "type": "string", "format": "date-time" },
    "payment_intent_id": { "type": "string", "minLength": 16, "maxLength": 120 },
    "visitor_id": {
      "type": ["string", "null"],
      "pattern": "^vis_[A-Za-z0-9_-]{20,64}$"
    },
    "session_id": {
      "type": ["string", "null"],
      "pattern": "^ses_[A-Za-z0-9_-]{20,64}$"
    },
    "attribution_id": {
      "type": ["string", "null"],
      "pattern": "^atr_[A-Za-z0-9_-]{20,64}$"
    },
    "payment_status": {
      "enum": ["verified", "expired", "failed", "superseded"]
    },
    "amount": { "type": "string", "pattern": "^[0-9]+(?:\\.[0-9]{1,6})?$" },
    "token": { "const": "USDC" },
    "chain": { "const": "solana" },
    "offering_id": {
      "enum": ["traveler", "keeper", "sacred", "eternal"]
    },
    "offering_name": { "type": "string", "minLength": 1, "maxLength": 160 },
    "wallet_hash": {
      "type": ["string", "null"],
      "pattern": "^sha256:[a-f0-9]{16,64}$"
    },
    "verified_signature": {
      "type": ["string", "null"],
      "minLength": 64,
      "maxLength": 100
    },
    "verified_at": { "type": ["string", "null"], "format": "date-time" },
    "verified_by": {
      "type": ["string", "null"],
      "enum": ["reference", "matching-transfer", null]
    },
    "shrine_blessing_id": { "type": ["string", "null"], "maxLength": 100 },
    "environment": { "enum": ["production", "test", "development"] }
  }
}
```

## attribution-record

Purpose:

Materialized, query-friendly join of send, visit, and payment evidence.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://fortune-shrine.local/schema/attribution-record-v1.json",
  "title": "Fortune Shrine Attribution Record V1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema_version",
    "record_id",
    "generated_at",
    "attribution_status",
    "first_touch_source",
    "last_touch_source",
    "visit_count",
    "verified_payment_count",
    "verified_amount"
  ],
  "properties": {
    "schema_version": { "const": "1.0" },
    "record_id": { "type": "string", "minLength": 16, "maxLength": 100 },
    "generated_at": { "type": "string", "format": "date-time" },
    "attribution_id": {
      "type": ["string", "null"],
      "pattern": "^atr_[A-Za-z0-9_-]{20,64}$"
    },
    "send_event_id": { "type": ["string", "null"], "maxLength": 100 },
    "user_id": { "type": ["string", "null"], "maxLength": 160 },
    "username": { "type": ["string", "null"], "maxLength": 160 },
    "source_platform": {
      "type": ["string", "null"],
      "enum": ["X", "Polymarket", "Other", null]
    },
    "source_surface": { "type": ["string", "null"], "maxLength": 80 },
    "candidate_category": { "type": ["string", "null"], "maxLength": 120 },
    "state_tags": {
      "type": "array",
      "items": { "type": "string", "maxLength": 80 },
      "uniqueItems": true
    },
    "outbound_blessing_id": { "type": ["string", "null"], "maxLength": 100 },
    "first_touch_source": {
      "enum": ["x_reply", "x_profile", "polymarket", "direct", "other", "unknown"]
    },
    "last_touch_source": {
      "enum": ["x_reply", "x_profile", "polymarket", "direct", "other", "unknown"]
    },
    "first_visit_at": { "type": ["string", "null"], "format": "date-time" },
    "last_visit_at": { "type": ["string", "null"], "format": "date-time" },
    "visit_count": { "type": "integer", "minimum": 0 },
    "payment_intent_id": { "type": ["string", "null"], "maxLength": 120 },
    "first_verified_payment_at": {
      "type": ["string", "null"],
      "format": "date-time"
    },
    "verified_payment_count": { "type": "integer", "minimum": 0 },
    "verified_amount": {
      "type": "string",
      "pattern": "^[0-9]+(?:\\.[0-9]{1,6})?$"
    },
    "offering_ids": {
      "type": "array",
      "items": {
        "enum": ["traveler", "keeper", "sacred", "eternal"]
      },
      "uniqueItems": true
    },
    "wallet_hashes": {
      "type": "array",
      "items": { "type": "string", "pattern": "^sha256:[a-f0-9]{16,64}$" },
      "uniqueItems": true
    },
    "attribution_status": {
      "enum": ["sent_only", "visited", "paid", "unattributed", "orphaned", "voided"]
    },
    "environment": { "enum": ["production", "test", "development"] }
  }
}
```

## Example Joined Record

```json
{
  "schema_version": "1.0",
  "record_id": "rec_01JABC...",
  "generated_at": "2026-06-21T18:00:00.000Z",
  "attribution_id": "atr_7YpN4fZ2uX8qR6sL9cKm3A",
  "send_event_id": "snd_01JABC...",
  "user_id": "x:123456",
  "username": "traveler",
  "source_platform": "X",
  "source_surface": "reply",
  "candidate_category": "crypto_trader",
  "state_tags": ["waiting", "risk"],
  "outbound_blessing_id": "b_0ed15b5f9f63b97ddde4",
  "first_touch_source": "x_reply",
  "last_touch_source": "x_reply",
  "first_visit_at": "2026-06-21T17:10:00.000Z",
  "last_visit_at": "2026-06-21T17:14:00.000Z",
  "visit_count": 2,
  "payment_intent_id": "1881469f-04f5-481a-9fe1-7e05fb28e3a5",
  "first_verified_payment_at": "2026-06-21T17:16:00.000Z",
  "verified_payment_count": 1,
  "verified_amount": "5",
  "offering_ids": ["traveler"],
  "wallet_hashes": ["sha256:84b2640160457d07"],
  "attribution_status": "paid",
  "environment": "production"
}
```
