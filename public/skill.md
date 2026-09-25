# AnagataPost API — Agent Skill (Indian Physical Mail as a Service)

Use this skill to send real, physical letters anywhere in India via the AnagataPost API. We handle laser printing on 100 GSM bond paper, tamper-evident enveloping, India Post Speed Post postage, and doorstep delivery with EMS tracking.

## Setup

Set your API key in an environment variable `ANAGATAPOST_API_KEY` or pass it as a Bearer token.
Keys start with `ap_live_` or `ap_test_`.

- **Base URL:** `https://post.anagataitsolutions.in` (or local `http://localhost:3000`)
- **Authentication Header:**
  ```http
  Authorization: Bearer ap_live_...
  ```

---

## Endpoints

### 1. Send or Draft a Letter
```http
POST /api/v1/letters
Content-Type: application/json
```

#### Request Body
| Field | Type | Required | Description |
|---|---|---|---|
| `recipient` | string | Yes | Recipient full name or organization (max 60 chars) |
| `phone` | string | No | 10-digit Indian mobile number (for WhatsApp dispatch tracking alerts) |
| `address` | object | Yes | Indian Postal Address object (see below) |
| `content` | string | Yes | Letter text body. Line breaks (`\n`) preserved. Supports markdown. |
| `handwriting` | boolean/string | No | `true` or `"CAVEAT"` / `"KALAM"` for realistic cursive handwriting font |
| `letterhead` | boolean/string | No | `true` or string title for official corporate letterhead |
| `color` | boolean | No | `true` for full-color laser printing |
| `delivery_type` | string | No | `"SPEED_POST"` (default, ₹99), `"REGISTERED_POST"` (₹129), `"STANDARD"` (₹49) |
| `send` | boolean | No | `true` (default) queues immediately for printing. `false` saves as draft. |

#### Address Object
| Field | Type | Required | Description |
|---|---|---|---|
| `street` | string | Yes | Flat/House No., Building, Street (e.g. "Flat 402, Green Glen") |
| `locality` | string | No | Area, Landmark, or Colony (e.g. "Bellandur") |
| `city` | string | Yes | City or Town (e.g. "Bengaluru") |
| `state` | string | Yes | Indian State or UT (e.g. "Karnataka", "Maharashtra", "Delhi") |
| `pincode` | string | Yes | Exactly 6-digit Indian PIN Code (e.g. "560103") |
| `country` | string | No | Defaults to `"IN"` |

#### Response (`201 Created`)
```json
{
  "id": "ltr_blr_982143",
  "status": "queued",
  "balance_paise": 40100,
  "balance_inr": "401.00",
  "cost_inr": "99.00",
  "tracking_url": "/track/ltr_blr_982143"
}
```

---

### 2. Verify / Auto-Lookup Indian PIN Code
```http
GET /api/v1/pincode/{6_digit_pincode}
```

Returns Post Office name, District, State, and Postal Circle.

---

### 3. List Letters
```http
GET /api/v1/letters
```

---

### 4. Get Letter & Tracking Milestones
```http
GET /api/v1/letters/{letterId}
```

Returns letter data and live milestones:
- Letter Created
- Queued for Regional Print Hub
- Printed & Enveloped (100 GSM)
- Dispatched via India Post Speed Post (with consignment code e.g. `ED839201948IN`)
- Delivered to Recipient

---

### 5. Send a Draft Letter
```http
POST /api/v1/letters/{letterId}/send
```

Deducts balance and queues draft for print & dispatch.

---

## Agent Usage Example (cURL)

```bash
curl -X POST https://post.anagataitsolutions.in/api/v1/letters \
  -H "Authorization: Bearer $ANAGATAPOST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "Rohan Gupta",
    "phone": "9876543210",
    "address": {
      "street": "104, Cyber Heights, 4th Cross",
      "locality": "HSR Layout Sector 1",
      "city": "Bengaluru",
      "state": "Karnataka",
      "pincode": "560102"
    },
    "content": "Dear Rohan,\n\nWe are pleased to send your physical certificate of equity allocation.\n\nWarm regards,\nFounder Office",
    "delivery_type": "SPEED_POST",
    "handwriting": false
  }'
```
