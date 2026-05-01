Perfecto. Vamos con el **siguiente paso operativo** para cerrar Fase 4: validar webhook en producción y luego en Google.

## Checklist rápido (10–15 min)

1. **Configura variables en tu deploy** (`Vercel` o VPS):
   - `VOICE_WEBHOOK_SECRET`
   - `VOICE_DEFAULT_USER_EMAIL` (o usarás `x-excelso-user-email`)
   - opcional: `VOICE_WEBHOOK_ALT_HEADER_NAME=x-monitoring-token`

2. **Redeploy** de la app.

3. **Prueba HTTP directa** (antes de Dialogflow).

   **Opción A — reporte JSON** (recomendada para scripts y Home Assistant; no exige payload Dialogflow):

```bash
curl -sS -X POST "https://TU_DOMINIO/api/v1/voice/report" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_DE_VOZ_USUARIO" \
  -d '{"lang":"es"}'
```

Esperado: JSON con `message` (texto hablable), `report`, `meta` y `pulse_contract` / `pulse_version`.

**Opción B — fulfillment Dialogflow** (legacy / simulador Google):

```bash
curl -sS -X POST "https://TU_DOMINIO/api/v1/voice/fulfillment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_VOICE_WEBHOOK_SECRET" \
  -H "x-excelso-user-email: TU_EMAIL" \
  -d '{"queryResult":{"queryText":"estado","languageCode":"es"}}'
```

Esperado: JSON con `fulfillmentText` y `fulfillmentMessages` (y metadatos `pulse_contract` / `pulse_version` en el mismo objeto).

4. **Configura Dialogflow ES**:
   - Fulfillment webhook URL: `https://TU_DOMINIO/api/v1/voice/fulfillment`
   - Header: `Authorization: Bearer TU_VOICE_WEBHOOK_SECRET`
   - Opcional: `x-excelso-user-email: TU_EMAIL`

5. **Prueba en simulador Dialogflow** con frases tipo:
   - “¿Cómo están mis apps?”
   - “Dame el reporte de Excelso”

6. **Prueba en dispositivo real** (Google Home / Assistant).

---

## Si falla, diagnóstico inmediato

- **401**: falta Bearer, token de usuario inválido/revocado, o (solo modo legacy) el valor no coincide con `VOICE_WEBHOOK_SECRET`. El webhook **no** devuelve 503 solo por tener el secreto vacío: ante credencial inválida es **401**.
- **429** (`POST /voice/report`): rate limit del agregador; cabecera `Retry-After`.
- **400** (`POST /voice/report`, legacy): falta objetivo (`voice_legacy_config_required`) — configurar `VOICE_DEFAULT_USER_EMAIL` o cabecera `x-excelso-user-email`.
- **404** (`POST /voice/report`, legacy): correo sin usuario en esta instancia.
- **200** con texto de configuración (solo fulfillment): falta correo cuando usas secreto legacy sin `VOICE_DEFAULT_USER_EMAIL` ni `x-excelso-user-email`.
- **200** con “usuario no encontrado” (fulfillment legacy): email no existe en Mongo.
- Revisa logs del deployment: `"[voice] fulfillment"` o `"[voice] report"`.

---

**Dialogflow ES**.

## 1) Crear/abrir agente

1. Entra a [Dialogflow ES Console](https://dialogflow.cloud.google.com/).
2. Crea un agente nuevo (o usa uno existente), idioma `es`, zona horaria correcta.

## 2) Crear intención de estado

1. Ve a **Intents** → **Create Intent**.
2. Nombre: `StatusReport`.
3. Agrega frases de entrenamiento:
   - `¿Cómo están mis apps?`
   - `Dame el reporte de Excelso`
   - `Estado de mis servicios`
4. Guarda.

## 3) Activar fulfillment webhook

1. Ve a **Fulfillment**.
2. Activa **Webhook**.
3. URL:
   - `https://TU_DOMINIO/api/v1/voice/fulfillment`
4. En **Headers** agrega:
   - `Authorization` = `Bearer TU_VOICE_WEBHOOK_SECRET`
   - (opcional) `x-excelso-user-email` = `tu@correo.com`  
     _(si no usas `VOICE_DEFAULT_USER_EMAIL`)_

## 4) Conectar la intención al webhook

1. Vuelve a `StatusReport`.
2. En **Fulfillment** de esa intent:
   - habilita **Enable webhook call for this intent**.
3. Guarda.

## 5) Probar en simulador

En la derecha (Try it now), escribe:

- `¿Cómo están mis apps?`

Debes recibir respuesta con tu resumen (texto de `fulfillmentText`).

## 6) Si quieres Google Home

1. Ve a **Integrations**.
2. Activa integración del canal que uses (Google Assistant/Actions según disponibilidad de tu proyecto).
3. Usa la misma cuenta Google en el dispositivo.
4. Prueba con la frase entrenada.

---

## Bridge con Home Assistant (recomendado)

Como la integración nativa Dialogflow ES ↔ Google Assistant ya no está disponible, usa Google Home + Home Assistant como puente.

### 1) `configuration.yaml` (o paquete YAML)

Usa el endpoint **`/api/v1/voice/report`**: mismo token que generas en Cuenta, cuerpo mínimo y campo **`message`** listo para TTS (alternativa válida sigue siendo `/voice/fulfillment` simulando `queryResult`; el report simplifica automatizaciones).

```yaml
rest_command:
  pulse_voice_report:
    url: "https://TU_DOMINIO/api/v1/voice/report"
    method: POST
    content_type: "application/json"
    headers:
      Authorization: "Bearer TU_TOKEN_DE_VOZ_GENERADO_EN_PULSE"
    payload: '{"lang":"es"}'

script:
  pulse_reporte_voz:
    alias: "Pulse: reporte por voz"
    mode: single
    sequence:
      - action: rest_command.pulse_voice_report
        response_variable: pulse_resp

      - variables:
          pulse_text: >-
            {% if pulse_resp is defined and pulse_resp.status == 200 and pulse_resp.content is mapping %}
              {{ pulse_resp.content.message | default('No pude obtener el reporte de Pulse.') }}
            {% else %}
              No pude conectar con Pulse en este momento.
            {% endif %}

      # Cambia media_player.salon por tu entidad Google Cast/Nest
      - action: tts.google_translate_say
        target:
          entity_id: media_player.salon
        data:
          message: "{{ pulse_text }}"
          language: "es"
```

> Si usas `tts.speak` en vez de `tts.google_translate_say`, cambia esa acción por el servicio TTS de tu instalación.

### 2) Prueba manual en Home Assistant

1. Ve a **Developer Tools → Services**.
2. Ejecuta `script.pulse_reporte_voz`.
3. Verifica que el altavoz reproduzca el texto del webhook.

### 3) Conectar con Google Home (rutina)

1. En Google Home crea una rutina (p. ej. “reporte pulse”).
2. Acción de rutina: disparar el script en Home Assistant (vía integración de HA con Google o Assist pipeline).
3. Frase de voz: “Hey Google, reporte pulse”.

### 4) Errores típicos

- `401` en `pulse_resp.status`: token inválido o expirado/revocado.
- `429`: demasiadas peticiones; esperar según `Retry-After`.
- `500` o timeout: revisar logs de Pulse y conectividad saliente de HA.
- No habla en altavoz: revisar `entity_id` del `media_player` y servicio TTS disponible.

---

## Fase 1 — evidencia en hardware (Google Home / rutina HTTP)

Marcar cuando se valide en dispositivo real o cuando se registre una **decisión explícita de aplazamiento** en el equipo:

| Ítem                                        | Estado      |
| ------------------------------------------- | ----------- |
| Fecha de prueba o decisión                  | _pendiente_ |
| Entorno (altavoz, red, VPS/Vercel)          | _pendiente_ |
| Resultado (OK / timeout / bloqueo de red)   | _pendiente_ |
| Canal usado (Dialogflow / HA bridge / otro) | _pendiente_ |
| Captura de log o referencia corta           | _pendiente_ |

Documentación de endpoints y contratos: [`web-app/docs/voice-fulfillment.md`](../web-app/docs/voice-fulfillment.md).
