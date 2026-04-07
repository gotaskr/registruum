export type SpaceActionState = Readonly<{
  error?: string;
  fieldErrors?: Readonly<{
    name?: string;
    spaceType?: string;
    address?: string;
    photo?: string;
  }>;
}>;

export const initialSpaceActionState: SpaceActionState = {};
