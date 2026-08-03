"use client";

import React, { useState } from "react";
import {
  Eye,
  Download,
  Send,
  MoreVertical,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

export interface DocumentItem {
  id: string;
  type: string;
  recipient: string;
  template: string;
  status: "Generated" | "Sent" | "Draft" | "Failed";
  timestamp: string;
}

interface RecentDocumentsTableProps {
  documents: DocumentItem[];
  onActionClick: (action: string, doc: DocumentItem) => void;
}

export default function RecentDocumentsTable({
  documents,
  onActionClick,
}: RecentDocumentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "All" || doc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: DocumentItem["status"]) => {
    switch (status) {
      case "Generated":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Generated
          </span>
        );
      case "Sent":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-500/30">
            <Send className="w-3 h-3" /> Sent
          </span>
        );
      case "Draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Draft
          </span>
        );
      case "Failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-[#1E2638] overflow-hidden">
      {/* Table Top Controls */}
      <div className="p-5 border-b border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D111F]">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Recent Documents
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of generated documents, contracts & payslips
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#141A2B] border border-[#202B44] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors w-44 sm:w-56"
            />
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#141A2B] border border-[#202B44] rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Generated">Generated</option>
            <option value="Sent">Sent</option>
            <option value="Draft">Draft</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#0B0E1B] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-[#1E2638]">
            <tr>
              <th className="py-3.5 px-4 font-bold">Document ID</th>
              <th className="py-3.5 px-4 font-bold">Type</th>
              <th className="py-3.5 px-4 font-bold">Employee / Recipient</th>
              <th className="py-3.5 px-4 font-bold">Template</th>
              <th className="py-3.5 px-4 font-bold">Status</th>
              <th className="py-3.5 px-4 font-bold">Generated</th>
              <th className="py-3.5 px-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E2638]">
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-[#121829] transition-colors group"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-400 group-hover:text-indigo-300">
                    {doc.id}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-white">
                    {doc.type}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    {doc.recipient}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {doc.template}
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(doc.status)}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {doc.timestamp}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onActionClick("View", doc)}
                        className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-white transition-colors"
                        title="View Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onActionClick("Download", doc)}
                        className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-cyan-400 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onActionClick("Send", doc)}
                        className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-indigo-400 transition-colors"
                        title="Send via Email"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onActionClick("More", doc)}
                        className="p-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1C253E] text-slate-400 hover:text-white transition-colors"
                        title="More Options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No documents found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
