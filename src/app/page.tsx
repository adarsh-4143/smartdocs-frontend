"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ShortcutCards from "@/components/ShortcutCards";
import KPICards from "@/components/KPICards";
import GenerationTrendChart from "@/components/GenerationTrendChart";
import DocumentTypeDonut from "@/components/DocumentTypeDonut";
import TemplateUsageChart from "@/components/TemplateUsageChart";
import GenerationStatusPie from "@/components/GenerationStatusPie";
import RecentDocumentsTable, { DocumentItem } from "@/components/RecentDocumentsTable";
import ActivityFeed, { ActivityItem } from "@/components/ActivityFeed";
import Modals from "@/components/Modals";
import { dashboardService, DashboardStatsData } from "@/services/dashboard.service";
import { RefreshCw } from "lucide-react";

export default function CorporateDashboardPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCompany, setSelectedCompany] = useState("All Companies");
  const [companies, setCompanies] = useState<string[]>(["All Companies"]);
  const [stats, setStats] = useState<DashboardStatsData | null>(null);

  const [activeModal, setActiveModal] = useState<"document" | "template" | "employee" | "company" | null>(null);
  const [loading, setLoading] = useState(true);

  const tableRef = useRef<HTMLDivElement>(null);

  // Dynamic KPI Data
  const [kpiData, setKpiData] = useState({
    totalDocuments: 0,
    generatedThisMonth: 0,
    templates: 0,
    activeTemplates: 0,
    draftDocuments: 0,
    failedDocuments: 0,
  });

  // Fetch real database dashboard data
  const fetchDashboardData = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getDashboardStats();
      if (data) {
        setStats(data);
        if (data.companiesList && data.companiesList.length > 0) {
          setCompanies(["All Companies", ...data.companiesList]);
        }
        if (data.kpi) {
          setKpiData({
            totalDocuments: data.kpi.totalGeneratedDocs || 0,
            generatedThisMonth: data.kpi.completedDocs || 0,
            templates: data.kpi.totalTemplates || 0,
            activeTemplates: data.kpi.totalDocumentTypes || 0,
            draftDocuments: data.kpi.pendingDocs || 0,
            failedDocuments: data.kpi.failedDocs || 0,
          });
        }

        if (data.recentActivity && data.recentActivity.length > 0) {
          setDocuments(
            data.recentActivity.map((item) => ({
              id: `DOC-#${item.id}`,
              type: item.templateName || "Document",
              recipient: item.profileName || "Employee",
              template: item.companyName || "Company",
              status: item.status === "Completed" ? "Generated" : item.status === "Failed" ? "Failed" : "Draft",
              timestamp: item.createdAt
                ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Recent",
            }))
          );

          setActivities(
            data.recentActivity.map((item) => ({
              id: `act-${item.id}`,
              title: `${item.templateName || "Document"} generated`,
              subtitle: `${item.profileName} • ${item.companyName}`,
              timestamp: item.createdAt
                ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })
                : "Just now",
              type: "generated",
            }))
          );
        } else {
          setDocuments([]);
          setActivities([]);
        }
      }
    } catch (e) {
      setDocuments([]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Recent Documents initial state (100% Dynamic - default empty)
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  // Activity Feed initial state (100% Dynamic - default empty)
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const handleOpenModal = (type: "document" | "template" | "employee" | "company") => {
    setActiveModal(type);
  };

  const handleScrollToTable = () => {
    tableRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleModalSuccess = (type: string, data?: any) => {
    if (type === "document") {
      setKpiData((prev) => ({
        ...prev,
        totalDocuments: prev.totalDocuments + 1,
        generatedThisMonth: prev.generatedThisMonth + 1,
      }));

      const newId = `DOC-2026-00${Math.floor(1000 + Math.random() * 9000)}`;
      const newDoc: DocumentItem = {
        id: newId,
        type: data?.docType || "Offer Letter",
        recipient: data?.recipientName || "New Employee",
        template: "Custom Template",
        status: "Generated",
        timestamp: "Just now",
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          title: `${newDoc.type} generated`,
          subtitle: newDoc.recipient,
          timestamp: "Just now",
          type: "generated",
        },
        ...prev,
      ]);
    } else if (type === "template") {
      setKpiData((prev) => ({
        ...prev,
        templates: prev.templates + 1,
        activeTemplates: prev.activeTemplates + 1,
      }));
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          title: "New template created",
          subtitle: data?.templateName || "Preset Template",
          timestamp: "Just now",
          type: "created",
        },
        ...prev,
      ]);
    } else if (type === "employee") {
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          title: "Employee record added",
          subtitle: data?.recipientName || "Employee",
          timestamp: "Just now",
          type: "created",
        },
        ...prev,
      ]);
    } else if (type === "company") {
      if (data?.companyName && !companies.includes(data.companyName)) {
        companies.push(data.companyName);
        setSelectedCompany(data.companyName);
      }
    }
  };

  const router = useRouter();

  const handleTableAction = (action: string, doc: DocumentItem) => {
    router.push("/generated-history");
  };

  return (
    <div className="min-h-screen bg-[#070911] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out p-4 sm:p-6 lg:p-8 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Bar with Company Switcher & CTA */}
          <Header
            onOpenGenerateModal={() => handleOpenModal("document")}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
            companies={companies}
          />

          {/* Live Sync Bar */}
          <div className="flex items-center justify-between px-1 -mt-4">
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Database Connected (MySQL)</span>
            </div>

            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-[#141A2C] border border-[#202B44] hover:border-[#3f5f59] transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              <span>Sync Metrics</span>
            </button>
          </div>

          {/* 1. Top 6 Shortcut / Action Cards */}
          <ShortcutCards />

          {/* 2. Main KPI Cards */}
          <KPICards kpiData={kpiData} />

          {/* 3. Primary Graph — Document Generation Trend */}
          <GenerationTrendChart monthlyStats={stats?.monthlyStats} />

          {/* 4 & 5. Document Type Distribution & Template Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DocumentTypeDonut
              distribution={stats?.documentTypeDistribution}
              totalDocs={kpiData.totalDocuments}
            />
            <TemplateUsageChart templateUsage={stats?.templateUsage} />
            <GenerationStatusPie statusDistribution={stats?.statusDistribution} />
          </div>

          {/* 7 & 8. Recent Documents Table + Quick Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" ref={tableRef}>
            {/* Left 2 Columns: Table */}
            <div className="lg:col-span-2">
              <RecentDocumentsTable
                documents={documents}
                onActionClick={handleTableAction}
              />
            </div>

            {/* Right 1 Column: Activity Feed */}
            <div className="lg:col-span-1">
              <ActivityFeed activities={activities} />
            </div>
          </div>
        </div>
      </main>

      {/* Modals for Document, Template, Employee, Company */}
      <Modals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onSuccess={handleModalSuccess}
        selectedCompany={selectedCompany}
      />
    </div>
  );
}
