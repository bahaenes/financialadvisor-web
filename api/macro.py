import json
import math
import requests
from http.server import BaseHTTPRequestHandler
import yfinance as yf

BIST_SECTORS = {
    "Bankacılık": ["GARAN.IS", "AKBNK.IS", "ISCTR.IS", "YKBNK.IS", "VAKBN.IS", "HALKB.IS"],
    "Havacılık": ["THYAO.IS", "PGSUS.IS", "TAVHL.IS"],
    "Enerji": ["TUPRS.IS", "PETKM.IS"],
    "Holding": ["KCHOL.IS", "SAHOL.IS"],
    "Savunma": ["ASELS.IS"],
    "Perakende": ["BIMAS.IS"],
    "Telekom": ["TCELL.IS", "TTKOM.IS"],
    "Otomotiv": ["FROTO.IS", "TOASO.IS"],
    "Demir-Çelik": ["EREGL.IS"],
    "Cam": ["SISE.IS"],
    "Madencilik": ["KOZAL.IS", "KOZAA.IS"],
    "Kimya": ["SASA.IS", "HEKTS.IS"],
    "GYO": ["EKGYO.IS"],
    "İnşaat": ["ENKAI.IS"],
    "Gübre": ["GUBRF.IS"],
}


def safe(val):
    try:
        f = float(val)
        return None if math.isnan(f) or math.isinf(f) else round(f, 4)
    except (TypeError, ValueError):
        return None


def get_forex(base: str, target: str) -> dict:
    try:
        url = f"https://api.frankfurter.dev/v1/latest?base={base}&symbols={target}"
        r = requests.get(url, timeout=8)
        data = r.json()
        rate = data["rates"][target]

        # Get yesterday to compute change
        from datetime import date, timedelta
        yesterday = (date.today() - timedelta(days=2)).isoformat()
        url2 = f"https://api.frankfurter.dev/v1/{yesterday}?base={base}&symbols={target}"
        r2 = requests.get(url2, timeout=8)
        data2 = r2.json()
        prev_rate = data2["rates"][target]
        change_pct = round(((rate - prev_rate) / prev_rate) * 100, 4) if prev_rate else 0

        return {"rate": round(rate, 4), "change_pct": change_pct}
    except Exception:
        return {"rate": None, "change_pct": 0}


def get_gold_try(usd_try_rate: float) -> dict:
    try:
        ticker = yf.Ticker("GC=F")
        hist = ticker.history(period="5d")
        if hist.empty or usd_try_rate is None:
            return {"price": None, "change_pct": 0}
        gold_usd = float(hist["Close"].iloc[-1])
        gold_usd_prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else gold_usd
        gold_try = round(gold_usd * usd_try_rate, 2)
        gold_try_prev = round(gold_usd_prev * usd_try_rate, 2)
        change_pct = round(((gold_try - gold_try_prev) / gold_try_prev) * 100, 4) if gold_try_prev else 0
        return {"price": gold_try, "change_pct": change_pct}
    except Exception:
        return {"price": None, "change_pct": 0}


def get_index(symbol: str) -> dict:
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="5d")
        if hist.empty:
            return {"value": None, "change_pct": 0}
        val = float(hist["Close"].iloc[-1])
        prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else val
        change_pct = round(((val - prev) / prev) * 100, 4) if prev else 0
        return {"value": round(val, 2), "change_pct": change_pct}
    except Exception:
        return {"value": None, "change_pct": 0}


def get_fear_greed() -> dict:
    try:
        r = requests.get("https://api.alternative.me/fng/?limit=1", timeout=8)
        data = r.json()
        item = data["data"][0]
        return {"value": int(item["value"]), "classification": item["value_classification"]}
    except Exception:
        return {"value": 50, "classification": "Neutral"}


def get_sector_performance() -> dict:
    all_symbols = list({s for syms in BIST_SECTORS.values() for s in syms})
    result = {}
    try:
        symbols_str = " ".join(all_symbols)
        data = yf.download(symbols_str, period="5d", progress=False, auto_adjust=True)
        closes = data["Close"] if "Close" in data else data

        for sector, syms in BIST_SECTORS.items():
            pcts = []
            for sym in syms:
                if sym in closes.columns:
                    col = closes[sym].dropna()
                    if len(col) >= 2:
                        pct = ((float(col.iloc[-1]) - float(col.iloc[-2])) / float(col.iloc[-2])) * 100
                        pcts.append(pct)
            result[sector] = round(sum(pcts) / len(pcts), 2) if pcts else 0.0
    except Exception:
        for sector in BIST_SECTORS:
            result[sector] = 0.0
    return result


def get_macro_data() -> dict:
    usd_try = get_forex("USD", "TRY")
    eur_try = get_forex("EUR", "TRY")
    usd_try_rate = usd_try.get("rate")
    gold_try = get_gold_try(usd_try_rate)
    bist100 = get_index("XU100.IS")
    bist30 = get_index("XU030.IS")
    fear_greed = get_fear_greed()
    sector_perf = get_sector_performance()

    return {
        "usd_try": usd_try,
        "eur_try": eur_try,
        "gold_try": gold_try,
        "bist100": bist100,
        "bist30": bist30,
        "fear_greed": fear_greed,
        "sector_performance": sector_perf,
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            data = get_macro_data()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "public, max-age=3600")
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
