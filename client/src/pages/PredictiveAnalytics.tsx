import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertTriangle, TrendingUp, Package, AlertCircle, Download } from "lucide-react";
import { Loader2 } from "lucide-react";

/**
 * Predictive Analytics Page
 * Revenue forecasting, inventory prediction, anomaly detection, and reporting
 */
export default function PredictiveAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<"month" | "quarter" | "year">("month");
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");

  // Fetch predictive insights
  const { data: insights, isLoading: insightsLoading } =
    trpc.predictiveAnalytics.generateInsights.useQuery();

  // Fetch revenue forecast
  const { data: forecast, isLoading: forecastLoading } =
    trpc.predictiveAnalytics.forecastRevenue.useQuery({ months: 6 });

  // Fetch inventory predictions
  const { data: inventoryPredictions, isLoading: inventoryLoading } =
    trpc.predictiveAnalytics.predictInventoryDemand.useQuery();

  // Fetch anomalies
  const { data: anomalies, isLoading: anomaliesLoading } =
    trpc.predictiveAnalytics.detectAnomalies.useQuery();

  // Fetch financial report
  const { data: financialReport, isLoading: financialLoading } =
    trpc.predictiveAnalytics.generateFinancialReport.useQuery({ timeframe: selectedTimeframe });

  // Export mutations
  const exportPDF = trpc.predictiveAnalytics.exportReportAsPDF.useMutation();
  const exportExcel = trpc.predictiveAnalytics.exportReportAsExcel.useMutation();

  const isLoading =
    insightsLoading || forecastLoading || inventoryLoading || anomaliesLoading || financialLoading;

  const handleExport = async (type: "financial" | "comprehensive") => {
    try {
      if (exportFormat === "pdf") {
        await exportPDF.mutateAsync({
          reportType: type,
          timeframe: selectedTimeframe,
        });
      } else {
        await exportExcel.mutateAsync({
          reportType: type,
          timeframe: selectedTimeframe,
        });
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (isLoading && !forecast && !anomalies) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Predictive Analytics & Reporting</h1>
        <p className="text-gray-600 mt-1">
          AI-powered forecasting, anomaly detection, and comprehensive reporting
        </p>
      </div>

      {/* Executive Summary */}
      {insights && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">{insights.summary}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="forecasts" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecasts">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Prediction</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Revenue Forecast Tab */}
        <TabsContent value="forecasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Revenue Forecast (Next 6 Months)
              </CardTitle>
              <CardDescription>
                AI-powered revenue projections based on historical trends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {forecast && forecast.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={forecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => `$${value.toLocaleString()}`}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Forecast"
                        dot={{ fill: "#3b82f6" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {forecast.map((month, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-600">{month.month}</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${month.forecast.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              month.trend === "up"
                                ? "bg-green-100 text-green-800"
                                : month.trend === "down"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {month.trend.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-600">
                            {(month.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">{month.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">No forecast data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Prediction Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Inventory Demand Prediction
              </CardTitle>
              <CardDescription>
                Predicted demand and reorder recommendations for inventory items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryPredictions && inventoryPredictions.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {inventoryPredictions.map((item) => (
                    <div
                      key={item.productId}
                      className={`p-4 rounded-lg border-l-4 ${
                        item.riskLevel === "high"
                          ? "bg-red-50 border-red-400"
                          : item.riskLevel === "medium"
                            ? "bg-yellow-50 border-yellow-400"
                            : "bg-green-50 border-green-400"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-600 mt-1">{item.reasoning}</p>
                        </div>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            item.riskLevel === "high"
                              ? "bg-red-200 text-red-800"
                              : item.riskLevel === "medium"
                                ? "bg-yellow-200 text-yellow-800"
                                : "bg-green-200 text-green-800"
                          }`}
                        >
                          {item.riskLevel.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-3 text-sm">
                        <div>
                          <p className="text-gray-600">Current Stock</p>
                          <p className="font-semibold">{item.currentStock} units</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Predicted Demand</p>
                          <p className="font-semibold">{item.predictedDemand} units</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Reorder Qty</p>
                          <p className="font-semibold">{item.recommendedReorder} units</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Days Until Stockout</p>
                          <p className="font-semibold">{item.daysUntilStockout} days</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No inventory predictions</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomaly Detection Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Anomaly Detection
              </CardTitle>
              <CardDescription>
                Unusual patterns and deviations detected in business metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies && anomalies.length > 0 ? (
                <div className="space-y-3">
                  {anomalies.map((anomaly, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${
                        anomaly.severity === "high"
                          ? "bg-red-50 border-red-400"
                          : anomaly.severity === "medium"
                            ? "bg-yellow-50 border-yellow-400"
                            : "bg-blue-50 border-blue-400"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{anomaly.description}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Metric:</strong> {anomaly.affectedMetric}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            anomaly.severity === "high"
                              ? "bg-red-200 text-red-800"
                              : anomaly.severity === "medium"
                                ? "bg-yellow-200 text-yellow-800"
                                : "bg-blue-200 text-blue-800"
                          }`}
                        >
                          {anomaly.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                        <div>
                          <p className="text-gray-600">Current Value</p>
                          <p className="font-semibold">
                            {typeof anomaly.currentValue === "number"
                              ? anomaly.currentValue.toFixed(2)
                              : anomaly.currentValue}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Expected Value</p>
                          <p className="font-semibold">
                            {typeof anomaly.expectedValue === "number"
                              ? anomaly.expectedValue.toFixed(2)
                              : anomaly.expectedValue}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Deviation</p>
                          <p className="font-semibold text-red-600">
                            {anomaly.deviation.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-3">
                        <strong>Recommendation:</strong> {anomaly.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  No anomalies detected - all metrics are within normal ranges
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Generation & Export</CardTitle>
              <CardDescription>Generate and export comprehensive business reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Timeframe Selection */}
              <div className="flex gap-2">
                {(["month", "quarter", "year"] as const).map((tf) => (
                  <Button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    variant={selectedTimeframe === tf ? "default" : "outline"}
                    size="sm"
                  >
                    {tf.charAt(0).toUpperCase() + tf.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Export Format Selection */}
              <div className="flex gap-2">
                {(["pdf", "excel"] as const).map((fmt) => (
                  <Button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    variant={exportFormat === fmt ? "default" : "outline"}
                    size="sm"
                  >
                    {fmt.toUpperCase()}
                  </Button>
                ))}
              </div>

              {/* Export Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                <Button
                  onClick={() => handleExport("financial")}
                  disabled={exportPDF.isPending || exportExcel.isPending}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  {exportPDF.isPending || exportExcel.isPending ? "Exporting..." : "Export Financial Report"}
                </Button>
                <Button
                  onClick={() => handleExport("comprehensive")}
                  disabled={exportPDF.isPending || exportExcel.isPending}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  {exportPDF.isPending || exportExcel.isPending ? "Exporting..." : "Export Comprehensive Report"}
                </Button>
              </div>

              {/* Financial Report Preview */}
              {financialReport && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-4">Financial Report Preview</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {financialReport.sections.map((section, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-semibold text-sm text-gray-900">{section.title}</p>
                        {section.metrics && (
                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                            {Object.entries(section.metrics).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600">{key}:</span>
                                <span className="font-semibold text-gray-900">{value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>Set up automatic report generation and email delivery</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Scheduled report feature coming soon</p>
            <p className="text-sm mt-2">Configure daily, weekly, or monthly report delivery to stakeholders</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
