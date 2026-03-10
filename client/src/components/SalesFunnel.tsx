import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign } from "lucide-react";

interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  conversionRate: number;
  avgDealSize: number;
}

interface SalesFunnelProps {
  data: FunnelStage[];
  title?: string;
  description?: string;
}

/**
 * Sales Funnel Component
 * Visualizes sales pipeline stages with conversion rates and deal values
 */
export function SalesFunnel({ data, title = "Sales Funnel", description }: SalesFunnelProps) {
  const maxCount = useMemo(() => {
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  const totalValue = useMemo(() => {
    return data.reduce((sum, stage) => sum + stage.value, 0);
  }, [data]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No funnel data available</div>
        ) : (
          <div className="space-y-6">
            {/* Funnel visualization */}
            <div className="space-y-4">
              {data.map((stage, index) => {
                const widthPercent = (stage.count / maxCount) * 100;
                const color = COLORS[index % COLORS.length];

                return (
                  <div key={stage.stage} className="space-y-2">
                    {/* Stage header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">{stage.stage}</h4>
                        <p className="text-xs text-gray-600">
                          {stage.count} {stage.count === 1 ? "lead" : "leads"}
                        </p>
                      </div>
                      {index > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {stage.conversionRate.toFixed(1)}% conversion
                        </Badge>
                      )}
                    </div>

                    {/* Funnel bar */}
                    <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all flex items-center justify-between px-4"
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: color,
                          opacity: 0.8,
                        }}
                      >
                        <span className="text-white text-sm font-semibold">{stage.count}</span>
                      </div>

                      {/* Value display */}
                      <div className="absolute inset-0 flex items-center justify-end px-4">
                        <span className="text-sm font-medium text-gray-700">
                          ${(stage.value / 1000).toFixed(1)}K
                        </span>
                      </div>
                    </div>

                    {/* Stage metrics */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-gray-600">Avg Deal Size</p>
                        <p className="font-semibold">${(stage.avgDealSize / 1000).toFixed(1)}K</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-gray-600">Total Value</p>
                        <p className="font-semibold">${(stage.value / 1000).toFixed(1)}K</p>
                      </div>
                      <div className="bg-purple-50 p-2 rounded">
                        <p className="text-gray-600">Lead Count</p>
                        <p className="font-semibold">{stage.count}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary metrics */}
            <div className="border-t pt-4 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600">Total Leads</p>
                <p className="text-lg font-bold">{data.reduce((sum, s) => sum + s.count, 0)}</p>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-600">Pipeline Value</p>
                <p className="text-lg font-bold">${(totalValue / 1000).toFixed(1)}K</p>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-xs text-gray-600">Avg Deal Size</p>
                <p className="text-lg font-bold">
                  ${(totalValue / Math.max(data.reduce((sum, s) => sum + s.count, 0), 1) / 1000).toFixed(1)}K
                </p>
              </div>
            </div>

            {/* Stage breakdown table */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-3">Stage Breakdown</h4>
              <div className="space-y-2 text-sm">
                {data.map((stage, index) => (
                  <div key={stage.stage} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{stage.stage}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">{stage.count} leads</span>
                      <span className="font-semibold w-20 text-right">
                        ${(stage.value / 1000).toFixed(1)}K
                      </span>
                      {index > 0 && (
                        <span className="text-green-600 w-16 text-right">
                          {stage.conversionRate.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
