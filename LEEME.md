# Bote Arcade

Diecisiete minijuegos en una sola app de Telegram, con monedas, anuncios con recompensa y ranking semanal comunes.

| Archivo | Juego | Temática |
| --- | --- | --- |
| `ruta-neon.html` | Ruta Neón | Corredor 3D por una ciudad neón |
| `pila-zen.html` | Pila Zen | Torre de bloques en un templo japonés |
| `abismo.html` | El Abismo | Submarino en una cueva del fondo del mar |
| `corta-fruta.html` | Corta Fruta | Cortar fruta tropical y esquivar bombas |
| `orbita.html` | Órbita | Nave espacial contra asteroides |
| `check-in.html` | Check-In | Cruzar la ciudad hasta el hotel sin que te timen |
| `mordisco.html` | Mordisco | Laberinto clásico: comer dulces y huir de las avispas |
| `asteroides.html` | Asteroides | El clásico vectorial de rocas y platillos |
| `barriles.html` | La Torre | Plataformas clásicas: barriles, cintas, ascensores y remaches |
| `invasores.html` | Invasores | Marcianos que bajan en filas |
| `charca.html` | La Charca | La rana que cruza carretera y río |
| `ladrillos.html` | Rompeladrillos | Pala, bola y ladrillos con premios |
| `serpiente.html` | Serpiente | La serpiente del móvil, con modo retro y neón |
| `glaciar.html` | Glaciar | Pingüino que empuja bloques de hielo, con música propia |
| `zombis.html` | Noche Zombi | Correr y saltar zombis por una ciudad de noche, subiendo a tejados |
| `turbo-noche.html` | Turbo Noche | Carreras nocturnas en 3D: esquiva el tráfico, llega a los controles a tiempo y escapa de la policía |
| `base-infierno.html` | Base Infierno | Disparos en primera persona en 3D por una base lunar: tarjetas, ascensor, tres armas y una jefa cada 4 niveles |

- `index.html`: menú con los diecisiete juegos, el bote total y la cuenta atrás hasta el reparto del domingo.
- `config.js`: identificador del bloque de AdsGram (`adsgramBlockId`) y bote de ejemplo. Vacío = anuncios simulados.
- `comun.js`: base común (Telegram, sonido, anuncios, ranking y pantallas) que usan Pila Zen, El Abismo, Corta Fruta y Órbita.
- `vendor/three.min.js`: motor 3D (Three.js r128) para Ruta Neón y Pila Zen.

Cada juego tiene su ranking semanal y una quinta parte del bote; cobran los 20 primeros de cada juego
(20, 13, 10, 8, 7, 6, 5, 4, 4 y 3 % del 1.º al 10.º, y 2 % del 11.º al 20.º).

Publicación prevista: GitHub Pages en `https://lcortivideos-max.github.io/juegos/`.
