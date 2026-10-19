from __future__ import annotations

import os
import time
from typing import Optional

from fastapi import FastAPI, HTTPException
import MetaTrader5 as mt5

app = FastAPI(title="algo-trader MT5 bridge")

# ==========================================
# INITIALIZATION (lazy + retried)
# ==========================================

_MT5_READY = False


def ensure_initialized() -> None:
    """Initialize the MT5 terminal link, retrying briefly on failure.

    Lazy so the bridge module can load (and /health can answer) even when the
    MT5 terminal is not running yet.
    """
    global _MT5_READY
    if _MT5_READY and mt5.terminal_info() is not None:
        return

    path = os.environ.get("MT5_PATH") or None
    login = int(os.environ["MT5_LOGIN"]) if os.environ.get("MT5_LOGIN") else None
    password = os.environ.get("MT5_PASSWORD") or None
    server = os.environ.get("MT5_SERVER") or None

    for attempt in range(5):
        ok = mt5.initialize(
            path=path, login=login, password=password, server=server, timeout=15000
        )
        if ok:
            _MT5_READY = True
            return
        time.sleep(1.0)

    raise HTTPException(
        status_code=503,
        detail=(
            "MT5 terminal initialization failed. Ensure the terminal is running and "
            "reachable (check MT5_PATH / MT5_LOGIN / MT5_PASSWORD / MT5_SERVER). "
            f"Last error: {mt5.last_error()}"
        ),
    )


# ==========================================
# HEALTH
# ==========================================

@app.get("/health")
def health():
    ok = mt5.terminal_info() is not None
    return {"ok": ok, "connected": ok, "server": str(mt5.terminal_info().server if ok else "")}


# ==========================================
# HELPERS
# ==========================================

TF_MAP = {
    "S1": mt5.TIMEFRAME_M1,
    "S5": mt5.TIMEFRAME_M1,
    "S15": mt5.TIMEFRAME_M1,
    "M1": mt5.TIMEFRAME_M1,
    "M5": mt5.TIMEFRAME_M5,
    "M15": mt5.TIMEFRAME_M15,
    "M30": mt5.TIMEFRAME_M30,
    "H1": mt5.TIMEFRAME_H1,
    "H2": mt5.TIMEFRAME_H2,
    "H3": mt5.TIMEFRAME_H3,
    "H4": mt5.TIMEFRAME_H4,
    "H6": mt5.TIMEFRAME_H6,
    "H8": mt5.TIMEFRAME_H8,
    "H12": mt5.TIMEFRAME_H12,
    "D1": mt5.TIMEFRAME_D1,
    "W1": mt5.TIMEFRAME_W1,
    "MN1": mt5.TIMEFRAME_MN1,
}


def select_symbol(symbol: str) -> None:
    if not mt5.symbol_select(symbol, True):
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found or could not be selected")


def tick_of(symbol: str) -> dict:
    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        raise HTTPException(status_code=503, detail=f"No active tick feed data available for '{symbol}'")
    return {
        "symbol": symbol,
        "bid": float(tick.bid),
        "ask": float(tick.ask),
        "brokerTime": str(tick.time),
    }


# ==========================================
# MARKET DATA
# ==========================================

@app.get("/history/{symbol}")
def get_symbol_history(symbol: str, timeframe: str = "M1", count: int = 1200):
    ensure_initialized()
    select_symbol(symbol)

    mt5_tf = TF_MAP.get(timeframe, mt5.TIMEFRAME_M1)
    rates = mt5.copy_rates_from_pos(symbol, mt5_tf, 0, max(1, min(count, 100000)))
    if rates is None or len(rates) == 0:
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical rates for '{symbol}' from MT5")

    payload = [
        {
            "time": int(r["time"]),
            "open": float(r["open"]),
            "high": float(r["high"]),
            "low": float(r["low"]),
            "close": float(r["close"]),
        }
        for r in rates
    ]
    return {"success": True, "data": payload}


@app.get("/price/{symbol}")
def get_price(symbol: str):
    ensure_initialized()
    if not mt5.symbol_select(symbol, True):
        return {"success": False, "error": f"Symbol '{symbol}' not found"}
    return {"success": True, "data": tick_of(symbol)}


@app.get("/symbols")
def list_symbols():
    ensure_initialized()
    symbols = mt5.symbols_get() or []
    payload = []
    for s in symbols:
        if s.visible:
            payload.append(
                {
                    "name": s.name,
                    "digits": int(s.digits),
                    "point": float(s.point),
                    "tradeMode": str(s.trade_mode) if hasattr(s, "trade_mode") else "",
                    "volumeMin": float(s.volume_min) if hasattr(s, "volume_min") else 0.0,
                    "volumeMax": float(s.volume_max) if hasattr(s, "volume_max") else 0.0,
                    "volumeStep": float(s.volume_step) if hasattr(s, "volume_step") else 0.0,
                }
            )
    return {"success": True, "data": payload, "count": len(payload)}


@app.get("/account")
def get_account():
    ensure_initialized()
    info = mt5.account_info()
    if info is None:
        raise HTTPException(status_code=503, detail=f"Account info unavailable: {mt5.last_error()}")
    return {
        "success": True,
        "data": {
            "login": int(info.login),
            "server": str(info.server),
            "currency": str(info.currency),
            "balance": float(info.balance),
            "equity": float(info.equity),
            "margin": float(info.margin),
            "freeMargin": float(info.margin_free),
            "leverage": int(info.leverage),
            "tradeMode": int(info.trade_mode),
            "name": str(info.name),
        },
    }


# ==========================================
# TRADING
# ==========================================

def _filling(value: str):
    return {
        "FOK": mt5.ORDER_FILLING_FOK,
        "IOC": mt5.ORDER_FILLING_IOC,
        "RETURN": mt5.ORDER_FILLING_RETURN,
        "BOC": mt5.ORDER_FILLING_BOC,
    }.get(str(value).upper(), mt5.ORDER_FILLING_IOC)


def _order_type(action: str, order_type: str):
    action = str(action).upper()
    order_type = str(order_type or "MARKET").upper()
    if action == "BUY":
        return {"action": mt5.TRADE_ACTION_DEAL, "type": mt5.ORDER_TYPE_BUY}
    if action == "SELL":
        return {"action": mt5.TRADE_ACTION_DEAL, "type": mt5.ORDER_TYPE_SELL}
    if action in ("BUY_LIMIT", "BUY_STOP", "SELL_LIMIT", "SELL_STOP"):
        type_map = {
            "BUY_LIMIT": mt5.ORDER_TYPE_BUY_LIMIT,
            "BUY_STOP": mt5.ORDER_TYPE_BUY_STOP,
            "SELL_LIMIT": mt5.ORDER_TYPE_SELL_LIMIT,
            "SELL_STOP": mt5.ORDER_TYPE_SELL_STOP,
        }
        return {"action": mt5.TRADE_ACTION_PENDING, "type": type_map[action]}
    raise HTTPException(status_code=400, detail=f"Unknown order action '{action}' (BUY/SELL/BUY_LIMIT/BUY_STOP/SELL_LIMIT/SELL_STOP)")


@app.post("/orders")
def place_order(payload: dict):
    ensure_initialized()

    symbol = payload.get("symbol")
    if not symbol:
        raise HTTPException(status_code=400, detail="symbol is required")
    select_symbol(symbol)

    order = _order_type(payload.get("action", "BUY"), payload.get("type", "MARKET"))
    is_market = order["action"] == mt5.TRADE_ACTION_DEAL
    tick = mt5.symbol_info_tick(symbol)

    volume = float(payload.get("volume", 0.01))
    if is_market and tick is None:
        raise HTTPException(status_code=503, detail="Market price feed unavailable for order execution")

    request = {
        "action": order["action"],
        "symbol": symbol,
        "volume": volume,
        "type": order["type"],
        "price": float(payload.get("price") or (tick.ask if order["type"] == mt5.ORDER_TYPE_BUY else tick.bid)),
        "deviation": int(payload.get("deviation", 20)),
        "magic": int(payload.get("magic", 123456)),
        "comment": str(payload.get("comment", "AlgoTrader")),
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": _filling(payload.get("filling", "IOC")),
    }
    if payload.get("sl") is not None:
        request["sl"] = float(payload["sl"])
    if payload.get("tp") is not None:
        request["tp"] = float(payload["tp"])
    if payload.get("expiration") is not None:
        request["expiration"] = int(payload["expiration"])

    result = mt5.order_send(request)
    if result is None:
        raise HTTPException(status_code=500, detail=f"Internal execution pipeline failure within MT5 API wrapper: {mt5.last_error()}")

    return {
        "success": result.retcode == mt5.TRADE_RETCODE_DONE,
        "retcode": int(result.retcode),
        "retcodeName": str(result.retcode),
        "comment": str(result.comment),
        "order": int(result.order),
        "deal": int(result.deal),
        "request": request,
    }


@app.post("/positions/{ticket}/close")
def close_position(ticket: int, payload: dict = None):
    ensure_initialized()
    payload = payload or {}
    positions = mt5.positions_get(ticket=ticket)
    if not positions or len(positions) == 0:
        raise HTTPException(status_code=404, detail=f"Position {ticket} not found")
    pos = positions[0]

    tick = mt5.symbol_info_tick(pos.symbol)
    if tick is None:
        raise HTTPException(status_code=503, detail=f"Price feed unavailable to close {pos.symbol}")

    position_type = pos.type  # 0 = BUY, 1 = SELL
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": pos.symbol,
        "volume": float(payload.get("volume", pos.volume)),
        "type": mt5.ORDER_TYPE_SELL if position_type == mt5.POSITION_TYPE_BUY else mt5.ORDER_TYPE_BUY,
        "position": int(ticket),
        "price": float(tick.bid if position_type == mt5.POSITION_TYPE_BUY else tick.ask),
        "deviation": int(payload.get("deviation", 20)),
        "magic": int(pos.magic),
        "comment": str(payload.get("comment", "AlgoTrader close")),
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": _filling(payload.get("filling", "IOC")),
    }
    result = mt5.order_send(request)
    if result is None:
        raise HTTPException(status_code=500, detail=f"Close failed: {mt5.last_error()}")
    return {
        "success": result.retcode == mt5.TRADE_RETCODE_DONE,
        "retcode": int(result.retcode),
        "comment": str(result.comment),
        "order": int(result.order),
        "deal": int(result.deal),
    }


@app.get("/positions")
def get_positions(symbol: Optional[str] = None):
    ensure_initialized()
    positions = mt5.positions_get(symbol=symbol) if symbol else mt5.positions_get()
    positions = positions or []
    payload = [
        {
            "ticket": int(p.ticket),
            "symbol": p.symbol,
            "type": "BUY" if p.type == mt5.POSITION_TYPE_BUY else "SELL",
            "volume": float(p.volume),
            "openPrice": float(p.price_open),
            "currentPrice": float(p.price_current),
            "sl": float(p.sl) if p.sl else None,
            "tp": float(p.tp) if p.tp else None,
            "profit": float(p.profit),
            "swap": float(p.swap),
            "magic": int(p.magic),
            "time": int(p.time),
        }
        for p in positions
    ]
    return {"success": True, "data": payload, "count": len(payload)}


@app.get("/orders")
def get_pending_orders(symbol: Optional[str] = None):
    ensure_initialized()
    orders = mt5.orders_get(symbol=symbol) if symbol else mt5.orders_get()
    orders = orders or []
    payload = [
        {
            "ticket": int(o.ticket),
            "symbol": o.symbol,
            "type": str(o.type),
            "volume": float(o.volume_current),
            "price": float(o.price_open),
            "sl": float(o.sl) if o.sl else None,
            "tp": float(o.tp) if o.tp else None,
            "magic": int(o.magic),
            "comment": str(o.comment),
            "time": int(o.time_setup),
        }
        for o in orders
    ]
    return {"success": True, "data": payload, "count": len(payload)}


@app.post("/orders/{ticket}/modify")
def modify_order(ticket: int, payload: dict):
    ensure_initialized()
    orders = mt5.orders_get(ticket=ticket)
    if not orders or len(orders) == 0:
        raise HTTPException(status_code=404, detail=f"Pending order {ticket} not found")
    o = orders[0]

    request = {
        "action": mt5.TRADE_ACTION_MODIFY,
        "order": int(ticket),
        "symbol": o.symbol,
        "price": float(payload.get("price", o.price_open)),
        "sl": float(payload["sl"]) if payload.get("sl") is not None else (float(o.sl) if o.sl else 0.0),
        "tp": float(payload["tp"]) if payload.get("tp") is not None else (float(o.tp) if o.tp else 0.0),
        "type_time": mt5.ORDER_TIME_GTC,
    }
    result = mt5.order_send(request)
    if result is None:
        raise HTTPException(status_code=500, detail=f"Modify failed: {mt5.last_error()}")
    return {
        "success": result.retcode == mt5.TRADE_RETCODE_DONE,
        "retcode": int(result.retcode),
        "comment": str(result.comment),
    }


@app.post("/orders/{ticket}/cancel")
def cancel_order(ticket: int):
    ensure_initialized()
    orders = mt5.orders_get(ticket=ticket)
    if not orders or len(orders) == 0:
        raise HTTPException(status_code=404, detail=f"Pending order {ticket} not found")
    o = orders[0]

    request = {
        "action": mt5.TRADE_ACTION_REMOVE,
        "order": int(ticket),
        "symbol": o.symbol,
    }
    result = mt5.order_send(request)
    if result is None:
        raise HTTPException(status_code=500, detail=f"Cancel failed: {mt5.last_error()}")
    return {
        "success": result.retcode == mt5.TRADE_RETCODE_DONE,
        "retcode": int(result.retcode),
        "comment": str(result.comment),
    }


@app.get("/deals/history")
def deals_history(days: int = 1, symbol: Optional[str] = None):
    ensure_initialized()
    now = int(time.time())
    date_from = now - days * 86400
    deals = mt5.history_deals_get(date_from, now, symbol=symbol) if symbol else mt5.history_deals_get(date_from, now)
    deals = deals or []
    payload = [
        {
            "ticket": int(d.ticket),
            "order": int(d.order),
            "symbol": d.symbol,
            "type": int(d.type),
            "volume": float(d.volume),
            "price": float(d.price),
            "profit": float(d.profit),
            "commission": float(d.commission),
            "swap": float(d.swap),
            "magic": int(d.magic),
            "comment": str(d.comment),
            "time": int(d.time),
        }
        for d in deals
    ]
    return {"success": True, "data": payload, "count": len(payload)}
