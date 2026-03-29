"use client";

import { useActionState } from "react";
import { ChatMessageItem } from "@/components/ui/chat-message-item";
import { InputBar } from "@/components/ui/input-bar";
import { FormMessage } from "@/features/auth/ui/form-message";
import { createWorkOrderMessage } from "@/features/chat/actions/chat.actions";
import { initialChatActionState } from "@/features/chat/types/chat-action-state";
import { ChatEmptyState } from "@/features/chat/ui/chat-empty-state";
import { ChatHeader } from "@/features/chat/ui/chat-header";
import type { WorkOrderStatus } from "@/types/work-order";
import type { Message } from "@/types/message";

type ChatPanelProps = Readonly<{
  workOrderName: string;
  status: WorkOrderStatus;
  memberCount: number;
  messages: Message[];
  spaceId: string;
  workOrderId: string;
  canSendMessage: boolean;
  lockedMessage?: string;
}>;

export function ChatPanel({
  workOrderName,
  status,
  memberCount,
  messages,
  spaceId,
  workOrderId,
  canSendMessage,
  lockedMessage,
}: ChatPanelProps) {
  const [state, formAction] = useActionState(
    createWorkOrderMessage,
    initialChatActionState,
  );
  const needsMoreMembers = memberCount < 2;
  const chatDisabledReason = needsMoreMembers
    ? "Need 2 or more members"
    : lockedMessage;
  const canUseChatInput = canSendMessage && !needsMoreMembers;

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_1fr_auto]">
      <ChatHeader
        workOrderName={workOrderName}
        status={status}
        memberCount={memberCount}
      />
      <div className="min-h-0 overflow-y-auto px-6 py-5">
        <FormMessage
          message={state.error ?? chatDisabledReason}
          tone={state.error ? "error" : "info"}
        />
        <div className="space-y-4">
          {messages.length > 0 ? (
            messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} />
            ))
          ) : (
            <ChatEmptyState />
          )}
        </div>
      </div>
      <InputBar
        action={formAction}
        hiddenFields={[
          { name: "spaceId", value: spaceId },
          { name: "workOrderId", value: workOrderId },
        ]}
        inputName="body"
        fileInputName="files"
        placeholder={
          canUseChatInput
            ? "Message the work order team"
            : needsMoreMembers
              ? "Need 2 or more members"
              : "Messaging is disabled for this work order"
        }
        disabled={!canUseChatInput}
        disabledReason={needsMoreMembers ? "Need 2 or more members" : undefined}
      />
    </section>
  );
}
