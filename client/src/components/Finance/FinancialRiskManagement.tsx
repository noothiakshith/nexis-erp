import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  Eye,
  Bell,
  Settings,
  Activity,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Percent,
  BarChart3,
  PieChart,
  Users,
  Building,
  Globe
} from "lucide-react";

interface RiskMetric {
  id: string;
  name: string;
  category: 'credit' | 'market' | 'operational' | 'liquidity' | 'compliance';
  currentLevel: number;
  threshold: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  lastUpdated: Date;
  mitigation: string[];
}

interface RiskAlert {
  id: string;
  type: 'threshold_breach' | 'trend_warning' | 'compliance_issue' | 'market_volatility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedMetrics: string[];
  recommendedActions: string[];
  createdAt: Date;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface ComplianceCheck {
  id: string;
  regulation: string;
  status: 'compliant' | 'warning' | 'non_compliant';
  lastCheck: Date;
  nextCheck: Date;
  requirements: string[];
  gaps?: string[];
}

interface RiskScenario {
  id: string;
  name: string;
  description: string;
  probability: number;
  impact: number;
  riskScore: number;
  affectedAreas: string[];
  mitigationCost: number;
  potentialLoss: number;
}

export function FinancialRiskManagement() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [alertsFilter, setAlertsFilter] = useState<string>("active");

  // Risk Metrics
  const riskMetrics: RiskMetric[] = [
    {
      id: "risk-1",
      name: "Credit Risk Exposure",
      category: "credit",
      currentLevel: 15.2,
      threshold: 20,
      trend: "increasing",
      impact: "high",
      probability: 25,
      lastUpdated: new Date(),
      mitigation: ["Diversify customer base", "Implement stricter credit checks", "Increase credit insurance coverage"]
    },
    {
      id: "risk-2",
      name: "Market Volatility Impact",
      category: "market",
      currentLevel: 8.7,
      threshold: 12,
      trend: "stable",
      impact: "medium",
      probability: 40,
      lastUpdated: new Date(),
      mitigation: ["Hedge currency exposure", "Diversify investment portfolio", "Monitor market indicators"]
    },
    {
      id: "risk-3",
      name: "Operational Risk Score",
      category: "operational",
      currentLevel: 22.1,
      threshold: 25,
      trend: "decreasing",
      impact: "high",
      probability: 35,
      lastUpdated: new Date(),
      mitigation: ["Improve process documentation", "Enhance staff training", "Implement backup systems"]
    },
    {
      id: "risk-4",
      name: "Liquidity Risk Ratio",
      category: "liquidity",
      currentLevel: 1.8,
      threshold: 1.5,
      trend: "stable",
      impact: "critical",
      probability: 15,
      lastUpdated: new Date(),
      mitigation: ["Maintain cash reserves", "Establish credit facilities", "Optimize working capital"]
    },
    {
      id: "risk-5",
      name: "Compliance Risk Level",
      category: "compliance",
      currentLevel: 5.3,
      threshold: 10,
      trend: "decreasing",
      impact: "medium",
      probability: 20,
      lastUpdated: new Date(),
      mitigation: ["Regular compliance audits", "Staff training programs", "Update policies and procedures"]
    }
  ];

  // Risk Alerts
  const riskAlerts: RiskAlert[] = [
    {
      id: "alert-1",
      type: "threshold_breach",
      severity: "high",
      title: "Credit Risk Approaching Threshold",
      description: "Credit risk exposure has increased to 15.2%, approaching the 20% threshold limit",
      affectedMetrics: ["Credit Risk Exposure"],
      recommendedActions: [
        "Review and tighten credit approval criteria",
        "Increase collection efforts on overdue accounts",
        "Consider credit insurance for large exposures"
      ],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "active"
    },
    {
      id: "alert-2",
      type: "market_volatility",
      severity: "medium",
      title: "Increased Market Volatility Detected",
      description: "Market volatility indicators show 25% increase in the past week",
      affectedMetrics: ["Market Volatility Impact"],
      recommendedActions: [
        "Review hedging strategies",
        "Monitor currency exposure",
        "Consider reducing market-sensitive investments"
      ],
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: "acknowledged"
    },
    {
      id: "alert-3",
      type: "compliance_issue",
      severity: "critical",
      title: "Regulatory Reporting Deadline Approaching",
      description: "SOX compliance report due in 3 days with incomplete documentation",
      affectedMetrics: ["Compliance Risk Level"],
      recommendedActions: [
        "Complete missing documentation immediately",
        "Assign dedicated compliance officer",
        "Schedule emergency compliance review"
      ],
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: "active"
    }
  ];

  // Compliance Checks
  const complianceChecks: ComplianceCheck[] = [
    {
      id: "comp-1",
      regulation: "SOX (Sarbanes-Oxley)",
      status: "warning",
      lastCheck: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextCheck: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      requirements: ["Financial controls documentation", "Management certification", "Auditor attestation"],
      gaps: ["Incomplete control testing documentation"]
    },
    {
      id: "comp-2",
      regulation: "GDPR (Data Protection)",
      status: "compliant",
      lastCheck: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      nextCheck: new Date(Date.now() + 76 * 24 * 60 * 60 * 1000),
      requirements: ["Data processing agreements", "Privacy policies", "Breach notification procedures"]
    },
    {
      id: "comp-3",
      regulation: "PCI DSS (Payment Security)",
      status: "compliant",
      lastCheck: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      nextCheck: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
      requirements: ["Secure payment processing", "Network security", "Regular security testing"]
    },
    {
      id: "comp-4",
      regulation: "Basel III (Banking)",
      status: "non_compliant",
      lastCheck: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      nextCheck: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      requirements: ["Capital adequacy ratios", "Liquidity coverage", "Risk management framework"],
      gaps: ["Insufficient Tier 1 capital ratio", "Liquidity buffer below minimum"]
    }
  ];

  // Risk Scenarios
  const riskScenarios: RiskScenario[] = [
    {
      id: "scenario-1",
      name: "Economic Recession",
      description: "Severe economic downturn affecting customer payments and market conditions",
      probability: 25,
      impact: 85,
      riskScore: 21.25,
      affectedAreas: ["Credit Risk", "Market Risk", "Liquidity Risk"],
      mitigationCost: 150000,
      potentialLoss: 2500000
    },
    {
      id: "scenario-2",
      name: "Cyber Security Breach",
      description: "Major data breach affecting customer information and financial systems",
      probability: 15,
      impact: 90,
      riskScore: 13.5,
      affectedAreas: ["Operational Risk", "Compliance Risk"],
      mitigationCost: 200000,
      potentialLoss: 5000000
    },
    {
      id: "scenario-3",
      name: "Key Customer Default",
      description: "Default by largest customer representing 30% of revenue",
      probability: 10,
      impact: 70,
      riskScore: 7,
      affectedAreas: ["Credit Risk", "Liquidity Risk"],
      mitigationCost: 50000,
      potentialLoss: 1200000
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'credit': return 'bg-red-100 text-red-700 border-red-200';
      case 'market': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'operational': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'liquidity': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'compliance': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'non_compliant': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-emerald-600" />;
      case 'stable': return <Activity className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  const filteredMetrics = selectedCategory === 'all' 
    ? riskMetrics 
    : riskMetrics.filter(metric => metric.category === selectedCategory);

  const filteredAlerts = riskAlerts.filter(alert => 
    alertsFilter === 'all' || alert.status === alertsFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="w-7 h-7 text-blue-600" />
            Financial Risk Management
          </h2>
          <p className="text-slate-500 text-sm">Comprehensive risk monitoring, assessment, and mitigation</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Risk Settings
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Create Alert
          </Button>
        </div>
      </div>

      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {['credit', 'market', 'operational', 'liquidity', 'compliance'].map((category) => {
          const categoryMetrics = riskMetrics.filter(m => m.category === category);
          const avgRisk = categoryMetrics.reduce((sum, m) => sum + m.currentLevel, 0) / categoryMetrics.length;
          const highRiskCount = categoryMetrics.filter(m => m.currentLevel > m.threshold * 0.8).length;
          
          return (
            <Card key={category} className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700 capitalize">{category} Risk</p>
                    <h3 className="text-xl font-bold text-slate-900">{avgRisk.toFixed(1)}%</h3>
                  </div>
                  <Badge className={getCategoryColor(category)}>
                    {highRiskCount} alerts
                  </Badge>
                </div>
                <Progress value={avgRisk} className="h-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Risk Metrics */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Risk Metrics Dashboard
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Button>
              {['credit', 'market', 'operational', 'liquidity', 'compliance'].map((category) => (
                <Button 
                  key={category}
                  size="sm" 
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMetrics.map((metric) => (
              <div key={metric.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{metric.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getCategoryColor(metric.category)}>
                        {metric.category}
                      </Badge>
                      <Badge className={getSeverityColor(metric.impact)}>
                        {metric.impact} impact
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getTrendIcon(metric.trend)}
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{metric.currentLevel}%</p>
                      <p className="text-xs text-slate-500">Threshold: {metric.threshold}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <Progress 
                    value={(metric.currentLevel / metric.threshold) * 100} 
                    className="h-3"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Risk Probability</p>
                    <div className="flex items-center gap-2">
                      <Progress value={metric.probability} className="h-2 flex-1" />
                      <span className="text-sm font-medium text-slate-900">{metric.probability}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Mitigation Actions</p>
                    <div className="flex gap-1">
                      {metric.mitigation.slice(0, 2).map((action, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {action.split(' ').slice(0, 2).join(' ')}...
                        </Badge>
                      ))}
                      {metric.mitigation.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{metric.mitigation.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Alerts and Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Alerts */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Risk Alerts
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={alertsFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setAlertsFilter('active')}
                >
                  Active
                </Button>
                <Button 
                  size="sm" 
                  variant={alertsFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setAlertsFilter('all')}
                >
                  All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className="p-3 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-900 text-sm">{alert.title}</h4>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-3">{alert.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                      {alert.createdAt.toLocaleDateString()} {alert.createdAt.toLocaleTimeString()}
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      {alert.status === 'active' && (
                        <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceChecks.map((check) => (
                <div key={check.id} className="p-3 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-900 text-sm">{check.regulation}</h4>
                    <Badge className={getComplianceStatusColor(check.status)}>
                      {check.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                    <div>
                      <span className="font-medium">Last Check:</span> {check.lastCheck.toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Next Check:</span> {check.nextCheck.toLocaleDateString()}
                    </div>
                  </div>
                  
                  {check.gaps && check.gaps.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-red-700 mb-1">Compliance Gaps:</p>
                      <ul className="text-xs text-red-600 space-y-1">
                        {check.gaps.map((gap, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Button size="sm" variant="outline" className="w-full h-6 text-xs">
                    <Settings className="w-3 h-3 mr-1" />
                    Manage Compliance
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Scenarios */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Risk Scenario Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {riskScenarios.map((scenario) => (
              <div key={scenario.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-slate-900">{scenario.name}</h4>
                  <Badge className={getSeverityColor(
                    scenario.riskScore > 15 ? 'critical' : 
                    scenario.riskScore > 10 ? 'high' : 
                    scenario.riskScore > 5 ? 'medium' : 'low'
                  )}>
                    Risk: {scenario.riskScore.toFixed(1)}
                  </Badge>
                </div>
                
                <p className="text-sm text-slate-600 mb-3">{scenario.description}</p>
                
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Probability</span>
                    <span className="text-xs font-medium">{scenario.probability}%</span>
                  </div>
                  <Progress value={scenario.probability} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Impact</span>
                    <span className="text-xs font-medium">{scenario.impact}%</span>
                  </div>
                  <Progress value={scenario.impact} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <p className="text-slate-600">Mitigation Cost</p>
                    <p className="font-medium text-slate-900">${scenario.mitigationCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Potential Loss</p>
                    <p className="font-medium text-red-700">${scenario.potentialLoss.toLocaleString()}</p>
                  </div>
                </div>
                
                <Button size="sm" variant="outline" className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Run Simulation
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}