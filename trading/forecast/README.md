# Timestral forecast service

A small FastAPI service around **Mistral Timestral**, a time-series foundation
model that forecasts zero-shot on CPU. It exists to give the trading stack a
*probabilistic* view: a median line plus 21 quantiles, instead of a single
guess.

It is a **signal service**. It never places orders.

## Install

```powershell
cd trading/forecast
python -m venv env
env\Scripts\python.exe -m pip install -r requirements.txt
```

`torch` is a large download; `timestral` itself is installed from Mistral's
GitHub repository. Weights are pulled from the Hugging Face Hub on first
forecast (5M ≈ 21 MB … 209M ≈ 837 MB).

## Run

```powershell
env\Scripts\python.exe -m uvicorn app:app --port 8001
# or: npm run forecast   (from trading/)
```

The MCP server reaches it at `FORECAST_URL` (default `http://127.0.0.1:8001`).

## Environment

| Var | Default | Meaning |
|---|---|---|
| `FORECAST_MODEL` | `mistralai/Timestral-209M` | HF repo. Use `…-28M` for speed. |
| `FORECAST_DEVICE` | `cpu` | `cpu`, `cuda`, `mps` |
| `FORECAST_MAX_HORIZON` | `1024` | Reject longer `prediction_length` |
| `FORECAST_PORT` | `8001` | Only used when run as `__main__` |
| `TIMESTRAL_DISABLED` | unset | `true` → service reports unavailable |

## API

`GET /health` → `{ status, available, model, device, loaded, error }`
(never loads the model, safe for liveness probes)

`POST /forecast`

```json
{
  "series": [[1.08, 1.081, 1.079, 1.083]],
  "prediction_length": 24,
  "past_covariates": [[120, 180, 90, 210]],
  "known_covariates": [[1, 0, 1, 0, 1, 0]],
  "quantiles": [0.05, 0.5, 0.95]
}
```

→

```json
{
  "model": "mistralai/Timestral-209M",
  "device": "cpu",
  "horizon": 24,
  "variates": 1,
  "quantile_levels": [0.05, 0.5, 0.95],
  "median": [[...]],
  "bands": { "0.05": [[...]], "0.5": [[...]], "0.95": [[...]] },
  "elapsed_ms": 138.4
}
```

- `series` is `(variates, time)`, oldest → newest. `null` means missing.
- `past_covariates` must be as long as `series`.
- `known_covariates` must be `series.length + prediction_length` long — this is
  how macro events (scheduled releases, sessions, holidays) reach the model.
- 503 = model unavailable (not installed / disabled). 422 = bad shape.

## What it does and does not do

- **Does**: multivariate zero-shot forecasts, covariate-aware attention, 32k
  context, 21 quantiles, CPU inference (~10 ms for 5M, ~140 ms for 209M on
  8 threads).
- **Does not**: reason about news, explain itself, or make trading decisions.
  It maps numeric arrays to quantiles. Macro context only enters through
  covariates you supply.

## Licence

Code in `mistralai/timestral` is Apache-2.0. The **weights** are Modified MIT:
the grant does not apply to companies above roughly $20M monthly revenue —
those need a commercial licence from Mistral. Check the `LICENSE` file in the
model repo before shipping.
