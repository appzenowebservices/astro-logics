from fastapi import FastAPI, HTTPException
import MetaTrader5 as mt5

app = FastAPI()

# ==========================================
# INIT MT5 TERMINAL LINK
# ==========================================

if not mt5.initialize():
    raise RuntimeError("MT5 backend terminal initialization failed")


# ==========================================
# GET CANDLESTICK DATA HISTORY
# ==========================================

@app.get("/history/{symbol}")
def get_symbol_history(symbol: str, timeframe: str = "M1", count: int = 1200):
    # Ensure the target symbol is actively selected in MT5 Market Watch
    if not mt5.symbol_select(symbol, True):
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found or could not be selected in MT5")

    # Map frontend incoming timeframe tokens to native MT5 structural constants
    tf_map = {
        "S5": mt5.TIMEFRAME_M1,
        "S15": mt5.TIMEFRAME_M1,
        "M1": mt5.TIMEFRAME_M1,
        "M5": mt5.TIMEFRAME_M5,
        "M15": mt5.TIMEFRAME_M15,
        "M30": mt5.TIMEFRAME_M30,
        "H1": mt5.TIMEFRAME_H1,
        "H4": mt5.TIMEFRAME_H4,
        "D1": mt5.TIMEFRAME_D1,
    }
    mt5_tf = tf_map.get(timeframe, mt5.TIMEFRAME_M1)
    
    # Fetch historical bars out of local MT5 terminal cache
    rates = mt5.copy_rates_from_pos(symbol, mt5_tf, 0, count)
    if rates is None or len(rates) == 0:
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical rates for '{symbol}' from MT5")
        
    history_payload = []
    for rate in rates:
        history_payload.append({
            "time": int(rate['time']),  # Lightweight Charts expects a clean UNIX epoch integer timestamp
            "open": float(rate['open']),
            "high": float(rate['high']),
            "low": float(rate['low']),
            "close": float(rate['close'])
        })
        
    return {
        "success": True,
        "data": history_payload
    }


# ==========================================
# GET LIVE TICK PRICE STREAM
# ==========================================

@app.get("/price/{symbol}")
def get_price(symbol: str):
    if not mt5.symbol_select(symbol, True):
        return {"success": False, "error": f"Symbol '{symbol}' not found"}

    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        return {"success": False, "error": f"No active tick feed data available for '{symbol}'"}

    return {
        "success": True,
        "data": {
            "symbol": symbol,
            "bid": float(tick.bid),
            "ask": float(tick.ask),
            "brokerTime": str(tick.time)  # Passed straight down to populate your footer panel UI
        }
    }


# ==========================================
# PLACE LIVE BUY TRANSACTION DEAL
# ==========================================

@app.post("/buy/{symbol}")
def buy(symbol: str):
    if not mt5.symbol_select(symbol, True):
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' initialization error")

    tick = mt5.symbol_info_tick(symbol)
    if tick is None:
        raise HTTPException(status_code=503, detail="Market price feed unavailable for order execution")

    # Construct the native MT5 Trade Deal dictionary payload
    trade_request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": 0.01,
        "type": mt5.ORDER_TYPE_BUY,
        "price": float(tick.ask),
        "deviation": 20,
        "magic": 123456,
        "comment": "AstroBot Buy Deal",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }

    result = mt5.order_send(trade_request)

    if result is None:
        return {
            "success": False, 
            "error": "Internal execution pipeline failure within MT5 API wrapper"
        }

    return {
        "success": result.retcode == mt5.TRADE_RETCODE_DONE,
        "retcode": int(result.retcode),
        "comment": str(result.comment)
    }