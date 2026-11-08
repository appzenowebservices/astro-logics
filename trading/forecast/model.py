#!/usr/bin/env python3
"""
Timestral wrapper — Mistral's time-series foundation model.

Zero-shot probabilistic forecasting on CPU. Imported lazily so the service
starts (and reports health) even when torch/timestral are not installed yet.

Env:
  FORECAST_MODEL        Hugging Face repo (default mistralai/Timestral-209M)
  FORECAST_DEVICE       cpu | cuda | mps (default cpu)
  FORECAST_MAX_HORIZON  upper bound for prediction_length (default 1024)
  TIMESTRAL_DISABLED    true -> never load the model
"""

from __future__ import annotations

import importlib.util
import os
import threading
import time
from pathlib import Path
from typing import Optional, Sequence

import numpy as np


def _load_env_files() -> None:
    """Load FORECAST_* / TIMESTRAL_DISABLED from nearby .env files (no deps)."""
    here = Path(__file__).resolve().parent
    for candidate in (here / ".env", here.parent / ".env", here.parent.parent / ".env"):
        if not candidate.is_file():
            continue
        try:
            for raw in candidate.read_text(encoding="utf-8").splitlines():
                line = raw.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                key = key.strip()
                if not (key.startswith("FORECAST_") or key == "TIMESTRAL_DISABLED"):
                    continue
                if key not in os.environ:
                    os.environ[key] = value.strip().strip('"').strip("'")
        except OSError:
            continue


_load_env_files()

MODEL_ID = os.getenv("FORECAST_MODEL", "mistralai/Timestral-209M")
DEVICE = os.getenv("FORECAST_DEVICE", "cpu")
MAX_HORIZON = int(os.getenv("FORECAST_MAX_HORIZON", "1024"))

_LOCK = threading.Lock()
_STATE: dict = {"model": None, "error": None, "loaded_at": None}


class ForecastUnavailable(RuntimeError):
    """Raised when the model cannot be used (not installed, disabled, broken)."""


def _disabled() -> bool:
    return os.getenv("TIMESTRAL_DISABLED", "").strip().lower() in {"1", "true", "yes"}


def _installed() -> bool:
    try:
        return importlib.util.find_spec("timestral") is not None
    except (ImportError, ValueError):
        return False


def _load():
    """Load the model once. Raises ForecastUnavailable with a readable reason."""
    with _LOCK:
        if _STATE["model"] is not None:
            return _STATE["model"]

        if _STATE["error"] is not None:
            raise ForecastUnavailable(_STATE["error"])

        if _disabled():
            _STATE["error"] = "disabled by TIMESTRAL_DISABLED"
            raise ForecastUnavailable(_STATE["error"])

        try:
            from timestral import TimestralForecaster  # type: ignore[import-not-found]
        except Exception as exc:  # pragma: no cover - depends on install
            _STATE["error"] = (
                f"timestral is not installed ({exc}). "
                "Run: pip install -r forecast/requirements.txt"
            )
            raise ForecastUnavailable(_STATE["error"]) from exc

        try:
            model = TimestralForecaster.from_pretrained(MODEL_ID, device=DEVICE)
        except Exception as exc:  # pragma: no cover
            _STATE["error"] = f"failed to load {MODEL_ID}: {exc}"
            raise ForecastUnavailable(_STATE["error"]) from exc

        _STATE["model"] = model
        _STATE["loaded_at"] = time.time()
        _STATE["error"] = None
        return model


def _matrix(rows: Sequence[Sequence[Optional[float]]], name: str) -> np.ndarray:
    """Turn a list-of-rows (None = missing) into a float32 matrix."""
    if not rows:
        raise ValueError(f"{name} must not be empty")

    lengths = {len(row) for row in rows}
    if len(lengths) != 1:
        raise ValueError(f"{name} rows must all have the same length")

    width = lengths.pop()
    if width == 0:
        raise ValueError(f"{name} rows must not be empty")

    return np.array(
        [[np.nan if value is None else float(value) for value in row] for row in rows],
        dtype=np.float32,
    )


def health() -> dict:
    """Report status without loading the model."""
    loaded = _STATE["model"] is not None
    error = _STATE["error"]

    available = loaded or (error is None and not _disabled() and _installed())

    return {
        "status": "ok",
        "available": available,
        "model": MODEL_ID,
        "device": DEVICE,
        "loaded": loaded,
        "error": error,
    }


def forecast_series(
    series: Sequence[Sequence[Optional[float]]],
    prediction_length: int = 96,
    past_covariates: Optional[Sequence[Sequence[Optional[float]]]] = None,
    known_covariates: Optional[Sequence[Sequence[Optional[float]]]] = None,
    quantiles: Optional[Sequence[float]] = None,
) -> dict:
    """
    Forecast `series` and return the median plus selected quantile bands.

    series: (variates, time) — one row per variate, oldest → newest.
    """
    if prediction_length < 1 or prediction_length > MAX_HORIZON:
        raise ValueError(
            f"prediction_length must be between 1 and {MAX_HORIZON}"
        )

    model = _load()

    target = _matrix(series, "series")  # (V, T)
    context = target.reshape(1, *target.shape)  # (1, V, T)

    kwargs: dict = {}

    if past_covariates:
        past = _matrix(past_covariates, "past_covariates")
        if past.shape[1] != target.shape[1]:
            raise ValueError("past_covariates must match the history length")
        kwargs["past_covariates"] = past.reshape(1, *past.shape)

    if known_covariates:
        known = _matrix(known_covariates, "known_covariates")
        if known.shape[1] != target.shape[1] + prediction_length:
            raise ValueError("known_covariates must span history + horizon")
        kwargs["known_covariates"] = known.reshape(1, *known.shape)

    started = time.perf_counter()
    out = model.forecast(context, prediction_length=prediction_length, **kwargs)
    elapsed_ms = (time.perf_counter() - started) * 1000

    levels = [float(v) for v in getattr(out, "quantile_levels", [])]

    requested = [float(q) for q in (quantiles or []) if 0.0 < float(q) < 1.0]
    selected = requested or levels

    bands: dict[str, list] = {}
    for level in selected:
        bands[f"{level:g}"] = (
            np.asarray(out.quantile(level)).reshape(-1, prediction_length).tolist()
        )

    median = np.asarray(out.median).reshape(-1, prediction_length)

    return {
        "model": MODEL_ID,
        "device": DEVICE,
        "horizon": prediction_length,
        "variates": int(target.shape[0]),
        "quantile_levels": selected,
        "median": median.tolist(),
        "bands": bands,
        "elapsed_ms": round(elapsed_ms, 1),
    }
