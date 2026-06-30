import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CookieOptions } from "express";

@Injectable()
export class SettingsService {
  // Déclarez les propriétés sans les initialiser
  TESTING: boolean;

  // URL settings
  readonly FRONT_URL: string;
  readonly GLOBAL_PREFIX = '';

  // Cookie settings
  readonly DEFAULT_COOKIE_OPTIONS: CookieOptions;

  // JWT settings
  readonly JWT_SECRET: string;
  readonly ACCESS_TOKEN_EXPIRY: string = "15m";
  readonly REFRESH_TOKEN_EXPIRY: string = "3d";
  readonly VERIFY_EMAIL_TOKEN_EXPIRY: string = "1y";
  readonly RESET_PASS_TOKEN_EXPIRY: string = "1h";

  constructor(private readonly config: ConfigService) {
    // Initialisez les propriétés dans le constructeur
    this.TESTING = this.config.get<string>("TESTING") === "true";
    this.FRONT_URL = this.config.getOrThrow<string>("FRONT_URL");
    this.JWT_SECRET = this.config.getOrThrow("JWT_SECRET");

    this.DEFAULT_COOKIE_OPTIONS = {
      httpOnly: true,
      sameSite: this.config.get("COOKIE_SECURE") === "true" ? "none" : "lax", // permet de gérer les cookies cross-site si en production
      secure: this.config.get("COOKIE_SECURE") === "true", // true en production (HTTPS), false en développement (HTTP)
      path: `/${this.GLOBAL_PREFIX}`, // le cookie ne peut être envoyé qu'à des adresses commençant par "/futurekawaapi"
      maxAge: this.parseTokenExpiry(this.REFRESH_TOKEN_EXPIRY) // la durée de vie du cookie doit être la même celle du refresh_token
    };
  }

  /**
   * Convertit une durée au format "10s", "30m", "24h", "7d", "1y" en millisecondes
   * @param token - Durée au format string (ex: "10s", "30m")
   * @returns Durée en millisecondes
   */
  private parseTokenExpiry(token: string): number {
    // Utilise une regex pour extraire nombre et unité
    const match = token.match(/^(\d+)([smhdy])$/);

    if (!match) {
      throw new Error(`Invalid token expiry format: ${token}. Expected format: <number><unit> (ex: 10s, 30m, 24h, 7d, 1y)`);
    }

    const timeValue = parseInt(match[1], 10);
    const timeUnit = match[2];

    switch (timeUnit) {
      case 's':
        return timeValue * 1000;
      case 'm':
        return timeValue * 60 * 1000;
      case 'h':
        return timeValue * 60 * 60 * 1000;
      case 'd':
        return timeValue * 24 * 60 * 60 * 1000;
      case 'y':
        return timeValue * 365 * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Invalid time unit: ${timeUnit}. Supported units: s, m, h, d, y`);
    }
  }
}