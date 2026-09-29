"use client";

import * as React from "react";
import Link from "next/link";
import { Banknote } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { PayWorkerDialog } from "@/components/workforce/pay-worker-dialog";
import { useWorkforce } from "@/lib/workforce/store";
import { outstandingForWorker } from "@/lib/workforce/reporting";
import { humanizeStatus } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";

export default function NewPaymentPage() {
  const { ready, workers, records, items } = useWorkforce();

  const owed = React.useMemo(
    () =>
      workers
        .map((w) => ({
          worker: w,
          outstanding: outstandingForWorker(w.id, records, items),
        }))
        .filter((x) => x.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding),
    [workers, records, items],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Record a payment"
        description="Everyone with an outstanding balance. Pay them what they're owed."
      />

      {!ready ? (
        <LoadingState />
      ) : owed.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="Everyone's paid up"
          description="No worker has an outstanding balance right now."
          action={
            <Button asChild variant="outline">
              <Link href="/workforce">Back to workforce</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {owed.map(({ worker, outstanding }) => (
                <li
                  key={worker.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/workforce/${worker.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {worker.first_name} {worker.last_name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Badge variant="secondary">
                        {humanizeStatus(worker.worker_type)}
                      </Badge>
                      {worker.role_title && (
                        <span className="text-xs text-muted-foreground">
                          {worker.role_title}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Outstanding
                      </p>
                      <p className="font-semibold tabular-nums text-warning">
                        {formatCurrency(outstanding)}
                      </p>
                    </div>
                    <PayWorkerDialog
                      worker={worker}
                      trigger={
                        <Button size="sm">
                          <Banknote className="h-4 w-4" /> Pay
                        </Button>
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
