#!/usr/bin/env python3
"""Builds the self-hosted eco fonts (src/templates/eco/fonts/*.woff2) from the Google variable fonts.

Why: the stock files cover weights 200 to 900 and a wide character range (58 kB + 29 kB on every page). The eco pages use
Newsreader at 500 and 600 and Source Sans 3 from 400 to 700, in Latin only. Pinning the weight axis and keeping only the characters
the site uses gives about 30 kB in total, preloaded.

Needs: python3 -m venv v && v/bin/pip install fonttools brotli.  Input: the two Latin woff2 files that next/font downloaded
(find them with: python3 scripts/make-fonts.py --list out/_next/static/media), or any TTF/WOFF2 of the same families.
Usage: python3 scripts/make-fonts.py newsreader.woff2 sourcesans3.woff2
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

# Basic Latin, Latin-1 Supplement, typographic punctuation and the arrows used in the copy
UNICODES = list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026, 0x20AC, 0x2190, 0x2192, 0x2193, 0x203A, 0x2212]

def build(src, out, wght):
    import io, os
    f = TTFont(src)
    # round trip through memory so every table is fully loaded (woff2 files load glyph variations lazily)
    buf = io.BytesIO()
    f.flavor = None
    f.save(buf)
    f = TTFont(io.BytesIO(buf.getvalue()))
    f = instancer.instantiateVariableFont(f, {"wght": wght})
    buf = io.BytesIO()
    f.save(buf)
    f = TTFont(io.BytesIO(buf.getvalue()))
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["kern", "liga", "calt", "ccmp", "locl", "mark", "mkmk", "tnum", "pnum", "lnum", "onum"]
    opts.name_IDs = [1, 2, 3, 4, 6]
    opts.notdef_outline = True
    s = subset.Subsetter(opts)
    s.populate(unicodes=UNICODES)
    s.subset(f)
    f.flavor = "woff2"
    f.save(out)
    print(out, os.path.getsize(out), "bytes")

if __name__ == "__main__":
    news, sans = sys.argv[1], sys.argv[2]
    build(news, "src/templates/eco/fonts/newsreader-500-600.woff2", (500, 600))
    build(sans, "src/templates/eco/fonts/sourcesans3-400-700.woff2", (400, 700))
