# PixelMathness v0.1 · Banco de formas

Primera entrega de la ruta de la biblioteca paramétrica. La pestaña **Banco de formas** mide el detector de caras de trazo del public.zip original contra máscaras de interiores visibles. Vector Lab, Texture Lab, Cuboid Lab y Analyzer siguen disponibles.

## Abrir la app

En Windows, descomprime el ZIP en una carpeta nueva. Abre CMD en la carpeta donde está package.json. Usa Node.js 22 o superior.

```cmd
npm ci
npm run dev
```

Abre la dirección local que imprime Vite. En el banco, selecciona un caso para ver el sprite original, la superposición por píxel y las instancias que toca cada cara.

## Probar un sprite

1. Abre **Añadir PNG anotado** y carga un PNG a resolución nativa. Para una primera prueba se incluye examples/ramita.png, dibujado para esta entrega. Usa recortes por sprite; el analizador original construye una matriz completa por tono.
2. Elige una etiqueta por pieza y pinta su interior visible con el ratón. En una pieza sin tinta marca toda su superficie visible. El pincel Borrar devuelve el píxel al fondo. Zona sin evaluar excluye un píxel del cálculo. Una muestra negativa puede tener todas sus etiquetas vacías.
3. También puedes cargar examples/ramita.json junto al PNG de ejemplo. El campo image debe coincidir con el nombre de archivo y la máscara debe tener sus mismas dimensiones. Al sustituir un PNG por otro del mismo nombre revisa la referencia.
4. Asigna estilo y grupo. Mantén los frames de una misma serie en el mismo grupo. Pulsa **Evaluar sprite**. La evaluación de los PNG se ejecuta en un trabajador del navegador.
5. **Exportar referencia** guarda las etiquetas y el resultado del caso seleccionado. **Exportar informe** guarda las métricas y máscaras detectadas del conjunto filtrado. Los casos añadidos viven en la sesión de la página. Guarda el JSON antes de recargarla para poder volver a abrirlo con su PNG. Evaluar otra vez el mismo nombre actualiza su entrada.

## Interpretar la línea base

El corpus incluido contiene diez escenas sintéticas mínimas y un sprite de follaje dibujado para esta versión. El archivo examples/baseline.json registra una ejecución del motor. Sobre esas once muestras se recuperan **8 de 15 interiores**, con **3 detecciones sin pareja** y **1 fusión**. En la ramita, se recupera una de tres hojas. Estos resultados caracterizan este corpus pequeño.

Cada carácter en reference equivale a un píxel. Las etiquetas 1–9, A–Z y a–z identifican instancias. El punto marca fondo evaluable, y ? marca píxeles desconocidos. Una máscara representa un único nivel de partes visibles. Evalúa niveles anidados en casos separados con nombres distintos.

Se emparejan instancias y caras uno a uno con IoU ≥ 0.50. IoU es intersección dividida por unión. Se maximiza la cantidad de parejas admitidas. Omitidas son las instancias sin pareja. Una detección sin pareja cuenta como sobrante si tiene algún píxel evaluable. Fusión señala una cara que toca más de una instancia. Fragmentación señala una instancia tocada por varias caras. Estas señales pueden coincidir con un acierto y son sensibles incluso a contactos de un píxel. El color de la comparación expresa acuerdo por píxel, mientras que la tabla expresa acuerdo por instancia.

Los tiempos corresponden a separar tonos, construir el contorno y detectar caras. Excluyen carga, evaluación y dibujo. El conjunto de reserva incluido es ilustrativo. Para medir generalización, conserva una reserva nueva de tu dataset antes de ajustar parámetros.

## Reproducir desde CMD

```cmd
npm test
npm run build
npm run --silent benchmark > baseline-local.json
```

El detector, las referencias y el evaluador están separados en src/pixelmathness/benchmark. El siguiente hito de la ruta es extraer analyzeSprite y el mapa de etiquetas compartido, comprobando el resultado frente a esta línea base.
