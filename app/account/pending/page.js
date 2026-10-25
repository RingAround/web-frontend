import { AppHeader } from "@/components/app-header";
import { PendingStatus } from "./pending-status";

export const metadata = {
  title: "Account in review — RingAround",
  robots: { index: false, follow: false },
};

export default function AccountPendingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader label="Account" />
      <main className="flex-1">
        <PendingStatus />
      </main>
    </div>
  );
}
