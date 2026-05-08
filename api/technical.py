import json
import math
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import yfinance as yf
import pandas as pd
import ta


def safe(val):
    if val is None:
        return None
    try:
        f = float(val)
        return None if math.isnan(f) or math.isinf(f) else round(f, 4)
    except (TypeError, ValueError):
        return None


def to_series(index, series) -> list:
    out = []
    for dt, val in zip(index, series):
        v = safe(val)
        if v is not None:
            out.append({"time": dt.strftime("%Y-%m-%d"), "value": v})
    return out


def compute_signals(df: pd.DataFrame) -> dict:
    scores = []
    details = {}

    # RSI signal
    rsi = df["rsi"].dropna()
    if not rsi.empty:
        last_rsi = rsi.iloc[-1]
        if last_rsi < 35:
            rsi_score = 1.0
            rsi_sig = "OVERSOLD"
        elif last_rsi > 65:
            rsi_score = -1.0
            rsi_sig = "OVERBOUGHT"
        else:
            rsi_score = (50 - last_rsi) / 50
            rsi_sig = "NEUTRAL"
        scores.append(("rsi", rsi_score, 0.25))
        details["rsi_signal"] = rsi_sig

    # MACD signal
    if "macd" in df.columns and "macd_signal" in df.columns:
        macd_diff = (df["macd"] - df["macd_signal"]).dropna()
        if not macd_diff.empty:
            last = macd_diff.iloc[-1]
            prev = macd_diff.iloc[-2] if len(macd_diff) > 1 else last
            if last > 0 and prev <= 0:
                macd_score, macd_sig = 1.0, "BULLISH_CROSS"
            elif last < 0 and prev >= 0:
                macd_score, macd_sig = -1.0, "BEARISH_CROSS"
            elif last > 0:
                macd_score, macd_sig = 0.5, "BULLISH"
            else:
                macd_score, macd_sig = -0.5, "BEARISH"
            scores.append(("macd", macd_score, 0.25))
            details["macd_signal"] = macd_sig

    # Bollinger Bands signal
    if all(c in df.columns for c in ["bb_upper", "bb_lower", "Close"]):
        last_close = df["Close"].iloc[-1]
        last_upper = df["bb_upper"].dropna().iloc[-1] if not df["bb_upper"].dropna().empty else None
        last_lower = df["bb_lower"].dropna().iloc[-1] if not df["bb_lower"].dropna().empty else None
        if last_upper and last_lower:
            bb_range = last_upper - last_lower
            if bb_range > 0:
                bb_pos = (last_close - last_lower) / bb_range
                if bb_pos < 0.2:
                    bb_score, bb_sig = 1.0, "NEAR_LOWER"
                elif bb_pos > 0.8:
                    bb_score, bb_sig = -1.0, "NEAR_UPPER"
                else:
                    bb_score, bb_sig = 0.0, "NEUTRAL"
            else:
                bb_score, bb_sig = 0.0, "NEUTRAL"
            scores.append(("bb", bb_score, 0.20))
            details["bb_signal"] = bb_sig

    # Moving average signal
    if "sma_50" in df.columns and "sma_200" in df.columns:
        sma50 = df["sma_50"].dropna()
        sma200 = df["sma_200"].dropna()
        if not sma50.empty and not sma200.empty:
            close = df["Close"].iloc[-1]
            s50 = sma50.iloc[-1]
            s200 = sma200.iloc[-1]
            if close > s50 > s200:
                ma_score, ma_sig = 1.0, "STRONG_BULLISH"
            elif close > s50:
                ma_score, ma_sig = 0.5, "BULLISH"
            elif close < s50 < s200:
                ma_score, ma_sig = -1.0, "STRONG_BEARISH"
            else:
                ma_score, ma_sig = -0.5, "BEARISH"
            scores.append(("ma", ma_score, 0.15))
            details["ma_signal"] = ma_sig

    # Stochastic signal
    if "stoch_k" in df.columns and "stoch_d" in df.columns:
        k = df["stoch_k"].dropna()
        d = df["stoch_d"].dropna()
        if not k.empty and not d.empty:
            lk, ld = k.iloc[-1], d.iloc[-1]
            if lk < 25 and ld < 25:
                stoch_score, stoch_sig = 1.0, "OVERSOLD"
            elif lk > 75 and ld > 75:
                stoch_score, stoch_sig = -1.0, "OVERBOUGHT"
            elif lk > ld:
                stoch_score, stoch_sig = 0.4, "BULLISH"
            else:
                stoch_score, stoch_sig = -0.4, "BEARISH"
            scores.append(("stoch", stoch_score, 0.15))
            details["stoch_signal"] = stoch_sig

    if not scores:
        return {"overall": "TUT", "score": 0.5, **{k: "N/A" for k in ["rsi_signal", "macd_signal", "bb_signal", "ma_signal", "stoch_signal"]}}

    weighted = sum(s * w for _, s, w in scores) / sum(w for _, _, w in scores)
    overall = "AL" if weighted > 0.15 else ("SAT" if weighted < -0.15 else "TUT")
    normalized_score = (weighted + 1) / 2  # 0-1 scale

    return {
        "overall": overall,
        "score": round(normalized_score, 3),
        "rsi_signal": details.get("rsi_signal", "N/A"),
        "macd_signal": details.get("macd_signal", "N/A"),
        "bb_signal": details.get("bb_signal", "N/A"),
        "ma_signal": details.get("ma_signal", "N/A"),
        "stoch_signal": details.get("stoch_signal", "N/A"),
    }


def compute_support_resistance(df: pd.DataFrame) -> dict:
    highs = df["High"].values
    lows = df["Low"].values
    closes = df["Close"].values

    # Pivot-based S/R using recent 60 bars
    window = min(60, len(df))
    recent_high = float(pd.Series(highs[-window:]).max())
    recent_low = float(pd.Series(lows[-window:]).min())
    pivot = (recent_high + recent_low + closes[-1]) / 3

    r1 = 2 * pivot - recent_low
    r2 = pivot + (recent_high - recent_low)
    s1 = 2 * pivot - recent_high
    s2 = pivot - (recent_high - recent_low)

    return {
        "support": [round(s1, 2), round(s2, 2)],
        "resistance": [round(r1, 2), round(r2, 2)],
    }


def get_technical_data(symbol: str, period: str) -> dict:
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period)
    if hist.empty:
        raise ValueError(f"No data for {symbol}")

    hist = hist.dropna(subset=["Close"])
    hist.index = hist.index.tz_localize(None) if hist.index.tz else hist.index
    hist = hist.sort_index()

    close = hist["Close"]
    high = hist["High"]
    low = hist["Low"]
    volume = hist["Volume"]

    # RSI
    hist["rsi"] = ta.momentum.RSIIndicator(close, window=14).rsi()

    # MACD
    macd_ind = ta.trend.MACD(close, window_slow=26, window_fast=12, window_sign=9)
    hist["macd"] = macd_ind.macd()
    hist["macd_signal"] = macd_ind.macd_signal()
    hist["macd_histogram"] = macd_ind.macd_diff()

    # Bollinger Bands
    bb = ta.volatility.BollingerBands(close, window=20, window_dev=2)
    hist["bb_upper"] = bb.bollinger_hband()
    hist["bb_middle"] = bb.bollinger_mavg()
    hist["bb_lower"] = bb.bollinger_lband()

    # SMA
    hist["sma_20"] = ta.trend.SMAIndicator(close, window=20).sma_indicator()
    hist["sma_50"] = ta.trend.SMAIndicator(close, window=50).sma_indicator()
    hist["sma_200"] = ta.trend.SMAIndicator(close, window=200).sma_indicator()

    # EMA
    hist["ema_12"] = ta.trend.EMAIndicator(close, window=12).ema_indicator()
    hist["ema_26"] = ta.trend.EMAIndicator(close, window=26).ema_indicator()

    # Stochastic
    stoch = ta.momentum.StochasticOscillator(high, low, close, window=14, smooth_window=3)
    hist["stoch_k"] = stoch.stoch()
    hist["stoch_d"] = stoch.stoch_signal()

    # ATR
    hist["atr"] = ta.volatility.AverageTrueRange(high, low, close, window=14).average_true_range()

    idx = hist.index

    macd_series = []
    for dt, row in hist.iterrows():
        m, s, h = safe(row.get("macd")), safe(row.get("macd_signal")), safe(row.get("macd_histogram"))
        if m is not None and s is not None and h is not None:
            macd_series.append({"time": dt.strftime("%Y-%m-%d"), "macd": m, "signal": s, "histogram": h})

    bb_series = []
    for dt, row in hist.iterrows():
        u, mid, l = safe(row.get("bb_upper")), safe(row.get("bb_middle")), safe(row.get("bb_lower"))
        if u is not None and mid is not None and l is not None:
            bb_series.append({"time": dt.strftime("%Y-%m-%d"), "upper": u, "middle": mid, "lower": l})

    stoch_series = []
    for dt, row in hist.iterrows():
        k, d = safe(row.get("stoch_k")), safe(row.get("stoch_d"))
        if k is not None and d is not None:
            stoch_series.append({"time": dt.strftime("%Y-%m-%d"), "k": k, "d": d})

    return {
        "indicators": {
            "rsi": to_series(idx, hist["rsi"]),
            "macd": macd_series,
            "bollinger": bb_series,
            "sma_20": to_series(idx, hist["sma_20"]),
            "sma_50": to_series(idx, hist["sma_50"]),
            "sma_200": to_series(idx, hist["sma_200"]),
            "ema_12": to_series(idx, hist["ema_12"]),
            "ema_26": to_series(idx, hist["ema_26"]),
            "stoch": stoch_series,
            "atr": to_series(idx, hist["atr"]),
        },
        "signals": compute_signals(hist),
        "support_resistance": compute_support_resistance(hist),
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        symbol = params.get("symbol", ["THYAO.IS"])[0].upper()
        period = params.get("period", ["1y"])[0]

        try:
            data = get_technical_data(symbol, period)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "public, max-age=300")
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def log_message(self, format, *args):
        pass
