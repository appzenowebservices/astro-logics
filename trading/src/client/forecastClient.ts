/**
 * HTTP client for the local Timestral forecast service.
 *
 * The service returns a median plus quantile bands for a (variates, time)
 * matrix. Missing values are sent as `null`.
 */

const DEFAULT_URL = "http://127.0.0.1:8001";

export type Matrix = Array<Array<number | null>>;

export interface ForecastRequest {
  series: Matrix;
  prediction_length?: number;
  past_covariates?: Matrix;
  known_covariates?: Matrix;
  quantiles?: number[];
}

export interface ForecastResponse {
  model: string;
  device: string;
  horizon: number;
  variates: number;
  quantile_levels: number[];
  median: number[][];
  bands: Record<string, number[][]>;
  elapsed_ms: number;
}

export interface ForecastHealth {
  status: string;
  available: boolean;
  model: string;
  device: string;
  loaded: boolean;
  error: string | null;
}

class ForecastClient {
  private base: string;

  constructor() {
    this.base = (process.env.FORECAST_URL ?? DEFAULT_URL).replace(/\/+$/, "");
  }

  private async call<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.base}${path}`, {
        ...init,
        headers: {
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...init?.headers,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Forecast service unreachable at ${this.base} (${message}). ` +
          "Start it with: npm run forecast",
      );
    }

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const payload = (await res.json()) as { detail?: string };
        if (payload.detail) detail = payload.detail;
      } catch {
        /* non-JSON body */
      }
      throw new Error(`Forecast service ${res.status}: ${detail}`);
    }

    return (await res.json()) as T;
  }

  health(): Promise<ForecastHealth> {
    return this.call<ForecastHealth>("/health");
  }

  forecast(request: ForecastRequest): Promise<ForecastResponse> {
    return this.call<ForecastResponse>("/forecast", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }
}

export const forecast = new ForecastClient();
