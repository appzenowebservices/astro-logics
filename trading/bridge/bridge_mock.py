from __future__ import annotations

import math
import random
import time

from fastapi import FastAPI, HTTPException

app = FastAPI(title="algo-trader MT5 bridge (MOCK - no terminal required)")

_BASE = 1.10000


def _candles(count: int, seed: int = 42) -> list:
    rng = random.Random(seed)
    price = _BASE
    now = int(time.time())
    bars = []
    for i in range(count):
        open_ = price
        close = price + rng.uniform(-0.004, 0.004)
        high = max(open_, close) + rng.uniform(0, 0.003)
        low = min(open_, close) - rng.uniform(0, 0.003)
        bars.append(
            {
                "time": now - (count - i) * 60,
                "open": round(open_, 5),
                "high": round(high, 5),
                "low": round(low, 5),
                "close": round(close, 5),
            }
        )
        price = close
    return bars


@app.get("/health")
def health():
    return {"ok": True, "connected": True, "server": "MOCK"}


@app.get("/history/{symbol}")
def get_symbol_history(symbol: str, timeframe: str = "M1", count: int = 1200):
    return {"success": True, "data": _candles(max(1, min(count, 100000)))}


@app.get("/price/{symbol}")
def get_price(symbol: str):
    return {
        "success": True,
        "data": {
            "symbol": symbol,
            "bid": round(_BASE - 0.0001, 5),
            "ask": round(_BASE + 0.0001, 5),
            "brokerTime": str(int(time.time())),
        },
    }


@app.get("/symbols")
def list_symbols():
    return {
        "success": True,
        "count": 2,
        "data": [
            {"name": "EURUSD", "digits": 5, "point": 0.00001, "volumeMin": 0.01, "volumeMax": 100.0, "volumeStep": 0.01},
            {"name": "GBPUSD", "digits": 5, "point": 0.00001, "volumeMin": 0.01, "volumeMax": 100.0, "volumeStep": 0.01},
        ],
    }


@app.get("/account")
def get_account():
    return {
        "success": True,
        "data": {
            "login": 1234567,
            "server": "MockServer",
            "currency": "USD",
            "balance": 10000.0,
            "equity": 10000.0,
            "margin": 0.0,
            "freeMargin": 10000.0,
            "leverage": 100,
            "tradeMode": 0,
            "name": "Mock Demo",
        },
    }


@app.post("/orders")
def place_order(payload: dict):
    return {
        "success": True,
        "retcode": 10009,
        "retcodeName": "TRADE_RETCODE_DONE",
        "comment": "Mock fill",
        "order": random.randint(1000000, 9999999),
        "deal": random.randint(1000000, 9999999),
        "request": payload,
    }


@app.post("/positions/{ticket}/close")
def close_position(ticket: int, payload: dict = None):
    return {"success": True, "retcode": 10009, "comment": "Mock close", "order": ticket, "deal": random.randint(1000000, 9999999)}


@app.get("/positions")
def get_positions(symbol: str = None):
    return {
        "success": True,
        "count": 1,
        "data": [
            {
                "ticket": 10001,
                "symbol": symbol or "EURUSD",
                "type": "BUY",
                "volume": 0.01,
                "openPrice": 1.09900,
                "currentPrice": 1.09910,
                "sl": 1.09000,
                "tp": 1.11000,
                "profit": 0.10,
                "swap": 0.0,
                "magic": 123456,
                "time": int(time.time()) - 3600,
            }
        ],
    }


@app.get("/orders")
def get_pending_orders(symbol: str = None):
    return {
        "success": True,
        "count": 1,
        "data": [
            {
                "ticket": 20001,
                "symbol": symbol or "EURUSD",
                "type": "ORDER_TYPE_BUY_LIMIT",
                "volume": 0.01,
                "price": 1.09500,
                "sl": 1.08500,
                "tp": 1.11000,
                "magic": 123456,
                "comment": "Mock pending",
                "time": int(time.time()) - 1800,
            }
        ],
    }


@app.post("/orders/{ticket}/modify")
def modify_order(ticket: int, payload: dict):
    return {"success": True, "retcode": 10009, "comment": "Mock modify"}


@app.post("/orders/{ticket}/cancel")
def cancel_order(ticket: int):
    return {"success": True, "retcode": 10009, "comment": "Mock cancel"}


@app.get("/deals/history")
def deals_history(days: int = 1, symbol: str = None):
    return {
        "success": True,
        "count": 0,
        "data": [
            {
                "ticket": 30001,
                "order": 30001,
                "symbol": symbol or "EURUSD",
                "type": 0,
                "volume": 0.01,
                "price": 1.09900,
                "profit": 5.20,
                "commission": -0.10,
                "swap": 0.0,
                "magic": 123456,
                "comment": "Mock deal",
                "time": int(time.time()) - 86400,
            }
        ],
    }
