import React from "react";
import { ERPDashboardLayout } from "@/components/ERPDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Analytics() {
  return (
    <ERPDashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics & Insights</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">AI-powered maintenance predictions coming soon...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">System anomalies and alerts coming soon...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demand Forecasting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Demand predictions coming soon...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Key performance indicators coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ERPDashboardLayout>
  );
}
