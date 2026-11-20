"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { externalHrmsService } from "@/services/externalHrms.service";
import { ExternalEmployee } from "@/types/externalHrms.types";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileOutput,
  Phone,
  Mail,
  Building2,
  Briefcase,
  Calendar,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  X,
  AlertCircle,
  MapPin,
  Clock,
  User,
  Landmark,
  FileText,
  Ban,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Code,
  Layers,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import AppToast, { type ToastType } from "@/components/AppToast";

export default function EmployeesPage() {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Data states
  const [employees, setEmployees] = useState<ExternalEmployee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Main Table Pagination states (10 per page fits perfectly without page scroll)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Drawer / Detail Modal states
  const [selectedEmployee, setSelectedEmployee] = useState<ExternalEmployee | null>(null);
  const [activeTab, setActiveTab] = useState<"personal" | "employment" | "bank" | "raw">("personal");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Raw fields search & pagination inside modal
  const [rawSearch, setRawSearch] = useState<string>("");
  const [rawPage, setRawPage] = useState<number>(1);
  const rawPageSize = 8;

  // Toast notification
  const [toast, setToast] = useState<{ type: ToastType; msg: string } | null>(null);

  const showToast = (type: ToastType, msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await externalHrmsService.getEmployees();
      setEmployees(data);
    } catch (err: any) {
      console.error("External HRMS API Error:", err);
      setError(err?.message || "Failed to load employees from external HRMS");
      showToast("error", err?.message || "Failed to load employees from external HRMS");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Derived departments list
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department && e.department !== "General") set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = emp.fullName?.toLowerCase().includes(q);
        const matchesCode = emp.employeeCode?.toLowerCase().includes(q);
        const matchesDesignation = emp.designation?.toLowerCase().includes(q);
        const matchesEmail = emp.email?.toLowerCase().includes(q);
        const matchesPhone = emp.mobileNo?.includes(q);
        const matchesDept = emp.department?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDesignation && !matchesEmail && !matchesPhone && !matchesDept) {
          return false;
        }
      }

      if (selectedDepartment !== "ALL") {
        if (emp.department.toLowerCase() !== selectedDepartment.toLowerCase()) {
          return false;
        }
      }

      if (statusFilter !== "ALL") {
        const isAct = statusFilter === "ACTIVE";
        if (emp.isActive !== isAct) {
          return false;
        }
      }

      return true;
    });
  }, [employees, searchTerm, selectedDepartment, statusFilter]);

  // Main table pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEmployees = useMemo(() => {
    return filteredEmployees.slice(startIndex, startIndex + pageSize);
  }, [filteredEmployees, startIndex, pageSize]);

  // Modal navigation index
  const currentEmployeeIndex = useMemo(() => {
    if (!selectedEmployee) return -1;
    return filteredEmployees.findIndex((e) => e.id === selectedEmployee.id);
  }, [selectedEmployee, filteredEmployees]);

  const handlePrevEmployee = () => {
    if (currentEmployeeIndex > 0) {
      setSelectedEmployee(filteredEmployees[currentEmployeeIndex - 1]);
      setRawPage(1);
    }
  };

  const handleNextEmployee = () => {
    if (currentEmployeeIndex >= 0 && currentEmployeeIndex < filteredEmployees.length - 1) {
      setSelectedEmployee(filteredEmployees[currentEmployeeIndex + 1]);
      setRawPage(1);
    }
  };

  // Keyboard navigation for drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedEmployee) return;
      if (e.key === "Escape") {
        setSelectedEmployee(null);
      } else if (e.key === "ArrowLeft") {
        handlePrevEmployee();
      } else if (e.key === "ArrowRight") {
        handleNextEmployee();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEmployee, currentEmployeeIndex, filteredEmployees]);

  // Raw fields calculations for modal
  const rawFieldsList = useMemo(() => {
    if (!selectedEmployee?.rawDetails) return [];
    const entries = Object.entries(selectedEmployee.rawDetails);
    if (!rawSearch) return entries;
    const q = rawSearch.toLowerCase();
    return entries.filter(
      ([key, val]) =>
        key.toLowerCase().includes(q) ||
        String(val ?? "").toLowerCase().includes(q)
    );
  }, [selectedEmployee, rawSearch]);

  const totalRawPages = Math.ceil(rawFieldsList.length / rawPageSize) || 1;
  const paginatedRawFields = useMemo(() => {
    const start = (rawPage - 1) * rawPageSize;
    return rawFieldsList.slice(start, start + rawPageSize);
  }, [rawFieldsList, rawPage, rawPageSize]);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate page numbers for main pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const activeCount = employees.filter((e) => e.isActive).length;
  const inactiveCount = employees.length - activeCount;

  const handleGenerateDoc = (empId: number) => {
    router.push(`/document-generation?employeeId=${empId}`);
  };

  return (
    <div className="h-screen bg-[#070911] text-slate-100 flex overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area: Fixed 100vh height with ZERO page scrolling */}
      <main
        className={`flex-1 h-screen overflow-hidden flex flex-col transition-all duration-300 ease-in-out p-3 sm:p-5 lg:p-6 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0 space-y-3.5 max-w-7xl mx-auto w-full overflow-hidden">
          {toast && (
            <div className="flex-shrink-0">
              <AppToast type={toast.type} message={toast.msg} onClose={() => setToast(null)} />
            </div>
          )}

          {/* Page Header (Fixed height, no scroll) */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Employee Directory
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Live HRMS API
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Synchronized staff directory from external HRMS for instant document auto-fill and verification
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={fetchEmployees}
                className="p-2 rounded-xl bg-[#0F1422] hover:bg-[#151C2F] text-slate-400 hover:text-white border border-[#1E2638] transition-all cursor-pointer"
                title="Refresh Directory"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => router.push("/document-generation")}
                className="gradient-btn flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-xs cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <FileOutput className="w-4 h-4" />
                <span>Generate Document</span>
              </button>
            </div>
          </div>

          {/* Error Banner if any */}
          {error && (
            <div className="flex-shrink-0 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchEmployees}
                className="px-3 py-1 bg-rose-900 hover:bg-rose-800 rounded text-[11px] text-white font-semibold cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Compact KPI Overview Tiles (Fixed height, no scroll) */}
          <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card p-3 rounded-xl border border-[#1E2638]">
              <span className="text-[10px] text-slate-400 block font-medium">
                Total Live Employees
              </span>
              <span className="text-xl font-extrabold text-white font-mono mt-0.5 block">
                {employees.length}
              </span>
            </div>

            <div className="glass-card p-3 rounded-xl border border-[#1E2638]">
              <span className="text-[10px] text-slate-400 block font-medium">
                Active Personnel
              </span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5 block">
                {activeCount}
              </span>
            </div>

            <div className="glass-card p-3 rounded-xl border border-[#1E2638]">
              <span className="text-[10px] text-slate-400 block font-medium">
                Inactive Records
              </span>
              <span className="text-xl font-extrabold text-slate-400 font-mono mt-0.5 block">
                {inactiveCount}
              </span>
            </div>

            <div className="glass-card p-3 rounded-xl border border-[#1E2638]">
              <span className="text-[10px] text-slate-400 block font-medium">
                Total Departments
              </span>
              <span className="text-xl font-extrabold text-indigo-400 font-mono mt-0.5 block">
                {departments.length}
              </span>
            </div>
          </div>

          {/* Filters & Actions Bar (Fixed height, no scroll) */}
          <div className="flex-shrink-0 glass-card p-3 rounded-xl border border-[#1E2638] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Department Filter */}
              <div className={`page-filter float-field ${selectedDepartment !== "ALL" ? "is-filled" : ""}`}>
                <Filter className="page-filter-icon" />
                <select
                  id="employee-dept-filter"
                  value={selectedDepartment === "ALL" ? "" : selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value || "ALL");
                    setCurrentPage(1);
                  }}
                  className="float-input"
                >
                  <option value="" hidden disabled />
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <label htmlFor="employee-dept-filter" className="float-label">
                  Department
                </label>
                {selectedDepartment !== "ALL" && (
                  <button
                    type="button"
                    className="page-filter-clear"
                    onClick={() => {
                      setSelectedDepartment("ALL");
                      setCurrentPage(1);
                    }}
                    title="Clear department filter"
                  >
                    <X />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className={`page-filter float-field ${statusFilter !== "ALL" ? "is-filled" : ""}`}>
                <Filter className="page-filter-icon" />
                <select
                  id="employee-status-filter"
                  value={statusFilter === "ALL" ? "" : statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value || "ALL");
                    setCurrentPage(1);
                  }}
                  className="float-input"
                >
                  <option value="" hidden disabled />
                  <option value="ACTIVE">Active Only</option>
                  <option value="INACTIVE">Inactive Only</option>
                </select>
                <label htmlFor="employee-status-filter" className="float-label">
                  Status
                </label>
                {statusFilter !== "ALL" && (
                  <button
                    type="button"
                    className="page-filter-clear"
                    onClick={() => {
                      setStatusFilter("ALL");
                      setCurrentPage(1);
                    }}
                    title="Clear status filter"
                  >
                    <X />
                  </button>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className={`page-search float-field w-full sm:w-80 ${searchTerm ? "is-filled" : ""}`}>
              <Search className="page-search-icon" />
              <input
                id="employee-search"
                type="text"
                placeholder=" "
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="float-input"
                autoComplete="off"
              />
              <label htmlFor="employee-search" className="float-label">
                Search by name, code, role...
              </label>
              {searchTerm && (
                <button
                  type="button"
                  className="page-filter-clear"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  title="Clear search"
                >
                  <X />
                </button>
              )}
            </div>
          </div>

          {/* Employee Data Table Box (Fills remaining height, internal scrolling with sticky header, ZERO page scroll) */}
          <div className="flex-1 min-h-0 flex flex-col glass-card rounded-2xl border border-[#1E2638] overflow-hidden">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                <p className="text-xs font-mono">Loading employee directory from external HRMS...</p>
              </div>
            ) : (
              <>
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                  <table className="w-full text-left text-xs text-slate-300 table-fixed">
                    <thead className="sticky top-0 z-10 bg-[#0B0E1B] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-[#1E2638] shadow-sm">
                      <tr>
                        <th className="py-2.5 px-3 font-bold w-[10%]">Code</th>
                        <th className="py-2.5 px-3 font-bold w-[20%]">Employee Name</th>
                        <th className="py-2.5 px-3 font-bold w-[12%]">Department</th>
                        <th className="py-2.5 px-3 font-bold w-[16%]">Designation & Role</th>
                        <th className="py-2.5 px-3 font-bold w-[18%]">Contact Info</th>
                        <th className="py-2.5 px-3 font-bold w-[12%]">Office Location</th>
                        <th className="py-2.5 px-3 font-bold w-[8%] text-center">Status</th>
                        <th className="py-2.5 px-3 font-bold text-right w-[6%]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2638]">
                      {paginatedEmployees.length > 0 ? (
                        paginatedEmployees.map((emp) => {
                          const initials = emp.fullName
                            ? emp.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .filter(Boolean)
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()
                            : "EM";

                          return (
                            <tr
                              key={emp.id}
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setActiveTab("personal");
                                setRawPage(1);
                              }}
                              className="hover:bg-[#121829] transition-colors group cursor-pointer"
                            >
                              {/* Code */}
                              <td className="py-2 px-3 font-mono font-bold text-indigo-400 truncate">
                                {emp.employeeCode}
                              </td>

                              {/* Employee Name */}
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {emp.profileImage ? (
                                    <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-slate-800 border border-[#232F4C] flex-shrink-0">
                                      <Image
                                        src={emp.profileImage}
                                        alt={emp.fullName}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300 flex-shrink-0">
                                      {initials}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <span className="font-bold text-white block group-hover:text-indigo-300 transition-colors truncate">
                                      {emp.fullName}
                                    </span>
                                    {emp.fatherorHusbandName && (
                                      <span className="text-[10px] text-slate-500 truncate block">
                                        c/o {emp.fatherorHusbandName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Department */}
                              <td className="py-2 px-3">
                                <span className="px-2 py-0.5 rounded bg-[#151C2F] text-slate-300 border border-[#222E48] font-medium text-[11px] truncate block max-w-fit">
                                  {emp.department || "General"}
                                </span>
                              </td>

                              {/* Designation & Role */}
                              <td className="py-2 px-3">
                                <span className="text-slate-200 font-medium block truncate">
                                  {emp.designation || "—"}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {emp.workType || "Full-Time"}
                                </span>
                              </td>

                              {/* Contact Info */}
                              <td className="py-2 px-3">
                                {emp.email ? (
                                  <span className="font-mono text-slate-300 block truncate">
                                    {emp.email}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 block truncate">—</span>
                                )}
                                {emp.mobileNo && (
                                  <span className="text-[11px] text-slate-400 block font-mono truncate">
                                    {emp.mobileNo}
                                  </span>
                                )}
                              </td>

                              {/* Office Location & Shift */}
                              <td className="py-2 px-3">
                                <span className="text-slate-300 block truncate">
                                  {emp.officeLocation || "Headquarters"}
                                </span>
                                {emp.workShift && (
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    Shift: {emp.workShift}
                                  </span>
                                )}
                              </td>

                              {/* Status */}
                              <td className="py-2 px-3 text-center">
                                {emp.isActive ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-slate-400 border border-slate-700 whitespace-nowrap">
                                    <Ban className="w-2.5 h-2.5" /> Inactive
                                  </span>
                                )}
                              </td>

                              {/* Actions: Clean Icon-Only buttons to completely eliminate horizontal scrolling */}
                              <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedEmployee(emp);
                                      setActiveTab("personal");
                                      setRawPage(1);
                                    }}
                                    className="p-1.5 rounded-lg bg-[#0F1422] hover:bg-[#151C2F] text-slate-400 hover:text-white border border-[#1E2638] transition-all cursor-pointer flex-shrink-0"
                                    title="View Profile Details"
                                    aria-label="View Profile Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleGenerateDoc(emp.id)}
                                    className="p-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-white transition-all shadow-sm cursor-pointer flex-shrink-0"
                                    title="Generate Document with this Employee"
                                    aria-label="Generate Document"
                                  >
                                    <FileOutput className="w-3.5 h-3.5 text-indigo-400" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                            <Users className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                            <p className="text-sm font-medium text-slate-300">No employees match your search criteria</p>
                            <p className="text-xs text-slate-500">Try adjusting your filters or search keywords</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Main Table Pagination Controls: Pinned at bottom of table box */}
                {filteredEmployees.length > 0 && (
                  <div className="flex-shrink-0 p-2.5 px-4 border-t border-[#1E2638] bg-[#0B0E1B] flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
                    {/* Rows per page & counter */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                      <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="bg-[#0F1422] border border-[#1E2638] rounded-lg px-2 py-0.5 text-slate-200 text-xs focus:outline-none cursor-pointer"
                        >
                          <option value={10}>10</option>
                          <option value={15}>15</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                      </div>

                      <span className="text-slate-500">|</span>

                      <div>
                        Showing <span className="text-white font-bold">{startIndex + 1}</span>–
                        <span className="text-white font-bold">
                          {Math.min(startIndex + pageSize, filteredEmployees.length)}
                        </span>{" "}
                        of <span className="text-white font-bold">{filteredEmployees.length}</span>
                      </div>
                    </div>

                    {/* Pagination page numbers */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      {/* First Page */}
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-1 rounded-lg bg-[#0F1422] border border-[#1E2638] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        title="First Page"
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </button>

                      {/* Prev Page */}
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded-lg bg-[#0F1422] border border-[#1E2638] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      {/* Numbered Pills */}
                      {getPageNumbers().map((num, idx) =>
                        num === "..." ? (
                          <span key={`dots-${idx}`} className="px-1.5 py-0.5 text-slate-600">
                            ...
                          </span>
                        ) : (
                          <button
                            key={`page-${num}`}
                            onClick={() => setCurrentPage(Number(num))}
                            className={`min-w-[26px] h-6 px-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              currentPage === num
                                ? "gradient-btn text-white shadow-md shadow-indigo-500/20"
                                : "bg-[#0F1422] border border-[#1E2638] text-slate-400 hover:text-white hover:bg-[#151C2F]"
                            }`}
                          >
                            {num}
                          </button>
                        )
                      )}

                      {/* Next Page */}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="p-1 rounded-lg bg-[#0F1422] border border-[#1E2638] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        title="Next Page"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Last Page */}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage >= totalPages}
                        className="p-1 rounded-lg bg-[#0F1422] border border-[#1E2638] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        title="Last Page"
                      >
                        <ChevronsRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ─── Employee Details Modal (Box Table + Modal Pagination) ─────── */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-[#0B0E1B] border-l border-[#1E2638] h-full flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1E2638] bg-[#0F1422] flex items-start justify-between gap-4 flex-shrink-0">
              <div className="flex items-center gap-4">
                {selectedEmployee.profileImage ? (
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border-2 border-indigo-500/40 shadow-lg flex-shrink-0">
                    <Image
                      src={selectedEmployee.profileImage}
                      alt={selectedEmployee.fullName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-indigo-950/90 border-2 border-indigo-500/40 flex items-center justify-center font-bold text-lg text-indigo-300 shadow-lg flex-shrink-0">
                    {selectedEmployee.fullName ? selectedEmployee.fullName[0] : "E"}
                  </div>
                )}

                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                    {selectedEmployee.fullName}
                  </h2>
                  <p className="text-xs text-indigo-300 font-medium mt-0.5">
                    {selectedEmployee.designation} &bull; <span className="text-slate-400">{selectedEmployee.department}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-mono text-xs bg-[#151C2F] text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-bold">
                      {selectedEmployee.employeeCode}
                    </span>
                    {selectedEmployee.isActive ? (
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Active Personnel
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">
                        <Ban className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 rounded-xl bg-[#151C2F] text-slate-400 hover:text-white border border-[#1E2638] transition cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Navigation Strip (Pagination between employees) */}
            <div className="px-5 py-2 bg-[#0B0E1B] border-b border-[#1E2638] flex items-center justify-between text-xs font-mono flex-shrink-0">
              <span className="text-slate-400">
                Employee <span className="text-white font-bold">{currentEmployeeIndex + 1}</span> of{" "}
                <span className="text-white font-bold">{filteredEmployees.length}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevEmployee}
                  disabled={currentEmployeeIndex <= 0}
                  className="px-2 py-0.5 rounded bg-[#0F1422] hover:bg-[#151C2F] border border-[#1E2638] text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                  title="Previous Employee (Left Arrow)"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>Prev</span>
                </button>
                <button
                  onClick={handleNextEmployee}
                  disabled={currentEmployeeIndex >= filteredEmployees.length - 1}
                  className="px-2 py-0.5 rounded bg-[#0F1422] hover:bg-[#151C2F] border border-[#1E2638] text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                  title="Next Employee (Right Arrow)"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-[#1E2638] bg-[#0F1422] px-5 text-xs overflow-x-auto flex-shrink-0">
              <button
                onClick={() => setActiveTab("personal")}
                className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === "personal"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <User className="w-3.5 h-3.5" /> Personal Details
              </button>
              <button
                onClick={() => setActiveTab("employment")}
                className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === "employment"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" /> Employment & Role
              </button>
              <button
                onClick={() => setActiveTab("bank")}
                className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === "bank"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Landmark className="w-3.5 h-3.5" /> Identity & Banking
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`py-3 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === "raw"
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Raw HRMS Fields ({rawFieldsList.length})
              </button>
            </div>

            {/* Drawer Body Content: Structured Box Table Layout */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#070911]/60">
              {/* TAB 1: PERSONAL DETAILS TABLE BOX */}
              {activeTab === "personal" && (
                <div className="space-y-4">
                  <div className="glass-card rounded-2xl border border-[#1E2638] overflow-hidden shadow-lg">
                    <div className="bg-[#0F1422] px-4 py-2.5 border-b border-[#1E2638] flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                        Personal Information
                      </span>
                    </div>
                    <table className="w-full text-left text-xs">
                      <tbody className="divide-y divide-[#1E2638]">
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Father / Husband Name
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-white">
                            {selectedEmployee.fatherorHusbandName || "—"}
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Date of Birth
                          </td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-white">
                            {selectedEmployee.dob || "—"}
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Gender
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-white">
                            {selectedEmployee.gender || "—"}
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Blood Group
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-white">
                            {selectedEmployee.bloodGroup ? (
                              <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30 font-bold font-mono">
                                {selectedEmployee.bloodGroup}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Marital Status
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-white">
                            {selectedEmployee.maritalStatus || "—"}
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Mobile Number
                          </td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-white flex items-center justify-between">
                            <span>{selectedEmployee.mobileNo || "—"}</span>
                            {selectedEmployee.mobileNo && (
                              <button
                                onClick={() => copyToClipboard(selectedEmployee.mobileNo!, "mobile")}
                                className="p-1 text-slate-500 hover:text-white transition cursor-pointer"
                                title="Copy mobile number"
                              >
                                {copiedKey === "mobile" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Official Email Address
                          </td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-indigo-300 flex items-center justify-between">
                            <span className="truncate">{selectedEmployee.email || "—"}</span>
                            {selectedEmployee.email && (
                              <button
                                onClick={() => copyToClipboard(selectedEmployee.email!, "email")}
                                className="p-1 text-slate-500 hover:text-white transition cursor-pointer"
                                title="Copy email address"
                              >
                                {copiedKey === "email" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: EMPLOYMENT DETAILS TABLE BOX */}
              {activeTab === "employment" && (
                <div className="space-y-4">
                  <div className="glass-card rounded-2xl border border-[#1E2638] overflow-hidden shadow-lg">
                    <div className="bg-[#0F1422] px-4 py-2.5 border-b border-[#1E2638] flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                        Employment Specifications
                      </span>
                    </div>
                    <table className="w-full text-left text-xs">
                      <tbody className="divide-y divide-[#1E2638]">
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Department
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-white">
                            <span className="px-2 py-0.5 rounded bg-[#151C2F] text-indigo-300 border border-[#1E2638] font-medium">
                              {selectedEmployee.department}
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Designation
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-white">
                            {selectedEmployee.designation}
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Role Title
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-white">
                            {selectedEmployee.role || selectedEmployee.designation}
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Joining Date
                          </td>
                          <td className="py-2.5 px-4 font-mono font-semibold text-white">
                            {selectedEmployee.joiningDate || "—"}
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Office Location
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-white flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            <span>{selectedEmployee.officeLocation}</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Work Shift
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-white flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{selectedEmployee.workShift}</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Work Type
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-white">
                            {selectedEmployee.workType}
                          </td>
                        </tr>
                        {selectedEmployee.probationEndDate && (
                          <tr className="hover:bg-[#121829]/60 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                              Probation End Date
                            </td>
                            <td className="py-2.5 px-4 font-mono font-semibold text-white">
                              {selectedEmployee.probationEndDate}
                            </td>
                          </tr>
                        )}
                        {selectedEmployee.dateofPermanecy && (
                          <tr className="hover:bg-[#121829]/60 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                              Date of Permanency
                            </td>
                            <td className="py-2.5 px-4 font-mono font-semibold text-white">
                              {selectedEmployee.dateofPermanecy}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: IDENTITY & BANKING DETAILS TABLE BOX */}
              {activeTab === "bank" && (
                <div className="space-y-5">
                  {/* Government Identity Box */}
                  <div className="glass-card rounded-2xl border border-[#1E2638] overflow-hidden shadow-lg">
                    <div className="bg-[#0F1422] px-4 py-2.5 border-b border-[#1E2638] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                        Government Identification
                      </span>
                    </div>
                    <table className="w-full text-left text-xs">
                      <tbody className="divide-y divide-[#1E2638]">
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            PAN Card Number
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-white flex items-center justify-between">
                            <span>{selectedEmployee.panNumber || "—"}</span>
                            {selectedEmployee.panNumber && (
                              <button
                                onClick={() => copyToClipboard(selectedEmployee.panNumber, "pan")}
                                className="p-1 text-slate-500 hover:text-white transition cursor-pointer"
                                title="Copy PAN Number"
                              >
                                {copiedKey === "pan" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Aadhaar Card Number
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-white flex items-center justify-between">
                            <span>{selectedEmployee.aadharNumber || "—"}</span>
                            {selectedEmployee.aadharNumber && (
                              <button
                                onClick={() => copyToClipboard(selectedEmployee.aadharNumber, "aadhar")}
                                className="p-1 text-slate-500 hover:text-white transition cursor-pointer"
                                title="Copy Aadhaar Number"
                              >
                                {copiedKey === "aadhar" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Bank Account Box */}
                  <div className="glass-card rounded-2xl border border-[#1E2638] overflow-hidden shadow-lg">
                    <div className="bg-[#0F1422] px-4 py-2.5 border-b border-[#1E2638] flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                        Bank Account Information
                      </span>
                    </div>
                    <table className="w-full text-left text-xs">
                      <tbody className="divide-y divide-[#1E2638]">
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Bank Name
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-white">
                            {selectedEmployee.bankName || "—"}
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            Account Number
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-white flex items-center justify-between">
                            <span>{selectedEmployee.accountNumber || "—"}</span>
                            {selectedEmployee.accountNumber && (
                              <button
                                onClick={() => copyToClipboard(selectedEmployee.accountNumber, "acc")}
                                className="p-1 text-slate-500 hover:text-white transition cursor-pointer"
                                title="Copy Account Number"
                              >
                                {copiedKey === "acc" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </td>
                        </tr>
                        <tr className="hover:bg-[#121829]/60 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-400 w-2/5 bg-[#0B0E1B]/60 border-r border-[#1E2638]">
                            IFSC Code
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-indigo-300 flex items-center justify-between">
                            <span>{selectedEmployee.ifscCode || "—"}</span>
                            {selectedEmployee.ifscCode && (
                              <button
                                onClick={() => copyToClipboard(selectedEmployee.ifscCode, "ifsc")}
                                className="p-1 text-slate-500 hover:text-white transition cursor-pointer"
                                title="Copy IFSC Code"
                              >
                                {copiedKey === "ifsc" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: RAW HRMS FIELDS WITH PAGINATED TABLE */}
              {activeTab === "raw" && (
                <div className="space-y-4">
                  {/* Search inside raw fields */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter fields by name or value..."
                        value={rawSearch}
                        onChange={(e) => {
                          setRawSearch(e.target.value);
                          setRawPage(1);
                        }}
                        className="w-full bg-[#0F1422] border border-[#1E2638] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      {rawSearch && (
                        <button
                          onClick={() => {
                            setRawSearch("");
                            setRawPage(1);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Raw Fields Box Table */}
                  <div className="glass-card rounded-2xl border border-[#1E2638] overflow-hidden shadow-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0F1422] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-[#1E2638]">
                        <tr>
                          <th className="py-2.5 px-4 font-bold w-2/5">HRMS Field Key</th>
                          <th className="py-2.5 px-4 font-bold">Resolved Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E2638]">
                        {paginatedRawFields.length > 0 ? (
                          paginatedRawFields.map(([key, value]) => (
                            <tr key={key} className="hover:bg-[#121829]/60 transition-colors">
                              <td className="py-2.5 px-4 font-mono font-medium text-indigo-400 bg-[#0B0E1B]/60 border-r border-[#1E2638] select-all">
                                {key}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-slate-200 break-all">
                                {value === null || value === undefined
                                  ? <span className="text-slate-600 italic">null</span>
                                  : typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="py-8 text-center text-slate-500">
                              No fields matching "{rawSearch}"
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Raw Fields Table Pagination */}
                    {rawFieldsList.length > 0 && (
                      <div className="p-2.5 border-t border-[#1E2638] bg-[#0F1422] flex items-center justify-between text-xs text-slate-400 font-mono">
                        <div>
                          Field {(rawPage - 1) * rawPageSize + 1}–
                          {Math.min(rawPage * rawPageSize, rawFieldsList.length)} of {rawFieldsList.length}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setRawPage((p) => Math.max(1, p - 1))}
                            disabled={rawPage === 1}
                            className="p-1 rounded-lg bg-[#0B0E1B] border border-[#1E2638] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2">
                            {rawPage} / {totalRawPages}
                          </span>
                          <button
                            onClick={() => setRawPage((p) => Math.min(totalRawPages, p + 1))}
                            disabled={rawPage >= totalRawPages}
                            className="p-1 rounded-lg bg-[#0B0E1B] border border-[#1E2638] text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-[#1E2638] bg-[#0F1422] flex items-center justify-between gap-3 flex-shrink-0">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-[#151C2F] hover:bg-[#1B253E] border border-[#1E2638] text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => handleGenerateDoc(selectedEmployee.id)}
                className="gradient-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-xs cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <FileOutput className="w-4 h-4" />
                <span>Generate Document for {selectedEmployee.fullName.split(" ")[0]}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
