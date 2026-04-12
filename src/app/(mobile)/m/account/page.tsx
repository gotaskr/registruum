import { getMobileAccountData } from "@/features/mobile/api/mobile-dashboard";
import { MobileAccountScreen } from "@/features/mobile/account/ui/mobile-account-screen";

export default async function MobileAccountPage() {
  const data = await getMobileAccountData();
  return <MobileAccountScreen data={data} />;
}
