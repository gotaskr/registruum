export type SpaceActionState = Readonly<{
  error?: string;
  fieldErrors?: Readonly<{
    name?: string;
    address?: string;
  }>;
}>;

export const initialSpaceActionState: SpaceActionState = {};
