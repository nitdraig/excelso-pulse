# Estrategia de voz: Hub (Next.js) y ecosistema asistente

Este documento fija **de forma definitiva** el diseño acordado entre producto y técnica para integraciones de voz en **Excelso Pulse** (open source, autoalojado). Complementa guías operativas concretas enlazadas al final.

---

## 1. Objetivo

Permitir que un usuario obtenga **un resumen hablable** del estado agregado de sus aplicaciones (p. ej. Fuddy, JEMA, Skipy) sin obligar a OAuth corporativo, certificación Smart Home ni dependencias de pago tipo IFTTT. El **Hub** centraliza agregación, autenticación de voz y el texto final para TTS.

---

## 2. Principio de arquitectura: contrato en el NPM, inteligencia en el Hub

| Capa                                           | Rol                                                                                                                                                                                                                                                      |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backends / paquete `excelso-pulse-express`** | Exponen datos estructurados en `GET /internal/pulse` (`pulse_version`, `status`, `context`, métricas, etc.). No implementan reglas de presentación para altavoces.                                                                                       |
| **Hub (Next.js)**                              | Valida el token de voz, ejecuta la agregación en paralelo, aplica **sanitización** y **truncado** para TTS, opcionalmente `lang`, caché acotada, y devuelve el JSON que espera cada canal (Dialogflow, rutina HTTP, Google Home Scripting Editor, etc.). |

**Motivos:** si cambian límites de TTS o de Google, se actualiza **un lugar** en el Hub; los usuarios no tienen que subir versiones del NPM en todos los backends solo por reglas de “cómo suena” en el altavoz.

---

## 3. Seguridad y alcance del token de voz

- **Token dedicado por usuario** (hash en base de datos vía `VoiceIntegration`; el valor en claro solo al crear/rotar). Ver [`web-app/docs/voice-fulfillment.md`](../web-app/docs/voice-fulfillment.md).
- **Aislamiento por ruta y credencial**: el token de voz solo debe usarse contra rutas **`/api/v1/voice/*`** (y equivalentes documentados). No sustituye la sesión web ni APIs de escritura de cuenta.
- **No** imponer como requisito inicial un sistema de **scopes OAuth2** completo: añade fricción innecesaria para self-hosting. La seguridad práctica es: token largo, rotación/revocación en UI, rate limiting en el Hub y documentación clara de que el token **puede quedar embebido** en scripts (Dialogflow, Home Assistant, Google Home).
- **Riesgo residual**: token en URL de GET o pegado en YAML expone el secreto a logs, historiales y proveedores intermedios. Mitigación: documentar, evitar loguear query strings, preferir cabecera cuando el cliente lo permita, y **revocación inmediata** desde el panel.

---

## 4. Canales de integración

| Canal                                         | Estado de referencia                              | Notas                                                                                                                                                                                                                                                              |
| --------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Webhook Dialogflow ES**                     | Implementado: `POST /api/v1/voice/fulfillment`    | Formato `queryResult` / `fulfillmentText`. Integración nativa Assistant ↔ Dialogflow en declive; útil para pruebas y proxies.                                                                                                                                      |
| **Home Assistant**                            | Documentado en [`operativo-4.md`](operativo-4.md) | Puente recomendado hoy: `rest_command` + TTS en altavoz.                                                                                                                                                                                                           |
| **Google Home Scripting Editor** (HTTP + voz) | Diseño / validación en hardware                   | Objetivo: respuesta JSON **mínima** (`status`, `message`, metadatos de contrato) consumible por `network.make_request` (o equivalente vigente). **La Fase 1 es bloqueante:** confirmar en dispositivo real timeouts, método HTTP permitido y esquema YAML oficial. |
| **JSON simplificado “reporte voz”**           | **Implementado:** `POST /api/v1/voice/report`     | Misma autenticación que fulfillment; cuerpo opcional `{ "lang": "es" \| "en" }`. Respuesta incluye `pulse_contract`, `message` (TTS-ready), `report` estructurado y `meta` (tiempos, caché, truncado). **No** pongas el token en query string.                     |

---

## 5. Roadmap de prioridades

| Prioridad   | Entrega                                                                                    | Justificación                                                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Crítica** | Validación **Fase 1 en hardware** (Google Home / red saliente)                             | Si la automatización no puede llamar al Hub de forma fiable o los timeouts son agresivos, el diseño del canal debe pivotar antes de invertir en UI “copiar script”.                                         |
| **Alta**    | Endpoint de reporte de voz + **pipeline**: agregación → sanitización TTS → truncado → JSON | Valor mínimo reusable por Scripting Editor, HA o herramientas externas.                                                                                                                                     |
| **Media**   | **`pulse_version` (o `pulse_contract`)** en la respuesta de voz                            | **Implementado** en fulfillment y report (`voice-fulfillment-v1` / `voice-report-v1`). Pendiente: tabla de compatibilidad en README self-host (ver §11).                                                    |
| **Media**   | **`last_voice_at`** (o nombre equivalente) en el modelo de integración de voz              | Feedback al usuario de que la configuración **sí llegó al servidor** (trazabilidad y confianza).                                                                                                            |
| **Media**   | Parámetro **`lang`** resuelto en el Hub                                                    | Datos estructurados desde apps en un idioma neutral o principal; plantillas (y, en fase avanzada, traducción) en el Hub. **No** exigir que cada backend duplique narrativa en varios idiomas solo para voz. |
| **Baja**    | “Delight” vía luces (verde/amarillo según estado)                                          | Solo tras core estable y si el editor de automatizaciones lo soporta de forma mantenible.                                                                                                                   |

---

## 6. Comportamiento del Hub (voz)

### 6.1 Agregación y caché

- Reutilizar el mismo agregador que el panel, con opciones de voz (timeouts y caché acotados). Hoy la rama voz usa caché dedicada; TTL configurable con **`VOICE_PULSE_CACHE_TTL_MS`** (por defecto del orden de **45 s**; `0` = sin caché). Objetivo: reducir riesgo de **timeout** en el cliente (Google Home, HA) sin esconder estados críticos sin documentar: el usuario debe saber que el hablado puede ir **ligeramente desfasado** respecto al panel en vivo.

### 6.2 Sanitización y truncado (TTS)

- **Sanitización**: eliminar o normalizar caracteres que el TTS lee mal (markdown, guiones bajos raros, asteriscos, almohadillas, etc.) **en el Hub**, después de construir el mensaje y antes de responder.
- **Truncado**: aplicar un **tope de caracteres** configurable (**`VOICE_TTS_MAX_CHARS`**, por defecto ~720; `≤0` = sin tope) con criterio predecible (p. ej. última frase completa + elipsis). Aplica a fulfillment Dialogflow y al campo `message` del reporte JSON.
- **Límite de Google**: el Hub garantiza un tope **en servidor**; Google u otros altavoces pueden imponer límites adicionales no estables en documentación. Eso debe constar en README de despliegue y en ayuda in-app.

### 6.3 Documentación para quien extiende el Hub

Quien añade proyectos al portfolio debe orientar los textos que alimentan el resumen a **frases cortas y factuales** (p. ej. una línea de estado + un detalle). El Hub concatena varias apps: bloques largos empeoran TTS y latencia. No se exige que el NPM “corte” por cuenta propia si el Hub ya trunca.

---

## 7. Matriz de riesgos (resumen)

| Riesgo                                        | Impacto | Mitigación                                                                                                   |
| --------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| Timeout del cliente (Google / HA)             | Alto    | Caché de agregación en rama voz, timeouts acotados en fetch a orígenes, mensajes breves.                     |
| Filtración o robo del token                   | Crítico | Token solo en rutas de voz, rotación/revocación, no registrar token en logs, documentar riesgo de URL/query. |
| TTS ilegible o cortado                        | Medio   | Sanitización + truncado en Hub; documentar límites y responsabilidad por app.                                |
| Cambio de API de Google (scripting / rutinas) | Medio   | Fase 1 en hardware; contrato versionado (`pulse_version` / `pulse_contract`).                                |

---

## 8. Experiencia de producto (post-core)

- **Botón “Copiar script”** (p. ej. para Google Home): plantilla con placeholders `BASE_URL` y `TOKEN`, instrucciones breves y enlace a la consola [Google Home](https://home.google.com/).
- **Última consulta de voz** en el panel: refuerzo de que la integración funciona sin depender de probar el micrófono cada vez.

---

## 9. Documentación relacionada

- [`web-app/docs/voice-fulfillment.md`](../web-app/docs/voice-fulfillment.md) — Autenticación, cuerpo Dialogflow, variables de entorno de la rama voz.
- [`web-app/docs/deploy-voice-vercel.md`](../web-app/docs/deploy-voice-vercel.md) — Despliegue y secretos (Vercel/VPS).
- [`docs/operativo-4.md`](operativo-4.md) — Checklist operativo, Dialogflow y bridge **Home Assistant**.
- [`web-app/docs/pulse-aggregator.md`](../web-app/docs/pulse-aggregator.md) — Agregador, rate limits y caché general.
- [`npm/README.es.md`](../npm/README.es.md) — Contrato `GET /internal/pulse` en backends de producto.

---

## 10. Criterio de cierre

La funcionalidad de voz en Pulse se considera **alineada con esta estrategia** cuando:

1. Toda narrativa hablable pasa por el **mismo pipeline** del Hub (o queda explícitamente excluida y documentada).
2. Los tokens de voz **no** habilitan operaciones fuera del alcance acordado de lectura/agregación.
3. Existe **evidencia de Fase 1** (o decisión documentada de aplazamiento) para el canal Google Home que se prometa al usuario.
4. README / ayuda in-app describen **límites TTS**, caché y riesgos del token de forma que un self-hoster pueda operar sin sorpresas.

---

_Última actualización del diseño: documento vivo; los enlaces a rutas HTTP reflejan la implementación vigente en el repositorio._

---

## 11. TODO — estado de implementación (repo)

Seguimiento ejecutable: lo que **ya está en código**, lo **parcial** y lo que **aún no entró** respecto a esta estrategia. Actualizar esta sección al cerrar tareas.

### Listo en `web-app`

- [x] Webhook **Dialogflow ES**: `POST /api/v1/voice/fulfillment` (auth token por usuario + fallback legacy; rate limit por usuario).
- [x] **Reporte JSON** para scripts: `POST /api/v1/voice/report` (`pulse_contract`: `voice-report-v1`, `pulse_version`: `1`, `message` + `report` + `meta`).
- [x] Respuesta fulfillment con **`pulse_contract` / `pulse_version`** en el JSON (contrato `voice-fulfillment-v1`) para quien lea el cuerpo fuera del texto hablado.
- [x] Rama voz del agregador: caché **`VOICE_PULSE_CACHE_TTL_MS`**, timeouts **`VOICE_PULSE_*`**, documentado en docs del Hub.
- [x] **Sanitización + truncado TTS** en servidor (`VOICE_TTS_MAX_CHARS`), aplicado a fulfillment y al `message` del reporte.
- [x] **`lastUsedAt`** en modelo de integración de voz + lectura en UI de cuenta (equivalente operativo a “última consulta” en servidor).
- [x] Resolución de identidad de voz centralizada en `lib/voice/resolve-voice-identity.ts` (reutilizable por nuevos endpoints bajo `/api/v1/voice/*`).
- [x] **UI Cuenta:** botón que copia al portapapeles un `curl` de ejemplo contra `POST /api/v1/voice/report` (placeholder `YOUR_VOICE_TOKEN`).
- [x] **UI Cuenta:** botón para copiar snippet **Home Assistant** (`rest_command` + `script`) usando **`/voice/report`** y campo `message`.

### Parcial / deuda técnica

- [ ] **Fase 1 en hardware** (Google Home / Scripting Editor o rutina HTTP): **plantilla de evidencia** en [`operativo-4.md`](operativo-4.md) (§ Fase 1); rellenar filas cuando se pruebe o documentar aplazamiento.
- [ ] **Rate limit en memoria** del agregador: suficiente en un solo nodo; para varias réplicas o serverless agresivo, valorar **Redis / Upstash** y documentar.
- [x] **Documentación** del endpoint `report` y TTS en `web-app/docs/voice-fulfillment.md` y `web-app/docs/deploy-voice-vercel.md` (cURL y errores legacy vs JSON).
- [ ] **Parámetro `lang`** en reporte: hoy `lang` en JSON o `Accept-Language`; **plantillas o más idiomas** siguen en roadmap (no exigir duplicar narrativa en cada backend).

### No entró (producto / posteriores)

- [ ] Plantilla **Google Home Scripting Editor** / automatización “oficial” en UI (solo **HA YAML** + **curl** desde Cuenta por ahora).
- [x] Copy de **última consulta voz** más explícito en Cuenta (etiqueta orientada al usuario vs campo técnico `lastUsedAt`).
- [ ] **Delight** (luces / estados visuales en el hogar) tras core estable.
- [x] **Tabla de contratos `pulse_contract` / `pulse_version`** en [`web-app/README.es.md`](../web-app/README.es.md) (en inglés puede enlazarse al mismo contrato hasta tener README paralelo solo en inglés dentro de `web-app/`).

### Cómo usar el TODO

1. Marcar **[x]** al fusionar código o evidencia que cierre el ítem.
2. Si un ítem **se descarta**, sustituir por una línea tachada y una nota de “won’t fix” breve.
3. Añadir sub-ítems nuevos cuando aparezcan canales (p. ej. otro assistant) sin duplicar lógica fuera del Hub.
