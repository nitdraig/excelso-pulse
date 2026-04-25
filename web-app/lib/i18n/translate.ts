/** Reemplaza `{clave}` en la plantilla. */
export function interpolate(
  template: string,
  vars?: Record<string, string | number | boolean>,
): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key]
    return v === undefined || v === false ? "" : String(v)
  })
}

export function getByPath(root: unknown, path: string): unknown {
  const parts = path.split(".")
  let cur: unknown = root
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}
