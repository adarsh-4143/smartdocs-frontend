"use client";

import React, { useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Circle,
  Columns,
  Image as ImageIcon,
  Italic,
  Layers,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Redo,
  Rows,
  Square,
  Strikethrough,
  Subscript,
  Superscript,
  Table as TableIcon,
  Type,
  Underline as UnderlineIcon,
  Undo,
  FilePlus,
  Droplets,
  FormInput,
  Stamp,
  PanelTop,
  PanelBottom,
} from "lucide-react";
import { FONT_SIZES, pageSize } from "@/lib/documentDesigner/constants";
import ColorPicker from "./ColorPicker";
import FontPicker from "./FontPicker";
import type { DocumentDesignerApi } from "./useDocumentDesigner";
import type { TextObject } from "@/types/documentDesigner.types";

interface EditorToolbarProps {
  api: DocumentDesignerApi;
  onInsertImage: () => void;
  onInsertHeaderImage: () => void;
  onInsertFooterImage: () => void;
  onInsertFieldPanel: () => void;
}

function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

function ToolButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
        active ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-[#1A2236] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function EditorToolbar({ api, onInsertImage, onInsertHeaderImage, onInsertFooterImage, onInsertFieldPanel }: EditorToolbarProps) {
  const [insertOpen, setInsertOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [shapeOpen, setShapeOpen] = useState(false);
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const insertRef = useRef<HTMLDivElement>(null);

  const text = api.selectedObject?.type === "text" ? (api.selectedObject as TextObject) : null;
  const table = api.selectedObject?.type === "table";

  const applyTextPatch = (patch: Partial<TextObject>) => {
    if (text) api.patchObject(text.id, patch);
  };

  return (
    <div className="relative z-20 flex flex-wrap items-center gap-1 px-3 py-2 border-b border-[#1E2638] bg-[#0C101D] shrink-0">
      <ToolButton title="Undo" onClick={api.undo}>
        <Undo className="w-4 h-4" />
      </ToolButton>
      <ToolButton title="Redo" onClick={api.redo}>
        <Redo className="w-4 h-4" />
      </ToolButton>
      <div className="w-px h-6 bg-[#1E2638] mx-1" />

      <div className="relative" ref={insertRef}>
        <button
          type="button"
          onClick={() => setInsertOpen((v) => !v)}
          className="h-8 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1"
        >
          Insert
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {insertOpen && (
          <div className="absolute z-40 mt-1 w-52 rounded-xl border border-[#202B44] bg-[#0F1422] shadow-2xl py-1 text-[12px]">
            <InsertItem icon={<Type className="w-3.5 h-3.5" />} label="Text box" onClick={() => { api.addTextBox(); setInsertOpen(false); }} />
            <InsertItem icon={<Type className="w-3.5 h-3.5" />} label="Body text (flow)" onClick={() => { api.setEditingFlow(true); if (!api.selectedPage.flowHtml) api.setFlowHtml(api.selectedPage.id, "<p></p>"); setInsertOpen(false); }} />
            <InsertItem icon={<ImageIcon className="w-3.5 h-3.5" />} label="Image" onClick={() => { onInsertImage(); setInsertOpen(false); }} />
            <InsertItem icon={<PanelTop className="w-3.5 h-3.5" />} label="Header image" onClick={() => { onInsertHeaderImage(); setInsertOpen(false); }} />
            <InsertItem icon={<PanelBottom className="w-3.5 h-3.5" />} label="Footer image" onClick={() => { onInsertFooterImage(); setInsertOpen(false); }} />
            <InsertItem icon={<TableIcon className="w-3.5 h-3.5" />} label="Table" onClick={() => { setTableOpen(true); setInsertOpen(false); }} />
            <InsertItem icon={<Minus className="w-3.5 h-3.5" />} label="Divider" onClick={() => { api.addLine("horizontal"); setInsertOpen(false); }} />
            <InsertItem icon={<Minus className="w-3.5 h-3.5" />} label="Vertical line" onClick={() => { api.addLine("vertical"); setInsertOpen(false); }} />
            <InsertItem icon={<Square className="w-3.5 h-3.5" />} label="Rectangle" onClick={() => { api.addShape("rectangle"); setInsertOpen(false); }} />
            <InsertItem icon={<Square className="w-3.5 h-3.5" />} label="Rounded rectangle" onClick={() => { api.addShape("rounded-rect"); setInsertOpen(false); }} />
            <InsertItem icon={<Circle className="w-3.5 h-3.5" />} label="Circle" onClick={() => { api.addShape("circle"); setInsertOpen(false); }} />
            <InsertItem icon={<FormInput className="w-3.5 h-3.5" />} label="Dynamic field" onClick={() => { onInsertFieldPanel(); setInsertOpen(false); }} />
            <InsertItem icon={<FilePlus className="w-3.5 h-3.5" />} label="Page break" onClick={() => { api.insertPageBreak(); setInsertOpen(false); }} />
            <InsertItem icon={<Stamp className="w-3.5 h-3.5" />} label="Signature area" onClick={() => {
              const size = pageSize(api.doc.orientation);
              api.addTextBox(Math.max(40, size.widthPx - 260), Math.max(80, size.heightPx - 140), "<p>Signature</p>");
              setInsertOpen(false);
            }} />
            <InsertItem icon={<Droplets className="w-3.5 h-3.5" />} label="Watermark" onClick={() => { api.addWatermark("text"); setInsertOpen(false); }} />
          </div>
        )}
      </div>

      <ToolButton title="Text box" onClick={() => api.addTextBox()}>
        <Type className="w-4 h-4" />
      </ToolButton>
      <ToolButton title="Image" onClick={onInsertImage}>
        <ImageIcon className="w-4 h-4" />
      </ToolButton>
      <div className="relative">
        <ToolButton title="Table" onClick={() => setTableOpen((v) => !v)}>
          <TableIcon className="w-4 h-4" />
        </ToolButton>
        {tableOpen && (
          <div className="absolute z-40 mt-1 w-48 p-3 rounded-xl border border-[#202B44] bg-[#0F1422] shadow-2xl">
            <p className="text-[10px] uppercase text-slate-500 mb-2 font-semibold">Insert table</p>
            <label className="text-[11px] text-slate-400 flex items-center justify-between mb-2">
              Rows
              <input type="number" min={1} max={20} value={rows} onChange={(e) => setRows(Number(e.target.value))} className="w-16 bg-[#141A2C] border border-[#202B44] rounded px-2 py-1 text-slate-200" />
            </label>
            <label className="text-[11px] text-slate-400 flex items-center justify-between mb-3">
              Columns
              <input type="number" min={1} max={12} value={cols} onChange={(e) => setCols(Number(e.target.value))} className="w-16 bg-[#141A2C] border border-[#202B44] rounded px-2 py-1 text-slate-200" />
            </label>
            <button
              type="button"
              onClick={() => {
                api.addTable(rows, cols);
                setTableOpen(false);
              }}
              className="w-full h-8 rounded-md bg-indigo-600 text-white text-[11px] font-semibold"
            >
              Insert
            </button>
          </div>
        )}
      </div>
      <div className="relative">
        <ToolButton title="Shape" onClick={() => setShapeOpen((v) => !v)}>
          <Square className="w-4 h-4" />
        </ToolButton>
        {shapeOpen && (
          <div className="absolute z-40 mt-1 w-40 rounded-xl border border-[#202B44] bg-[#0F1422] shadow-2xl py-1">
            <InsertItem icon={<Square className="w-3.5 h-3.5" />} label="Rectangle" onClick={() => { api.addShape("rectangle"); setShapeOpen(false); }} />
            <InsertItem icon={<Square className="w-3.5 h-3.5" />} label="Rounded" onClick={() => { api.addShape("rounded-rect"); setShapeOpen(false); }} />
            <InsertItem icon={<Circle className="w-3.5 h-3.5" />} label="Circle" onClick={() => { api.addShape("circle"); setShapeOpen(false); }} />
            <InsertItem icon={<Minus className="w-3.5 h-3.5" />} label="Line" onClick={() => { api.addLine("horizontal"); setShapeOpen(false); }} />
          </div>
        )}
      </div>
      <ToolButton title="Dynamic field" onClick={onInsertFieldPanel}>
        <FormInput className="w-4 h-4" />
      </ToolButton>
      <ToolButton title="Page break" onClick={api.insertPageBreak}>
        <FilePlus className="w-4 h-4" />
      </ToolButton>

      <div className="w-px h-6 bg-[#1E2638] mx-1" />

      <FontPicker
        value={text?.fontFamily}
        onChange={(font) => {
          applyTextPatch({ fontFamily: font.value });
          exec("fontName", font.name);
        }}
      />
      <select
        value={text?.fontSize || 14}
        onChange={(e) => applyTextPatch({ fontSize: Number(e.target.value) })}
        className="h-8 bg-[#141A2C] border border-[#202B44] rounded-md px-2 text-[11px] text-slate-200"
      >
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <ToolButton title="Bold" onClick={() => exec("bold")}>
        <Bold className="w-4 h-4" />
      </ToolButton>
      <ToolButton title="Italic" onClick={() => exec("italic")}>
        <Italic className="w-4 h-4" />
      </ToolButton>
      <ToolButton title="Underline" onClick={() => exec("underline")}>
        <UnderlineIcon className="w-4 h-4" />
      </ToolButton>
      <ToolButton title="Strikethrough" onClick={() => exec("strikeThrough")}>
        <Strikethrough className="w-4 h-4" />
      </ToolButton>
      <ColorPicker
        label="Color"
        value={text?.color || "#0f172a"}
        onChange={(color) => {
          applyTextPatch({ color });
          exec("foreColor", color);
        }}
      />
      <ColorPicker
        label="Highlight"
        value={text?.background || ""}
        allowEmpty
        onChange={(color) => {
          applyTextPatch({ background: color || null });
          if (color) exec("hiliteColor", color);
        }}
      />

      <div className="w-px h-6 bg-[#1E2638] mx-1" />
      <ToolButton title="Align left" onClick={() => { applyTextPatch({ align: "left" }); exec("justifyLeft"); }}>
        <AlignLeft className="w-4 h-4" />
      </ToolButton>
      <ToolButton title="Align center" onClick={() => { applyTextPatch({ align: "center" }); exec("justifyCenter"); }}>
        <AlignCenter className="w-4 h-4" />
      </ToolButton>
      <ToolButton title="Align right" onClick={() => { applyTextPatch({ align: "right" }); exec("justifyRight"); }}>
        <AlignRight className="w-4 h-4" />
      </ToolButton>
      <ToolButton title="Justify" onClick={() => { applyTextPatch({ align: "justify" }); exec("justifyFull"); }}>
        <AlignJustify className="w-4 h-4" />
      </ToolButton>
      <ToolButton title="Bullets" onClick={() => exec("insertUnorderedList")}>
        <List className="w-4 h-4" />
      </ToolButton>
      <ToolButton title="Numbered list" onClick={() => exec("insertOrderedList")}>
        <ListOrdered className="w-4 h-4" />
      </ToolButton>
      <ToolButton title="Superscript" onClick={() => exec("superscript")}>
        <Superscript className="w-4 h-4" />
      </ToolButton>
      <ToolButton title="Subscript" onClick={() => exec("subscript")}>
        <Subscript className="w-4 h-4" />
      </ToolButton>
      <ToolButton
        title="Link"
        onClick={() => {
          const url = window.prompt("Link URL");
          if (url) exec("createLink", url);
        }}
      >
        <LinkIcon className="w-4 h-4" />
      </ToolButton>

      <div className="w-px h-6 bg-[#1E2638] mx-1" />
      <ToolButton title="Bring to front" onClick={() => api.changeLayer("front")}>
        <Layers className="w-4 h-4" />
      </ToolButton>
      {table && (
        <>
          <ToolButton title="Add row" onClick={api.tableActions.addRow}>
            <Rows className="w-4 h-4" />
          </ToolButton>
          <ToolButton title="Add column" onClick={api.tableActions.addColumn}>
            <Columns className="w-4 h-4" />
          </ToolButton>
        </>
      )}
    </div>
  );
}

function InsertItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-[#1A2236] hover:text-white text-left"
    >
      {icon}
      {label}
    </button>
  );
}
