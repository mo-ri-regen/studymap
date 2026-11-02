"use client";

import { BackToHome } from "@/components/BackToHome";
import { DataGate } from "@/components/DataGate";
import { PlanForm } from "@/components/PlanForm";
import { Screen } from "@/components/ui";
import { toFormValues } from "@/lib/planForm";
import { saveAppData } from "@/state/appStore";

/** 計画を変える。最初の計画を作り直し、記録は残す */
export default function EditPlanPage() {
  return (
    <DataGate>
      {(data) =>
        data.plan === null ? (
          <BackToHome />
        ) : (
          <Screen>
            <PlanForm
              title="計画を変える"
              defaultValues={toFormValues(data.plan)}
              submitLabel="この計画に変える"
              onSubmit={(plan) => saveAppData({ ...data, plan }).ok}
            />
          </Screen>
        )
      }
    </DataGate>
  );
}
