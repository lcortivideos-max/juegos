#!/usr/bin/env python3
"""Prepara los juegos para GameDistribution: un .zip por juego en gd/dist/.

Uso: python3 gd/build.py            (usa los Game ID de gd/ids.json)
En ids.json pon el Game ID que da GameDistribution a cada juego; los que estén vacíos se saltan.
"""
import json, os, re, shutil, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = {'turbo': 'turbo-noche.html', 'infierno': 'base-infierno.html', 'invasores': 'invasores.html', 'asteroides': 'asteroides.html',
         'abismo': 'abismo.html', 'fruta': 'corta-fruta.html', 'orbita': 'orbita.html', 'hotel': 'check-in.html', 'mordisco': 'mordisco.html',
         'torre': 'barriles.html', 'charca': 'charca.html', 'ladrillos': 'ladrillos.html', 'serpiente': 'serpiente.html', 'glaciar': 'glaciar.html',
         'zombis': 'zombis.html'}

def build(gid, game_id, out):
    src = open(os.path.join(ROOT, FILES[gid]), encoding='utf-8').read()
    # Fuera los scripts de Telegram y AdsGram: en los portales no hacen falta.
    src = re.sub(r'\s*<script src="https://telegram\.org/js/telegram-web-app\.js"></script>', '', src)
    src = re.sub(r'\s*<script src="https://sad\.adsgram\.ai/js/sad\.min\.js"></script>', '', src)
    d = os.path.join(out, gid); shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(src)
    shutil.copy(os.path.join(ROOT, 'comun.js'), d)
    open(os.path.join(d, 'config.js'), 'w', encoding='utf-8').write(
        "window.ARCADE = { adsgramBlockId: '', potTotal: 0, gdGameId: %s };\n" % json.dumps(game_id))
    if 'vendor/three.min.js' in src:
        os.makedirs(os.path.join(d, 'vendor')); shutil.copy(os.path.join(ROOT, 'vendor', 'three.min.js'), os.path.join(d, 'vendor'))
    z = os.path.join(out, f'{gid}.zip')
    with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
        for base, _, files in os.walk(d):
            for f in files:
                p = os.path.join(base, f); zf.write(p, os.path.relpath(p, d))
    return z

if __name__ == '__main__':
    ids = json.load(open(os.path.join(ROOT, 'gd', 'ids.json')))
    out = os.path.join(ROOT, 'gd', 'dist'); os.makedirs(out, exist_ok=True)
    for gid, game_id in ids.items():
        if game_id: print(build(gid, game_id, out))
        else: print(f'{gid}: sin Game ID, se salta')
