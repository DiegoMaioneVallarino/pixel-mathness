# Furni Lab

Generador paramétrico de pixel art isométrico estilo Habbo (baldosa 64×32, líneas 2:1), con la marca **Pairtial**.

- **Mundo**: plano isométrico infinito que se desplaza; los furnis se dibujan píxel a píxel y se renuevan con nuevas semillas. Colorimetría con paletas, giro de tono y opacidad del interior en vivo. Clic sobre un furni para guardarlo, descargar su JSON o abrirlo.
- **Laboratorio**: 38 generadores en 7 categorías (interior, árboles, vegetación, rocas y relieve, vallas y muros, estructuras, granja) con sliders; descarga PNG en 1 o 4 direcciones.
- **Terreno y biomas**: modo mixto con zonas de pradera, bosque, desierto, nieve, pantano y costa (clima por temperatura/humedad, playa en las orillas). El relieve usa alturas por esquina cuantizadas a semibloques de 8 px: los desniveles siempre son pendientes planas en diagonal, con brillo en la cima y sombra al pie. Los objetos se colocan solo sobre terreno plano, a su altura.
- **Fauna**: mariposas, murciélagos, conejos, topos, peces, aves, cocodrilos e insectos como NPC animados (4 direcciones × 2 fotogramas), que aparecen según el bioma y el terreno: los peces nadan y saltan, los conejos brincan, los topos se asoman, las aves cruzan el cielo con su sombra, los cocodrilos nadan medio sumergidos, las luciérnagas brillan.
- **Bloques y construcciones**: bloque/semibloque y rampas (recta, esquina exterior e interior) en 9 materiales; torres, murallas y casas hechas de bloques.
- **Alternativas y colorimetría**: el laboratorio genera 8 variaciones de un furni (forma, color o ambas) y traslada la colorimetría de un furni u objeto del catálogo a otro (por luminosidad o por orden, con opción de conservar la luz).
- **Suprafurnis**: plano isométrico con capas para apilar furnis del catálogo respetando su altura de superficie.
- **Catálogo**: objetos guardados, familias, exportar/importar JSON; el mundo puede mostrar solo una familia.

## Uso

No necesita instalación: abre `dist/index.html` en el navegador.

Para reconstruirlo después de editar `src/`:

```bash
npm run build      # genera dist/index.html (requiere Node 18+)
```

## Estructura

```
src/
  index.html          Estructura de la página (marcadores /* @inline ... */)
  styles/app.css      Estilos propios de la app
  engine/engine.js    Motor: primitivas SDF, materiales/rampas, render incremental,
                      generadores de interior (FURNI) y alturas de apilado
  engine/exterior.js  Primitivas extra (rama cónica, cilindro, cristal, roca facetada),
                      materiales por zona y los 30 generadores de exterior
  engine/bloques.js   Pieles de material, bloque/semibloque, rampas, torre, muralla y casa
  engine/fauna.js     Generadores de las criaturas (2 fotogramas cada una)
  app/app.js          Interfaz: mundo, laboratorio, suprafurnis, catálogo
vendor/
  pairtial-brand.css  tokens + themes + components de pairtial-style-brand (sin cambios)
scripts/build.mjs     Une todo en dist/index.html (archivo único)
dist/index.html       Página lista para usar o publicar
tools/generador-node/ Versión TypeScript del motor para generar PNG desde la terminal
```

## Cómo funciona el render

1. Cada furni es un conjunto de formas 3D descritas por distancia (cajas, cilindros, conos, elipsoides...).
2. Cada píxel lanza un rayo en la dirección isométrica fija: `sx = x − y`, `sy = (x + y)/2 − z`.
3. La luz se convierte en un índice de una rampa de 6 tonos por material (con giro de tono en sombras y luces): la salida nunca sale de la paleta.
4. Contornos, brillos de arista y pliegues se derivan de los saltos de profundidad y de normal.
5. El render es incremental (`makeJob().step()`), con un presupuesto de 6 ms por cuadro, así que la interfaz nunca se bloquea.

## Agregar un furni

En `src/engine/exterior.js` (o `engine.js`), añade una entrada a `FURNI` con `name`, `cat` (categoría), `params` (sliders), `colors`, `build(p)`, `stack(p)` (altura de su superficie superior) y opcionalmente `walk: true` si se puede atravesar. Cada parte de `build` puede llevar `pick(x,y,z,nx,ny,nz)` para cambiar de material por zona (nieve, musgo, vetas, juntas). La interfaz genera sus controles automáticamente.

## Guardado del catálogo

Hoy el catálogo vive en el `localStorage` del navegador. Todo pasa por `CatalogStore.load()` / `CatalogStore.save()` en `src/app/app.js`: para un guardado persistente, reemplaza esas dos funciones por tu backend.

## Fuentes

La marca usa Pair Pro Display/Text, que no se distribuyen aquí; la página usa la tipografía de respaldo definida en los tokens.
