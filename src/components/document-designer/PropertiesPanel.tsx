"use client";

import React from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import ColorPicker from "./ColorPicker";
import type { DocumentDesignerApi } from "./useDocumentDesigner";
import type {
  ImageFit,
  ImageObject,
  LineObject,
  PageBand,
  ShapeObject,
  TableObject,
  TextObject,
  WatermarkObject,
} from "@/types/documentDesigner.types";
import { isImageFile } from "@/lib/documentDesigner/images";
import { normalizeBand } from "@/lib/documentDesigner/model";

interface PropertiesPanelProps {
  api: DocumentDesignerApi;
  onPickBandImage: (kind: "header" | "footer") => void;
  onUploadBandImage: (kind: "header" | "footer", file: File) => void;
}

export default function PropertiesPanel({ api, onPickBandImage, onUploadBandImage }: PropertiesPanelProps) {
  const obj = api.selectedObject;
  const page = api.selectedPage;

  if (!obj) {
    const header = normalizeBand(page.header, 80);
    const footer = normalizeBand(page.footer, 56);
    return (
      <div className="p-2.5 space-y-3">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Page</p>
        <label className="block text-[11px] text-slate-400">
          Orientation
          <select
            value={api.doc.orientation}
            onChange={(e) => api.setOrientation(e.target.value as "portrait" | "landscape")}
            className="mt-1 w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-slate-200"
          >
            <option value="portrait">A4 Portrait</option>
            <option value="landscape">A4 Landscape</option>
          </select>
        </label>
        <div>
          <p className="text-[11px] text-slate-400 mb-1">Background color</p>
          <ColorPicker
            label="Background"
            value={page.background.color}
            onChange={(color) => api.patchPage(page.id, { background: { ...page.background, color } })}
          />
        </div>
        <label className="block text-[11px] text-slate-400">
          Background opacity
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={page.background.imageOpacity}
            onChange={(e) =>
              api.patchPage(page.id, {
                background: { ...page.background, imageOpacity: Number(e.target.value) },
              })
            }
            className="w-full mt-1"
          />
        </label>

        <BandCard
          title="Header image"
          hint="Letterhead / logo bar at the top"
          band={header}
          onPick={() => onPickBandImage("header")}
          onUpload={(file) => onUploadBandImage("header", file)}
          onChange={(patch) => api.patchBand("header", patch)}
        />
        <BandCard
          title="Footer image"
          hint="Company strip / address bar at the bottom"
          band={footer}
          onPick={() => onPickBandImage("footer")}
          onUpload={(file) => onUploadBandImage("footer", file)}
          onChange={(patch) => api.patchBand("footer", patch)}
        />

        {api.doc.pages.length > 1 && (
          <button
            type="button"
            onClick={api.applyBandsToAllPages}
            className="w-full h-8 rounded-md bg-indigo-600/20 border border-indigo-500/40 text-[11px] font-semibold text-indigo-200 hover:bg-indigo-600/30"
          >
            Use this header & footer on all pages
          </button>
        )}

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Click the page header or footer, or drop an image there. New pages copy the same letterhead automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="p-2.5 space-y-2.5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Selected object</p>
      <label className="block text-[11px] text-slate-400">
        Name
        <input
          value={obj.name}
          onChange={(e) => api.patchObject(obj.id, { name: e.target.value })}
          className="mt-1 w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-slate-200"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        {(["x", "y", "width", "height"] as const).map((key) => (
          <label key={key} className="text-[11px] text-slate-400">
            {key.toUpperCase()}
            <input
              type="number"
              value={Math.round(obj[key])}
              onChange={(e) => api.patchObject(obj.id, { [key]: Number(e.target.value) })}
              className="mt-1 w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-slate-200"
            />
          </label>
        ))}
      </div>
      <label className="block text-[11px] text-slate-400">
        Rotation
        <input
          type="number"
          value={obj.rotation}
          onChange={(e) => api.patchObject(obj.id, { rotation: Number(e.target.value) })}
          className="mt-1 w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-slate-200"
        />
      </label>
      <label className="block text-[11px] text-slate-400">
        Opacity
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={obj.opacity}
          onChange={(e) => api.patchObject(obj.id, { opacity: Number(e.target.value) })}
          className="w-full mt-1"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => api.patchObject(obj.id, { locked: !obj.locked })}
          className="flex-1 h-8 rounded-lg border border-[#202B44] text-[11px] text-slate-300"
        >
          {obj.locked ? "Unlock" : "Lock"}
        </button>
        <button
          type="button"
          onClick={api.duplicateSelected}
          className="flex-1 h-8 rounded-lg border border-[#202B44] text-[11px] text-slate-300"
        >
          Duplicate
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {(["left", "center", "right", "top", "middle", "bottom"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => api.alignSelected(kind)}
            className="h-7 rounded border border-[#202B44] text-[10px] text-slate-400 hover:text-white capitalize"
          >
            {kind}
          </button>
        ))}
      </div>

      {obj.type === "text" && <TextProps obj={obj as TextObject} api={api} />}
      {obj.type === "image" && <ImageProps obj={obj as ImageObject} api={api} />}
      {obj.type === "table" && <TableProps obj={obj as TableObject} api={api} />}
      {obj.type === "shape" && <ShapeProps obj={obj as ShapeObject} api={api} />}
      {obj.type === "line" && <LineProps obj={obj as LineObject} api={api} />}
      {obj.type === "watermark" && <WatermarkProps obj={obj as WatermarkObject} api={api} />}
    </div>
  );
}

function BandCard({
  title,
  hint,
  band,
  onPick,
  onUpload,
  onChange,
}: {
  title: string;
  hint: string;
  band: PageBand;
  onPick: () => void;
  onUpload: (file: File) => void;
  onChange: (patch: Partial<PageBand>) => void;
}) {
  return (
    <div className="rounded-lg border border-[#202B44] bg-[#101628] p-2 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold text-white">{title}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>
        </div>
        <label className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
          <input
            type="checkbox"
            checked={band.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
          />
          Show
        </label>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={onPick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPick();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files?.[0];
          if (isImageFile(file)) onUpload(file);
        }}
        className="relative w-full rounded-md overflow-hidden border border-dashed border-[#2A3550] bg-[#0B1020] hover:border-indigo-400/70 cursor-pointer min-h-[56px] flex items-center justify-center"
      >
        {band.image ? (
          <img src={band.image} alt="" className="w-full h-12 object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-0.5 py-2.5 text-slate-400">
            <ImagePlus className="w-4 h-4 text-indigo-400" />
            <span className="text-[11px] font-semibold text-slate-200">Click or drop image</span>
            <span className="text-[10px] text-slate-500">PNG, JPG, WEBP · max 5 MB</span>
          </div>
        )}
      </div>

      {band.image && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPick}
            className="flex-1 h-8 rounded-lg border border-[#202B44] text-[11px] text-slate-300 hover:text-white flex items-center justify-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Replace
          </button>
          <button
            type="button"
            onClick={() => onChange({ image: null })}
            className="h-8 px-3 rounded-lg border border-rose-500/30 text-[11px] text-rose-300 hover:bg-rose-950/40 flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <label className="block text-[11px] text-slate-400">
        Height {Math.round(band.height)}px
        <input
          type="range"
          min={36}
          max={220}
          value={band.height}
          onChange={(e) => onChange({ enabled: true, height: Number(e.target.value) })}
          className="w-full mt-1"
        />
      </label>

      {band.image && (
        <label className="block text-[11px] text-slate-400">
          Fit
          <select
            value={band.imageFit}
            onChange={(e) => onChange({ imageFit: e.target.value as ImageFit })}
            className="mt-1 w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-slate-200"
          >
            <option value="cover">Fill bar (crop extra)</option>
            <option value="contain">Fit whole image</option>
            <option value="fill">Stretch</option>
          </select>
        </label>
      )}
    </div>
  );
}

function TextProps({ obj, api }: { obj: TextObject; api: DocumentDesignerApi }) {
  return (
    <div className="space-y-2 pt-2 border-t border-[#1E2638]">
      <label className="block text-[11px] text-slate-400">
        Line height
        <input
          type="number"
          step={0.05}
          value={obj.lineHeight}
          onChange={(e) => api.patchObject(obj.id, { lineHeight: Number(e.target.value) })}
          className="mt-1 w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-slate-200"
        />
      </label>
      <label className="block text-[11px] text-slate-400">
        Letter spacing
        <input
          type="number"
          step={0.1}
          value={obj.letterSpacing}
          onChange={(e) => api.patchObject(obj.id, { letterSpacing: Number(e.target.value) })}
          className="mt-1 w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-slate-200"
        />
      </label>
    </div>
  );
}

function ImageProps({ obj, api }: { obj: ImageObject; api: DocumentDesignerApi }) {
  return (
    <div className="space-y-2 pt-2 border-t border-[#1E2638]">
      <label className="block text-[11px] text-slate-400">
        Fit
        <select
          value={obj.fit}
          onChange={(e) => api.patchObject(obj.id, { fit: e.target.value as ImageObject["fit"] })}
          className="mt-1 w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-slate-200"
        >
          <option value="contain">Contain</option>
          <option value="cover">Cover</option>
          <option value="fill">Fill</option>
        </select>
      </label>
      <label className="block text-[11px] text-slate-400">
        Border width
        <input
          type="number"
          min={0}
          value={obj.borderWidth}
          onChange={(e) => api.patchObject(obj.id, { borderWidth: Number(e.target.value) })}
          className="mt-1 w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-slate-200"
        />
      </label>
      <ColorPicker
        label="Border"
        value={obj.borderColor}
        onChange={(color) => api.patchObject(obj.id, { borderColor: color })}
      />
      <label className="block text-[11px] text-slate-400">
        Radius
        <input
          type="number"
          min={0}
          value={obj.borderRadius}
          onChange={(e) => api.patchObject(obj.id, { borderRadius: Number(e.target.value) })}
          className="mt-1 w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-slate-200"
        />
      </label>
    </div>
  );
}

function TableProps({ obj, api }: { obj: TableObject; api: DocumentDesignerApi }) {
  return (
    <div className="space-y-2 pt-2 border-t border-[#1E2638]">
      <label className="flex items-center gap-2 text-[11px] text-slate-300">
        <input
          type="checkbox"
          checked={obj.headerRow}
          onChange={(e) => api.patchObject(obj.id, { headerRow: e.target.checked })}
        />
        Header row
      </label>
      <label className="flex items-center gap-2 text-[11px] text-slate-300">
        <input
          type="checkbox"
          checked={obj.headerBold}
          onChange={(e) => api.patchObject(obj.id, { headerBold: e.target.checked })}
        />
        Bold header
      </label>
      <ColorPicker
        label="Border"
        value={obj.borderColor}
        onChange={(color) => api.patchObject(obj.id, { borderColor: color })}
      />
      <label className="block text-[11px] text-slate-400">
        Border width
        <input
          type="number"
          min={0}
          value={obj.borderWidth}
          onChange={(e) => api.patchObject(obj.id, { borderWidth: Number(e.target.value) })}
          className="mt-1 w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-slate-200"
        />
      </label>
      <div className="grid grid-cols-2 gap-1">
        <button type="button" onClick={api.tableActions.addRow} className="h-7 rounded border border-[#202B44] text-[10px] text-slate-300">Add row</button>
        <button type="button" onClick={api.tableActions.deleteRow} className="h-7 rounded border border-[#202B44] text-[10px] text-slate-300">Delete row</button>
        <button type="button" onClick={api.tableActions.addColumn} className="h-7 rounded border border-[#202B44] text-[10px] text-slate-300">Add column</button>
        <button type="button" onClick={api.tableActions.deleteColumn} className="h-7 rounded border border-[#202B44] text-[10px] text-slate-300">Delete column</button>
        <button type="button" onClick={api.tableActions.mergeRight} className="h-7 rounded border border-[#202B44] text-[10px] text-slate-300">Merge right</button>
        <button type="button" onClick={api.tableActions.mergeBelow} className="h-7 rounded border border-[#202B44] text-[10px] text-slate-300">Merge below</button>
        <button type="button" onClick={api.tableActions.split} className="h-7 col-span-2 rounded border border-[#202B44] text-[10px] text-slate-300">Split cell</button>
      </div>
      {api.selectedCell && (
        <>
          <p className="text-[10px] text-slate-500">Cell {api.selectedCell.row + 1},{api.selectedCell.col + 1}</p>
          <ColorPicker
            label="Cell fill"
            value=""
            allowEmpty
            onChange={(color) => api.tableActions.updateSelectedCell({ background: color || null })}
          />
          <ColorPicker
            label="Cell text"
            value="#0f172a"
            onChange={(color) => api.tableActions.updateSelectedCell({ color })}
          />
        </>
      )}
    </div>
  );
}

function ShapeProps({ obj, api }: { obj: ShapeObject; api: DocumentDesignerApi }) {
  return (
    <div className="space-y-2 pt-2 border-t border-[#1E2638]">
      <ColorPicker label="Fill" value={obj.fill} onChange={(color) => api.patchObject(obj.id, { fill: color })} />
      <ColorPicker label="Stroke" value={obj.stroke} onChange={(color) => api.patchObject(obj.id, { stroke: color })} />
      <label className="block text-[11px] text-slate-400">
        Thickness
        <input
          type="number"
          min={0}
          value={obj.strokeWidth}
          onChange={(e) => api.patchObject(obj.id, { strokeWidth: Number(e.target.value) })}
          className="mt-1 w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-slate-200"
        />
      </label>
    </div>
  );
}

function LineProps({ obj, api }: { obj: LineObject; api: DocumentDesignerApi }) {
  return (
    <div className="space-y-2 pt-2 border-t border-[#1E2638]">
      <ColorPicker label="Color" value={obj.stroke} onChange={(color) => api.patchObject(obj.id, { stroke: color })} />
      <label className="block text-[11px] text-slate-400">
        Thickness
        <input
          type="number"
          min={1}
          value={obj.strokeWidth}
          onChange={(e) => api.patchObject(obj.id, { strokeWidth: Number(e.target.value) })}
          className="mt-1 w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-slate-200"
        />
      </label>
      <select
        value={obj.strokeStyle}
        onChange={(e) => api.patchObject(obj.id, { strokeStyle: e.target.value as LineObject["strokeStyle"] })}
        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
      >
        <option value="solid">Solid</option>
        <option value="dashed">Dashed</option>
        <option value="dotted">Dotted</option>
      </select>
    </div>
  );
}

function WatermarkProps({ obj, api }: { obj: WatermarkObject; api: DocumentDesignerApi }) {
  return (
    <div className="space-y-2 pt-2 border-t border-[#1E2638]">
      <select
        value={obj.mode}
        onChange={(e) => api.patchObject(obj.id, { mode: e.target.value as WatermarkObject["mode"] })}
        className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
      >
        <option value="text">Text watermark</option>
        <option value="image">Image watermark</option>
      </select>
      {obj.mode === "text" && (
        <>
          <input
            value={obj.text}
            onChange={(e) => api.patchObject(obj.id, { text: e.target.value })}
            className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg px-2 py-1.5 text-[11px] text-slate-200"
          />
          <ColorPicker label="Color" value={obj.color} onChange={(color) => api.patchObject(obj.id, { color })} />
        </>
      )}
    </div>
  );
}
