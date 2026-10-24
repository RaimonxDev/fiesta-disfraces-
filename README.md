# Fiesta de Disfraces: cómo ponerla en marcha

La web tiene dos piezas:

- **`index.html`**: la página que ve la gente (votar, inscribirse y ranking).
- **`Code.gs`**: un pequeño script de Google que guarda todo en un Google Sheet.

Tardas unos 10 minutos.

El barrio o rama se elige de una lista con las unidades de la Estaca Osorno. Si hay que cambiarla, edita la lista `BARRIOS` en **los dos** archivos (`index.html` y `Code.gs`). No hace falta servidor ni pagar nada.

## 1. Crear el Google Sheet y el script

1. Entra en [sheets.new](https://sheets.new) y ponle un nombre, por ejemplo *Fiesta de Disfraces*.
2. En el menú, ve a **Extensiones → Apps Script**.
3. Borra lo que haya en el editor, pega todo el contenido de `Code.gs` y pulsa **Guardar** (💾).
4. Arriba, en el desplegable de funciones, elige **`setup`** y pulsa **Ejecutar**.
   - Google te pedirá permisos: **Revisar permisos → tu cuenta → Configuración avanzada → Ir a … (no seguro) → Permitir**. Es normal: el script es tuyo.
   - Vuelve al Sheet: verás tres pestañas nuevas, **Disfraces**, **Votos** y **Config**.

## 2. Publicar el script como aplicación web

1. En el editor de Apps Script pulsa **Implementar → Nueva implementación**.
2. En el engranaje ⚙️ elige **Aplicación web**.
3. Rellena:
   - **Ejecutar como:** *Yo*
   - **Quién tiene acceso:** *Cualquier usuario* (sin esto la gente no podrá votar)
4. Pulsa **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).

> Si más adelante cambias `Code.gs`, ve a **Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar**. Así la URL no cambia.

## 3. Conectar la página

La página ya está publicada en **https://raimonxdev.github.io/fiesta-disfraces-/** (GitHub Pages, se actualiza sola con cada cambio en la rama `main`).

Solo falta pegar la URL del paso 2:

1. En GitHub abre el archivo `index.html` y pulsa el lápiz ✏️ (editar).
2. Busca esta línea y pega tu URL entre las comillas:

   ```js
   const API_URL = 'https://script.google.com/macros/s/XXXXXXXX/exec';
   ```
3. Pulsa **Commit changes**. En uno o dos minutos la web ya usa tu Google Sheet.

Mientras `API_URL` esté vacía, la página funciona en **modo demostración** (datos de ejemplo guardados solo en tu navegador).

Comparte el enlace (o un código QR con él) en la actividad.

## Controlar el concurso desde el Sheet

En la pestaña **Config** puedes cambiar estos valores (TRUE / FALSE) y la web lo refleja al recargar:

| clave | qué hace |
|---|---|
| `inscripcion_abierta` | FALSE cierra las inscripciones |
| `votacion_abierta` | FALSE cierra la votación (útil al final de la fiesta) |
| `mostrar_resultados` | FALSE oculta los votos y el ranking hasta el momento que quieras |
| `titulo` | El título grande de la página |

En **Disfraces** puedes corregir o borrar inscripciones a mano (borra la fila entera). En **Votos** ves cada voto.

## Cómo funciona la votación

- Cada persona tiene **un voto**. Si vuelve a votar a otro disfraz, se cambia su voto (no se suma).
- Nadie puede votar por su propio disfraz.
- El voto se identifica por el navegador del móvil. Es suficiente para una fiesta entre amigos, pero alguien con mucho empeño podría votar desde otro navegador o en modo incógnito. Si eso te preocupa, al final puedes revisar la pestaña **Votos**.
