import { AppMain } from "@/components/layout/app-main";
import { ManageNav } from "@/components/manage/manage-nav";

// Manager pages with the tab bar (`/manage`, `/manage/members`). Not
// `/manage/login`. Auth is checked in each page, not here.
export default function ManageTabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ManageNav />
      <AppMain>{children}</AppMain>
    </>
  );
}
