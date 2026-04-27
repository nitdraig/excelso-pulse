# Changelog

Formato basado en *Keep a Changelog*. Versionado semántico (**SemVer**): `MAJOR` rompe el contrato HTTP/JSON o la API pública de exports; `MINOR` añade compatibilidad hacia atrás; `PATCH` corrige bugs sin cambiar el contrato.

## [0.1.7] - 2026-04-22

### Added

- `monitoringTokenHeaderName` en `createPulseExpressRouter`: el mismo token de servicio puede enviarse por una cabecera adicional (p. ej. `x-monitoring-token`), además de `Authorization: Bearer`.
- `PulseServiceAuthMiddlewareOptions` y segundo argumento opcional en `createPulseBearerAuthMiddleware` para la misma semántica en rutas custom.

### Changed

- El middleware de auth comprueba primero Bearer y luego la cabecera alternativa; sigue ejecutándose **antes** de los probes.
