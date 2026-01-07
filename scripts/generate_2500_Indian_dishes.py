#!/usr/bin/env python3
"""
generate_2500_Indian_dishes.py

Generates a candidate list of ~2500 unique Indian dish names by pulling from:
1) Wikipedia category members (via MediaWiki API)
2) Wikidata SPARQL (Indian-origin dishes)

Then:
- filters obvious non-dish pages
- de-duplicates vs your existing master dataset (by canonical_name)
- fuzzy-collapses near-duplicates (avoid minor spelling / formatting variants)
- writes next2500_indian_dishes_candidates.csv

Usage:
  python3 generate_2500_Indian_dishes.py \
    --existing-master gi_gl_master_cleaned_v2_portionized_v2_more_mapped.csv \
    --out next2500_indian_dishes_candidates.csv \
    --target 2500

Dependencies:
  pip install pandas requests rapidfuzz
"""

import argparse
import random
import re
import time
from typing import Dict, List, Optional, Set

import pandas as pd
import requests
from rapidfuzz import fuzz

# -----------------------------
# Config
# -----------------------------

DEFAULT_WIKI_CATEGORIES = [
    "Indian dishes",
    "Indian desserts",
    "Indian snack foods",
    "Indian breads",
    "Indian rice dishes",
    "Indian curries",
    "Indian soups and stews",
    "Indian drinks",
    "Indian pickles",
    "Street food in India",
]

BAD_TERMS = [
    "cuisine",
    "portal",
    "category:",
    "template:",
    "list of",
    "festival",
    "company",
    "brand",
    "restaurant",
    "television",
    "film",
    "album",
    "song",
    "person",
    "politician",
    "book",
    "magazine",
]

USER_AGENT = "CutMySugar/1.0 (contact: you@example.com) Python requests"

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT})


# -----------------------------
# Helpers
# -----------------------------

def norm(s: str) -> str:
    s = (s or "").lower().strip().replace("&", "and")
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"[^a-z0-9\s\-\(\)]", "", s)
    return s


def safe_get_json(url: str, params: Dict, timeout: int = 30, max_retries: int = 7) -> Dict:
    """
    Fetch JSON robustly with retries + backoff and helpful debugging.
    """
    for attempt in range(max_retries):
        r = SESSION.get(url, params=params, timeout=timeout)

        # Retry on common transient / rate-limit statuses
        if r.status_code in (429, 500, 502, 503, 504):
            sleep = (2 ** attempt) + random.random()
            print(f"[retry] status={r.status_code} attempt={attempt+1}/{max_retries} sleep={sleep:.1f}s")
            time.sleep(sleep)
            continue

        # Non-200: print preview and raise
        if r.status_code != 200:
            print(f"[error] status={r.status_code} url={r.url}")
            print(f"[error] content-type={r.headers.get('content-type')}")
            print("[error] preview:", r.text[:200])
            r.raise_for_status()

        # Attempt JSON parse
        try:
            return r.json()
        except Exception:
            # Often HTML (e.g., block page) => preview and retry
            print(f"[error] Non-JSON response url={r.url}")
            print(f"[error] content-type={r.headers.get('content-type')}")
            print("[error] preview:", r.text[:200])
            sleep = (2 ** attempt) + random.random()
            time.sleep(sleep)

    raise RuntimeError("Failed to fetch valid JSON after retries.")


def get_wiki_category_members(category: str, limit: int = 8000) -> List[str]:
    """
    MediaWiki API: list of page titles in a category.
    Handles pagination (cmcontinue) and adds polite delays.
    """
    url = "https://en.wikipedia.org/w/api.php"
    members: List[str] = []
    cmcontinue: Optional[str] = None

    while True:
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": f"Category:{category}",
            "cmlimit": "500",
            "format": "json",
        }
        if cmcontinue:
            params["cmcontinue"] = cmcontinue

        data = safe_get_json(url, params=params, timeout=30, max_retries=7)

        members += [x["title"] for x in data.get("query", {}).get("categorymembers", [])]
        cmcontinue = data.get("continue", {}).get("cmcontinue")

        if not cmcontinue or len(members) >= limit:
            break

        # Polite delay to reduce throttling
        time.sleep(0.2 + random.random() * 0.3)

    return members[:limit]


def wikidata_indian_dishes(limit: int = 20000) -> List[str]:
    """
    Wikidata SPARQL:
      - instance/subclass of dish (Q746549)
      - country of origin India (Q668) via P495

    Retries on rate limiting.
    """
    sparql = f"""
    SELECT ?itemLabel WHERE {{
      ?item wdt:P31/wdt:P279* wd:Q746549 .
      ?item wdt:P495 wd:Q668 .
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }} LIMIT {limit}
    """

    url = "https://query.wikidata.org/sparql"
    headers = {
        "Accept": "application/sparql-results+json",
        "User-Agent": USER_AGENT,
    }

    for attempt in range(7):
        r = requests.get(url, params={"query": sparql}, headers=headers, timeout=60)

        if r.status_code in (429, 500, 502, 503, 504):
            sleep = (2 ** attempt) + random.random()
            print(f"[wikidata retry] status={r.status_code} attempt={attempt+1}/7 sleep={sleep:.1f}s")
            time.sleep(sleep)
            continue

        if r.status_code != 200:
            print(f"[wikidata error] status={r.status_code}")
            print(f"[wikidata] content-type={r.headers.get('content-type')}")
            print("[wikidata] preview:", r.text[:200])
            r.raise_for_status()

        try:
            data = r.json()
        except Exception:
            print("[wikidata] Non-JSON preview:", r.text[:200])
            sleep = (2 ** attempt) + random.random()
            time.sleep(sleep)
            continue

        return [b["itemLabel"]["value"] for b in data["results"]["bindings"]]

    raise RuntimeError("Wikidata failed after retries.")


def filter_titles(titles: List[str]) -> List[str]:
    """
    Remove obvious non-dish pages.
    """
    out: List[str] = []
    for t in titles:
        n = norm(t)
        if not n:
            continue
        if any(bt in n for bt in BAD_TERMS):
            continue
        # drop navigation-like entries
        if n.startswith("category ") or n.startswith("template "):
            continue
        out.append(t)
    return out


def fuzzy_collapse(titles: List[str], threshold: int = 95, window: int = 400) -> List[str]:
    """
    Collapse near-duplicates using token_set_ratio in a sliding window.
    Keeps the first occurrence.
    """
    kept: List[str] = []
    seen_norm: List[str] = []

    for t in sorted(set(titles), key=lambda x: norm(x)):
        n = norm(t)
        duplicate = False
        # Compare against recent kept to bound runtime
        for prev in seen_norm[-window:]:
            if fuzz.token_set_ratio(n, prev) >= threshold:
                duplicate = True
                break
        if not duplicate:
            kept.append(t)
            seen_norm.append(n)
    return kept


# -----------------------------
# Main
# -----------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--existing-master", required=True, help="CSV with canonical_name column to exclude existing items")
    ap.add_argument("--out", default="next2500_indian_dishes_candidates.csv", help="Output CSV path")
    ap.add_argument("--target", type=int, default=2500, help="Target number of candidates")
    ap.add_argument("--max-pool", type=int, default=3000, help="Max candidates to keep before truncating to target")
    ap.add_argument("--skip-wikipedia", action="store_true", help="Only use Wikidata (use if Wikipedia blocks you)")
    ap.add_argument("--wiki-limit-per-cat", type=int, default=8000, help="Max items per Wikipedia category")
    ap.add_argument("--wikidata-limit", type=int, default=20000, help="Max items fetched from Wikidata")
    args = ap.parse_args()

    # Load existing
    master = pd.read_csv(args.existing_master)
    if "canonical_name" not in master.columns:
        raise ValueError("existing-master CSV must contain a 'canonical_name' column.")
    existing: Set[str] = set(master["canonical_name"].astype(str).map(norm))

    pool: List[str] = []

    # Wikipedia
    if not args.skip_wikipedia:
        wiki_titles: List[str] = []
        for c in DEFAULT_WIKI_CATEGORIES:
            print(f"[wiki] fetching Category:{c}")
            try:
                wiki_titles += get_wiki_category_members(c, limit=args.wiki_limit_per_cat)
            except Exception as e:
                print(f"[wiki] failed for Category:{c} error={e}")
                print("[wiki] continuing... (you can rerun with --skip-wikipedia)")
        pool += wiki_titles

    # Wikidata
    print("[wikidata] fetching Indian-origin dishes...")
    wd_titles = wikidata_indian_dishes(limit=args.wikidata_limit)
    pool += wd_titles

    # Filter
    pool = filter_titles(pool)

    # Remove exact matches vs master
    pool2: List[str] = []
    for t in pool:
        if norm(t) not in existing:
            pool2.append(t)

    # Fuzzy collapse
    pool3 = fuzzy_collapse(pool2, threshold=95, window=400)

    # Truncate to max_pool then target
    pool3 = pool3[: args.max_pool]
    candidates = pool3[: args.target]

    out = pd.DataFrame({
        "Suggested_item": candidates,
        "Category": "",
        "Region": "",
        "Meal_occasion": "",
        "Standardization_hint": "Add cooking method and key add-ons (oil/ghee/sugar) to reduce GI/GL ambiguity.",
    })
    out.to_csv(args.out, index=False)

    print(f"\nWrote {len(out)} rows to: {args.out}")
    if len(out) < args.target:
        print("Note: output < target. Try increasing --wikidata-limit, adding categories, or lowering fuzzy threshold.")


if __name__ == "__main__":
    main()
