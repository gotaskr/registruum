"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import {
  createSpaceSchema,
  renameSpaceSchema,
} from "@/features/spaces/schemas/space.schema";
import type { Database } from "@/types/database";
import {
  initialSpaceActionState,
  type SpaceActionState,
} from "@/features/spaces/types/space-action-state";

type SpaceRow = Database["public"]["Tables"]["spaces"]["Row"];

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createSpace(
  previousState: SpaceActionState = initialSpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  void previousState;
  const parsed = createSpaceSchema.safeParse({
    name: readText(formData, "name"),
    address: readText(formData, "address"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      error: parsed.error.issues[0]?.message ?? "Unable to create space.",
      fieldErrors: {
        name: fieldErrors.name?.[0],
        address: fieldErrors.address?.[0],
      },
    };
  }

  const { supabase, user } = await requireAuthenticatedAppUser();

  const { data: space, error: createSpaceError } = await supabase
    .from("spaces")
    .insert({
      name: parsed.data.name,
      created_by_user_id: user.id,
    })
    .select("*")
    .single();

  if (createSpaceError) {
    return {
      error: createSpaceError.message,
    };
  }

  const createdSpace = space as SpaceRow;

  revalidatePath("/");
  revalidatePath(`/space/${createdSpace.id}`);
  redirect(`/space/${createdSpace.id}`);
}

export async function renameSpace(
  previousState: SpaceActionState = initialSpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  void previousState;
  const parsed = renameSpaceSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    name: readText(formData, "name"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to rename space.",
    };
  }

  const { supabase, user } = await requireAuthenticatedAppUser();
  const { data: membership, error: membershipError } = await supabase
    .from("space_memberships")
    .select("role")
    .eq("space_id", parsed.data.spaceId)
    .eq("user_id", user.id)
    .single();

  if (membershipError || !membership || membership.role !== "admin") {
    return {
      error: "You do not have permission to rename this space.",
    };
  }

  const { error: updateError } = await supabase
    .from("spaces")
    .update({
      name: parsed.data.name,
    })
    .eq("id", parsed.data.spaceId);

  if (updateError) {
    return {
      error: updateError.message,
    };
  }

  revalidatePath(`/space/${parsed.data.spaceId}`);
  redirect(`/space/${parsed.data.spaceId}`);
}
