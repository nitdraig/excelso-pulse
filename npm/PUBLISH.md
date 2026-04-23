# Publicar en npm

## Antes del primer publish

1. Edita `package.json`:
   - `"name"`: nombre único en npm (p. ej. `@tu-org/excelso-pulse-express` con scope).
   - `"repository"`: URL real del monorepo y `directory: "npm/excelso-pulse-express"`.
   - `"author"`, `"version"` (`0.1.0` → semver al publicar fixes).
2. Cuenta npm y **2FA** recomendada.

## Compilar y comprobar

```bash
cd npm/excelso-pulse-express
npm install
npm run build
```

Debe generarse `dist/` con `.js` y `.d.ts`.

## Login y publish

```bash
npm login
npm publish --access public
```

Si el nombre es **scoped** (`@org/pkg`) y es la primera vez:

```bash
npm publish --access public
```

## Consumo desde Git (sin publicar)

En otro proyecto:

```json
"dependencies": {
  "excelso-pulse-express": "file:../express-base/npm/excelso-pulse-express"
}
```

O URL de git + `npm install github:usuario/repo#main` si el paquete está en la raíz del subpath (npm soporta `package.json` en subcarpeta con workspaces o empaquetado manual).

## Versionado

Tras cambios en `src/`:

```bash
npm version patch   # o minor / major
npm publish
```

`prepublishOnly` ejecuta `npm run build` automáticamente.
