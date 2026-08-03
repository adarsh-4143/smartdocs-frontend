"use client";

import React, { useState, useRef } from "react";
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

export default function CorporateDashboardPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCompany, setSelectedCompany] = useState("Nighwan Technology");
  const companies = ["Nighwan Technology", "ABC Technologies", "Global Corp"];

  const [activeModal, setActiveModal] = useState<"document" | "template" | "employee" | "company" | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

  // Dynamic KPI Data
  const [kpiData, setKpiData] = useState({
    totalDocuments: 1248,
    generatedThisMonth: 184,
    templates: 42,
    activeTemplates: 37,
    draftDocuments: 16,
    failedDocuments: 3,
  });

  // Recent Documents initial state
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: "OL-2026-00124",
      type: "Offer Letter",
      recipient: "Rahul Kumar",
      template: "Developer OL",
      status: "Generated",
      timestamp: "2 min ago",
    },
    {
      id: "PS-2026-00421",
      type: "Payslip",
      recipient: "Amit Singh",
      template: "Monthly Payslip",
      status: "Sent",
      timestamp: "10 min ago",
    },
    {
      id: "QT-2026-00081",
      type: "Quotation",
      recipient: "ABC Pvt Ltd",
      template: "Standard Quote",
      status: "Generated",
      timestamp: "25 min ago",
    },
    {
      id: "EXP-2026-00032",
      type: "Experience Letter",
      recipient: "Priya Sharma",
      template: "Standard Exp Letter",
      status: "Draft",
      timestamp: "45 min ago",
    },
    {
      id: "OL-2026-00123",
      type: "Offer Letter",
      recipient: "Vikas Patel",
      template: "BDE Offer Letter",
      status: "Failed",
      timestamp: "1 hour ago",
    },
  ]);

  // Activity Feed
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: "act-1",
      title: "Offer Letter generated",
      subtitle: "Rahul Kumar",
      timestamp: "2 minutes ago",
      type: "generated",
    },
    {
      id: "act-2",
      title: "Template updated",
      subtitle: "Software Developer Offer Letter",
      timestamp: "15 minutes ago",
      type: "updated",
    },
    {
      id: "act-3",
      title: "Document sent",
      subtitle: "Amit Singh",
      timestamp: "25 minutes ago",
      type: "sent",
    },
    {
      id: "act-4",
      title: "New template created",
      subtitle: "BDE Offer Letter",
      timestamp: "1 hour ago",
      type: "created",
    },
  ]);

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

  const handleTableAction = (action: string, doc: DocumentItem) => {
    alert(`${action} triggered for Document ID: ${doc.id} (${doc.recipient})`);
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

          {/* 1. Top 6 Shortcut / Action Cards */}
          <ShortcutCards
            onOpenModal={handleOpenModal}
            onScrollToTable={handleScrollToTable}
          />

          {/* 2. Main KPI Cards */}
          <KPICards kpiData={kpiData} />

          {/* 3. Primary Graph — Document Generation Trend */}
          <GenerationTrendChart />

          {/* 4 & 5. Document Type Distribution & Template Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DocumentTypeDonut />
            <TemplateUsageChart />
            <GenerationStatusPie />
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
