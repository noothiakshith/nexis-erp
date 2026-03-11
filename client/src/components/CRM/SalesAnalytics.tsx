import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  ArrowUp,
  ArrowDown,
  Activity
} from "lucide-react";

export function SalesAnalytics() {
  // Mock analytics data - in real implementation, fetch from API
  const analytics = {
    totalRevenue: 1250000,
    revenueGrowth: 15.3,
    totalLeads: 156,
    leadsGrowth: 8.2,
    conversionRate: 24.5,
    conversionGrowth: 3.1,
    avgDealSize: 45000,
    dealSizeGrowth: -2.4,
    wonDeals: 38,
    lostDeals: 12,
    activeDeals: 106,
    pipelineValue: 4750000
  };

  const MetricCard = ({ 
    title, 
    value, 
    growth, 
    icon: Icon, 
    prefix = "", 
    suffix = "" 
  }: any) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold">
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
            </div>
            {growth !== undefined && (
              <div className={`flex items-center gap-1 text-sm mt-1 ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growth >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                <span>{Math.abs(growth)}% vs last month</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={analytics.totalRevenue}
          growth={analytics.revenueGrowth}
          icon={DollarSign}
          prefix="$"
        />
        <MetricCard
          title="Total Leads"
          value={analytics.totalLeads}
          growth={analytics.leadsGrowth}
          icon={Users}
        />
        <MetricCard
          title="Conversion Rate"
          value={analytics.conversionRate}
          growth={analytics.conversionGrowth}
          icon={Target}
          suffix="%"
        />
        <MetricCard
          title="Avg Deal Size"
          value={analytics.avgDealSize}
          growth={analytics.dealSizeGrowth}
          icon={TrendingUp}
          prefix="$"
        />
      </div>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              ${analytics.pipelineValue.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600 mt-1">{analytics.activeDeals} active deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Won Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {analytics.wonDeals}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {Math.round((analytics.wonDeals / (analytics.wonDeals + analytics.lostDeals)) * 100)}% win rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Lost Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {analytics.lostDeals}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {Math.round((analytics.lostDeals / (analytics.wonDeals + analytics.lostDeals)) * 100)}% loss rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Sales Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { stage: "New Leads", count: 156, percentage: 100, color: "bg-gray-500" },
              { stage: "Contacted", count: 98, percentage: 63, color: "bg-blue-500" },
              { stage: "Qualified", count: 67, percentage: 43, color: "bg-purple-500" },
              { stage: "Proposal", count: 45, percentage: 29, color: "bg-orange-500" },
              { stage: "Won", count: 38, percentage: 24, color: "bg-green-500" }
            ].map((stage) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{stage.stage}</span>
                  <span className="text-sm text-gray-600">
                    {stage.count} leads ({stage.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`${stage.color} h-3 rounded-full transition-all`}
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "John Doe", deals: 12, revenue: 540000 },
              { name: "Jane Smith", deals: 10, revenue: 450000 },
              { name: "Mike Johnson", deals: 8, revenue: 360000 }
            ].map((performer, index) => (
              <div key={performer.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{performer.name}</p>
                    <p className="text-sm text-gray-600">{performer.deals} deals closed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${performer.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
