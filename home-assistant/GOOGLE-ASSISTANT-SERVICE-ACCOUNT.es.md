# Google Assistant (camino manual): `service_account.json` con Dokploy / VPS

El JSON de la cuenta de servicio de Google Cloud **es un secreto**. No debe versionarse en Git.

## Dónde debe vivir el archivo en tu despliegue

En tu `[docker-compose.yml](docker-compose.yml)` el directorio persistente de Home Assistant es:

- **En el host (VPS):** `/var/lib/dokploy/homeassistant_config`
- **Dentro del contenedor:** `/config`

Los YAML (`configuration.yaml`, etc.) se montan desde el repo; el `**service_account.json` no** debe ir en el repo: va en el **volumen persistente**, es decir en el host:

```text
/var/lib/dokploy/homeassistant_config/service_account.json
```

Así Home Assistant lo ve como:

```text
/config/service_account.json
```

## Cómo copiarlo (elige una)

### Opción A — SSH al VPS

1. Descarga el JSON desde Google Cloud en tu PC (o genera la clave otra vez si la perdiste).
2. Desde tu PC (ejemplo con `scp`):
  ```bash
   scp /ruta/local/service_account.json usuario@TU_VPS:/var/lib/dokploy/homeassistant_config/service_account.json
  ```
3. Permisos razonables (solo lectura para el usuario que ejecuta el contenedor):
  ```bash
   chmod 600 /var/lib/dokploy/homeassistant_config/service_account.json
  ```
4. **Reinicia** el stack de Home Assistant en Dokploy para que el contenedor vuelva a leer `/config`.

### Opción B — Editor de archivos del host

Si Dokploy o tu panel ofrece **explorador de archivos / SFTP** del volumen, crea el archivo en esa ruta y pega el contenido del JSON (una sola vez).

### Opción C — Contenedor (solo si no tienes otra forma)

```bash
docker cp ./service_account.json homeassistant:/config/service_account.json
```

(El nombre del contenedor debe coincidir con el de tu `docker-compose.yml`.)

## `configuration.yaml`

En la raíz del archivo (no indentado bajo otra clave), añade el bloque que indique la [documentación oficial](https://www.home-assistant.io/integrations/google_assistant/) para tu versión de HA. Suele ser equivalente a:

```yaml
google_assistant:
  project_id: TU_PROJECT_ID_DE_GOOGLE_CLOUD
  service_account: !include service_account.json
```

`!include service_account.json` resuelve a `**/config/service_account.json**`, que es justo el archivo que pusiste en el volumen.

Si tu instancia usa **solo UI** para Google Assistant y ya no admite YAML, sigue el asistente de la integración: muchas veces te deja **subir** el JSON desde la interfaz; en ese caso no hace falta el `!include` manual.

## Comprobar

1. **Registro** de HA: no debe aparecer error de “file not found” para `service_account.json`.
2. Reinicia HA tras colocar el archivo.
3. Continúa con el enlace en la app **Google Home** y la sincronización de dispositivos (pasos 6–8 de la guía general).

## Git

Este repo ignora `service_account.json` en `home-assistant/` (ver `.gitignore`). No añadas el JSON real al repositorio.