# Sincronización con Google Sheets de cuentas — Diseño

**Fecha:** 2026-05-11
**Autora:** Marta Torres
**Estado:** propuesta

## Problema

La página Gestión calcula asistencias, ingresos por miembro y bote a partir de los votos que los miembros hacen en la app. Como no todos votan correctamente, los números no coinciden con la realidad. La fuente de verdad real está en una Google Sheet (CuentasCharanga) donde Marta lleva el control manual de cada acto: fecha, nombre, € total, € a repartir, X de asistencia por miembro, refuerzos, gasolina y observaciones.

Para los actos de 2026 en adelante, queremos que la app refleje los datos de la GS en lugar de los votos.

## Objetivo

Permitir a Marta sincronizar los actos del año seleccionado en Gestión con la pestaña correspondiente de la GS. Tras sincronizar:

- Los actos quedan creados o actualizados en Firestore con la asistencia, refuerzos y precios reales.
- Los actos sincronizados se marcan como cerrados (no se puede votar).
- El resto de directores y miembros ven los datos correctos sin necesidad de loguearse en Google.
- Los pagos (quién ha pagado su parte) siguen siendo manuales en la app.
- Los ensayos no se tocan: siguen funcionando con votos como hasta ahora.

## No objetivos

- Sincronización bidireccional (la app nunca escribe en la GS).
- Sincronización automática programada (siempre es manual, disparada por Marta).
- Reemplazar el sistema de votación: los miembros pueden seguir votando hasta que el acto se sincroniza y queda cerrado.
- Importar ensayos desde la GS.
- Importar/sincronizar el campo "pagados".

## Decisiones tomadas

| Decisión | Opción elegida |
|---|---|
| Fuente de verdad para 2026 | GS manda siempre |
| Conexión | OAuth con Google (Sheets API, scope `spreadsheets.readonly`) |
| Quién sincroniza | Solo Marta (identificada por email) |
| Almacenamiento de datos sincronizados | Firestore (resto lee como hoy) |
| Matching de actos | Por fecha + nombre normalizado |
| Comportamiento si la GS tiene un acto nuevo | Crear en Firestore |
| Comportamiento si la app tiene un acto que no está en la GS | No tocar, avisar |
| Mapeo de miembros (columnas GS → uid app) | Sistema actual: `claveHistorico` o match por nombre |
| Actos sincronizados | Se marcan `cerrado: true` automáticamente |
| Pagos | Quedan manuales en la app, no se sincronizan |
| Ensayos | No se sincronizan |
| Pestaña a leer | La que coincide con el año seleccionado en el filtro de Gestión |
| UI | Sin emoticonos, texto plano o iconos SVG existentes |

## Arquitectura

### Roles y flujo de datos

```
┌─────────────────────┐      OAuth       ┌──────────────────┐
│ Marta (admin)       │ ───────────────► │ Google Sheets API│
│  · Página Gestión   │ ◄─────────────── │ (readonly)       │
│  · Botón Sincronizar│   datos GS       └──────────────────┘
└──────────┬──────────┘
           │ confirma diff
           ▼
┌─────────────────────┐
│ Firestore           │ ◄──── otros directores y miembros (lectura)
│  · events/{id}      │
│  · config/sheetsSync│
└─────────────────────┘
```

- Marta es la única que dispara sync. Su token OAuth vive en memoria (no se persiste).
- Los datos sincronizados se escriben en Firestore.
- Resto de usuarios leen Firestore como ya hacen.

### Componentes nuevos

1. **`src/services/googleAuth.js`** — encapsula Google Identity Services (GIS):
   - `requestSheetsToken()`: abre popup, devuelve access token. Si ya hay uno válido en memoria, lo devuelve.
   - `clearToken()`: invalida el token en memoria (para "Cerrar sesión Google").
   - Token nunca se guarda en `localStorage` ni Firestore.

2. **`src/services/sheetsSync.js`** — orquesta la sincronización:
   - `fetchSheetData(spreadsheetId, year, accessToken)`: llama a Sheets API y devuelve filas crudas.
   - `parseRows(rows)`: convierte filas en objetos `ActoCandidato` (ver Modelo de datos).
   - `buildDiff(candidatos, eventosFirestore, users)`: produce `{ aCrear, aActualizar, soloEnApp, miembrosNoVinculados }`.
   - `applyDiff(diff)`: escribe en Firestore en batch.

3. **`src/services/sheetsConfig.js`** — lectura/escritura del doc `config/sheetsSync` en Firestore.

4. **`src/components/gestion/SheetsSyncPanel.jsx`** — bloque visual en Gestión con info de la última sync, botón Configurar, botón Sincronizar.

5. **`src/components/gestion/SheetsSyncPreviewModal.jsx`** — modal con la vista previa del diff y botón Confirmar.

6. **`src/components/gestion/SheetsConfigModal.jsx`** — modal para pegar/cambiar la URL de la GS.

### Configuración

**Variables de entorno** (Netlify y `.env` local):
- `VITE_GOOGLE_OAUTH_CLIENT_ID`: Client ID OAuth web creado en Google Cloud Console.

**Setup en Google Cloud Console** (manual, una vez):
- Habilitar Google Sheets API.
- Crear OAuth Client ID tipo "Web application".
- Authorized JavaScript origins: `https://<dominio-netlify>` y `http://localhost:5173`.
- Test users: `marta.torres@quantia.es`.

**Setup en la app** (Marta, una vez):
- Va a Gestión → bloque de sync → Configurar → pega URL de la GS.
- App extrae `spreadsheetId` y guarda en Firestore (`config/sheetsSync`).

**Identidad de "Marta":** comprobación por email exacto `marta.torres@quantia.es`. El bloque de sync solo se renderiza si `currentUser.email === ADMIN_EMAIL`. Las reglas de Firestore son la barrera real (ver Seguridad).

### Modelo de datos

**Doc Firestore `config/sheetsSync`:**
```
{
  spreadsheetId: string,
  spreadsheetUrl: string,
  ultimaSync: Timestamp | null,
  ultimaSyncPor: string (email),
  ultimaSyncResultado: { creados: number, actualizados: number } | null
}
```

**Campos nuevos en `events/{id}`** (solo en eventos sincronizados):
```
{
  // ... campos existentes ...
  sincronizadoDesdeGS: true,
  sincronizadoEn: Timestamp,
  cerrado: true
}
```

**`ActoCandidato`** (estructura interna en memoria al parsear):
```
{
  fecha: Date,                    // de columna FECHA
  nombre: string,                 // de columna ACTO (trim)
  precio: number,                 // de columna E (a repartir)
  precioTotal: number,            // de columna F (total)
  asistenciaPorColumna: {         // {nombreColumna: 'voy'} si hay X
    'Martín': 'voy',
    'Mónica': 'voy',
    ...
  },
  refuerzos: string[]             // nombres no vacíos de Refuerzo 1..5
}
```

### Mapeo GS → Firestore (por fila)

| Columna GS | Campo evento Firestore | Notas |
|---|---|---|
| FECHA | `fecha` (Timestamp) | Parseo `dd/mm/aaaa` (acepta `d/m/aaaa`) |
| ACTO | `nombre` | Trim |
| Columna E "€" (a repartir) | `precio` (number) | Si está vacío, `0` |
| Columna F "€" (total) | `precioTotal` (number) | Si está vacío, se usa `precio` |
| `Martín`…`Pablo C` (cols G–S) | `asistencia[uid] = 'voy'` | Resolución uid: ver siguiente sección |
| `Refuerzo 1`…`Refuerzo 5` | `refuerzos` (string[]) | Solo nombres no vacíos, en orden |
| ASISTENTES, €/PERSONA, BOTE, GASOLINA, OBSERVACIONES, COCHES | (ignorados) | La app los recalcula desde `precio` y `asistencia` |
| (nuevo) | `tipo` | Siempre `'actuacion'` |
| (nuevo) | `cerrado` | Siempre `true` |
| (nuevo) | `sincronizadoDesdeGS` | Siempre `true` |
| (nuevo) | `sincronizadoEn` | `serverTimestamp()` |

**Campos del evento que NO se tocan al actualizar:** `pagados`, `ubicacion`, `hora`, cualquier campo que no aparezca en la tabla de arriba.

### Resolución de columna GS → uid de usuario

Para cada nombre de columna GS de miembro:
1. Normalizar: minúsculas, sin tildes, sin espacios extra.
2. Buscar usuario con `claveHistorico` (normalizado) === nombre columna normalizado.
3. Si no, buscar usuario cuyo primer nombre (normalizado) === nombre columna normalizado.
4. Si encuentra → usar `user.id` como key en `asistencia`.
5. Si no encuentra → guardar el nombre de la columna en una lista `miembrosNoVinculados` que se muestra en el modal de vista previa. **No** se mete como refuerzo automáticamente para evitar contaminar datos.

### Matching acto GS ↔ acto Firestore

Para cada `ActoCandidato`:
1. Normalizar fecha al día (sin hora).
2. Normalizar nombre: minúsculas, sin tildes, sin espacios extra.
3. Buscar evento en Firestore donde `fecha` mismo día Y `nombreNormalizado === candidato.nombreNormalizado` Y `tipo === 'actuacion'`.
4. Si match → marcar para actualizar.
5. Si no match → marcar para crear.

Eventos en Firestore del mismo año/tipo que no aparezcan en GS → se listan como `soloEnApp` (informativo, no se tocan).

## Flujo de sincronización

1. Marta pulsa "Sincronizar 2026" en SheetsSyncPanel.
2. App pide token Google (popup si no hay token válido en memoria).
3. App lee la pestaña cuyo nombre coincida con el año seleccionado (ej: pestaña llamada `2026`). Asumimos que las pestañas se llaman exactamente con el año como string — a verificar en implementación.
   - Si la pestaña no existe → error: "No encuentro la pestaña '2026' en tu hoja".
4. App parsea filas (desde la primera fila con fecha, hasta la primera fila vacía).
5. App construye el diff comparando con eventos Firestore de 2026, tipo actuación.
6. App muestra `SheetsSyncPreviewModal` con:
   - Crear (N): lista de actos nuevos con fecha, nombre, precio.
   - Actualizar (N): lista con campos cambiados (precio antes→después, asistentes antes→después).
   - En la app pero no en la GS (N): lista informativa.
   - Avisos de miembros no vinculados (si los hay).
7. Marta pulsa "Confirmar sync".
8. App ejecuta batch de escrituras en Firestore.
9. App actualiza `config/sheetsSync.ultimaSync` y muestra toast: "Sincronizado: N actualizados, M creados".

## UI

### En Gestión (visible solo si `currentUser.email === 'marta.torres@quantia.es'`)

Bloque debajo de los filtros año/mes:

```
Sincronización Google Sheets
Hoja: CuentasCharanga · Pestaña: 2026
Última sync: hace 2 días (9 may 2026, 18:42)

[Configurar]   [Sincronizar 2026]
```

- Si no hay configuración → bloque muestra "No configurado" + botón "Configurar".
- El número de la pestaña en el botón viene del filtro de año seleccionado.

### Modal de vista previa

```
Vista previa de sincronización
Pestaña: 2026

Crear (2)
  - 31/01/2026  CUMPLEAÑOS FARMACIA  300€
  - 7/02/2026   SABADO EMBUTIDO       600€

Actualizar (3)
  - 8/02/2026  DOMINGO EMBUTIDO
      precio: 500€ -> 600€
      asistentes: 11 -> 13
  - 20/02/2026 RUA CARNAVAL
      asistentes: 10 -> 12

En la app pero no en la GS (1)
  - 25/04/2026 SAN MARCOS  (no se toca)

Avisos
  Miembros sin vincular: Mónica, Titi
  (configura su claveHistorico en Perfil)

[Cancelar]                [Confirmar sync]
```

Sin emoticonos. Indicadores con etiquetas de texto y badges de color sutil.

### Modal de configuración

```
Configurar Google Sheets
URL de la hoja:
[__________________________________________]
(pega la URL completa de tu CuentasCharanga)

[Cancelar]   [Guardar]
```

## Seguridad

- **Token OAuth:** vive solo en memoria del cliente. No se escribe en `localStorage` ni Firestore. Recargar la página obliga a re-autorizar.
- **Scope mínimo:** `https://www.googleapis.com/auth/spreadsheets.readonly`. La app físicamente no puede escribir en la GS.
- **Reglas Firestore** (a actualizar en `firestore.rules`):
  - `config/sheetsSync`: lectura para directores; escritura solo si `request.auth.token.email == 'marta.torres@quantia.es'`.
  - `events/{id}`: la regla actual de write para directores es suficiente (la sync escribe como Marta autenticada).
- **UI gating:** el bloque solo se renderiza para el email admin. Es UX, no seguridad real — la barrera son las reglas Firestore.

## Casos borde y errores

| Caso | Comportamiento |
|---|---|
| Fila GS sin fecha | Se ignora silenciosamente |
| Fila GS con fecha pero sin nombre ni precio ni asistentes | Se ignora silenciosamente |
| Fecha en formato no parseable | Se ignora, se añade a "filas con error" en el modal |
| Dos actos en GS con misma fecha + mismo nombre | Se considera el mismo, se actualiza una vez |
| Dos actos en GS con misma fecha + distinto nombre | Son distintos, se procesan ambos |
| Pestaña no existe | Error: "No encuentro la pestaña 'YYYY'" |
| Token denegado por Google | Error: "Permiso denegado, vuelve a autorizar" + botón "Reintentar" |
| URL de hoja inválida | Error en modal Configurar al guardar |
| Error de red | Toast: "Error de red, reintentar" |
| Sync sin cambios | Toast: "Ya está todo sincronizado" |
| Miembro sin vincular | Aparece en Avisos, su X no se aplica a nadie |

## Idempotencia

Sincronizar dos veces seguidas la misma pestaña sin cambios no produce escrituras. El paso de diff detecta que `aCrear` y `aActualizar` están vacíos y solo actualiza `config/sheetsSync.ultimaSync`.

## Rollback

No hay undo automático. Antes de la primera sync real en producción:
- Hacer export de Firestore manual desde Firebase Console (precaución).

Después: la GS sigue siendo la verdad. Cualquier corrección se hace en GS y se vuelve a sincronizar.

## Out of scope (futuras mejoras)

- Sincronización automática programada.
- Pestaña de ensayos.
- Reflejar gasolina, coches, observaciones en la app.
- Mapeo visual de columnas GS ↔ usuarios (si el matching por claveHistorico se queda corto).
- Histórico de syncs (solo guardamos la última).
