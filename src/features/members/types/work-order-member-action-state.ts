export type WorkOrderMemberActionState = Readonly<{
  error?: string;
  success?: string;
  inviteLink?: string;
}>;

export type WorkOrderMemberCodePreview = Readonly<{
  userId: string;
  name: string;
  email: string;
  memberCode: string;
  verificationState: "verified" | "unverified";
}>;

export type WorkOrderMemberCodePreviewState = Readonly<{
  error?: string;
  preview?: WorkOrderMemberCodePreview;
}>;

export const initialWorkOrderMemberActionState: WorkOrderMemberActionState = {};

export const initialWorkOrderMemberCodePreviewState: WorkOrderMemberCodePreviewState = {};
