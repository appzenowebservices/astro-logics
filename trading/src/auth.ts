import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

function parseCsv(value: string | undefined): string[] {
  if (!value || value.trim() === "null") return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

const allowedOrigins: string[] = parseCsv(process.env.ALLOWED_ORIGINS);
const expectedToken: string = process.env.MCP_AUTH_TOKEN ?? "";

/**
 * DNS-rebinding protection (required by the MCP spec).
 *
 * Browser clients send an Origin header; non-browser clients (hermes, curl)
 * do not. Only requests WITH an Origin are validated - and they are rejected
 * unless the origin is on the allow-list. An empty allow-list therefore
 * blocks every browser-originated request while leaving CLI clients working.
 */
export function enforceOriginAllowList(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  if (origin === undefined || origin === "") {
    next();
    return;
  }
  if (allowedOrigins.length === 0 || !allowedOrigins.includes(origin)) {
    res.status(403).json({ error: `Origin not allowed: ${origin}` });
    return;
  }
  next();
}

/**
 * Bearer-token gate for every /mcp request.
 * Auth is disabled only when MCP_AUTH_TOKEN is unset (local development).
 */
export function requireBearerToken(req: Request, res: Response, next: NextFunction): void {
  if (!expectedToken) {
    next();
    return;
  }
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }
  const token = header.slice("Bearer ".length);
  if (!safeEqual(token, expectedToken)) {
    res.status(401).json({ error: "Invalid bearer token" });
    return;
  }
  next();
}

function safeEqual(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  if (leftBuf.length !== rightBuf.length) return false;
  return crypto.timingSafeEqual(leftBuf, rightBuf);
}
