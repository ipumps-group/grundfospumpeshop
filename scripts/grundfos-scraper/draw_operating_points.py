#!/usr/bin/env python3
"""
draw_operating_points.py

Draws the nimitööpunkt (nominal operating point) on Grundfos pump curve images.
Adds: red filled circle + dashed lines to axes + label box.

Usage:
    python draw_operating_points.py                            # all SKUs
    python draw_operating_points.py --test                     # first 5 SKUs
    python draw_operating_points.py --sku 93074187,99199551    # specific SKUs
    python draw_operating_points.py --debug                    # draw plot bounds in green
    python draw_operating_points.py --input-dir path/to/curves --output-dir path/to/out

Requirements:
    pip install Pillow numpy
"""

import json
import re
import sys
import argparse
import warnings
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ── Paths ─────────────────────────────────────────────────────────────────────

BASE        = Path(__file__).parent
DATA_FILE   = BASE / 'output' / 'technical_data.json'
CURVES_DIR  = BASE / 'curves' / 'cropped'
OUTPUT_DIR  = BASE / 'curves' / 'annotated'

# ── Unit conversion ───────────────────────────────────────────────────────────

_FLOW_RE = re.compile(
    r'([\d.,]+)\s*(l/s|m[³3]/h|m3/h|l/min|m[³3]/s|m3/s)', re.IGNORECASE
)
_HEAD_RE = re.compile(
    r'([\d.,]+)\s*(dm|cm|mm|m)\b', re.IGNORECASE
)

def _num(s: str) -> float:
    return float(s.replace(',', '.'))

def parse_flow_ls(raw: str) -> float | None:
    """Parse flow string → l/s. Returns None on failure."""
    m = _FLOW_RE.search(raw)
    if not m:
        return None
    val, unit = _num(m.group(1)), m.group(2).lower()
    if 'm³/h' in unit or 'm3/h' in unit:
        return val / 3.6
    if 'l/min' in unit:
        return val / 60.0
    if 'm³/s' in unit or 'm3/s' in unit:
        return val * 1000.0
    return val  # l/s

def parse_head_m(raw: str) -> float | None:
    """Parse head string → metres. Returns None on failure."""
    m = _HEAD_RE.search(raw)
    if not m:
        return None
    val, unit = _num(m.group(1)), m.group(2).lower()
    if unit == 'dm':
        return val / 10.0
    if unit == 'cm':
        return val / 100.0
    if unit == 'mm':
        return val / 1000.0
    return val  # m

# ── Plot-area detection ───────────────────────────────────────────────────────

# Fallback relative margins (fraction of image width/height)
_FL, _FR, _FT, _FB = 0.055, 0.970, 0.070, 0.500

def detect_hq_panel(arr: np.ndarray) -> tuple[int, int, int, int, bool]:
    """
    Detect the H-Q panel bounding box (left, right, top, bottom) in pixels.

    Strategy:
      - Skip outer image border (first/last 2 %) to avoid picking up the
        image frame as an axis line.
      - Find strong horizontal dark lines (span ≥ 50 % of image width) in the
        upper 65 % of the image.  First such line = plot_top, last = plot_bottom.
      - Find the leftmost dark vertical line (span ≥ 18 % of search height)
        for plot_left.
      - Derive plot_right from the rightmost dark pixel on the plot_bottom row
        (the right border is often lighter / absent).
      - Fall back to relative margins if detection looks unreliable.
    """
    h, w = arr.shape[:2]
    search_h = int(h * 0.65)

    gray = arr[:search_h, :, :3].astype(np.float32).mean(axis=2)

    # Skip the outer 2 % border of the image
    skip_r = max(2, int(h  * 0.02))
    skip_c = max(2, int(w  * 0.02))

    # Adaptive darkness + span thresholds — try progressively looser settings
    # until we find at least 2 horizontal and 1 vertical border candidate
    strong_rows = np.array([], dtype=int)
    strong_cols = np.array([], dtype=int)

    for dark_thresh in [80, 110, 140]:
        is_dark   = gray < dark_thresh
        row_proj  = is_dark.sum(axis=1)   # (search_h,)
        col_proj  = is_dark.sum(axis=0)   # (w,)

        _strong_rows = np.array([], dtype=int)
        for row_frac in [0.50, 0.30, 0.15, 0.10, 0.05]:
            cands = np.where(row_proj > w * row_frac)[0]
            cands = cands[cands >= skip_r]
            # Require rows to span at least 10 % of image height so we pick up
            # both the top AND bottom borders, not just a thick single border line
            if len(cands) >= 2 and (cands[-1] - cands[0]) >= h * 0.10:
                _strong_rows = cands
                break

        _strong_cols = np.array([], dtype=int)
        for col_frac in [0.18, 0.10, 0.05, 0.03]:
            cands = np.where(col_proj > search_h * col_frac)[0]
            cands = cands[(cands >= skip_c) & (cands < w - skip_c)]
            if len(cands) >= 1:
                _strong_cols = cands
                break

        if len(_strong_rows) >= 2 and len(_strong_cols) >= 1:
            strong_rows = _strong_rows
            strong_cols = _strong_cols
            is_dark_final = is_dark   # needed for right-border scan
            break
    else:
        # Use whatever we found at the loosest setting
        is_dark_final = gray < 140
        col_proj = is_dark_final.sum(axis=0)
        strong_rows = _strong_rows
        strong_cols = _strong_cols

    is_dark = is_dark_final

    # Defaults
    plot_top    = int(h * _FT)
    plot_bottom = int(h * _FB)
    plot_left   = int(w * _FL)
    plot_right  = int(w * _FR)
    detected    = False

    if len(strong_rows) >= 2:
        plot_top    = int(strong_rows[0])
        plot_bottom = int(strong_rows[-1])
        detected    = True

    if len(strong_cols) >= 1:
        # Left border = leftmost strong column in the left half
        left_cands = strong_cols[strong_cols < w // 2]
        if len(left_cands):
            plot_left = int(left_cands[0])

        # Right border = rightmost dark pixel on the plot_bottom row
        bottom_row = is_dark[min(plot_bottom, search_h - 1), :]
        dark_in_row = np.where(bottom_row)[0]
        dark_in_row = dark_in_row[dark_in_row > w // 2]   # right half only
        if len(dark_in_row):
            plot_right = int(dark_in_row[-1])
        else:
            # Fallback: rightmost dark pixel across all rows in right half
            right_cands = strong_cols[strong_cols > w // 2]
            if len(right_cands):
                plot_right = int(right_cands[-1])

    # Sanity check
    if (plot_right - plot_left) < w * 0.20 or (plot_bottom - plot_top) < h * 0.05:
        detected  = False
        plot_top    = int(h * _FT)
        plot_bottom = int(h * _FB)
        plot_left   = int(w * _FL)
        plot_right  = int(w * _FR)

    return plot_left, plot_right, plot_top, plot_bottom, detected

# ── Drawing helpers ───────────────────────────────────────────────────────────

RED        = (220, 30,  30)
RED_LIGHT  = (220, 30,  30, 200)
WHITE      = (255, 255, 255)

def draw_dashed_line(draw, x1, y1, x2, y2, color=RED, dash=10, gap=6, width=2):
    dx, dy = x2 - x1, y2 - y1
    length = (dx**2 + dy**2) ** 0.5
    if length < 1:
        return
    nx, ny = dx / length, dy / length
    pos, on = 0.0, True
    while pos < length:
        seg = dash if on else gap
        end = min(pos + seg, length)
        if on:
            draw.line(
                [(x1 + nx * pos, y1 + ny * pos),
                 (x1 + nx * end, y1 + ny * end)],
                fill=color, width=width
            )
        pos = end
        on = not on

def draw_annotation(img: Image.Image,
                    px: int, py: int,
                    q_ls: float, h_m: float,
                    plot_left: int, plot_bottom: int) -> Image.Image:
    """Draw circle, dashed lines and label on a copy of img."""
    out  = img.convert('RGBA')
    draw = ImageDraw.Draw(out)

    img_w, img_h = img.size
    scale = min(img_w, img_h) / 800.0   # normalise for different resolutions

    r       = max(5, int(6 * scale))
    lw      = max(1, int(2 * scale))
    dash    = max(6, int(10 * scale))
    gap     = max(4, int(6  * scale))
    fsize   = max(11, int(14 * scale))

    # Dashed lines to axes
    draw_dashed_line(draw, plot_left, py, px, py, RED, dash, gap, lw)
    draw_dashed_line(draw, px, py, px, plot_bottom, RED, dash, gap, lw)

    # Filled circle
    draw.ellipse([(px - r, py - r), (px + r, py + r)], fill=RED, outline=RED)

    # Label text
    q_str = f'Q = {q_ls:.2f} l/s'
    h_str = f'H = {h_m:.2f} m'
    title = 'Nimitööpunkt'

    try:
        font_b = ImageFont.truetype('arialbd.ttf',  fsize)
        font_r = ImageFont.truetype('arial.ttf',    fsize - 1)
    except OSError:
        font_b = ImageFont.load_default()
        font_r = font_b

    pad  = int(6 * scale)
    lh   = fsize + 2

    # Measure box
    def tw(text, font):
        bb = draw.textbbox((0, 0), text, font=font)
        return bb[2] - bb[0]

    box_w = max(tw(title, font_b), tw(q_str, font_r), tw(h_str, font_r)) + pad * 2
    box_h = lh * 3 + pad * 2

    # Place label: prefer top-right of point; shift if near edge
    lx = px + r + 4
    ly = py - box_h - r - 4
    if lx + box_w > img_w - 5:
        lx = px - r - 4 - box_w
    if ly < 5:
        ly = py + r + 4
    if ly + box_h > img_h - 5:
        ly = img_h - box_h - 5

    # Box background + border
    draw.rectangle([(lx, ly), (lx + box_w, ly + box_h)],
                   fill=(255, 255, 255, 230), outline=RED, width=lw)

    # Text lines
    draw.text((lx + pad, ly + pad),              title, fill=RED,     font=font_b)
    draw.text((lx + pad, ly + pad + lh),         q_str, fill=(30,30,30), font=font_r)
    draw.text((lx + pad, ly + pad + lh * 2),     h_str, fill=(30,30,30), font=font_r)

    return out.convert('RGB')

# ── Per-SKU processing ────────────────────────────────────────────────────────

def process_sku(sku: str, entry: dict, input_dir: Path, output_dir: Path,
                debug: bool, input_suffix: str = '_curve.png',
                output_suffix: str = '_curve.png') -> str | None:
    """
    Process one SKU. Returns a warning string or None on success.
    """
    specs: dict = {s['label']: s['value'] for s in (entry.get('specs') or [])}

    # --- Parse nominal Q and H ---
    q_raw = specs.get('Nimijõudlus') or specs.get('Nominal flow')
    h_raw = (specs.get('Tõstekõrgus nom.') or specs.get('Nominal head')
             or specs.get('Tõstekõrgus') or specs.get('Head'))
    hmax_raw = (specs.get('Tõstekõrgus maks.') or specs.get('Max head')
                or specs.get('Maksimaalne tõstekõrgus'))
    qmax_raw = (specs.get('Max voolukiirus') or specs.get('Max flow')
                or specs.get('Maksimaalne voolukiirus'))

    if not q_raw:
        return f'{sku}: missing Nimijõudlus'
    if not h_raw:
        return f'{sku}: missing Tõstekõrgus nom.'

    q_ls = parse_flow_ls(q_raw)
    h_m  = parse_head_m(h_raw)
    if q_ls is None:
        return f'{sku}: cannot parse flow "{q_raw}"'
    if h_m is None:
        return f'{sku}: cannot parse head "{h_raw}"'

    h_max = parse_head_m(hmax_raw) if hmax_raw else h_m * 2.0
    q_max = parse_flow_ls(qmax_raw) if qmax_raw else q_ls * 2.5
    if not h_max or h_max <= h_m:
        h_max = h_m * 1.5
    if not q_max or q_max <= q_ls:
        q_max = q_ls * 2.5

    # --- Find image ---
    img_path = input_dir / f'{sku}{input_suffix}'
    if not img_path.exists():
        return f'{sku}: image not found ({img_path.name})'

    img = Image.open(img_path).convert('RGB')
    arr = np.array(img)

    # --- Detect plot bounds ---
    plot_left, plot_right, plot_top, plot_bottom, auto_detected = detect_hq_panel(arr)

    if not auto_detected:
        warnings.warn(f'{sku}: plot bounds not detected — using fallback margins')

    # --- Map Q, H → pixel ---
    plot_w = plot_right  - plot_left
    plot_h = plot_bottom - plot_top   # pixel height (bottom > top in image coords)

    px = plot_left   + int((q_ls / q_max) * plot_w)
    py = plot_bottom - int((h_m  / h_max) * plot_h)

    # Clamp to plot area (in case of estimation error)
    px = max(plot_left + 2,  min(px, plot_right  - 2))
    py = max(plot_top  + 2,  min(py, plot_bottom - 2))

    # --- Draw ---
    out = draw_annotation(img, px, py, q_ls, h_m, plot_left, plot_bottom)

    if debug:
        d = ImageDraw.Draw(out)
        d.rectangle(
            [(plot_left, plot_top), (plot_right, plot_bottom)],
            outline=(0, 200, 0), width=2
        )

    output_dir.mkdir(parents=True, exist_ok=True)
    out.save(output_dir / f'{sku}{output_suffix}')
    return None  # success

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Draw pump operating points on curve images')
    parser.add_argument('--test',        action='store_true',  help='Process first 5 SKUs only')
    parser.add_argument('--debug',       action='store_true',  help='Draw detected plot bounds in green')
    parser.add_argument('--sku',         default='',           help='Comma-separated SKUs to process')
    parser.add_argument('--input-dir',   default=str(CURVES_DIR),  help='Folder with curve images')
    parser.add_argument('--output-dir',  default=str(OUTPUT_DIR),  help='Output folder for annotated images')
    parser.add_argument('--input-suffix', default='_curve.png', help='Input filename suffix (default: _curve.png)')
    parser.add_argument('--output-suffix', default='_curve.png', help='Output filename suffix (default: _curve.png)')
    args = parser.parse_args()

    input_dir     = Path(args.input_dir)
    output_dir    = Path(args.output_dir)
    input_suffix  = args.input_suffix
    output_suffix = args.output_suffix

    data: dict = json.loads(DATA_FILE.read_text(encoding='utf-8'))

    if args.sku:
        skus = [s.strip() for s in args.sku.split(',') if s.strip()]
    else:
        skus = list(data.keys())

    if args.test:
        skus = skus[:5]

    mode = ('TEST (5)' if args.test
            else f'TARGETED ({len(skus)})' if args.sku
            else f'FULL ({len(skus)})')

    print(f'\nGrundfos Operating Point Annotator')
    print(f'Mode       : {mode}')
    print(f'Input dir  : {input_dir}')
    print(f'Output dir : {output_dir}')
    print()

    ok, failed, warn_msgs = 0, 0, []

    for sku in skus:
        entry = data.get(sku)
        if not entry:
            warn_msgs.append(f'{sku}: not in technical_data.json')
            failed += 1
            continue

        w = process_sku(sku, entry, input_dir, output_dir, args.debug, input_suffix, output_suffix)
        if w:
            warn_msgs.append(w)
            failed += 1
            print(f'  FAIL  {w}')
        else:
            ok += 1
            print(f'  OK    {sku}')

    print(f'\n-- Summary --')
    print(f'  OK      : {ok}')
    print(f'  Failed  : {failed}')
    if warn_msgs and ok > 0:
        print(f'\n-- Warnings --')
        for m in warn_msgs:
            print(f'  WARN  {m}')

if __name__ == '__main__':
    main()
