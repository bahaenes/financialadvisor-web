import json
import math
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import yfinance as yf

BIST_STOCKS = {
    "THYAO.IS": "Türk Hava Yolları", "GARAN.IS": "Garanti BBVA",
    "AKBNK.IS": "Akbank", "EREGL.IS": "Ereğli Demir Çelik",
    "SISE.IS": "Şişe Cam", "KCHOL.IS": "Koç Holding",
    "SAHOL.IS": "Sabancı Holding", "TUPRS.IS": "Tüpraş",
    "ASELS.IS": "Aselsan", "BIMAS.IS": "BİM Mağazalar",
    "TCELL.IS": "Turkcell", "PGSUS.IS": "Pegasus",
    "TAVHL.IS": "TAV Havalimanları", "FROTO.IS": "Ford Otosan",
    "TOASO.IS": "Tofaş Oto", "VESTL.IS": "Vestel",
    "ARCLK.IS": "Arçelik", "PETKM.IS": "Petkim",
    "KOZAL.IS": "Koza Altın", "KOZAA.IS": "Koza Anadolu",
    "HEKTS.IS": "Hektaş", "SASA.IS": "SASA Polyester",
    "EKGYO.IS": "Emlak Konut GYO", "ENKAI.IS": "Enka İnşaat",
    "ISCTR.IS": "İş Bankası", "YKBNK.IS": "Yapı Kredi",
    "VAKBN.IS": "Vakıfbank", "HALKB.IS": "Halkbank",
    "TTKOM.IS": "Türk Telekom", "GUBRF.IS": "Gübre Fabrikaları",
}


def safe(val):
    if val is None:
        return None
    try:
        f = float(val)
        return None if math.isnan(f) or math.isinf(f) else round(f, 4)
    except (TypeError, ValueError):
        return None


def get_stock_data(symbol: str, period: str) -> dict:
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period)
    if hist.empty:
        raise ValueError(f"No data for {symbol}")

    hist = hist.dropna(subset=["Close"])
    hist.index = hist.index.tz_localize(None) if hist.index.tz else hist.index

    ohlcv = []
    for dt, row in hist.iterrows():
        ohlcv.append({
            "time": dt.strftime("%Y-%m-%d"),
            "open": safe(row["Open"]),
            "high": safe(row["High"]),
            "low": safe(row["Low"]),
            "close": safe(row["Close"]),
            "volume": int(row["Volume"]) if not math.isnan(float(row["Volume"])) else 0,
        })

    info = {}
    try:
        info = ticker.info or {}
    except Exception:
        pass

    current_price = safe(hist["Close"].iloc[-1])
    prev_close = safe(hist["Close"].iloc[-2]) if len(hist) > 1 else current_price
    change = round(current_price - prev_close, 4) if current_price and prev_close else 0
    change_pct = round((change / prev_close) * 100, 4) if prev_close else 0

    return {
        "symbol": symbol,
        "name": BIST_STOCKS.get(symbol, info.get("longName", symbol)),
        "price": current_price,
        "change": change,
        "change_pct": change_pct,
        "volume": int(hist["Volume"].iloc[-1]) if not math.isnan(float(hist["Volume"].iloc[-1])) else 0,
        "market_cap": safe(info.get("marketCap")),
        "pe_ratio": safe(info.get("trailingPE")),
        "dividend_yield": safe(info.get("dividendYield")),
        "beta": safe(info.get("beta")),
        "week_52_high": safe(info.get("fiftyTwoWeekHigh")),
        "week_52_low": safe(info.get("fiftyTwoWeekLow")),
        "ohlcv": ohlcv,
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        symbol = params.get("symbol", ["THYAO.IS"])[0].upper()
        period = params.get("period", ["1y"])[0]

        if symbol not in BIST_STOCKS:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Invalid symbol"}).encode())
            return

        try:
            data = get_stock_data(symbol, period)
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
