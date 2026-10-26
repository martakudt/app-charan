# La Mandanga 🎺

App web (PWA) para la gestión interna de la **Charanga La Mandanga**: agenda de actos, partituras, miembros y cuentas.

Hecha con React + Vite, con Firebase (Auth, Firestore, Storage) como backend y desplegada en Netlify.

> **Proyecto personal.** Esta app está hecha a medida para mi charanga y la usamos solo sus miembros: el registro requiere aprobación de un administrador. El código es público como portfolio y por si sirve de referencia, pero no es un producto genérico ni está pensada para que otros grupos la usen tal cual. Si quieres adaptarla a tu grupo, necesitarás tu propio proyecto de Firebase (ver [FIREBASE_SETUP.md](FIREBASE_SETUP.md)).

## Funcionalidades

- **Agenda**: crear, editar, cerrar y reabrir actos (actuaciones, ensayos…), con imagen, ubicación y asistencia de los miembros.
- **Partituras**: carpetas y partituras, con enlaces a carpetas de Google Drive.
- **Perfil**: datos del miembro (nombre, instrumento) y, para administradores, aprobación de nuevos miembros y gestión de permisos.
- **Gestión**: resumen económico de los actos y reparto entre miembros.
- **Sincronización con Google Sheets** (solo owner): importa los actos desde la hoja de cuentas de la charanga, con vista previa antes de confirmar.
- **Registro con aprobación**: los usuarios nuevos quedan en estado `pendiente` hasta que un admin los aprueba.
- **Instalable como app** en el móvil (PWA).

## Stack

| Parte | Tecnología |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 8 |
| Backend | Firebase Authentication, Cloud Firestore, Cloud Storage |
| APIs de Google | Drive API (listado de partituras), Sheets API + Google Identity Services (sincronización) |
| Tests | Vitest |
| Despliegue | Netlify |

## Puesta en marcha

Requisitos: Node.js 20+ y npm.

```bash
git clone <url-del-repo>
cd app-charan
npm install
cp .env.example .env   # y rellena los valores
npm run dev
```

La app queda disponible en `http://localhost:5173`.

### Variables de entorno

Todas se definen en `.env` (no se sube a git) y en Netlify → *Site settings → Environment variables*.

| Variable | Para qué sirve |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Configuración del proyecto Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | 〃 |
| `VITE_FIREBASE_PROJECT_ID` | 〃 |
| `VITE_FIREBASE_STORAGE_BUCKET` | 〃 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | 〃 |
| `VITE_FIREBASE_APP_ID` | 〃 |
| `VITE_GOOGLE_DRIVE_API_KEY` | Leer las carpetas de partituras en Google Drive |
| `VITE_DRIVE_ROOT_FOLDER_ID` | ID de la carpeta raíz de partituras en Drive (compartida como "cualquiera con el enlace: lector") |
| `VITE_GOOGLE_OAUTH_CLIENT_ID` | Sincronización con Google Sheets (solo owner) |

> Las variables `VITE_*` se incluyen en el código que se envía al navegador, así que **no son secretas**. La seguridad depende de las reglas de Firestore/Storage y de restringir las claves en Google Cloud Console (por dominio y por API).

La guía paso a paso para crear el proyecto de Firebase y las credenciales de Google está en [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm run lint` | ESLint |
| `npm test` | Tests con Vitest |
| `npm run test:watch` | Tests en modo watch |

## Estructura

```
src/
├── components/
│   ├── gestion/     # Sincronización con Google Sheets
│   ├── layout/      # Layout y navegación inferior
│   └── ui/          # Botones, tarjetas, modales…
├── context/         # AuthContext (usuario y datos de perfil)
├── hooks/           # useEvents, useScores, useUsers
├── pages/           # Agenda, Partituras, Perfil, Gestión, Login…
├── services/        # Firebase, Firestore, Drive, Sheets, auth
└── styles/          # Variables y estilos globales
firestore.rules      # Reglas de seguridad de Firestore
docs/                # Specs y planes de diseño
```

## Roles y permisos

- **pendiente**: recién registrado, solo ve la pantalla de espera.
- **miembro aprobado**: puede ver la agenda y las partituras y marcar asistencia.
- **permisos** `calendario` / `partituras`: dejan crear y borrar actos o gestionar partituras.
- **admin**: aprueba usuarios y asigna permisos.
- **owner**: puede configurar y lanzar la sincronización con Google Sheets.

El primer admin se asigna a mano desde la consola de Firestore (ver [FIREBASE_SETUP.md](FIREBASE_SETUP.md#6-set-yourself-as-admin)).

## Despliegue

Netlify usa [netlify.toml](netlify.toml): ejecuta `npm run build`, publica `dist/` y redirige todas las rutas a `index.html` para que funcione React Router.

Las reglas de Firestore **no se despliegan solas**: cada vez que cambie [firestore.rules](firestore.rules), hay que pegarlas en Firebase Console → Firestore → Rules → *Publish*.
