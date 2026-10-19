# Bote Arcade

Cinco minijuegos en una sola app de Telegram, con monedas, anuncios con recompensa y ranking semanal comunes.

| Archivo | Juego | Temática |
| --- | --- | --- |
| `ruta-neon.html` | Ruta Neón | Corredor 3D por una ciudad neón |
| `pila-zen.html` | Pila Zen | Torre de bloques en un templo japonés |
| `abismo.html` | El Abismo | Submarino en una cueva del fondo del mar |
| `corta-fruta.html` | Corta Fruta | Cortar fruta tropical y esquivar bombas |
| `orbita.html` | Órbita | Nave espacial contra asteroides |

- `index.html`: menú con los cinco juegos, el bote total y la cuenta atrás hasta el reparto del domingo.
- `config.js`: identificador del bloque de AdsGram (`adsgramBlockId`) y bote de ejemplo. Vacío = anuncios simulados.
- `comun.js`: base común (Telegram, sonido, anuncios, ranking y pantallas) que usan Pila Zen, El Abismo, Corta Fruta y Órbita.
- `vendor/three.min.js`: motor 3D (Three.js r128) para Ruta Neón y Pila Zen.

Cada juego tiene su ranking semanal y una quinta parte del bote; cobran los 20 primeros de cada juego
(20, 13, 10, 8, 7, 6, 5, 4, 4 y 3 % del 1.º al 10.º, y 2 % del 11.º al 20.º).

Publicación prevista: GitHub Pages en `https://lcortivideos-max.github.io/juegos/`.
