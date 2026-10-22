#!/usr/bin/env python3
"""Bot de Telegram de Bote Arcade.

Responde a /start, /ayuda y /info con un botón que abre la Mini App.
Solo usa la biblioteca estándar de Python (long polling, sin webhook).
El token se lee de la variable de entorno BOT_TOKEN.
"""
import html
import json
import os
import sys
import time
import urllib.error
import urllib.request

TOKEN = os.environ.get('BOT_TOKEN', '').strip()
APP_URL = os.environ.get('APP_URL', 'https://lcortivideos-max.github.io/juegos/')
API = f'https://api.telegram.org/bot{TOKEN}/'

PLAY = {'inline_keyboard': [[{'text': '🎮 Jugar', 'web_app': {'url': APP_URL}}],
                            [{'text': 'ℹ️ Cómo funciona', 'callback_data': 'info'},
                             {'text': '❓ Ayuda', 'callback_data': 'ayuda'}]]}

TEXTS = {
    'start': ('¡Hola, {name}! 👋\n\n'
              '<b>Bote Arcade</b> son 16 juegos arcade gratis: carreras, disparos, laberintos, '
              'serpiente, invasores y más.\n\n'
              'Pulsa <b>Jugar</b> para empezar. Cada juego tiene su ranking semanal.'),
    'info': ('<b>Cómo funciona</b>\n\n'
             '• Todos los juegos son gratis y se juegan sin ver anuncios.\n'
             '• Si quieres, puedes ver un anuncio para jugar con monedas x2 o para revivir.\n'
             '• Tu mejor partida de la semana cuenta para el ranking de cada juego.\n'
             '• El ranking semanal con premios llegará pronto.'),
    'ayuda': ('<b>Ayuda</b>\n\n'
              '/start – abrir el menú\n'
              '/info – cómo funciona\n'
              '/ayuda – esta ayuda\n\n'
              'Si la app no carga, cierra Telegram y vuelve a abrirlo.'),
}


def call(method, **params):
    data = json.dumps(params).encode()
    req = urllib.request.Request(API + method, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=70) as r:
        return json.load(r)


def send(chat_id, key, name=''):
    call('sendMessage', chat_id=chat_id, text=TEXTS[key].format(name=html.escape(name or "jugador")),
         parse_mode='HTML', reply_markup=PLAY)


def handle(update):
    if 'callback_query' in update:
        q = update['callback_query']
        call('answerCallbackQuery', callback_query_id=q['id'])
        if q.get('data') in TEXTS and q.get('message'):
            send(q['message']['chat']['id'], q['data'])
        return
    msg = update.get('message')
    if not msg or 'text' not in msg or msg['chat'].get('type') != 'private':
        return
    cmd = msg['text'].split()[0].split('@')[0].lower()
    key = {'/start': 'start', '/info': 'info', '/ayuda': 'ayuda', '/help': 'ayuda'}.get(cmd, 'start')
    send(msg['chat']['id'], key, msg.get('from', {}).get('first_name', ''))


def setup():
    steps = [
        ('setMyCommands', {'commands': [{'command': 'start', 'description': 'Abrir Bote Arcade'},
                                        {'command': 'info', 'description': 'Cómo funciona'},
                                        {'command': 'ayuda', 'description': 'Ayuda'}]}),
        ('setChatMenuButton', {'menu_button': {'type': 'web_app', 'text': 'Jugar', 'web_app': {'url': APP_URL}}}),
        ('setMyDescription', {'description': '16 juegos arcade gratis en Telegram, con ranking semanal. Pulsa Iniciar para jugar.'}),
        ('setMyShortDescription', {'short_description': '16 juegos arcade gratis con ranking semanal.'}),
    ]
    for method, params in steps:
        try:
            call(method, **params)
        except urllib.error.HTTPError as e:
            if e.code == 401:
                raise
            print(method, 'falló:', e.code, flush=True)
        except Exception as e:
            print(method, 'falló:', e, flush=True)


def main():
    if not TOKEN:
        sys.exit('Falta BOT_TOKEN')
    while True:
        try:
            setup()
            break
        except urllib.error.HTTPError:
            print('Telegram rechaza el token (401). Pon uno nuevo con poner-token.sh', flush=True)
            time.sleep(300)
    print('Bot en marcha', flush=True)
    offset = 0
    while True:
        try:
            res = call('getUpdates', offset=offset, timeout=50)
            for u in res.get('result', []):
                offset = u['update_id'] + 1
                try:
                    handle(u)
                except Exception as e:  # un mensaje raro no debe tumbar el bot
                    print('Error con un mensaje:', e, flush=True)
        except urllib.error.HTTPError as e:
            print('Telegram respondió', e.code, flush=True)
            time.sleep(10 if e.code != 401 else 300)
        except Exception as e:
            print('Sin conexión:', e, flush=True)
            time.sleep(5)


if __name__ == '__main__':
    main()
