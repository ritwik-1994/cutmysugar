#!/usr/bin/env python3
"""
Serving size/serving type model trainer + applier.

What it does
- Trains:
  1) serving_type classifier (multiclass; restricted to labels seen in training)
  2) (min_g, g, max_g) multi-output regressor
  3) serving_size_confidence regressor (then snapped to the discrete confidence levels seen in training)

- Applies:
  Fills ONLY these columns (creates them if missing):
    - serving_type
    - Serving size G
    - Serving size min 
    - Serving Size Max
    - Serving size confidence

It does NOT modify any other columns.

Usage
  Train:
    python serving_model.py train --train_csv <train.csv> --model_dir <dir>

  Apply:
    python serving_model.py apply --in_csv <input.csv> --out_csv <output.csv> --model_dir <dir>
    python serving_model.py apply --in_csv <input.csv> --out_csv <output.csv> --model_dir <dir> --overwrite

Notes
- Designed to be robust to "extra" columns or missing optional columns.
- Uses only lightweight sklearn models (fast and portable).
"""

from __future__ import annotations

import argparse
import os
import json
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional

import numpy as np
import pandas as pd
from joblib import dump, load

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LogisticRegression, Ridge

# ---------------------------
# Column names (keep exact)
# ---------------------------
COL_SERVING_TYPE = "serving_type"
COL_MIN = "Serving size min "
COL_G = "Serving size G"
COL_MAX = "Serving Size Max"
COL_CONF = "Serving size confidence"

TARGET_COLS = [COL_SERVING_TYPE, COL_G, COL_MIN, COL_MAX, COL_CONF]

# Candidate text columns (we'll use whatever exists)
TEXT_COL_CANDIDATES = [
    "canonical_name",
    "canonical_name_original",
    "primary_category",
    "notes",
]

# Discrete confidence levels observed in training will be learned and persisted.
DEFAULT_ALLOWED_CONF = [0.50, 0.55, 0.60, 0.70, 0.75, 0.80, 0.85, 0.90]


@dataclass
class ModelBundle:
    clf: Pipeline
    size_reg: Pipeline
    conf_reg: Pipeline
    serving_type_labels: List[str]
    allowed_conf_levels: List[float]
    clip_by_type: Dict[str, Dict[str, Tuple[float, float]]]  # {type: {col: (lo, hi)}}


def _normalize_colnames(df: pd.DataFrame) -> pd.DataFrame:
    """
    Keep original columns, but provide a mapping helper by stripping redundant whitespace.
    We DO NOT rename columns in-place; we only use this for matching.
    """
    return df


def _build_text_all(row: pd.Series, text_cols: List[str]) -> str:
    parts: List[str] = []
    for c in text_cols:
        if c in row and pd.notna(row[c]):
            v = str(row[c]).strip()
            if v:
                parts.append(v)
    return " | ".join(parts)


def _infer_text_cols(df: pd.DataFrame) -> List[str]:
    return [c for c in TEXT_COL_CANDIDATES if c in df.columns]


def _snap_to_levels(x: np.ndarray, levels: List[float]) -> np.ndarray:
    lv = np.array(levels, dtype=float)
    # broadcast abs diff and pick nearest
    idx = np.abs(x.reshape(-1, 1) - lv.reshape(1, -1)).argmin(axis=1)
    return lv[idx]


def _compute_clip_ranges(df: pd.DataFrame, serving_labels: List[str]) -> Dict[str, Dict[str, Tuple[float, float]]]:
    """
    Per serving_type, compute robust clipping ranges (5th to 95th percentile)
    for min/g/max to keep predictions realistic.
    """
    clip: Dict[str, Dict[str, Tuple[float, float]]] = {}
    for st in serving_labels:
        sub = df[df[COL_SERVING_TYPE] == st]
        if len(sub) < 10:
            # fallback to global quantiles when very few samples
            sub = df
        clip[st] = {}
        for col in [COL_MIN, COL_G, COL_MAX]:
            lo = float(np.nanpercentile(sub[col].astype(float), 5))
            hi = float(np.nanpercentile(sub[col].astype(float), 95))
            # guardrails
            lo = max(0.0, lo)
            hi = max(lo + 1.0, hi)
            clip[st][col] = (lo, hi)
    return clip


def train_models(train_csv: str, model_dir: str) -> ModelBundle:
    df = pd.read_csv(train_csv)
    text_cols = _infer_text_cols(df)

    # Basic training set filters
    df_clf = df.dropna(subset=[COL_SERVING_TYPE]).copy()
    df_clf["text_all"] = df_clf.apply(lambda r: _build_text_all(r, text_cols), axis=1)

    serving_type_labels = sorted(df_clf[COL_SERVING_TYPE].dropna().unique().tolist())

    # 1) serving_type classifier: TF-IDF(text_all) -> LogisticRegression (liblinear for speed)
    clf = Pipeline(
        steps=[
            ("tfidf", TfidfVectorizer(ngram_range=(1, 1), min_df=2, max_features=6000)),
            ("lr", LogisticRegression(max_iter=600, solver="liblinear")),
        ]
    )
    clf.fit(df_clf["text_all"], df_clf[COL_SERVING_TYPE])

    # 2) sizes regressor: TF-IDF(text_all) + OneHot(serving_type) -> Ridge (multioutput by default via y being DF)
    df_sz = df.dropna(subset=[COL_SERVING_TYPE, COL_MIN, COL_G, COL_MAX]).copy()
    df_sz["text_all"] = df_sz.apply(lambda r: _build_text_all(r, text_cols), axis=1)

    pre_sz = ColumnTransformer(
        transformers=[
            ("text", TfidfVectorizer(ngram_range=(1, 1), min_df=2, max_features=6000), "text_all"),
            ("cat", OneHotEncoder(handle_unknown="ignore"), [COL_SERVING_TYPE]),
        ]
    )
    size_reg = Pipeline(steps=[("pre", pre_sz), ("ridge", Ridge(alpha=3.0, random_state=42))])
    size_reg.fit(df_sz[["text_all", COL_SERVING_TYPE]], df_sz[[COL_MIN, COL_G, COL_MAX]])

    # 3) confidence regressor: TF-IDF(text_all) + OneHot(serving_type) -> Ridge
    df_cf = df.dropna(subset=[COL_SERVING_TYPE, COL_CONF]).copy()
    df_cf["text_all"] = df_cf.apply(lambda r: _build_text_all(r, text_cols), axis=1)

    allowed_conf = sorted(df_cf[COL_CONF].dropna().astype(float).unique().tolist())
    if not allowed_conf:
        allowed_conf = DEFAULT_ALLOWED_CONF

    pre_cf = ColumnTransformer(
        transformers=[
            ("text", TfidfVectorizer(ngram_range=(1, 1), min_df=2, max_features=6000), "text_all"),
            ("cat", OneHotEncoder(handle_unknown="ignore"), [COL_SERVING_TYPE]),
        ]
    )
    conf_reg = Pipeline(steps=[("pre", pre_cf), ("ridge", Ridge(alpha=5.0, random_state=42))])
    conf_reg.fit(df_cf[["text_all", COL_SERVING_TYPE]], df_cf[COL_CONF].astype(float))

    clip_by_type = _compute_clip_ranges(df_sz, serving_type_labels)

    bundle = ModelBundle(
        clf=clf,
        size_reg=size_reg,
        conf_reg=conf_reg,
        serving_type_labels=serving_type_labels,
        allowed_conf_levels=allowed_conf,
        clip_by_type=clip_by_type,
    )

    os.makedirs(model_dir, exist_ok=True)
    dump(bundle.clf, os.path.join(model_dir, "serving_type_clf.joblib"))
    dump(bundle.size_reg, os.path.join(model_dir, "size_reg.joblib"))
    dump(bundle.conf_reg, os.path.join(model_dir, "conf_reg.joblib"))
    with open(os.path.join(model_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(
            {
                "serving_type_labels": bundle.serving_type_labels,
                "allowed_conf_levels": bundle.allowed_conf_levels,
                "clip_by_type": bundle.clip_by_type,
                "text_cols_used": _infer_text_cols(df),
                "target_cols": TARGET_COLS,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    return bundle


def load_models(model_dir: str) -> ModelBundle:
    clf = load(os.path.join(model_dir, "serving_type_clf.joblib"))
    size_reg = load(os.path.join(model_dir, "size_reg.joblib"))
    conf_reg = load(os.path.join(model_dir, "conf_reg.joblib"))
    with open(os.path.join(model_dir, "metadata.json"), "r", encoding="utf-8") as f:
        meta = json.load(f)
    return ModelBundle(
        clf=clf,
        size_reg=size_reg,
        conf_reg=conf_reg,
        serving_type_labels=meta["serving_type_labels"],
        allowed_conf_levels=meta["allowed_conf_levels"],
        clip_by_type=meta["clip_by_type"],
    )


def _ensure_target_columns(df: pd.DataFrame) -> pd.DataFrame:
    for c in TARGET_COLS:
        if c not in df.columns:
            df[c] = np.nan
    return df


def apply_models(
    in_csv: str,
    out_csv: str,
    model_dir: str,
    overwrite: bool = False,
) -> None:
    bundle = load_models(model_dir)

    df = pd.read_csv(in_csv)
    df = _ensure_target_columns(df)

    text_cols = _infer_text_cols(df)
    if not text_cols:
        raise ValueError(
            f"No usable text columns found to build features. "
            f"Expected one of: {TEXT_COL_CANDIDATES}. "
            f"Found columns: {list(df.columns)[:50]}..."
        )

    # Only fill rows where at least one target col is missing (unless overwrite).
    if overwrite:
        mask = np.ones(len(df), dtype=bool)
    else:
        mask = df[TARGET_COLS].isna().any(axis=1)

    if mask.sum() == 0:
        # Nothing to do; still write output to be explicit/consistent.
        df.to_csv(out_csv, index=False)
        return

    work = df.loc[mask].copy()
    work["text_all"] = work.apply(lambda r: _build_text_all(r, text_cols), axis=1)

    # 1) Predict serving_type + probability
    if hasattr(bundle.clf, "predict_proba"):
        proba = bundle.clf.predict_proba(work["text_all"])
        pred_idx = np.argmax(proba, axis=1)
        pred_type = np.array(bundle.clf.classes_)[pred_idx]
        pred_type_prob = proba[np.arange(len(work)), pred_idx]
    else:
        pred_type = bundle.clf.predict(work["text_all"])
        pred_type_prob = np.full(len(work), 0.6, dtype=float)  # fallback

    # Force predictions into the master label set from training.
    pred_type = np.array([p if p in set(bundle.serving_type_labels) else "portion" for p in pred_type], dtype=object)

    # 2) Predict sizes using predicted serving_type
    X_sz = pd.DataFrame({"text_all": work["text_all"].values, COL_SERVING_TYPE: pred_type})
    sz_pred = bundle.size_reg.predict(X_sz)
    sz_pred = np.asarray(sz_pred, dtype=float)

    # enforce positive and clip by serving_type quantiles
    min_pred = np.maximum(0.0, sz_pred[:, 0])
    g_pred = np.maximum(0.0, sz_pred[:, 1])
    max_pred = np.maximum(0.0, sz_pred[:, 2])

    # type-based clipping
    for i, st in enumerate(pred_type):
        clip = bundle.clip_by_type.get(st)
        if not clip:
            continue
        lo, hi = clip[COL_MIN]
        min_pred[i] = float(np.clip(min_pred[i], lo, hi))
        lo, hi = clip[COL_G]
        g_pred[i] = float(np.clip(g_pred[i], lo, hi))
        lo, hi = clip[COL_MAX]
        max_pred[i] = float(np.clip(max_pred[i], lo, hi))

    # consistency: min <= g <= max
    min_pred = np.minimum(min_pred, g_pred)
    max_pred = np.maximum(max_pred, g_pred)
    max_pred = np.maximum(max_pred, min_pred + 1.0)

    # 3) Predict confidence using confidence regressor + derived signal from type probability
    X_cf = pd.DataFrame({"text_all": work["text_all"].values, COL_SERVING_TYPE: pred_type})
    conf_pred = bundle.conf_reg.predict(X_cf).astype(float)

    # derived confidence from classifier probability (maps 0..1 -> 0.50..0.90)
    conf_from_type = 0.50 + 0.40 * np.clip(pred_type_prob, 0.0, 1.0)

    conf = 0.5 * conf_pred + 0.5 * conf_from_type
    conf = np.clip(conf, 0.50, 0.90)

    # snap to the discrete confidence levels seen in training
    conf = _snap_to_levels(conf, bundle.allowed_conf_levels)

    # Write back ONLY target cols
    df.loc[mask, COL_SERVING_TYPE] = pred_type
    df.loc[mask, COL_MIN] = np.round(min_pred, 0).astype(int)
    df.loc[mask, COL_G] = np.round(g_pred, 0).astype(int)
    df.loc[mask, COL_MAX] = np.round(max_pred, 0).astype(int)
    df.loc[mask, COL_CONF] = conf.astype(float)

    df.to_csv(out_csv, index=False)


def _build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Train/apply serving size/type models.")
    sub = p.add_subparsers(dest="cmd", required=True)

    p_train = sub.add_parser("train", help="Train models from a labeled master CSV.")
    p_train.add_argument("--train_csv", required=True, help="Path to training CSV (master sheet).")
    p_train.add_argument("--model_dir", required=True, help="Directory to write trained models + metadata.")

    p_apply = sub.add_parser("apply", help="Apply models to a new CSV, filling only serving columns.")
    p_apply.add_argument("--in_csv", required=True, help="Input CSV to fill.")
    p_apply.add_argument("--out_csv", required=True, help="Output CSV to write.")
    p_apply.add_argument("--model_dir", required=True, help="Directory containing trained models + metadata.")
    p_apply.add_argument("--overwrite", action="store_true", help="Overwrite existing values in target columns.")

    return p


def main() -> None:
    args = _build_arg_parser().parse_args()

    if args.cmd == "train":
        train_models(args.train_csv, args.model_dir)
        print(f"✅ Trained models saved to: {args.model_dir}")
    elif args.cmd == "apply":
        apply_models(args.in_csv, args.out_csv, args.model_dir, overwrite=bool(args.overwrite))
        print(f"✅ Wrote filled CSV to: {args.out_csv}")
    else:
        raise RuntimeError("Unknown command")


if __name__ == "__main__":
    main()
