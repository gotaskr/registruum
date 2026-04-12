import { getMobileHomeData } from "@/features/mobile/api/mobile-dashboard";
import { MobileHomeScreen } from "@/features/mobile/home/ui/mobile-home-screen";

export default async function MobileHomePage() {
  const data = await getMobileHomeData();
  return <MobileHomeScreen data={data} />;
}
