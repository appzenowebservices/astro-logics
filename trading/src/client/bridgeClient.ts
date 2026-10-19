import { getBridgeUrl } from "./bridgeManager.js";

/**
 * Typed HTTP client for the Python MT5 bridge (or its mock).
 * All calls resolve the bridge URL lazily and return the `data` payload of
 * the bridge's `{ success, data }` envelope, throwing on non-OK HTTP.
 */

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface OrderRequest {
  symbol: string;
  action: "BUY" | "SELL" | "BUY_LIMIT" | "BUY_STOP" | "SELL_LIMIT" | "SELL_STOP";
  volume: number;
  price?: number;
  sl?: number;
  tp?: number;
  magic?: number;
  comment?: string;
  deviation?: number;
  filling?: string;
}

export interface OrderResponse {
  success: boolean;
  retcode: number;
  retcodeName?: string;
  comment: string;
  order: number;
  deal: number;
}

class BridgeClient {
  private base: string | null = null;

  private async url(): Promise<string> {
    if (!this.base) this.base = await getBridgeUrl();
    return this.base;
  }

  private async call<T>(
    method: string,
    pathWithQuery: string,
    body?: unknown,
  ): Promise<T> {
    const base = await this.url();
    const res = await fetch(`${base}${pathWithQuery}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const payload = (await res.json()) as { detail?: string };
        if (payload.detail) detail = payload.detail;
      } catch {
        // non-JSON error body
      }
      throw new Error(`Bridge error ${res.status}: ${detail}`);
    }
    const payload = (await res.json()) as { success: boolean; data?: T; error?: string };
    if (!payload.success) {
      throw new Error(`Bridge returned failure: ${payload.error ?? "unknown"}`);
    }
    // Endpoints either wrap results in { success, data } or return the result
    // flat (order/position mutations). Normalize both to the payload itself.
    return (payload.data as T | undefined) !== undefined ? (payload.data as T) : (payload as unknown as T);
  }

  history(symbol: string, timeframe: string, count: number): Promise<Candle[]> {
    const q = new URLSearchParams({ timeframe, count: String(count) });
    return this.call("GET", `/history/${encodeURIComponent(symbol)}?${q}`);
  }

  price(symbol: string): Promise<{ symbol: string; bid: number; ask: number; brokerTime: string }> {
    return this.call("GET", `/price/${encodeURIComponent(symbol)}`);
  }

  symbols(): Promise<Array<Record<string, unknown>>> {
    return this.call("GET", "/symbols");
  }

  account(): Promise<Record<string, unknown>> {
    return this.call("GET", "/account");
  }

  placeOrder(request: OrderRequest): Promise<OrderResponse> {
    return this.call("POST", "/orders", request);
  }

  closePosition(
    ticket: number,
    payload: { volume?: number; deviation?: number; comment?: string; filling?: string },
  ): Promise<OrderResponse> {
    return this.call("POST", `/positions/${ticket}/close`, payload);
  }

  positions(symbol?: string): Promise<Array<Record<string, unknown>>> {
    return this.call("GET", `/positions${symbol ? `?symbol=${encodeURIComponent(symbol)}` : ""}`);
  }

  orders(symbol?: string): Promise<Array<Record<string, unknown>>> {
    return this.call("GET", `/orders${symbol ? `?symbol=${encodeURIComponent(symbol)}` : ""}`);
  }

  modifyOrder(
    ticket: number,
    payload: { price?: number; sl?: number; tp?: number },
  ): Promise<OrderResponse> {
    return this.call("POST", `/orders/${ticket}/modify`, payload);
  }

  cancelOrder(ticket: number): Promise<OrderResponse> {
    return this.call("POST", `/orders/${ticket}/cancel`, {});
  }

  deals(days: number, symbol?: string): Promise<Array<Record<string, unknown>>> {
    const q = new URLSearchParams({ days: String(days) });
    if (symbol) q.set("symbol", symbol);
    return this.call("GET", `/deals/history?${q}`);
  }
}

export const bridge = new BridgeClient();
