export type {
  Database,
  Enums,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type SpaceMembershipRole =
  import("@/lib/supabase/database.types").Database["public"]["Enums"]["app_role"];

export type WorkOrderStatus =
  import("@/lib/supabase/database.types").Database["public"]["Enums"]["work_order_status"];
