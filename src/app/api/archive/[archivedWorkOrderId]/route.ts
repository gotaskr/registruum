import { NextResponse } from "next/server";
import { getArchivedWorkOrderDetails } from "@/features/archive/api/archive";

type ArchiveDetailRouteProps = Readonly<{
  params: Promise<{
    archivedWorkOrderId: string;
  }>;
}>;

export async function GET(
  _request: Request,
  { params }: ArchiveDetailRouteProps,
) {
  try {
    const { archivedWorkOrderId } = await params;
    const details = await getArchivedWorkOrderDetails(archivedWorkOrderId);

    if (!details) {
      return NextResponse.json(
        {
          error: "Archived work order not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(details);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load archived work order.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}
