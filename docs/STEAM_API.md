# Steam API Reference

This document details the Steam APIs used by SteamBIG and their responses.

## APIs Used

### 1. Store Search API

**Endpoint**: `https://store.steampowered.com/api/storesearch/`

**Purpose**: Search for games by name

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `term` | string | Search query |
| `l` | string | Language (e.g., 'english') |
| `cc` | string | Country code (e.g., 'US') |

**Example Request**:
```
GET https://store.steampowered.com/api/storesearch/?term=cyberpunk&l=english&cc=US
```

**Example Response**:
```json
{
  "total": 42,
  "items": [
    {
      "type": "app",
      "name": "Cyberpunk 2077",
      "id": 1091500,
      "tiny_image": "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/capsule_231x87.jpg",
      "metascore": "86",
      "platforms": {
        "windows": true,
        "mac": false,
        "linux": false
      },
      "streamingvideo": false,
      "price": {
        "currency": "USD",
        "initial": 5999,
        "final": 2999
      }
    }
  ]
}
```

---

### 2. App Details API

**Endpoint**: `https://store.steampowered.com/api/appdetails`

**Purpose**: Get detailed information about a game

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `appids` | number | Steam App ID |
| `l` | string | Language |

**Example Request**:
```
GET https://store.steampowered.com/api/appdetails?appids=1091500&l=english
```

**Example Response**:
```json
{
  "1091500": {
    "success": true,
    "data": {
      "type": "game",
      "name": "Cyberpunk 2077",
      "steam_appid": 1091500,
      "required_age": 18,
      "is_free": false,
      "detailed_description": "...",
      "about_the_game": "...",
      "short_description": "...",
      "header_image": "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg",
      "capsule_image": "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/capsule_231x87.jpg",
      "capsule_imagev5": "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/capsule_184x69.jpg",
      "background": "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/page_bg_generated_v6b.jpg",
      "background_raw": "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/page.bg.jpg",
      "screenshots": [
        {
          "id": 0,
          "path_thumbnail": "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/ss_xxx_116x65.jpg",
          "path_full": "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/ss_xxx_1920x1080.jpg"
        }
      ],
      "movies": [...],
      "developers": ["CD PROJEKT RED"],
      "publishers": ["CD PROJEKT RED"],
      "genres": [...],
      "categories": [...]
    }
  }
}
```

---

### 3. IStoreBrowseService API

**Endpoint**: `https://api.steampowered.com/IStoreBrowseService/GetItems/v1`

**Purpose**: Get enhanced asset information with hash-based URLs

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `input_json` | JSON string | Request configuration |

**Request JSON Structure**:
```json
{
  "ids": [{ "appid": 1091500 }],
  "context": {
    "language": "english",
    "country_code": "US",
    "steam_realm": 1
  },
  "data_request": {
    "include_assets": true
  }
}
```

**Example Response**:
```json
{
  "response": {
    "store_items": [
      {
        "appid": 1091500,
        "success": 1,
        "visible": true,
        "name": "Cyberpunk 2077",
        "assets": {
          "asset_url_format": "steam/apps/1091500/${FILENAME}",
          "main_capsule": "8de85f0fe24d47d8498a48c6c8e6fe571e2e76ec/capsule_616x353.jpg",
          "small_capsule": "8de85f0fe24d47d8498a48c6c8e6fe571e2e76ec/capsule_231x87.jpg",
          "header": "8de85f0fe24d47d8498a48c6c8e6fe571e2e76ec/header.jpg",
          "page_background": "8de85f0fe24d47d8498a48c6c8e6fe571e2e76ec/page_bg_generated.jpg",
          "library_capsule": "8de85f0fe24d47d8498a48c6c8e6fe571e2e76ec/library_600x900.jpg",
          "library_capsule_2x": "8de85f0fe24d47d8498a48c6c8e6fe571e2e76ec/library_600x900_2x.jpg",
          "library_hero": "8de85f0fe24d47d8498a48c6c8e6fe571e2e76ec/library_hero.jpg",
          "library_hero_2x": "8de85f0fe24d47d8498a48c6c8e6fe571e2e76ec/library_hero_2x.jpg"
        }
      }
    ]
  }
}
```

---

## Asset CDN URLs

### Modern CDN (Hash-based)
Base URL: `https://shared.cloudflare.steamstatic.com/store_item_assets/`

Pattern: `{base}steam/apps/{appid}/{hash}/{filename}`

Example:
```
https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/1091500/8de85f0fe24d47d8498a48c6c8e6fe571e2e76ec/library_hero.jpg
```

### Legacy CDN
Base URL: `https://cdn.akamai.steamstatic.com/steam/apps/`

Pattern: `{base}{appid}/{filename}`

Example:
```
https://cdn.akamai.steamstatic.com/steam/apps/1091500/library_hero.jpg
```

---

## Asset Types

### Logos
| Asset | Dimensions | Format | CDN |
|-------|------------|--------|-----|
| `logo.png` | Variable | PNG (transparent) | Hash-based |
| `library_logo.png` | Variable | PNG (transparent) | Legacy |

**Note**: Logo URLs are NOT returned by any public Steam API. They require:
1. Cached hash from previous SteamDB lookup
2. User manual input from SteamDB

### Backgrounds
| Asset | Dimensions | Format | CDN |
|-------|------------|--------|-----|
| `library_hero.jpg` | 1920×620 | JPEG | Both |
| `library_hero_2x.jpg` | 3840×1240 | JPEG | Hash-based |
| `page_bg_raw` | Variable | JPEG | Legacy |

### Capsules
| Asset | Dimensions | Format | Use |
|-------|------------|--------|-----|
| `header.jpg` | 460×215 | JPEG | Store page |
| `capsule_231x87.jpg` | 231×87 | JPEG | Search results |
| `library_600x900.jpg` | 600×900 | JPEG | Library grid |

---

## Rate Limiting

Steam's public APIs have rate limits:
- Generally ~200 requests per 5 minutes per IP
- No authentication required for these endpoints

SteamBIG implements:
- 5-minute response caching
- User-triggered requests only (no polling)

---

## CORS Considerations

Steam's APIs don't include CORS headers, requiring a proxy for browser access.

**Default Proxy**: `https://corsproxy.io/?`

**Alternative Proxies**:
- `https://api.allorigins.win/raw?url=`
- Self-hosted proxy

**Proxy-free options**:
- Browser extension (disable CORS)
- Electron/Tauri wrapper
- Server-side proxy

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden | CORS/rate limit | Check proxy, wait |
| 404 Not Found | Invalid app ID | Verify game exists |
| Game not found | Region locked/delisted | Try different proxy |

### Response Validation

Always check `success` field:
```javascript
if (!data[appId]?.success) {
    throw new Error('Game not found');
}
```
