# Estrategia y enfoque — Excelso Pulse

Este documento fija **cómo pensamos el producto** (proyecto libre y abierto, autoalojado) y **en qué orden conviene avanzar**. No sustituye la documentación técnica de API ni el contrato JSON detallado; sirve para alinear a quien despliegue, contribuya o integre voz.

---

## Seguimiento de avance

**Cómo usar esta lista:** al completar un ítem, edita este archivo y cambia `- [ ]` por `- [x]`. En commits puedes referenciar el ítem por el texto del checkbox.

### Fase 1 — Contrato y paquete NPM (`npm/`)

- [x] README del paquete: tabla `pulse_version`, campos obligatorios vs opcionales, ejemplo JSON mínimo.
- [x] Documentar auth soportada (p. ej. Bearer y/o cabecera de monitorización) y qué valida antes de los probes.
- [x] Inyección de probes y secreto(s) documentada como API estable (sin “magia” no descrita).
- [x] Privacidad: texto explícito sobre el probe por defecto (Mongo) y cómo sustituirlo o desactivarlo.
- [ ] Normalización estricta del payload de salida (si aplica) + política de semver / CHANGELOG. *(SemVer + `CHANGELOG.md` listos; falta normalizador runtime explícito si se exige.)*

### Fase 2 — Hub: fulfillment y agregación (`web-app/`)

- [x] Endpoint versionado de fulfillment (p. ej. bajo `/api/v1/...`) con auth acordada (secreto de instancia / token documentado).
- [x] Validación del cuerpo esperado de Dialogflow (o la variante ES/CX que elijamos) y respuestas de error controladas. *(Implementado Dialogflow ES; CX pendiente si se requiere.)*
- [x] Reutilizar agregación existente; paralelismo acotado y timeouts por backend revisados para latencia de voz.
- [x] Caché corta configurable (30–60 s) para el informe global o la rama de voz, documentada en `.env.example` / docs.

### Fase 3 — Voz (texto y adaptador)

- [x] Contrato interno “listo para voz” (resumen + lista breve de apps por severidad) sin datos sensibles.
- [x] Generación de texto por reglas (sin LLM obligatorio en v1).
- [x] Adaptador delgado hacia el formato de fulfillment de Dialogflow (si difiere del contrato interno).

### Fase 4 — Gateway Google / operación

- [x] Checklist mínimo en docs: consola Dialogflow, URL del webhook, cabecera de auth, prueba en simulador.
- [ ] Validar en dispositivo (Google Home / asistente) cuando el webhook esté estable. *(Requiere prueba manual con hardware/cuenta Google.)*
- [x] Variables de entorno y secretos documentados para despliegue (Vercel / VPS).

### Barra de calidad (antes de publicar npm / “release voz”)

- [ ] Aislamiento de fallos: un backend caído no tumba el informe completo; mensaje claro por app.
- [ ] Tests en paquete (auth, timeouts, payload) donde tenga sentido.
- [x] Enlace desde README raíz / web a este documento y a docs técnicas del contrato. *(README raíz EN/ES enlaza aquí; contrato detallado del pulse en `web-app/docs` y `npm/README`.)*

---

## Principios

1. **No es un SaaS.** No asumimos onboarding masivo, ni consolas obligatorias para el valor principal. El “usuario foco” puede leer el README, desplegar su instancia y tolerar **pasos mínimos** para integraciones opcionales (por ejemplo Google).
2. **Multiusuario = usuarios de la instancia.** Varios usuarios en la misma base de datos y despliegue es normal; no implica “plataforma global multiinquilino” ni obligatoriedad de OAuth con Google para cada persona.
3. **La voz es opcional.** El núcleo sigue siendo registro de orígenes, agregación de pulse y panel. El asistente es una **capa de salida** que consume el mismo cerebro.
4. **Separar responsabilidades.** El paquete NPM no conoce Google. El hub Next no duplica la lógica de probes que ya vive en backends. El gateway (Dialogflow) solo orquesta entrada/salida de voz si alguien lo configura.

---

## Tres piezas (mentalidad arquitectónica)

### A. Proveedor — paquete NPM (Express)

**Rol:** middleware “enchufable” que expone el contrato de pulse en el backend del producto.

**Enfoque recomendado:**

- **Configuración por inyección:** probes y secreto(s) al inicializar; sin magia oculta.
- **Contrato claro y versionado:** documentar explícitamente `pulse_version` y qué familias de campos son obligatorias u opcionales (por ejemplo estado, métricas, contexto, texto para IA, infraestructura si aplica). Si hace falta endurecer el JSON, hacerlo con normalización explícita y cambio de versión mayor cuando rompa compatibilidad.
- **Seguridad en capas:** validar credencial de monitorización **antes** de ejecutar lógica pesada de probes. Para no romper el ecosistema existente (Bearer hacia backends), lo razonable es **soportar variantes documentadas** (por ejemplo Bearer y/o cabecera dedicada), con una tabla en README que diga qué usa el agregador por defecto.
- **Privacidad por defecto:** los probes deben limitarse a **estado operativo** (latencia, conectividad, salud del servicio), no volcar datos sensibles de base de datos ni PII en el JSON público del pulse.

### B. Cerebro — hub Next.js (agregador + voz)

**Rol:** punto de entrada único para la web y, si se configura, para el webhook de voz; reutiliza la agregación ya existente.

**Enfoque recomendado:**

- **Un endpoint dedicado a fulfillment** (ruta estable, versionada si quieres, por ejemplo bajo `/api/v1/...`) que Dialogflow pueda llamar. No mezclar responsabilidades con rutas de sesión del panel sin necesidad.
- **Respuesta en dos niveles (conceptual):**
  - **Contrato interno “listo para voz”:** resumen corto, lista breve de apps con estado, sin datos sensibles; pensado para convertirse en texto hablado.
  - **Adaptador delgado hacia Dialogflow:** si Google exige un formato concreto, que sea una capa mínima que envuelva el contrato interno, no el único formato del proyecto.
- **Agregación en paralelo con límites:** paralelismo acotado, timeouts por backend y manejo de fallos para no superar la ventana de latencia típica de voz y no tumbar instancias débiles.
- **Caché corta y agresiva (30–60 s):** opcional y configurable; útil para no martillar backends y para respuestas repetidas del asistente, documentando que los datos pueden tener ese desfase máximo.

### C. Gateway — Asistente de Google / Dialogflow

**Rol:** opcional; quien despliegue puede conectar su propio proyecto de Dialogflow al webhook de su instancia.

**Enfoque recomendado:**

- **Intención simple** (“estado de mis apps”, “reporte Excelso”, etc.) enlazada al webhook.
- **Autenticación alineada con OSS:** en lugar de exigir “account linking” tipo producto cerrado en la primera versión, priorizar **secretos de instancia y/o tokens revocables** documentados en el README (cabeceras permitidas por el proveedor, o alternativas claras si no las hay). Si más adelante se quiere UX “cero pegado”, se puede sumar vinculación de cuentas como mejora, no como requisito inicial.
- **Documentación mínima reproducible:** checklist corto (consola, URL del webhook, cabecera de auth, prueba con simulador) para quien ya se animó a desplegar el hub.

---

## Estrategia de fases (orden recomendado)

1. **Contrato y documentación del paquete NPM** — qué es obligatorio, qué es opcional, `pulse_version`, privacidad de probes, auth soportada. Esto reduce refactors en cadena.
2. **Hub: endpoint de fulfillment “delgado”** — autenticación acordada, validación del payload de Dialogflow, respuesta estable; en primera iteración puede apoyarse en la agregación ya existente más caché.
3. **Texto para voz por reglas** — priorizar apps por severidad, frases cortas; evitar depender de un LLM en la primera entrega de voz (latencia y coste).
4. **Integración Google** — simulador, luego dispositivo; ajustar solo el adaptador si el formato de fulfillment lo exige.
5. **Endurecimiento del paquete** — normalización estricta, tests, semver; publicación npm cuando el contrato y el CHANGELOG estén alineados.

---

## Calidad antes de “publicar en NPM”

- **Aislamiento de fallos:** si un backend no responde, el agregador y la respuesta de voz deben poder decir, en lenguaje natural, que una app concreta no está disponible sin tumbar el resto del informe.
- **Documentación del contrato:** README del paquete explícito sobre versión y campos; ejemplos JSON mínimo y representativo (como anexos en docs, no como única fuente de verdad dispersa).
- **Privacidad:** dejar escrito qué hace el probe por defecto y cómo desactivarlo o sustituirlo.

---

## Decisiones explícitas que conviene no dejar ambiguas

| Tema | Enfoque recomendado |
|------|---------------------|
| ¿El paquete conoce Google? | No. |
| ¿El JSON del hub para voz es el JSON crudo de Dialogflow? | Preferible: **contrato interno** + adaptador mínimo si hace falta. |
| ¿OAuth con Google para cada usuario en v1? | No como requisito; opcional más adelante si el proyecto madura en esa dirección. |
| ¿Quién configura Dialogflow? | Normalmente el **dueño del despliegue** (pasos mínimos en README). |

---

## Cierre

Este enfoque prioriza **reproducibilidad, documentación y simplicidad operativa** propias del software libre autoalojado, dejando la voz como **capa opcional** bien acotada y el paquete NPM como **contrato estable** para la comunidad. Los cambios que rompan contrato deben ir acompañados de **versión mayor** y notas de migración claras.

Para el detalle de variables de entorno, despliegue en Vercel u otros hosts, y el contrato JSON campo a campo, seguirán existiendo documentos técnicos dedicados enlazados desde el README principal del repositorio.
