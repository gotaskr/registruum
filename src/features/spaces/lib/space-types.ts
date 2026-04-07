export const spaceTypeOptions = [
  {
    value: "buildings",
    label: "Buildings",
  },
  {
    value: "small-business",
    label: "Small Business",
  },
  {
    value: "facility",
    label: "Facility",
  },
  {
    value: "factory",
    label: "Factory",
  },
] as const;

export type SpaceTypeValue = (typeof spaceTypeOptions)[number]["value"];

const spaceTypeLabelByValue = new Map(
  spaceTypeOptions.map((option) => [option.value, option.label] as const),
);

export function getSpaceTypeLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return spaceTypeLabelByValue.get(value as SpaceTypeValue) ?? null;
}
