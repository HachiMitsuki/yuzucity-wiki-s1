"""Build search-index.json by scanning wiki content.

Outputs a flat list of search entries spanning:
  - Page metadata (title, section, breadcrumb) for every .html file
  - Catalog items from icarus.html / jointshop.html / nicole.html (ITEMS array)
  - Vehicles from vehicles_data.js (VEHICLES array)
  - Timeline entries from news.html / updates.html
  - Streamers from status.json
  - Social handles from socials.json
  - Clips from clips.json

Run manually whenever content changes:
  python build_search_index.py
"""

import json
import os
import re
import html
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parent

# Pages indexed by NAV section label (matches common.js)
PAGE_META = {
    "index": ("街の概要", "概要", "🏙️"),
    "guide": ("初心者ガイド", "概要", "📖"),
    "commands": ("コマンド一覧", "概要", "⌨️"),
    "terms": ("配信用語集", "概要", "💬"),
    "rules-general": ("一般ルール", "ルール", "📜"),
    "rules-rp": ("RPルール", "ルール", "🎭"),
    "rules-combat": ("戦闘ルール", "ルール", "⚔️"),
    "rules-vehicle": ("車両ルール", "ルール", "🚗"),
    "rules-relationship": ("恋愛RP", "ルール", "💕"),
    "job-pd": ("警察 (PD)", "職業", "🚓"),
    "job-ems": ("EMS（救急）", "職業", "🚑"),
    "job-doctor": ("個人医", "職業", "⚕️"),
    "job-mechanic": ("メカニック", "職業", "🔧"),
    "job-food": ("飲食店", "職業", "🍔"),
    "job-crime": ("犯罪", "職業", "💀"),
    "dealer": ("ディーラー", "カタログ", "🚗"),
    "nekocafenau": ("猫カフェNAU", "カタログ", "🐱"),
    "burgershot": ("BurgerShot", "カタログ", "🍔"),
    "news": ("お知らせ", "最新情報", "📢"),
    "updates": ("機能変更", "最新情報", "🔄"),
    "streams": ("配信中", "最新情報", "📺"),
    "socials": ("住民SNS", "最新情報", "𝕏"),
    "clips": ("クリップ", "最新情報", "🎬"),
}


def strip_html(s: str) -> str:
    """Strip HTML tags and collapse whitespace."""
    s = re.sub(r"<script\b[^>]*>.*?</script>", " ", s, flags=re.DOTALL | re.IGNORECASE)
    s = re.sub(r"<style\b[^>]*>.*?</style>", " ", s, flags=re.DOTALL | re.IGNORECASE)
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.IGNORECASE)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def extract_subtitle(html_text: str) -> str:
    """Pull the section-subtitle text (page tagline)."""
    m = re.search(r'class="section-subtitle"[^>]*>(.*?)</p>', html_text, re.DOTALL)
    if m:
        return strip_html(m.group(1))
    return ""


def extract_headings(html_text: str) -> list[str]:
    """Pull all h1/h2/h3 heading text."""
    headings = []
    for tag in ("h1", "h2", "h3"):
        for m in re.finditer(rf"<{tag}\b[^>]*>(.*?)</{tag}>", html_text, re.DOTALL | re.IGNORECASE):
            t = strip_html(m.group(1))
            if t and t not in headings:
                headings.append(t)
    return headings


def extract_catalog_items(slug: str) -> list[dict]:
    """Extract ITEMS = [...] block from a catalog HTML's inline script."""
    path = ROOT / f"{slug}.html"
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    items = []
    # Match each `{ id: N, name: "...", ..., category: "...", price: N }` entry
    for m in re.finditer(
        r'\{\s*id:\s*\d+[^{}]*?name:\s*"([^"]+)"[^{}]*?category:\s*"([^"]+)"[^{}]*?price:\s*(\d+)[^{}]*?\}',
        text,
        re.DOTALL,
    ):
        name, category, price = m.group(1), m.group(2), m.group(3)
        items.append({
            "type": "item",
            "title": name,
            "url": f"{slug}.html",
            "section": PAGE_META.get(slug, (slug, "カタログ", "🛒"))[1],
            "page_title": PAGE_META.get(slug, (slug, "", ""))[0],
            "page_icon": PAGE_META.get(slug, ("", "", "🛒"))[2],
            "category": category,
            "price": int(price),
            "snippet": f"{category} · ¥{int(price):,}",
        })
    return items


def extract_vehicles() -> list[dict]:
    """Extract VEHICLES = [...] from vehicles_data.js (each entry is JSON)."""
    path = ROOT / "vehicles_data.js"
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    # Find the VEHICLES = [ ... ] block and capture inner content
    m = re.search(r"const\s+VEHICLES\s*=\s*\[(.*?)\];", text, re.DOTALL)
    if not m:
        return []
    inner = m.group(1)
    # Each item is on its own line as valid JSON: {"id":N,"model":"...","price":N,...}
    entries = []
    for line in inner.splitlines():
        line = line.strip().rstrip(",")
        if not line.startswith("{"):
            continue
        try:
            v = json.loads(line)
        except json.JSONDecodeError:
            continue
        model = v.get("model", "")
        price = v.get("price", 0)
        cat = v.get("category", "")
        if not model:
            continue
        entries.append({
            "type": "vehicle",
            "title": model.upper(),
            "url": "dealer.html",
            "section": "カタログ",
            "page_title": "ディーラー",
            "page_icon": "🚗",
            "category": cat,
            "price": price,
            "snippet": f"{cat} · ¥{price:,}",
        })
    return entries


def extract_timeline(slug: str) -> list[dict]:
    """Extract .timeline-item entries from news.html / updates.html."""
    path = ROOT / f"{slug}.html"
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    entries = []
    pattern = re.compile(
        r'<div class="timeline-item[^"]*">(.*?)</div>\s*</div>\s*</div>',
        re.DOTALL,
    )
    # Simpler: find each item with date/title/content trio
    for m in re.finditer(
        r'<div class="timeline-item[^"]*">\s*'
        r'<div class="timeline-date">(.*?)</div>\s*'
        r'<div class="timeline-title">(.*?)</div>\s*'
        r'<div class="timeline-content">(.*?)</div>\s*</div>',
        text,
        re.DOTALL,
    ):
        date = strip_html(m.group(1))
        title = strip_html(m.group(2))
        content = strip_html(m.group(3))
        if not title:
            continue
        page_meta = PAGE_META.get(slug, (slug, "", ""))
        entries.append({
            "type": "timeline",
            "title": title,
            "url": f"{slug}.html",
            "section": page_meta[1],
            "page_title": page_meta[0],
            "page_icon": page_meta[2],
            "snippet": f"{date} · {content[:160]}" if content else date,
        })
    return entries


def load_streamers() -> list[dict]:
    """Load streamers from status.json (twitch + youtube)."""
    path = ROOT / "status.json"
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    entries = []
    for src in ("twitch", "youtube"):
        for s in (data.get(src) or []):
            name = s.get("display_name") or s.get("login") or s.get("handle") or ""
            if not name:
                continue
            entries.append({
                "type": "streamer",
                "title": name,
                "url": "streams.html",
                "section": "最新情報",
                "page_title": "配信中",
                "page_icon": "📺",
                "category": src,
                "snippet": f"{src} · {'🔴 LIVE' if s.get('is_live') else 'オフライン'}",
            })
    return entries


def load_socials() -> list[dict]:
    """Load X handles from socials.json."""
    path = ROOT / "socials.json"
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    entries = []
    handles = data.get("handles") or data.get("accounts") or (data if isinstance(data, list) else [])
    for h in handles:
        if isinstance(h, str):
            name = h
            display = h
        elif isinstance(h, dict):
            name = h.get("handle") or h.get("username") or ""
            display = h.get("name") or h.get("display_name") or name
        else:
            continue
        if not name:
            continue
        entries.append({
            "type": "social",
            "title": display,
            "url": "socials.html",
            "section": "最新情報",
            "page_title": "住民SNS",
            "page_icon": "𝕏",
            "snippet": f"@{name}",
        })
    return entries


def load_clips() -> list[dict]:
    """Load clips from clips.json (titles + broadcaster + source)."""
    path = ROOT / "clips.json"
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    entries = []
    items = data if isinstance(data, list) else (data.get("clips") or data.get("items") or [])
    for c in items:
        title = c.get("title") or c.get("name") or ""
        if not title:
            continue
        bc = c.get("broadcaster_name") or c.get("author_name") or ""
        source = c.get("source") or ""
        entries.append({
            "type": "clip",
            "title": title,
            "url": "clips.html",
            "section": "最新情報",
            "page_title": "クリップ",
            "page_icon": "🎬",
            "snippet": f"{source} · {bc}".strip(" ·"),
        })
    return entries


def build_page_entries() -> list[dict]:
    """One entry per HTML page (with title + subtitle + headings as searchable text)."""
    entries = []
    for slug, (title, section, icon) in PAGE_META.items():
        path = ROOT / (f"{slug}.html" if slug != "index" else "index.html")
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        subtitle = extract_subtitle(text)
        headings = extract_headings(text)
        entries.append({
            "type": "page",
            "title": title,
            "url": "index.html" if slug == "index" else f"{slug}.html",
            "section": section,
            "page_title": title,
            "page_icon": icon,
            "snippet": subtitle,
            "headings": headings[:20],  # cap for size
        })
    return entries


def main():
    entries = []
    entries.extend(build_page_entries())
    # S2: catalogs are coming-soon. Re-add shop slugs here once their pages
    # publish ITEMS arrays again (e.g. "nekocafenau", "burgershot").
    for slug in ():
        entries.extend(extract_catalog_items(slug))
    # S2: dealer is coming-soon; vehicles_data.js still holds the S1 lineup.
    # Re-enable once the S2 vehicle catalog is published.
    INDEX_VEHICLES = False
    if INDEX_VEHICLES:
        entries.extend(extract_vehicles())
    for slug in ("news", "updates"):
        entries.extend(extract_timeline(slug))
    entries.extend(load_streamers())
    entries.extend(load_socials())
    entries.extend(load_clips())

    out = {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "entries": entries,
    }
    out_path = ROOT / "search-index.json"
    out_path.write_text(
        json.dumps(out, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    counts = {}
    for e in entries:
        counts[e["type"]] = counts.get(e["type"], 0) + 1
    print(f"wrote {out_path} - {len(entries)} entries")
    for t, n in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {n}")


if __name__ == "__main__":
    main()
