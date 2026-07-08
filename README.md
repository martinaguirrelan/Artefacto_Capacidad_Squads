# Capacidad · Squads Ágiles

Aplicación en **Google Apps Script** para planificar la **capacidad real** de un Squad Ágil por sprint. Los datos viven en **Google Sheets** y la interfaz es una **Web App** (HtmlService).

La capacidad de un Team Member ya no es "10 días": a partir de las horas brutas del sprint se descuentan las **ceremonias ágiles** (daily, planning, refinement, review, retro), las **vacaciones**, los **cursos**, los **eventos trimestrales** y las **sesiones de Chapter**. El resultado es la **capacidad neta** disponible del squad.

## Módulos (pestañas)

- **Dashboard** — Selector de squad + sprint. Tarjetas de capacidad neta, disponibilidad %, bruta, ceremonias, ausencias y nº de miembros. Barra por miembro con la composición neto vs. reducciones, y timeline de ausencias del trimestre.
- **Squads** — Alta/edición de squads: horas/día y días de sprint por defecto.
- **Equipo & ceremonias** — Miembros del squad (con override de horas/día y % de dedicación) y catálogo editable de ceremonias del squad.
- **Sprints** — Sprints por squad con rango de fechas, trimestre y estado.
- **Ausencias** — Registro de vacaciones, cursos, eventos y sesiones de chapter por miembro (por rango de días completos o por horas puntuales).
- **Ajustes** — Feriados (con carga rápida de los feriados fijos de Perú) y usuarios (admin/editor/viewer).

## Modelo de cálculo (en horas, por miembro y sprint)

```
bruto      = díasHábiles(sprint) × horas/día × dedicación%
ceremonias = Σ(duración × ocurrencias del squad) × dedicación%
ausencias  = Σ horas de ausencias que caen dentro del sprint
neto       = max(0, bruto − ceremonias − ausencias)
disponibilidad % = neto / bruto
```

- **Días hábiles**: lun–vie del rango del sprint, excluyendo los **feriados** registrados.
- **Ausencias por día completo**: consumen `díasHábiles(intersección con el sprint) × horas/día`.
- **Ausencias por horas**: consumen una cantidad fija de horas, atribuida al sprint que contiene su fecha de inicio.

La capacidad del squad es la suma de la de sus miembros activos.

## Modelo de datos (hojas)

| Hoja | Campos |
|------|--------|
| `Squads` | id, nombre, gerencia, horasDia, diasSprint, descripcion, creadoEn |
| `Miembros` | id, squadId, nombre, email, rol, horasDia, factorFocus, activo, creadoEn |
| `Ceremonias` | id, squadId, nombre, duracionHoras, ocurrencias, activo |
| `Sprints` | id, squadId, nombre, trimestre, fechaInicio, fechaFin, estado |
| `Ausencias` | id, miembroId, tipo, fechaInicio, fechaFin, diaCompleto, horas, descripcion, creadoEn |
| `Feriados` | id, fecha, descripcion |
| `Usuarios` | email, rol, squadId |

## Estructura del proyecto

```
appsscript.json     Manifiesto (scopes, runtime V8, web app, zona Lima)
Code.gs             doGet, menú onOpen, include(), usuario actual
Database.gs         Capa de acceso a Sheets (CRUD genérico + esquema)
Fechas.gs           Utilidades de fechas y días hábiles
Squads.gs           Catálogo de squads
Miembros.gs         Team members (override horas/día, dedicación)
Ceremonias.gs       Ceremonias por squad (+ defaults de sprint de 2 semanas)
Sprints.gs          Sprints por squad
Ausencias.gs        Vacaciones / cursos / eventos / chapter
Feriados.gs         Feriados (+ carga de Perú)
Capacidad.gs        Motor de cálculo y agregaciones del dashboard
Usuarios.gs         Control de acceso ligero
Seed.gs             Datos de ejemplo
Index.html          Estructura de la interfaz (pestañas)
Stylesheet.html     Estilos
JavaScript.html     Lógica de cliente (google.script.run)
```

## Despliegue

### Opción A — Editor de Apps Script (rápido)
1. Crea un Google Sheets nuevo → **Extensiones → Apps Script**.
2. Copia el contenido de cada archivo `.gs` y `.html` a un archivo del mismo nombre en el editor (los `.html` como archivos HTML).
3. Pega `appsscript.json` en el manifiesto (activa "Mostrar archivo de manifiesto" en Configuración del proyecto).
4. Ejecuta `setupSpreadsheet` una vez para crear las hojas.
5. **Implementar → Nueva implementación → Aplicación web**.

### Opción B — clasp (desde este repo)
```bash
npm install -g @google/clasp
clasp login
clasp create --type sheets --title "Capacidad Squads Agile" --rootDir .
clasp push
clasp deploy
```
`.clasp.json` queda ignorado por git (contiene tu scriptId).

## Uso

- Desde el Spreadsheet: menú **Capacidad Squads → Abrir panel** (sidebar), **Inicializar hojas**, **Cargar datos de ejemplo** o **Cargar feriados Perú**.
- Como Web App: abre la URL de la implementación.
