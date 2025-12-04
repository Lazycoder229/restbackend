# OAuth Service Documentation

## Overview

The OAuth2Server provides OAuth 2.0 authentication flows including authorization code, client credentials, refresh tokens, and password grants for Fynix applications.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Grant Types](#grant-types)
- [API Reference](#api-reference)
- [Examples](#examples)

---

## Installation & Setup

```typescript
import { OAuth2Server, GrantType } from "./builtin/oauth.service";

const oauth = new OAuth2Server();
```

---

## Grant Types

- **Authorization Code**: For web applications
- **Client Credentials**: For machine-to-machine
- **Refresh Token**: For token renewal
- **Password**: For trusted applications

---

## API Reference

### `registerClient(client: OAuth2Client): void`

Register OAuth client.

```typescript
oauth.registerClient({
  clientId: "my-app",
  clientSecret: "secret",
  redirectUris: ["https://example.com/callback"],
  grants: [GrantType.AUTHORIZATION_CODE],
  scope: ["read", "write"],
});
```

### `generateAuthorizationCode(...): Promise<string>`

Generate authorization code.

```typescript
const code = await oauth.generateAuthorizationCode(
  "client-id",
  "user-id",
  "redirect-uri",
  ["read"]
);
```

### `exchangeAuthorizationCode(...): Promise<TokenResponse>`

Exchange code for tokens.

```typescript
const tokens = await oauth.exchangeAuthorizationCode(
  code,
  "client-id",
  "client-secret",
  "redirect-uri"
);
```

---

## Examples

### Complete OAuth Flow

```typescript
@Controller("/oauth")
export class OAuthController {
  constructor(private oauth: OAuth2Server) {
    // Register client
    this.oauth.registerClient({
      clientId: "web-app",
      clientSecret: "secret",
      redirectUris: ["https://app.com/callback"],
      grants: [GrantType.AUTHORIZATION_CODE],
      scope: ["read", "write"],
    });
  }

  @Get("/authorize")
  async authorize(@Query() query: any) {
    // Generate authorization code
    const code = await this.oauth.generateAuthorizationCode(
      query.client_id,
      query.user_id,
      query.redirect_uri,
      query.scope.split(" ")
    );

    return { code };
  }

  @Post("/token")
  async token(@Body() body: any) {
    // Exchange code for tokens
    return await this.oauth.exchangeAuthorizationCode(
      body.code,
      body.client_id,
      body.client_secret,
      body.redirect_uri
    );
  }
}
```

---

## Related Documentation

- [JWT Auth Guard](./JWT_AUTH_GUARD.md)
- [Security Service](./SECURITY_SERVICE.md)
- [API Key Guard](./API_KEY_GUARD.md)

---

**Last Updated**: December 4, 2025
