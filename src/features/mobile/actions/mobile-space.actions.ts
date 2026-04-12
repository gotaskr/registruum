"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import { createSpaceSchema } from "@/features/spaces/schemas/space.schema";
import {
  initialSpaceActionState,
  type SpaceActionState,
} from "@/features/spaces/types/space-action-state";
import type { Database } from "@/types/database";

type SpaceRow = Database["public"]["Tables"]["spaces"]["Row"];

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createMobileSpace(
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
  const { data: space, error } = await supabase
    .from("spaces")
    .insert({
      name: parsed.data.name,
      created_by_user_id: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return {
      error: error.message,
    };
  }

  const createdSpace = space as SpaceRow;

  revalidatePath("/m");
  revalidatePath("/m/spaces");
  revalidatePath(`/m/space/${createdSpace.id}`);
  redirect(`/m/space/${createdSpace.id}`);
}
