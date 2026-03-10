import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ArrowRight, BarChart3, Users, Package, TrendingUp } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (isAuthenticated && user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-400">Nexis ERP</div>
          <a href={getLoginUrl()}>
            <Button variant="outline" className="border-blue-400 text-blue-400 hover:bg-blue-400/10">
              Login
            </Button>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
            Enterprise Resource Planning
            <span className="block text-blue-400">Made Simple</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Nexis ERP is a comprehensive, AI-powered enterprise resource planning system designed to streamline your business operations across Finance, HR, Inventory, CRM, Projects, and Procurement.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Get Started <ArrowRight className="ml-2" size={20} />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-800/50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Core Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Finance",
                description: "Invoice management, expense tracking, budgeting, and financial reporting",
              },
              {
                icon: Users,
                title: "HR Management",
                description: "Employee management, payroll, attendance, and leave management",
              },
              {
                icon: Package,
                title: "Inventory",
                description: "Stock tracking, warehouse management, reorder alerts, and supplier management",
              },
              {
                icon: TrendingUp,
                title: "CRM",
                description: "Customer database, sales pipeline, lead tracking, and communication history",
              },
              {
                icon: BarChart3,
                title: "Projects",
                description: "Task tracking, milestone management, resource allocation, and timelines",
              },
              {
                icon: Package,
                title: "Procurement",
                description: "Purchase orders, vendor management, approval workflows, and cost tracking",
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="bg-slate-700/50 border-slate-600 hover:border-blue-400 transition-colors">
                  <CardHeader>
                    <Icon className="w-10 h-10 text-blue-400 mb-4" />
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">AI-Powered Intelligence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Conversational AI Assistant</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <p>Ask natural language questions about your business data. Get instant insights, analytics, and recommendations powered by advanced LLMs.</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Predictive Analytics</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <p>Leverage machine learning for demand forecasting, predictive maintenance, anomaly detection, and cash flow predictions.</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Real-time Dashboards</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <p>Customizable KPI widgets with role-based views. Monitor critical metrics and get instant alerts for anomalies.</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Smart Alerts</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300">
                <p>Automated notifications for low inventory, pending approvals, overdue tasks, budget thresholds, and anomalies.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to Transform Your Business?</h2>
          <p className="text-xl text-blue-100">
            Join thousands of companies using Nexis ERP to streamline their operations and make data-driven decisions.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              Start Your Free Trial <ArrowRight className="ml-2" size={20} />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>&copy; 2026 Nexis ERP. All rights reserved. Powered by advanced AI and cloud technology.</p>
        </div>
      </footer>
    </div>
  );
}
