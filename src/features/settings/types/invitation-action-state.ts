export type InvitationActionState = Readonly<{
  error?: string;
  success?: string;
  inviteLink?: string;
}>;

export const initialInvitationActionState: InvitationActionState = {};
