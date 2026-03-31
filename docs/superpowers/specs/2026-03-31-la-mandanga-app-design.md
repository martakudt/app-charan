# La Mandanga — App de Charanga v1

## Resumen

App web progresiva (PWA) para los 16 miembros de la Charanga La Mandanga. Permite gestionar partituras (enlaces a Google Drive), coordinar asistencia a eventos mediante votación, y administrar miembros con permisos granulares. Desplegada en Netlify con acceso directo desde el móvil.

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | React 18 + Vite |
| Backend/DB | Firebase (Auth, Firestore, Storage) |
| PWA | Service Worker + manifest.json |
| Despliegue | Netlify |
| Almacén PDFs | Google Drive (enlaces externos) |
| Almacén imágenes | Firebase Storage (fotos de eventos) |

## Paleta de colores

Extraída del logo de La Mandanga:

| Token | Hex | Uso |
|---|---|---|
| `--color-primary` | `#E91E7B` | Rosa fucsia — botones, tabs activos, FAB, acentos |
| `--color-primary-light` | `#FFF5F8` | Fondo general de la app |
| `--color-primary-hover` | `#D11A6E` | Hover/pressed en botones primarios |
| `--color-text` | `#1A1A1A` | Textos principales (negro del logo) |
| `--color-text-secondary` | `#666666` | Textos secundarios |
| `--color-surface` | `#FFFFFF` | Tarjetas y superficies elevadas |
| `--color-background` | `#FFF5F8` | Fondo general |
| `--color-border` | `#F0E0E8` | Bordes sutiles rosados |
| `--color-success` | `#22C55E` | Votación "Voy" |
| `--color-warning` | `#F59E0B` | Votación "No sé" |
| `--color-danger` | `#EF4444` | Votación "No voy", acciones destructivas |

## Navegación

Barra inferior fija con 3 tabs:

1. **Agenda** — icono calendario
2. **Partituras** — icono nota musical
3. **Perfil** — icono persona

Tab activo: icono y texto en rosa fucsia. Tab inactivo: gris.

No hay tab central con logo (3 tabs queda más limpio). El logo aparece en la pantalla de login como splash.

## Estructura de archivos

```
src/
  components/         Componentes reutilizables
    ui/               Button, Modal, TabBar, FAB, Card, EmptyState
    layout/           AppLayout, BottomNav
  pages/
    Login.jsx         Pantalla de login/registro
    PendingApproval.jsx  Cuenta pendiente
    Agenda.jsx        Listado de eventos
    EventDetail.jsx   Detalle + votación
    EventForm.jsx     Crear/editar evento
    Partituras.jsx    Listado de carpetas
    Carpeta.jsx       Partituras dentro de una carpeta
    Perfil.jsx        Info personal + admin panel
  services/
    firebase.js       Config e inicialización de Firebase
    auth.js           Login, registro, logout
    firestore.js      CRUD usuarios, eventos, partituras, carpetas
    storage.js        Upload de imágenes de eventos
  hooks/
    useAuth.js        Estado de autenticación + datos de usuario
    useEvents.js      CRUD y suscripción a eventos
    useScores.js      CRUD carpetas y partituras
    useUsers.js       Gestión de usuarios (admin)
  context/
    AuthContext.jsx    Proveedor de autenticación y permisos
  styles/
    variables.css     Tokens de color y tipografía
    global.css        Estilos base
  assets/
    logo.svg          Logo de La Mandanga (convertido de PDF)
```

## Sección 1: Autenticación

### Pantalla de Login

- Fondo `--color-primary-light`
- Logo de La Mandanga centrado y grande
- Campo email + campo contraseña
- Botón "Entrar" (rosa fucsia, texto blanco)
- Botón "Crear cuenta" (borde rosa, fondo blanco)
- Mensaje de error bajo los botones si falla

### Registro

- Mismos campos que login + nombre + instrumento (selector)
- Al registrarse: se crea usuario en Firebase Auth y documento en Firestore con `estado: "pendiente"`
- Redirige a pantalla de "Cuenta pendiente de aprobación"

### Pantalla pendiente

- Icono de reloj
- Mensaje: "Tu cuenta está esperando aprobación"
- Botón "Cerrar sesión"

### Flujo de autenticación

```
App init → ¿Hay sesión?
  No  → Pantalla Login
  Sí  → ¿Estado del usuario?
    "pendiente"  → Pantalla Pendiente
    "rechazado"  → Pantalla Rechazado + Cerrar sesión
    "aprobado"   → App principal (Agenda/Partituras/Perfil)
```

## Sección 2: Sistema de permisos

### Modelo de datos — Usuario

```
users/{uid}
  email: string
  nombre: string
  instrumento: string
  estado: "pendiente" | "aprobado" | "rechazado"
  rol: "admin" | "miembro"
  permisos: {
    partituras: boolean    // puede crear carpetas y añadir enlaces
    calendario: boolean    // puede crear y editar eventos
  }
  fechaRegistro: timestamp
```

### Roles

- **Admin**: control total. Gestiona usuarios, permisos, y tiene acceso a todo. Se configura manualmente en Firestore la primera vez (el primer usuario).
- **Miembro**: puede ver todo, votar asistencia, editar su perfil. Solo puede gestionar partituras/calendario si el admin le activa esos permisos.

### Reglas de Firestore

- Lectura: solo usuarios autenticados con `estado: "aprobado"`
- Escritura en eventos: solo usuarios con `permisos.calendario: true` o `rol: "admin"`
- Escritura en carpetas/partituras: solo usuarios con `permisos.partituras: true` o `rol: "admin"`
- Escritura en asistencia: cualquier usuario aprobado puede votar en cualquier evento
- Escritura en users: solo admin puede cambiar estado, rol y permisos

## Sección 3: Partituras

### Vista de carpetas

- Listado de tarjetas blancas redondeadas
- Cada tarjeta: icono de carpeta rosa + nombre + contador de partituras "(5)"
- Buscador arriba para filtrar carpetas por nombre
- Ordenadas por campo `orden` (configurable)
- FAB rosa "+" visible solo si el usuario tiene permiso de partituras

### Vista de carpeta individual

- Header con nombre de la carpeta + botón atrás
- Listado de partituras como filas: icono PDF + nombre de la pieza
- Al tocar una partitura: `window.open(urlDrive, '_blank')` — abre el PDF en el navegador/visor del móvil
- FAB "+" para añadir partitura (solo con permiso)

### Formulario de añadir partitura

- Campo: nombre de la pieza
- Campo: URL de Google Drive (pegar enlace)
- Selector: carpeta destino
- Botón "Guardar"

### Formulario de añadir carpeta

- Campo: nombre de la carpeta
- Botón "Crear"

### Acciones de gestión (solo con permiso)

- Eliminar partitura (con confirmación "¿Seguro?")
- Eliminar carpeta (con confirmación, solo si está vacía)

### Modelo de datos

```
carpetas/{carpetaId}
  nombre: string
  orden: number
  creadoPor: string (uid)

partituras/{partituraId}
  nombre: string
  carpetaId: string
  urlDrive: string
  creadoPor: string (uid)
```

## Sección 4: Agenda

### Vista principal

- Dos pestañas: **"Próximos"** (defecto) / **"Anteriores"**
- Filtros tipo chip: Todos | Actuaciones | Ensayos | Otros
- Próximos: ordenados por fecha ascendente (el más cercano primero)
- Anteriores: ordenados por fecha descendente (el más reciente primero)

### Tarjeta de evento

- Franja lateral de color según tipo:
  - Actuación: rosa `#E91E7B`
  - Ensayo: gris `#666666`
  - Otro: amarillo `#F59E0B`
- Imagen banner arriba si tiene foto (si no, no se muestra)
- Nombre del evento (negrita)
- Fecha y hora
- Ubicación
- Recuento rápido: "8 Voy · 3 No · 5 NS"

### Detalle del evento

- Toda la info del evento expandida
- Foto grande si existe
- Tres botones de votación:
  - "Voy" (verde `#22C55E`)
  - "No sé" (amarillo `#F59E0B`)
  - "No voy" (rojo `#EF4444`)
- Tu voto actual aparece resaltado (borde más grueso + relleno)
- Lista de asistencia agrupada por respuesta:
  - Voy: nombre + instrumento de cada uno
  - No sé: nombre + instrumento
  - No voy: nombre + instrumento
- Esto permite ver de un vistazo qué instrumentos faltan

### Formulario de evento (solo con permiso calendario)

- Nombre del evento
- Tipo: selector (Actuación / Ensayo / Otro)
- Fecha y hora (date picker + time picker)
- Ubicación (texto libre)
- Descripción (textarea, opcional)
- Foto (upload desde galería/cámara, opcional) — se sube a Firebase Storage
- Botones: "Guardar" / "Cancelar"
- Si es edición: botón "Eliminar evento" (rojo, con confirmación)

### Modelo de datos

```
eventos/{eventoId}
  nombre: string
  tipo: "actuacion" | "ensayo" | "otro"
  fecha: timestamp
  ubicacion: string
  descripcion: string
  imagenUrl: string (URL de Firebase Storage, vacío si no hay)
  creadoPor: string (uid)
  asistencia: {
    [uid]: "voy" | "no" | "nose"
  }
```

La asistencia como mapa dentro del documento es la opción correcta para 16 personas: sin subcolecciones innecesarias, una sola lectura trae todo.

## Sección 5: Perfil

### Vista del perfil

- Nombre grande
- Instrumento con icono
- "En La Mandanga desde [fecha formateada]"
- Botón "Editar perfil" → modal para cambiar nombre e instrumento
- Botón "Cerrar sesión" (gris, abajo)

### Panel de administración (solo admin)

Sección visible debajo del perfil cuando `rol === "admin"`:

**Bloque 1 — Solicitudes pendientes:**
- Lista de usuarios con `estado: "pendiente"`
- Cada uno muestra: nombre + email + instrumento
- Botones: "Aprobar" (verde) / "Rechazar" (rojo)

**Bloque 2 — Gestión de miembros:**
- Lista de usuarios aprobados
- Cada miembro muestra: nombre + instrumento
- Toggle: "Puede gestionar partituras" (on/off)
- Toggle: "Puede gestionar calendario" (on/off)
- Contador: "X/16 miembros activos"

## PWA

- `manifest.json` con nombre "La Mandanga", colores del tema rosa, icono del logo
- Service Worker para caché de assets estáticos
- Meta tags para iOS (apple-mobile-web-app-capable, status-bar-style)
- Orientación: portrait

## Fuera de alcance (v2)

- Tablón de avisos / noticias
- Notificaciones push
- Foto de perfil
- Insignias y estadísticas de asistencia
- Chat grupal
- Tab central con logo (si se añaden más secciones)
