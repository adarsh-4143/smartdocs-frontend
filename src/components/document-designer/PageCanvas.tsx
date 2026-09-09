"use client";

import React, { useEffect, useMemo, useRef } from "react";
import type {
  DesignerObject,
  ImageObject,
  LineObject,
  PageBand,
  ResizeHandle,
  ShapeObject,
  TableObject,
  TextObject,
  WatermarkObject,
} from "@/types/documentDesigner.types";
import { ImagePlus } from "lucide-react";
import { pageSize, SNAP_THRESHOLD } from "@/lib/documentDesigner/constants";
import { isBlankHtml, normalizeEditableHtml } from "@/lib/documentDesigner/cleanHtml";
import { isImageFile } from "@/lib/documentDesigner/images";
import { normalizeBand } from "@/lib/documentDesigner/model";
import { handleCursor, type DocumentDesignerApi } from "./useDocumentDesigner";

interface PageCanvasProps {
  api: DocumentDesignerApi;
  zoom: number;
  onContextMenu: (e: React.MouseEvent, objectId: string | null) => void;
  onRequestReplaceImage: (objectId: string) => void;
  onPickBandImage: (kind: "header" | "footer") => void;
  onBandImageFile: (kind: "header" | "footer", file: File) => void;
  droppingFieldKey?: string | null;
}

const HANDLES: ResizeHandle[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
const DRAG_THRESHOLD = 5;

function handlePos(handle: ResizeHandle): React.CSSProperties {
  const map: Record<ResizeHandle, React.CSSProperties> = {
    n: { top: -5, left: "50%", transform: "translateX(-50%)" },
    s: { bottom: -5, left: "50%", transform: "translateX(-50%)" },
    e: { right: -5, top: "50%", transform: "translateY(-50%)" },
    w: { left: -5, top: "50%", transform: "translateY(-50%)" },
    ne: { top: -5, right: -5 },
    nw: { top: -5, left: -5 },
    se: { bottom: -5, right: -5 },
    sw: { bottom: -5, left: -5 },
  };
  return map[handle];
}

export default function PageCanvas({
  api,
  zoom,
  onContextMenu,
  onRequestReplaceImage,
  onPickBandImage,
  onBandImageFile,
  droppingFieldKey,
}: PageCanvasProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef(api);
  apiRef.current = api;
  const pageRef = useRef(api.selectedPage);
  pageRef.current = api.selectedPage;
  const sizeRef = useRef(pageSize(api.doc.orientation));
  sizeRef.current = pageSize(api.doc.orientation);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const gesture = useRef<{
    kind: "pending" | "drag" | "resize" | "rotate";
    id: string;
    handle?: ResizeHandle;
    startX: number;
    startY: number;
    startClientX?: number;
    startClientY?: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    origRot: number;
    aspect: number;
    wasSelected?: boolean;
  } | null>(null);

  const { selectedPage, doc } = api;
  const size = pageSize(doc.orientation);
  const headerBand = normalizeBand(selectedPage.header, 80);
  const footerBand = normalizeBand(selectedPage.footer, 56);

  useEffect(() => {
    if (!api.editingFlow || !flowRef.current) return;
    if (document.activeElement === flowRef.current) return;
    flowRef.current.innerHTML = selectedPage.flowHtml || "";
    flowRef.current.focus();
  }, [api.editingFlow, selectedPage.id]);

  const paperPoint = (e: { clientX: number; clientY: number }) => {
    const rect = paperRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) / zoomRef.current,
      y: (e.clientY - rect.top) / zoomRef.current,
    };
  };

  const snapMove = (x: number, y: number, obj: DesignerObject) => {
    const page = pageRef.current;
    const pageSizePx = sizeRef.current;
    const others = page.objects.filter((o) => o.id !== obj.id && o.visible);
    const vTargets = [
      ...new Set([0, pageSizePx.widthPx / 2, pageSizePx.widthPx, ...others.flatMap((o) => [o.x, o.x + o.width / 2, o.x + o.width])]),
    ];
    const hTargets = [
      ...new Set([0, pageSizePx.heightPx / 2, pageSizePx.heightPx, ...others.flatMap((o) => [o.y, o.y + o.height / 2, o.y + o.height])]),
    ];
    let nx = x;
    let ny = y;
    const guidesV = new Set<number>();
    const guidesH = new Set<number>();
    const edgesX = [x, x + obj.width / 2, x + obj.width];
    const edgesY = [y, y + obj.height / 2, y + obj.height];
    vTargets.forEach((t) => {
      edgesX.forEach((edge, i) => {
        if (Math.abs(edge - t) < SNAP_THRESHOLD) {
          nx = i === 0 ? t : i === 1 ? t - obj.width / 2 : t - obj.width;
          guidesV.add(t);
        }
      });
    });
    hTargets.forEach((t) => {
      edgesY.forEach((edge, i) => {
        if (Math.abs(edge - t) < SNAP_THRESHOLD) {
          ny = i === 0 ? t : i === 1 ? t - obj.height / 2 : t - obj.height;
          guidesH.add(t);
        }
      });
    });
    apiRef.current.setGuides({ v: [...guidesV], h: [...guidesH] });
    return { x: nx, y: ny };
  };

  const applyGesture = (clientX: number, clientY: number, shiftKey = false) => {
    const g = gesture.current;
    if (!g) return;
    const liveApi = apiRef.current;
    const obj = pageRef.current.objects.find((o) => o.id === g.id);
    if (!obj || obj.locked) return;
    const pt = paperPoint({ clientX, clientY });

    if (g.kind === "pending") {
      const dist = Math.hypot(clientX - (g.startClientX ?? clientX), clientY - (g.startClientY ?? clientY));
      if (dist < DRAG_THRESHOLD) return;
      g.kind = "drag";
      liveApi.beginGesture();
      document.body.style.cursor = "grabbing";
    }

    if (g.kind === "drag") {
      const rawX = g.origX + (pt.x - g.startX);
      const rawY = g.origY + (pt.y - g.startY);
      const snapped = shiftKey ? { x: rawX, y: rawY } : snapMove(rawX, rawY, obj);
      liveApi.patchObjectSilent(obj.id, {
        x: Math.round(snapped.x),
        y: Math.round(snapped.y),
      });
    } else if (g.kind === "resize" && g.handle) {
      const dx = pt.x - g.startX;
      const dy = pt.y - g.startY;
      let x = g.origX;
      let y = g.origY;
      let w = g.origW;
      let h = g.origH;
      const handle = g.handle;
      if (handle.includes("e")) w = Math.max(16, g.origW + dx);
      if (handle.includes("s")) h = Math.max(16, g.origH + dy);
      if (handle.includes("w")) {
        w = Math.max(16, g.origW - dx);
        x = g.origX + g.origW - w;
      }
      if (handle.includes("n")) {
        h = Math.max(16, g.origH - dy);
        y = g.origY + g.origH - h;
      }
      if (obj.type === "image" && !shiftKey) {
        if (handle === "e" || handle === "w") h = w / g.aspect;
        else if (handle === "n" || handle === "s") w = h * g.aspect;
        else h = w / g.aspect;
      }
      if (obj.type === "line") {
        if (obj.orientation === "horizontal") h = Math.max(obj.strokeWidth, 2);
        else w = Math.max(obj.strokeWidth, 2);
      }
      liveApi.patchObjectSilent(obj.id, { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) });
    } else if (g.kind === "rotate") {
      const cx = g.origX + g.origW / 2;
      const cy = g.origY + g.origH / 2;
      const angle = (Math.atan2(pt.y - cy, pt.x - cx) * 180) / Math.PI + 90;
      liveApi.patchObjectSilent(obj.id, { rotation: Math.round(angle) });
    }
  };

  const endGesture = () => {
    const g = gesture.current;
    if (!g) return;
    const liveApi = apiRef.current;
    if (g.kind === "pending") {
      const obj = pageRef.current.objects.find((o) => o.id === g.id);
      if (obj?.type === "text" && g.wasSelected) {
        liveApi.setEditingObjectId(obj.id);
      }
    }
    gesture.current = null;
    document.body.style.cursor = "";
    liveApi.setGuides({ v: [], h: [] });
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!gesture.current) return;
      applyGesture(e.clientX, e.clientY, e.shiftKey);
    };
    const onUp = () => endGesture();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const startDrag = (e: React.PointerEvent, obj: DesignerObject) => {
    if (obj.locked || api.editingObjectId === obj.id) return;
    e.stopPropagation();
    const wasSelected = api.selectedObjectId === obj.id;
    api.selectObject(obj.id);
    const pt = paperPoint(e);
    gesture.current = {
      kind: "pending",
      id: obj.id,
      startX: pt.x,
      startY: pt.y,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: obj.x,
      origY: obj.y,
      origW: obj.width,
      origH: obj.height,
      origRot: obj.rotation,
      aspect: obj.height ? obj.width / obj.height : 1,
      wasSelected,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const startResize = (e: React.PointerEvent, obj: DesignerObject, handle: ResizeHandle) => {
    if (obj.locked) return;
    e.stopPropagation();
    api.selectObject(obj.id);
    api.beginGesture();
    const pt = paperPoint(e);
    gesture.current = {
      kind: "resize",
      id: obj.id,
      handle,
      startX: pt.x,
      startY: pt.y,
      origX: obj.x,
      origY: obj.y,
      origW: obj.width,
      origH: obj.height,
      origRot: obj.rotation,
      aspect: obj.height ? obj.width / obj.height : 1,
    };
  };

  const startRotate = (e: React.PointerEvent, obj: DesignerObject) => {
    if (obj.locked) return;
    e.stopPropagation();
    api.selectObject(obj.id);
    api.beginGesture();
    const pt = paperPoint(e);
    gesture.current = {
      kind: "rotate",
      id: obj.id,
      startX: pt.x,
      startY: pt.y,
      origX: obj.x,
      origY: obj.y,
      origW: obj.width,
      origH: obj.height,
      origRot: obj.rotation,
      aspect: 1,
    };
  };

  const onPaperClick = (e: React.MouseEvent) => {
    if (e.target === paperRef.current || (e.target as HTMLElement).dataset.paper === "true") {
      api.selectObject(null);
      api.setEditingFlow(false);
    }
  };

  const onPaperDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-object-id]") || target.closest("[contenteditable]") || target.closest("[data-band]")) return;
    const pt = paperPoint(e);
    api.addTextBox(Math.max(8, pt.x - 80), Math.max(8, pt.y - 16));
  };

  const bandAtPoint = (y: number): "header" | "footer" | null => {
    if (headerBand.enabled && y <= headerBand.height) return "header";
    if (footerBand.enabled && y >= size.heightPx - footerBand.height) return "footer";
    return null;
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (isImageFile(file)) {
      const pt = paperPoint(e);
      const band = bandAtPoint(pt.y) || (pt.y < 120 ? "header" : pt.y > size.heightPx - 120 ? "footer" : null);
      if (band) {
        onBandImageFile(band, file);
        return;
      }
    }
    const key = e.dataTransfer.getData("text/hrms-field") || droppingFieldKey;
    if (key) {
      const pt = paperPoint(e);
      api.insertFieldIntoSelection(key, pt);
    }
  };

  const objects = useMemo(
    () => [...selectedPage.objects].sort((a, b) => a.zIndex - b.zIndex),
    [selectedPage.objects]
  );

  return (
    <div
      className="relative shadow-[0_25px_80px_rgba(0,0,0,0.45)]"
      style={{
        width: size.widthPx * zoom,
        height: size.heightPx * zoom,
      }}
    >
      <div
        ref={paperRef}
        data-paper="true"
        className="absolute top-0 left-0 origin-top-left bg-white text-slate-900 overflow-hidden"
        style={{
          width: size.widthPx,
          height: size.heightPx,
          transform: `scale(${zoom})`,
          backgroundColor: selectedPage.background.color || "#ffffff",
          backgroundImage: selectedPage.background.image ? `url(${selectedPage.background.image})` : undefined,
          backgroundSize: selectedPage.background.imageFit,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        onClick={onPaperClick}
        onDoubleClick={onPaperDoubleClick}
        onContextMenu={(e) => {
          const target = (e.target as HTMLElement).closest("[data-object-id]") as HTMLElement | null;
          onContextMenu(e, target?.dataset.objectId || null);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {selectedPage.background.image && selectedPage.background.imageOpacity < 1 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: selectedPage.background.color, opacity: 1 - selectedPage.background.imageOpacity }}
          />
        )}

        {headerBand.enabled ? (
          <BandLayer
            kind="header"
            band={headerBand}
            onPick={() => onPickBandImage("header")}
          />
        ) : (
          <button
            type="button"
            data-band="header"
            onClick={(e) => {
              e.stopPropagation();
              onPickBandImage("header");
            }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-[4] px-2.5 py-1 rounded-full bg-white/90 border border-indigo-200 text-[10px] font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50"
          >
            + Header image
          </button>
        )}
        {footerBand.enabled ? (
          <BandLayer
            kind="footer"
            band={footerBand}
            onPick={() => onPickBandImage("footer")}
          />
        ) : (
          <button
            type="button"
            data-band="footer"
            onClick={(e) => {
              e.stopPropagation();
              onPickBandImage("footer");
            }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[4] px-2.5 py-1 rounded-full bg-white/90 border border-indigo-200 text-[10px] font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50"
          >
            + Footer image
          </button>
        )}

        <div
          ref={flowRef}
          contentEditable={api.editingFlow}
          suppressContentEditableWarning
          className="absolute inset-0 hrms-flow-editor outline-none"
          style={{
            paddingTop: headerBand.enabled ? headerBand.height : 24,
            paddingBottom: footerBand.enabled ? footerBand.height : 24,
            paddingLeft: 40,
            paddingRight: 40,
            zIndex: 1,
            pointerEvents: api.editingFlow ? "auto" : "none",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 14,
            lineHeight: 1.5,
            color: "#0f172a",
          }}
          onBlur={() => {
            if (flowRef.current) {
              api.setFlowHtml(selectedPage.id, normalizeEditableHtml(flowRef.current.innerHTML));
              api.setEditingFlow(false);
            }
          }}
          dangerouslySetInnerHTML={!api.editingFlow ? { __html: selectedPage.flowHtml || "" } : undefined}
        />

        {objects.map((obj) =>
          obj.visible ? (
            <ObjectView
              key={obj.id}
              obj={obj}
              selected={api.selectedObjectId === obj.id}
              editing={api.editingObjectId === obj.id}
              selectedCell={api.selectedCell}
              onPointerDown={(e) => startDrag(e, obj)}
              onDoubleClick={() => {
                if (obj.type === "text") api.setEditingObjectId(obj.id);
                if (obj.type === "image" || (obj.type === "watermark" && obj.mode === "image")) {
                  onRequestReplaceImage(obj.id);
                }
              }}
              onResizeStart={startResize}
              onRotateStart={startRotate}
              onSelectCell={api.setSelectedCell}
              onCellInput={(row, col, html) => {
                if (obj.type === "table") {
                  api.patchObject(obj.id, (current) => {
                    const table = current as TableObject;
                    const cells = table.cells.map((r, ri) =>
                      r.map((c, ci) => (ri === row && ci === col ? { ...c, html } : c))
                    );
                    return { ...table, cells };
                  });
                }
              }}
              onTextBlur={(html) => api.patchObject(obj.id, { html } as Partial<TextObject>)}
              onTextHeight={(height) => api.patchObjectSilent(obj.id, { height })}
            />
          ) : null
        )}

        {api.guides.v.map((x) => (
          <div key={`v-${x}`} className="absolute top-0 bottom-0 w-px bg-cyan-400/80 pointer-events-none z-[80]" style={{ left: x }} />
        ))}
        {api.guides.h.map((y) => (
          <div key={`h-${y}`} className="absolute left-0 right-0 h-px bg-cyan-400/80 pointer-events-none z-[80]" style={{ top: y }} />
        ))}
      </div>
    </div>
  );
}

function BandLayer({
  kind,
  band,
  onPick,
}: {
  kind: "header" | "footer";
  band: PageBand;
  onPick: () => void;
}) {
  const isHeader = kind === "header";
  return (
    <div
      data-band={kind}
      className={`absolute left-0 right-0 overflow-hidden ${isHeader ? "top-0" : "bottom-0"} ${
        band.image ? "pointer-events-none" : ""
      }`}
      style={{ height: band.height, zIndex: 2 }}
    >
      {band.image ? (
        <img
          src={band.image}
          alt=""
          className="w-full h-full pointer-events-none"
          style={{ objectFit: band.imageFit, objectPosition: "center" }}
        />
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPick();
          }}
          className={`w-full h-full flex flex-col items-center justify-center gap-1 bg-indigo-50/70 text-indigo-500 ${
            isHeader ? "border-b" : "border-t"
          } border-dashed border-indigo-300 hover:bg-indigo-100/80`}
        >
          <ImagePlus className="w-4 h-4" />
          <span className="text-[11px] font-semibold">
            {isHeader ? "Click or drop a header image" : "Click or drop a footer image"}
          </span>
        </button>
      )}
    </div>
  );
}

function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function TextEditor({
  obj,
  style,
  onBlur,
  onHeightChange,
}: {
  obj: TextObject;
  style: React.CSSProperties;
  onBlur: (html: string) => void;
  onHeightChange: (height: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = isBlankHtml(obj.html) ? "" : normalizeEditableHtml(obj.html);
    el.focus();
    placeCaretAtEnd(el);
  }, [obj.id]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className="w-full h-full outline-none hrms-text hrms-text-editor"
      style={style}
      onPointerDown={(e) => e.stopPropagation()}
      onInput={(e) => {
        const el = e.currentTarget;
        const next = Math.max(36, Math.ceil(el.scrollHeight));
        if (next > obj.height + 2) onHeightChange(next);
      }}
      onBlur={(e) => onBlur(normalizeEditableHtml(e.currentTarget.innerHTML))}
    />
  );
}

interface ObjectViewProps {
  obj: DesignerObject;
  selected: boolean;
  editing: boolean;
  selectedCell: { row: number; col: number } | null;
  onPointerDown: (e: React.PointerEvent) => void;
  onDoubleClick: () => void;
  onResizeStart: (e: React.PointerEvent, obj: DesignerObject, handle: ResizeHandle) => void;
  onRotateStart: (e: React.PointerEvent, obj: DesignerObject) => void;
  onSelectCell: (cell: { row: number; col: number }) => void;
  onCellInput: (row: number, col: number, html: string) => void;
  onTextBlur: (html: string) => void;
  onTextHeight: (height: number) => void;
}

function ObjectView({
  obj,
  selected,
  editing,
  selectedCell,
  onPointerDown,
  onDoubleClick,
  onResizeStart,
  onRotateStart,
  onSelectCell,
  onCellInput,
  onTextBlur,
  onTextHeight,
}: ObjectViewProps) {
  return (
    <div
      data-object-id={obj.id}
      className={`absolute ${selected ? "z-[70]" : ""}`}
      style={{
        left: obj.x,
        top: obj.y,
        width: obj.width,
        height: obj.height,
        opacity: obj.opacity,
        transform: obj.rotation ? `rotate(${obj.rotation}deg)` : undefined,
        zIndex: selected ? 70 : obj.zIndex + 2,
        cursor: obj.locked ? "default" : editing ? "text" : "grab",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
    >
      <div className="w-full h-full relative" style={{ overflow: obj.type === "text" ? "visible" : "hidden" }}>
        <ObjectInner
          obj={obj}
          editing={editing}
          selectedCell={selectedCell}
          onSelectCell={onSelectCell}
          onCellInput={onCellInput}
          onTextBlur={onTextBlur}
          onTextHeight={onTextHeight}
        />
      </div>
      {selected && (
        <>
          <div className="absolute -inset-[1px] border-2 border-indigo-500 pointer-events-none rounded-[1px]" />
          {!obj.locked &&
            HANDLES.map((handle) => (
              <div
                key={handle}
                onPointerDown={(e) => onResizeStart(e, obj, handle)}
                className="absolute w-2.5 h-2.5 bg-white border-2 border-indigo-500 rounded-sm z-[90]"
                style={{ ...handlePos(handle), cursor: handleCursor(handle) }}
              />
            ))}
          {!obj.locked && (
            <div
              onPointerDown={(e) => onRotateStart(e, obj)}
              className="absolute -top-6 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white cursor-grab z-[90]"
              title="Rotate"
            />
          )}
        </>
      )}
    </div>
  );
}

function ObjectInner({
  obj,
  editing,
  selectedCell,
  onSelectCell,
  onCellInput,
  onTextBlur,
  onTextHeight,
}: Pick<
  ObjectViewProps,
  "obj" | "editing" | "selectedCell" | "onSelectCell" | "onCellInput" | "onTextBlur" | "onTextHeight"
>) {
  if (obj.type === "text") {
    const text = obj as TextObject;
    const empty = isBlankHtml(text.html);
    const textStyle: React.CSSProperties = {
      fontFamily: text.fontFamily,
      fontSize: text.fontSize,
      color: text.color,
      background: text.background || "transparent",
      textAlign: text.align,
      lineHeight: text.lineHeight,
      letterSpacing: text.letterSpacing,
      padding: text.padding,
      wordBreak: "break-word",
    };
    if (editing) {
      return (
        <TextEditor
          obj={text}
          style={textStyle}
          onBlur={onTextBlur}
          onHeightChange={onTextHeight}
        />
      );
    }
    return (
      <div className="w-full h-full outline-none hrms-text" style={textStyle}>
        {empty ? (
          <span className="text-slate-300 pointer-events-none">Type here...</span>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: normalizeEditableHtml(text.html) }} />
        )}
      </div>
    );
  }

  if (obj.type === "image") {
    const image = obj as ImageObject;
    return image.src ? (
      <img
        src={image.src}
        alt=""
        draggable={false}
        className="w-full h-full pointer-events-none"
        style={{
          objectFit: image.fit,
          borderWidth: image.borderWidth,
          borderStyle: image.borderWidth ? "solid" : "none",
          borderColor: image.borderColor,
          borderRadius: image.borderRadius,
        }}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-400 border border-dashed border-slate-300 bg-slate-50">
        Image
      </div>
    );
  }

  if (obj.type === "table") {
    const table = obj as TableObject;
    return (
      <table className="w-full h-full border-collapse table-fixed">
        <tbody>
          {table.cells.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => {
                if (cell.skipped) return null;
                const isHeader = table.headerRow && ri === 0;
                const Tag = isHeader ? "th" : "td";
                const active = selectedCell?.row === ri && selectedCell?.col === ci;
                return (
                  <Tag
                    key={`${ri}-${ci}`}
                    colSpan={cell.colspan}
                    rowSpan={cell.rowspan}
                    contentEditable
                    suppressContentEditableWarning
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onSelectCell({ row: ri, col: ci });
                    }}
                    onBlur={(e) => onCellInput(ri, ci, e.currentTarget.innerHTML)}
                    className={`outline-none ${active ? "ring-2 ring-indigo-400" : ""}`}
                    style={{
                      background: cell.background || (isHeader ? table.headerBackground || "#f1f5f9" : "transparent"),
                      color: cell.color || "#0f172a",
                      textAlign: cell.align,
                      verticalAlign: cell.vAlign,
                      fontSize: cell.fontSize,
                      fontWeight: isHeader && table.headerBold ? 700 : cell.bold ? 700 : 400,
                      padding: cell.padding,
                      border:
                        table.borderWidth === 0
                          ? "none"
                          : `${cell.borderWidth ?? table.borderWidth}px ${table.borderStyle} ${
                              cell.borderColor ?? table.borderColor
                            }`,
                    }}
                    dangerouslySetInnerHTML={{ __html: cell.html || "" }}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (obj.type === "shape") {
    const shape = obj as ShapeObject;
    return (
      <div
        className="w-full h-full"
        style={{
          background: shape.fill,
          border: `${shape.strokeWidth}px solid ${shape.stroke}`,
          borderRadius: shape.shape === "circle" ? "50%" : shape.shape === "rounded-rect" ? 12 : 0,
        }}
      />
    );
  }

  if (obj.type === "line") {
    const line = obj as LineObject;
    return (
      <div
        className="w-full h-full"
        style={{
          borderTop: line.orientation === "horizontal" ? `${line.strokeWidth}px ${line.strokeStyle} ${line.stroke}` : "none",
          borderLeft: line.orientation === "vertical" ? `${line.strokeWidth}px ${line.strokeStyle} ${line.stroke}` : "none",
        }}
      />
    );
  }

  const mark = obj as WatermarkObject;
  if (mark.mode === "image" && mark.src) {
    return <img src={mark.src} alt="" draggable={false} className="w-full h-full object-contain pointer-events-none" />;
  }
  return (
    <div
      className="w-full h-full flex items-center justify-center font-bold uppercase tracking-[0.18em] select-none"
      style={{ color: mark.color, fontSize: mark.fontSize }}
    >
      {mark.text || "WATERMARK"}
    </div>
  );
}
