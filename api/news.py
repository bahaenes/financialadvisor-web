import json
import re
import xml.etree.ElementTree as ET
from http.server import BaseHTTPRequestHandler
from datetime import datetime, timezone
import requests

RSS_FEEDS = [
    ("Bloomberg HT", "https://www.bloomberght.com/rss"),
    ("Dünya", "https://www.dunya.com/rss"),
    ("Ekonomist", "https://www.ekonomist.com.tr/rss"),
]

BIST_SYMBOLS = [
    "THYAO", "GARAN", "AKBNK", "EREGL", "SISE", "KCHOL", "SAHOL", "TUPRS",
    "ASELS", "BIMAS", "TCELL", "PGSUS", "TAVHL", "FROTO", "TOASO", "VESTL",
    "ARCLK", "PETKM", "KOZAL", "KOZAA", "HEKTS", "SASA", "EKGYO", "ENKAI",
    "ISCTR", "YKBNK", "VAKBN", "HALKB", "TTKOM", "GUBRF",
]

POSITIVE_WORDS = [
    "artış", "yükseliş", "kar", "büyüme", "pozitif", "güçlü", "rekor",
    "başarı", "kazanç", "ivme", "toparlanma", "iyileşme", "artıyor", "yükseliyor",
    "rally", "beklenti", "optimist", "fırsat", "değer", "temettü",
]

NEGATIVE_WORDS = [
    "düşüş", "kayıp", "zarar", "negatif", "zayıf", "risk", "endişe",
    "gerileme", "daralma", "kriz", "baskı", "satış", "düşüyor", "gerilemek",
    "belirsizlik", "sert", "çöküş", "sıkıntı", "borç", "enflasyon",
]

NEGATION = ["değil", "yok", "olmayan", "azalmış"]


def simple_sentiment(text: str) -> float:
    if not text:
        return 0.0
    text = text.lower()
    words = re.findall(r"\w+", text)
    score = 0
    for i, w in enumerate(words):
        is_negated = i > 0 and words[i - 1] in NEGATION
        if w in POSITIVE_WORDS:
            score += -1 if is_negated else 1
        elif w in NEGATIVE_WORDS:
            score += 1 if is_negated else -1
    total = max(len(words) / 10, 1)
    return max(-1.0, min(1.0, score / total))


def sentiment_label(score: float) -> str:
    if score > 0.05:
        return "pozitif"
    if score < -0.05:
        return "negatif"
    return "nötr"


def extract_mentioned_stocks(text: str) -> list:
    text_upper = text.upper()
    return [sym for sym in BIST_SYMBOLS if sym in text_upper]


def parse_rss(source_name: str, url: str) -> list:
    items = []
    try:
        r = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        r.raise_for_status()
        root = ET.fromstring(r.content)
        channel = root.find("channel")
        if channel is None:
            return []
        for item in channel.findall("item")[:8]:
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            description = re.sub(r"<[^>]+>", "", item.findtext("description") or "").strip()
            pub_date = (item.findtext("pubDate") or "").strip()

            combined = f"{title} {description}"
            score = simple_sentiment(combined)
            mentioned = extract_mentioned_stocks(combined)

            items.append({
                "title": title,
                "summary": description[:300] if description else title,
                "url": link,
                "source": source_name,
                "published": pub_date,
                "sentiment": round(score, 3),
                "sentiment_label": sentiment_label(score),
                "mentioned_stocks": mentioned[:5],
            })
    except Exception:
        pass
    return items


def get_news_data() -> dict:
    all_items = []
    seen_titles = set()

    for source_name, url in RSS_FEEDS:
        for item in parse_rss(source_name, url):
            title_key = item["title"][:60].lower()
            if title_key not in seen_titles:
                seen_titles.add(title_key)
                all_items.append(item)

    all_items = all_items[:30]

    if all_items:
        avg_sentiment = sum(i["sentiment"] for i in all_items) / len(all_items)
    else:
        avg_sentiment = 0.0

    return {
        "items": all_items,
        "market_sentiment": round(avg_sentiment, 3),
        "market_sentiment_label": sentiment_label(avg_sentiment),
    }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            data = get_news_data()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "public, max-age=600")
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
