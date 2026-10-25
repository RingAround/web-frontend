import { Suspense } from "react";
import { AppHeader } from "@/components/app-header";
import { AccountNavigation, AccountNavigationFallback } from "@/components/auth-navigation";
import RequestForm from "./request-form";

export const metadata = {
  title: "New quote request — RingAround",
};

export default function NewRequestPage() {
  return (
    <div className="flex flex-1 flex-col">
      <AppHeader label="New quote request">
        <Suspense fallback={<AccountNavigationFallback />}>
          <AccountNavigation />
        </Suspense>
      </AppHeader>
      <main className="flex-1">
        <RequestForm />
      </main>
    </div>
  );
}
