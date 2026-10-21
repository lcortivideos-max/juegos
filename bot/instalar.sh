#!/usr/bin/env bash
# Instala el bot de Bote Arcade como servicio en un servidor Linux (Oracle Cloud, Ubuntu u Oracle Linux).
# Uso: curl -fsSL https://raw.githubusercontent.com/lcortivideos-max/juegos/main/bot/instalar.sh | sudo bash
set -euo pipefail
DIR=/opt/botearcade
mkdir -p "$DIR"
curl -fsSL https://raw.githubusercontent.com/lcortivideos-max/juegos/main/bot/bot.py -o "$DIR/bot.py"
command -v python3 >/dev/null || { (apt-get update && apt-get install -y python3) || dnf install -y python3; }
cat > "$DIR/poner-token.sh" <<'TOK'
#!/usr/bin/env bash
# Guarda el token del bot sin mostrarlo y reinicia el bot.
set -euo pipefail
echo "Pega el token NUEVO de tu bot (el de BotFather) y pulsa Intro. No se verá en pantalla:"
read -rs TOKEN < /dev/tty
echo
printf 'BOT_TOKEN=%s\n' "$TOKEN" > /opt/botearcade/token.env
chmod 600 /opt/botearcade/token.env
systemctl enable --now botearcade >/dev/null 2>&1
systemctl restart botearcade
sleep 3
if systemctl is-active --quiet botearcade; then echo "✅ Bot en marcha. Abre tu bot en Telegram y escribe /start"; else echo "❌ El bot no arrancó: journalctl -u botearcade -n 30"; fi
TOK
chmod 700 "$DIR/poner-token.sh"
touch "$DIR/token.env"
chmod 600 "$DIR/token.env"
cat > /etc/systemd/system/botearcade.service <<UNIT
[Unit]
Description=Bot de Telegram de Bote Arcade
After=network-online.target
Wants=network-online.target

[Service]
EnvironmentFile=$DIR/token.env
ExecStart=/usr/bin/env python3 $DIR/bot.py
Restart=always
RestartSec=5
DynamicUser=yes

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
if [ ! -s "$DIR/token.env" ] && [ -z "${NO_PROMPT:-}" ]; then
  exec "$DIR/poner-token.sh"
fi
if [ ! -s "$DIR/token.env" ]; then
  echo "Bot instalado. Falta el token: ejecuta  sudo $DIR/poner-token.sh"
  exit 0
fi
systemctl enable --now botearcade
systemctl restart botearcade
sleep 3
if systemctl is-active --quiet botearcade; then
  echo "✅ Bot en marcha. Abre tu bot en Telegram y escribe /start"
else
  echo "❌ El bot no arrancó. Mira el error con: journalctl -u botearcade -n 30"
fi
