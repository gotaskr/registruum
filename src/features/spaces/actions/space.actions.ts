"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedAppUser } from "@/features/auth/api/profiles";
import {
  createSpaceSchema,
  deleteSpaceSchema,
  updateSpaceSchema,
} from "@/features/spaces/schemas/space.schema";
import {
  buildSpacePhotoPath,
  spacePhotoBucket,
} from "@/features/spaces/lib/space-photo-storage";
import { readFormDataFile } from "@/lib/form-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

function readPhotoFile(formData: FormData) {
  return readFormDataFile(formData, "photo");
}

function validateSpacePhoto(photo: File | null) {
  if (photo && !photo.type.startsWith("image/")) {
    return {
      error: "Space photo must be an image file.",
      fieldErrors: {
        photo: "Space photo must be an image file.",
      },
    } satisfies SpaceActionState;
  }

  if (photo && photo.size > 5 * 1024 * 1024) {
    return {
      error: "Space photo must be 5 MB or smaller.",
      fieldErrors: {
        photo: "Space photo must be 5 MB or smaller.",
      },
    } satisfies SpaceActionState;
  }

  return null;
}

export async function createSpace(
  previousState: SpaceActionState = initialSpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  void previousState;
  const parsed = createSpaceSchema.safeParse({
    name: readText(formData, "name"),
    spaceType: readText(formData, "spaceType"),
    address: readText(formData, "address"),
  });
  const photo = readPhotoFile(formData);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      error: parsed.error.issues[0]?.message ?? "Unable to create space.",
      fieldErrors: {
        name: fieldErrors.name?.[0],
        spaceType: fieldErrors.spaceType?.[0],
        address: fieldErrors.address?.[0],
      },
    };
  }

  const photoValidation = validateSpacePhoto(photo);

  if (photoValidation) {
    return photoValidation;
  }

  const { supabase, user } = await requireAuthenticatedAppUser();
  const adminSupabase = createSupabaseAdminClient();

  const { data: space, error: createSpaceError } = await supabase
    .from("spaces")
    .insert({
      name: parsed.data.name,
      created_by_user_id: user.id,
      address: parsed.data.address || null,
      space_type: parsed.data.spaceType,
    })
    .select("*")
    .single();

  if (createSpaceError) {
    return {
      error: createSpaceError.message,
    };
  }

  const createdSpace = space as SpaceRow;

  if (photo) {
    const storagePath = buildSpacePhotoPath(createdSpace.id, photo.name);
    const bytes = new Uint8Array(await photo.arrayBuffer());
    const { error: uploadError } = await adminSupabase.storage
      .from(spacePhotoBucket)
      .upload(storagePath, bytes, {
        cacheControl: "3600",
        contentType: photo.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      await supabase.from("spaces").delete().eq("id", createdSpace.id);

      return {
        error: uploadError.message,
        fieldErrors: {
          photo: uploadError.message,
        },
      };
    }

    const { error: updateError } = await supabase
      .from("spaces")
      .update({
        photo_path: storagePath,
        photo_file_name: photo.name,
      })
      .eq("id", createdSpace.id);

    if (updateError) {
      await adminSupabase.storage.from(spacePhotoBucket).remove([storagePath]);
      await supabase.from("spaces").delete().eq("id", createdSpace.id);

      return {
        error: updateError.message,
        fieldErrors: {
          photo: updateError.message,
        },
      };
    }
  }

  revalidatePath("/");
  revalidatePath(`/space/${createdSpace.id}`);
  redirect(`/space/${createdSpace.id}`);
}

export async function updateSpaceProfile(
  previousState: SpaceActionState = initialSpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  void previousState;
  const parsed = updateSpaceSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
    name: readText(formData, "name"),
    spaceType: readText(formData, "spaceType"),
    address: readText(formData, "address"),
  });
  const photo = readPhotoFile(formData);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      error: parsed.error.issues[0]?.message ?? "Unable to update space.",
      fieldErrors: {
        name: fieldErrors.name?.[0],
        spaceType: fieldErrors.spaceType?.[0],
        address: fieldErrors.address?.[0],
      },
    };
  }

  const photoValidation = validateSpacePhoto(photo);

  if (photoValidation) {
    return photoValidation;
  }

  const { supabase, user } = await requireAuthenticatedAppUser();
  const adminSupabase = createSupabaseAdminClient();
  const { data: membership, error: membershipError } = await supabase
    .from("space_memberships")
    .select("role")
    .eq("space_id", parsed.data.spaceId)
    .eq("user_id", user.id)
    .single();

  if (membershipError || !membership || membership.role !== "admin") {
    return {
      error: "You do not have permission to update this space.",
    };
  }

  const { data: existingSpace, error: existingSpaceError } = await supabase
    .from("spaces")
    .select("photo_path")
    .eq("id", parsed.data.spaceId)
    .single();

  if (existingSpaceError || !existingSpace) {
    return {
      error: existingSpaceError?.message ?? "Unable to load the current space.",
    };
  }

  let nextPhotoPath = existingSpace.photo_path;

  if (photo) {
    const storagePath = buildSpacePhotoPath(parsed.data.spaceId, photo.name);
    const bytes = new Uint8Array(await photo.arrayBuffer());
    const { error: uploadError } = await adminSupabase.storage
      .from(spacePhotoBucket)
      .upload(storagePath, bytes, {
        cacheControl: "3600",
        contentType: photo.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      return {
        error: uploadError.message,
        fieldErrors: {
          photo: uploadError.message,
        },
      };
    }

    nextPhotoPath = storagePath;
  }

  const { error: updateError } = await supabase
    .from("spaces")
    .update({
      name: parsed.data.name,
      space_type: parsed.data.spaceType,
      address: parsed.data.address || null,
      photo_path: nextPhotoPath,
      photo_file_name: photo ? photo.name : undefined,
    })
    .eq("id", parsed.data.spaceId);

  if (updateError) {
    if (photo && nextPhotoPath && nextPhotoPath !== existingSpace.photo_path) {
      await adminSupabase.storage.from(spacePhotoBucket).remove([nextPhotoPath]);
    }

    return {
      error: updateError.message,
    };
  }

  if (photo && existingSpace.photo_path && existingSpace.photo_path !== nextPhotoPath) {
    await adminSupabase.storage.from(spacePhotoBucket).remove([existingSpace.photo_path]);
  }

  revalidatePath("/");
  revalidatePath(`/space/${parsed.data.spaceId}`);
  revalidatePath(`/space/${parsed.data.spaceId}/settings`);
  redirect(`/space/${parsed.data.spaceId}/settings`);
}

export async function deleteSpace(
  previousState: SpaceActionState = initialSpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  void previousState;
  const parsed = deleteSpaceSchema.safeParse({
    spaceId: readText(formData, "spaceId"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to delete space.",
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
      error: "Only admins can delete this space.",
    };
  }

  const { error: archivedDeleteError } = await supabase
    .from("archived_work_orders")
    .delete()
    .eq("space_id", parsed.data.spaceId);

  if (archivedDeleteError) {
    return {
      error: archivedDeleteError.message,
    };
  }

  const { error: deleteError } = await supabase
    .from("spaces")
    .delete()
    .eq("id", parsed.data.spaceId);

  if (deleteError) {
    return {
      error: deleteError.message,
    };
  }

  revalidatePath("/");
  revalidatePath(`/space/${parsed.data.spaceId}`);
  redirect("/");
}
