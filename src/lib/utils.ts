type ClassValue = string | false | null | undefined;

const roleLabelByValue: Record<string, string> = {
  admin: "Admin",
  operations_manager: "Operations Manager",
  manager: "Manager",
  officer_coordinator: "Officer / Coordinator",
  field_lead_superintendent: "Field Lead / Superintendent",
  helper: "Helper",
  contractor: "Contractor",
  worker: "Worker",
  member: "Member",
  viewer: "Viewer",
  Owner: "Owner",
};

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function formatWorkOrderLocation(
  locationLabel: string | null,
  unitLabel: string | null,
) {
  const parts = [locationLabel, unitLabel].filter(
    (part): part is string => Boolean(part && part.trim()),
  );

  return parts.length > 0 ? parts.join(" · ") : "No location set";
}

export function formatDateLabel(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function formatDateTimeLabel(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRoleLabel(value: string) {
  if (value in roleLabelByValue) {
    return roleLabelByValue[value];
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
