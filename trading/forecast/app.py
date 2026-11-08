#!/usr/bin/env python3
"""
Kaalvanta forecast service — Mistral Timestral over HTTP.

    uvicorn app:app --app-dir forecast --port 8001

Endpoints
  GET  /health    service + model status (never loads the model)
  POST /forecast  probabilistic forecast: median + quantile bands

This is a *signal* service. It never places orders; execution stays in the
bridge/MCP path behind TRADING_ENABLED.
"""

from __future__ import annotations

import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from model import ForecastUnavailable, forecast_series, health

app = FastAPI(title="Kaalvanta · Timestral", version="1.0.0")


class ForecastRequest(BaseModel):
    series: list[list[Optional[float]]] = Field(
        ...,
        description="(variates, time) matrix, oldest → newest. null = missing value.",
    )
    prediction_length: int = Field(96, ge=1, le=1024)
    past_covariates: Optional[list[list[Optional[float]]]] = Field(
        None, description="(covariates, history) — known only over the past."
    )
    known_covariates: Optional[list[list[Optional[float]]]] = Field(
        None, description="(covariates, history + horizon) — known into the future."
    )
    quantiles: Optional[list[float]] = Field(
        None, description="Subset of levels to return, e.g. [0.1, 0.5, 0.9]."
    )


@app.get("/health")
def get_health() -> dict:
    return health()


@app.post("/forecast")
def post_forecast(request: ForecastRequest) -> dict:
    try:
        return forecast_series(
            request.series,
            prediction_length=request.prediction_length,
            past_covariates=request.past_covariates,
            known_covariates=request.known_covariates,
            quantiles=request.quantiles,
        )
    except ForecastUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("FORECAST_PORT", "8001"))
    uvicorn.run(app, host="127.0.0.1", port=port)
