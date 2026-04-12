import { getMobileSpaceHubData } from "@/features/mobile/api/mobile-dashboard";
import { MobileSpaceHubScreen } from "@/features/mobile/spaces/ui/mobile-space-hub-screen";

type MobileSpaceHubPageProps = Readonly<{
  params: Promise<{
    spaceId: string;
  }>;
}>;

export default async function MobileSpaceHubPage({ params }: MobileSpaceHubPageProps) {
  const { spaceId } = await params;
  const data = await getMobileSpaceHubData(spaceId);

  return <MobileSpaceHubScreen data={data} />;
}
