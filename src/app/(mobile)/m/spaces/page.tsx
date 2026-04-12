import { getMobileSpacesData } from "@/features/mobile/api/mobile-dashboard";
import { MobileSpacesScreen } from "@/features/mobile/spaces/ui/mobile-spaces-screen";

export default async function MobileSpacesPage() {
  const data = await getMobileSpacesData();
  return <MobileSpacesScreen data={data} />;
}
