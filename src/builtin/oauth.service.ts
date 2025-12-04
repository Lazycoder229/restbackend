/**
 * OAuth2 and Authentication Services
 */

import * as crypto from "crypto";

/**
 * OAuth2 grant types
 */
export enum GrantType {
  AUTHORIZATION_CODE = "authorization_code",
  CLIENT_CREDENTIALS = "client_credentials",
  REFRESH_TOKEN = "refresh_token",
  PASSWORD = "password",
}

/**
 * OAuth2 client
 */
export interface OAuth2Client {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  grants: GrantType[];
  scope: string[];
}

/**
 * OAuth2 authorization code
 */
export interface AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string[];
  expiresAt: Date;
}

/**
 * OAuth2 access token
 */
export interface AccessToken {
  token: string;
  clientId: string;
  userId?: string;
  scope: string[];
  expiresAt: Date;
}

/**
 * OAuth2 refresh token
 */
export interface RefreshToken {
  token: string;
  clientId: string;
  userId: string;
  scope: string[];
  expiresAt: Date;
}

/**
 * OAuth2 server
 */
export class OAuth2Server {
  private clients = new Map<string, OAuth2Client>();
  private authCodes = new Map<string, AuthorizationCode>();
  private accessTokens = new Map<string, AccessToken>();
  private refreshTokens = new Map<string, RefreshToken>();

  /**
   * Register OAuth2 client
   */
  registerClient(client: OAuth2Client): void {
    this.clients.set(client.clientId, client);
  }

  /**
   * Generate authorization code
   */
  async generateAuthorizationCode(
    clientId: string,
    userId: string,
    redirectUri: string,
    scope: string[]
  ): Promise<string> {
    const code = this.generateToken();
    const authCode: AuthorizationCode = {
      code,
      clientId,
      userId,
      redirectUri,
      scope,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    };

    this.authCodes.set(code, authCode);
    return code;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeAuthorizationCode(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const authCode = this.authCodes.get(code);

    if (!authCode) {
      throw new Error("Invalid authorization code");
    }

    if (authCode.expiresAt < new Date()) {
      this.authCodes.delete(code);
      throw new Error("Authorization code expired");
    }

    if (
      authCode.clientId !== clientId ||
      authCode.redirectUri !== redirectUri
    ) {
      throw new Error("Invalid client or redirect URI");
    }

    const client = this.clients.get(clientId);
    if (!client || client.clientSecret !== clientSecret) {
      throw new Error("Invalid client credentials");
    }

    // Generate tokens
    const accessToken = this.generateToken();
    const refreshToken = this.generateToken();

    this.accessTokens.set(accessToken, {
      token: accessToken,
      clientId,
      userId: authCode.userId,
      scope: authCode.scope,
      expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
    });

    this.refreshTokens.set(refreshToken, {
      token: refreshToken,
      clientId,
      userId: authCode.userId,
      scope: authCode.scope,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 days
    });

    this.authCodes.delete(code);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<AccessToken | null> {
    const accessToken = this.accessTokens.get(token);

    if (!accessToken) return null;

    if (accessToken.expiresAt < new Date()) {
      this.accessTokens.delete(token);
      return null;
    }

    return accessToken;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const refresh = this.refreshTokens.get(refreshToken);

    if (!refresh) {
      throw new Error("Invalid refresh token");
    }

    if (refresh.expiresAt < new Date()) {
      this.refreshTokens.delete(refreshToken);
      throw new Error("Refresh token expired");
    }

    if (refresh.clientId !== clientId) {
      throw new Error("Invalid client");
    }

    const client = this.clients.get(clientId);
    if (!client || client.clientSecret !== clientSecret) {
      throw new Error("Invalid client credentials");
    }

    const accessToken = this.generateToken();

    this.accessTokens.set(accessToken, {
      token: accessToken,
      clientId,
      userId: refresh.userId,
      scope: refresh.scope,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    });

    return {
      accessToken,
      expiresIn: 3600,
    };
  }

  /**
   * Generate random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}

/**
 * 2FA (Two-Factor Authentication)
 */
export class TwoFactorAuth {
  /**
   * Generate TOTP secret
   */
  static generateSecret(): string {
    return crypto.randomBytes(20).toString("hex");
  }

  /**
   * Generate TOTP code
   */
  static generateTOTP(secret: string, window: number = 0): string {
    const time = Math.floor(Date.now() / 1000 / 30) + window;
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(0, 0);
    buffer.writeUInt32BE(time, 4);

    const hmac = crypto.createHmac("sha1", Buffer.from(secret, "hex"));
    hmac.update(buffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0xf;
    const code =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    return (code % 1000000).toString().padStart(6, "0");
  }

  /**
   * Verify TOTP code
   */
  static verifyTOTP(
    secret: string,
    token: string,
    window: number = 1
  ): boolean {
    for (let i = -window; i <= window; i++) {
      const code = this.generateTOTP(secret, i);
      if (code === token) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
    }
    return codes;
  }

  /**
   * Generate QR code data URI
   */
  static getQRCodeURI(secret: string, issuer: string, account: string): string {
    const uri = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;
    return uri;
  }
}

/**
 * Social login providers
 */
export enum SocialProvider {
  GOOGLE = "google",
  FACEBOOK = "facebook",
  GITHUB = "github",
  TWITTER = "twitter",
}

/**
 * Social auth configuration
 */
export interface SocialAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  scope?: string[];
}

/**
 * Social auth service
 */
export class SocialAuthService {
  private configs = new Map<SocialProvider, SocialAuthConfig>();

  /**
   * Register provider
   */
  registerProvider(provider: SocialProvider, config: SocialAuthConfig): void {
    this.configs.set(provider, config);
  }

  /**
   * Get authorization URL
   */
  getAuthorizationURL(provider: SocialProvider, state: string): string {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`Provider ${provider} not configured`);
    }

    const urls = {
      [SocialProvider.GOOGLE]: "https://accounts.google.com/o/oauth2/v2/auth",
      [SocialProvider.FACEBOOK]: "https://www.facebook.com/v12.0/dialog/oauth",
      [SocialProvider.GITHUB]: "https://github.com/login/oauth/authorize",
      [SocialProvider.TWITTER]: "https://twitter.com/i/oauth2/authorize",
    };

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.callbackURL,
      response_type: "code",
      state,
      scope: (config.scope || []).join(" "),
    });

    return `${urls[provider]}?${params.toString()}`;
  }

  /**
   * Exchange code for token (simplified)
   */
  async exchangeCode(provider: SocialProvider, code: string): Promise<any> {
    // Implementation would call provider's token endpoint
    // This is a simplified version
    return {
      accessToken: "mock_access_token",
      provider,
      code,
    };
  }
}

/**
 * Create OAuth2 server
 */
export function createOAuth2Server(): OAuth2Server {
  return new OAuth2Server();
}

/**
 * Create social auth service
 */
export function createSocialAuthService(): SocialAuthService {
  return new SocialAuthService();
}
