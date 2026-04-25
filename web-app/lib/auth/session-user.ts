/** Usuario devuelto por `authenticateUser` y persistido en JWT/sesión. */
export type SessionUserPayload = {
  id: string
  name: string
  email: string
  firstName: string
  lastName: string
  organizationName: string
}
