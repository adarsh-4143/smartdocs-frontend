"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  FileText,
  FileCode2,
  UserPlus,
  Building2,
  CheckCircle2,
  Upload,
} from "lucide-react";

interface ModalsProps {
  activeModal: "document" | "template" | "employee" | "company" | null;
  onClose: () => void;
  onSuccess: (type: string, data?: any) => void;
  selectedCompany: string;
}

export default function Modals({
  activeModal,
  onClose,
  onSuccess,
  selectedCompany,
}: ModalsProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Form states
  const [docType, setDocType] = useState("Offer Letter");
  const [recipientName, setRecipientName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [companyName, setCompanyName] = useState("");

  if (!activeModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(true);
      setTimeout(() => {
        onSuccess(activeModal, {
          docType,
          recipientName,
          templateName,
          employeeEmail,
          companyName,
          selectedCompany,
        });
        setSuccessMsg(false);
        onClose();
      }, 1000);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0F1424] border border-[#1E273E] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E2638] bg-[#0C101D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              {activeModal === "document" && <FileText className="w-4 h-4" />}
              {activeModal === "template" && <FileCode2 className="w-4 h-4" />}
              {activeModal === "employee" && <UserPlus className="w-4 h-4" />}
              {activeModal === "company" && <Building2 className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {activeModal === "document" && "Generate New Document"}
                {activeModal === "template" && "Create Document Template"}
                {activeModal === "employee" && "Add Employee / Recipient"}
                {activeModal === "company" && "Register New Company"}
              </h3>
              <p className="text-xs text-slate-400">
                Scope: <span className="text-indigo-400 font-semibold">{selectedCompany}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#141A2B] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {successMsg ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Successfully Saved!</h4>
            <p className="text-xs text-slate-400">
              Record created and synchronized with corporate engine.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {activeModal === "document" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Document Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Offer Letter">Offer Letter</option>
                    <option value="Payslip">Payslip</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Quotation">Quotation</option>
                    <option value="Experience Letter">Experience Letter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Recipient Name / Entity
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Kumar or ABC Pvt Ltd"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Template Preset
                  </label>
                  <select className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                    <option>Software Developer Offer Letter</option>
                    <option>BDE Offer Letter</option>
                    <option>Monthly Payslip Standard</option>
                    <option>Standard Corporate Quotation</option>
                  </select>
                </div>
              </>
            )}

            {activeModal === "template" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Template Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Architect Offer Letter 2026"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Template Category
                  </label>
                  <select className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                    <option>HR & Recruitment</option>
                    <option>Finance & Payroll</option>
                    <option>Sales & Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Variables (HTML / Mustache Syntax)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="{{employee_name}}, {{designation}}, {{joining_date}}, {{ctc_amount}}"
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  ></textarea>
                </div>
              </>
            )}

            {activeModal === "employee" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Employee Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Amit Singh"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="amit@company.com"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            {activeModal === "company" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Company Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nighwan Technology Pvt Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1E2638]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="gradient-btn px-5 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
              >
                {loading ? "Processing..." : "Save Record"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
