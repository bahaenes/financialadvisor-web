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
    "FROTO.IS": "Ford Otosan", "ISCTR.IS": "İş Bankası",
}


def safe(val):
    try:
        f = float(val)
        return None if math.isnan(f) or math.isinf(f) else round(f, 4)
    except (TypeError, ValueError):
        return None


def get_ticker_data(symbols: list) -> list:
    result = []
    try:
        sym_str = " ".join(symbols)
        data = yf.download(sym_str, period="5d", progress=False, auto_adjust=True)
        closes = data["Close"] if "Close" in data.columns.get_level_values(0) else data

        for sym in symbols:
            if sym not in BIST_STOCKS:
                continue
            try:
                col = closes[sym].dropna() if sym in closes.columns else None
                if col is None or len(col) < 2:
                    continue
                price = safe(float(col.iloc[-1]))
                prev = safe(float(col.iloc[-2]))
                change_pct = round(((price - prev) / prev) * 100, 2) if price and prev else 0
                result.append({"symbol": sym, "name": BIST_STOCKS[sym], "price": price, "change_pct": change_pct})
            except Exception:
                pass
    except Exception:
        pass
    return result


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        raw_symbols = params.get("symbols", ["THYAO.IS,GARAN.IS,AKBNK.IS,EREGL.IS,TUPRS.IS,SISE.IS,KCHOL.IS,BIMAS.IS"])[0]
        symbols = [s.strip().upper() for s in raw_symbols.split(",") if s.strip()][:10]

        try:
            data = get_ticker_data(symbols)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "public, max-age=60")
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
