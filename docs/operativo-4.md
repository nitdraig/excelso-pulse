Perfecto. Vamos con el **siguiente paso operativo** para cerrar Fase 4: validar webhook en producción y luego en Google.

## Checklist rápido (10–15 min)

1. **Configura variables en tu deploy** (`Vercel` o VPS):
   - `VOICE_WEBHOOK_SECRET`
   - `VOICE_DEFAULT_USER_EMAIL` (o usarás `x-excelso-user-email`)
   - opcional: `VOICE_WEBHOOK_ALT_HEADER_NAME=x-monitoring-token`

2. **Redeploy** de la app.

3. **Prueba HTTP directa** (antes de Dialogflow):

```bash
curl -sS -X POST "https://TU_DOMINIO/api/v1/voice/fulfillment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_VOICE_WEBHOOK_SECRET" \
  -H "x-excelso-user-email: TU_EMAIL" \
  -d '{"queryResult":{"queryText":"estado","languageCode":"es"}}'
```

Esperado: JSON con `fulfillmentText` y `fulfillmentMessages`.

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

- **401**: secreto/header incorrecto.
- **503**: falta `VOICE_WEBHOOK_SECRET` en entorno.
- **200 con mensaje de configuración**: falta `VOICE_DEFAULT_USER_EMAIL` o `x-excelso-user-email`.
- **200 con “usuario no encontrado”**: email no existe en Mongo.
- Revisa logs del deployment buscando: `"[voice] fulfillment"`.

---

Cuando termines estas pruebas, marco contigo el último checkbox de Fase 4 en `docs/estrategia-y-enfoque.md`. Si quieres, te acompaño paso a paso mientras ejecutas el `curl` y me pegas la respuesta.
