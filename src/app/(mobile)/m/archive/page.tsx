import { getMobileArchiveData } from "@/features/mobile/api/mobile-dashboard";
import { MobileArchiveScreen } from "@/features/mobile/archive/ui/mobile-archive-screen";

export default async function MobileArchivePage() {
  const data = await getMobileArchiveData({});
  return <MobileArchiveScreen data={data} />;
}
