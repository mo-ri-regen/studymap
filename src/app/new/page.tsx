"use client";

import { DataGate } from "@/components/DataGate";
import { PlanForm } from "@/components/PlanForm";
import { Screen } from "@/components/ui";
import { CURRENT_VERSION } from "@/lib/appData";
import { getToday } from "@/lib/date";
import { defaultFormValues } from "@/lib/planForm";
import { saveAppData } from "@/state/appStore";

export default function NewPlanPage() {
  return (
    <DataGate>
      {() => (
        <Screen>
          <PlanForm
            title="計画を作る"
            defaultValues={defaultFormValues(getToday())}
            submitLabel="この計画で始める"
            // 今の計画と記録は、ここで保存したときに置き換わる
            onSubmit={(plan) =>
              saveAppData({ version: CURRENT_VERSION, plan, records: [] }).ok
            }
          />
        </Screen>
      )}
    </DataGate>
  );
}
