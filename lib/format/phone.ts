/**
 * Formats a stored E.164 US number for display: "+12155551234" ->
 * "(215) 555-1234". Anything else is returned as is. Safe on client and server.
 */
export function formatPhone(phone: string): string {
  const match = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(phone);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
}
