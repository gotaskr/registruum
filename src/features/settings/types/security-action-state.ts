export type SecurityActionState = Readonly<{
  error?: string;
  success?: string;
}>;

export const initialSecurityActionState: SecurityActionState = {};
