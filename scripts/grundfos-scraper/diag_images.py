"""Trace exactly what detect_hq_panel does for the 3 failing SKUs."""
from PIL import Image
import numpy as np

_FL, _FR, _FT, _FB = 0.055, 0.970, 0.070, 0.500

def trace_detect(sku, arr):
    h, w = arr.shape[:2]
    search_h = int(h * 0.65)
    gray = arr[:search_h, :, :3].astype(np.float32).mean(axis=2)
    skip_r = max(2, int(h  * 0.02))
    skip_c = max(2, int(w  * 0.02))

    print(f'\n=== {sku}  {w}x{h}  search_h={search_h}  skip_r={skip_r}  skip_c={skip_c} ===')

    _strong_rows = np.array([], dtype=int)
    _strong_cols = np.array([], dtype=int)
    is_dark_final = None

    for dark_thresh in [80, 110, 140]:
        is_dark  = gray < dark_thresh
        row_proj = is_dark.sum(axis=1)
        col_proj = is_dark.sum(axis=0)

        for row_frac in [0.50, 0.30, 0.15, 0.10, 0.05]:
            cands = np.where(row_proj > w * row_frac)[0]
            cands = cands[cands >= skip_r]
            if len(cands) >= 2:
                _strong_rows = cands
                break

        for col_frac in [0.18, 0.10, 0.05, 0.03]:
            cands = np.where(col_proj > search_h * col_frac)[0]
            cands = cands[(cands >= skip_c) & (cands < w - skip_c)]
            if len(cands) >= 1:
                _strong_cols = cands
                break

        rows_ok = len(_strong_rows) >= 2
        cols_ok  = len(_strong_cols) >= 1
        print(f'  t={dark_thresh}: rows_ok={rows_ok}({len(_strong_rows)})  cols_ok={cols_ok}({len(_strong_cols)})  BOTH={rows_ok and cols_ok}')
        if rows_ok:
            print(f'    strong_rows[0]={_strong_rows[0]}  [-1]={_strong_rows[-1]}')
        if cols_ok:
            print(f'    strong_cols range=[{_strong_cols[0]}..{_strong_cols[-1]}]')

        if rows_ok and cols_ok:
            is_dark_final = is_dark
            print(f'  --> BREAK at t={dark_thresh}')
            break
    else:
        print(f'  --> FOR-ELSE (no break): using t=140 fallback')
        is_dark_final = gray < 140
        col_proj = is_dark_final.sum(axis=0)

    # Reproduce the bounds logic
    plot_top    = int(h * _FT)
    plot_bottom = int(h * _FB)
    plot_left   = int(w * _FL)
    plot_right  = int(w * _FR)
    detected    = False

    if len(_strong_rows) >= 2:
        plot_top    = int(_strong_rows[0])
        plot_bottom = int(_strong_rows[-1])
        detected    = True

    is_dark = is_dark_final
    if len(_strong_cols) >= 1:
        left_cands = _strong_cols[_strong_cols < w // 2]
        if len(left_cands):
            plot_left = int(left_cands[0])
        bottom_row = is_dark[min(plot_bottom, search_h - 1), :]
        dark_in_row = np.where(bottom_row)[0]
        dark_in_row = dark_in_row[dark_in_row > w // 2]
        if len(dark_in_row):
            plot_right = int(dark_in_row[-1])
        else:
            right_cands = _strong_cols[_strong_cols > w // 2]
            if len(right_cands):
                plot_right = int(right_cands[-1])

    w_ok = (plot_right - plot_left) >= w * 0.20
    h_ok = (plot_bottom - plot_top) >= h * 0.05
    print(f'  bounds: L={plot_left} R={plot_right} T={plot_top} B={plot_bottom}')
    print(f'  sanity: width={plot_right-plot_left} >= {w*0.20:.0f}? {w_ok}  height={plot_bottom-plot_top} >= {h*0.05:.0f}? {h_ok}')
    if not (w_ok and h_ok):
        detected = False
    print(f'  detected={detected}')

for sku in ['59641500', '92611467', '92616890', '92616892']:
    img = Image.open(f'curves/MoreCropped/cropped/{sku}_curve_cropped.png').convert('RGB')
    trace_detect(sku, np.array(img))
