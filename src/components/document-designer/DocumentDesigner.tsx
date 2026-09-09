"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Columns3,
  Eye,
  FormInput,
  Maximize2,
  Minus,
  PanelLeft,
  PanelRight,
  Plus,
  Settings2,
} from "lucide-react";
import type { DynamicField } from "@/types/dynamicField.types";
import type { RightPanelTab } from "@/types/documentDesigner.types";
import { ZOOM_PRESETS, pageSize, ensureDesignerFontsLoaded } from "@/lib/documentDesigner/constants";
import { isImageFile, readImageFile } from "@/lib/documentDesigner/images";
import { serializeDocument } from "@/lib/documentDesigner/serialize";
import type { DocumentDesignerApi } from "./useDocumentDesigner";
import EditorToolbar from "./EditorToolbar";
import PageCanvas from "./PageCanvas";
import PageNavigator from "./PageNavigator";
import PropertiesPanel from "./PropertiesPanel";
import LayersPanel from "./LayersPanel";
import DynamicFieldsPanel from "./DynamicFieldsPanel";
import DesignerContextMenu, { type ContextMenuState } from "./DesignerContextMenu";
import PreviewModal from "./PreviewModal";
import type { ImageObject, WatermarkObject } from "@/types/documentDesigner.types";

interface DocumentDesignerProps {
  api: DocumentDesignerApi;
  fields: DynamicField[];
  fieldsLoading?: boolean;
  previewOpen: boolean;
  onPreviewOpenChange: (open: boolean) => void;
}

export default function DocumentDesigner({
  api,
  fields,
  fieldsLoading,
  previewOpen,
  onPreviewOpenChange,
}: DocumentDesignerProps) {
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState(true);
  const [fitTick, setFitTick] = useState(0);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [rightTab, setRightTab] = useState<RightPanelTab>("fields");
  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => serializeDocument(api.doc), [api.doc]);
  const size = pageSize(api.doc.orientation);

  useEffect(() => {
    ensureDesignerFontsLoaded();
  }, []);

  useEffect(() => {
    const el = workspaceRef.current;
    if (!el || !fitMode) return;
    const apply = () => {
      const availableW = el.clientWidth - 24;
      if (availableW <= 0) return;
      const next = Math.max(40, Math.min(150, Math.round((availableW / size.widthPx) * 100)));
      setZoom(next);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitMode, size.widthPx, size.heightPx, fitTick, api.doc.orientation]);

  const showError = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const insertImage = async (file: File, replaceId?: string | null) => {
    try {
      const src = await readImageFile(file);
      if (replaceId) {
        const found = api.doc.pages.flatMap((p) => p.objects).find((o) => o.id === replaceId);
        if (found?.type === "image") {
          api.patchObject(replaceId, { src } as Partial<ImageObject>);
        } else if (found?.type === "watermark") {
          api.patchObject(replaceId, { src, mode: "image" } as Partial<WatermarkObject>);
        }
        return;
      }
      api.addImage(src);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Image upload failed.");
    }
  };

  const uploadBandImage = async (kind: "header" | "footer", file: File) => {
    try {
      const src = await readImageFile(file);
      api.patchBand(kind, { enabled: true, image: src });
      api.selectObject(null);
      setRightOpen(true);
      setRightTab("properties");
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Image upload failed.");
    }
  };

  const pickBandImage = (kind: "header" | "footer") => {
    api.selectObject(null);
    setRightOpen(true);
    setRightTab("properties");
    (kind === "header" ? headerInputRef : footerInputRef).current?.click();
  };

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const editing = target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
      const meta = e.metaKey || e.ctrlKey;

      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) api.redo();
        else api.undo();
        return;
      }
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        api.redo();
        return;
      }
      if (editing) return;
      if (meta && e.key.toLowerCase() === "c") {
        e.preventDefault();
        api.copySelected();
      }
      if (meta && e.key.toLowerCase() === "v") {
        e.preventDefault();
        api.pasteClipboard();
      }
      if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        api.duplicateSelected();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        api.deleteSelected();
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) && api.selectedObject) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        api.patchObject(api.selectedObject.id, {
          x: api.selectedObject.x + dx,
          y: api.selectedObject.y + dy,
        });
      }
    },
    [api]
  );

  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const menuObject = menu?.objectId
    ? api.doc.pages.flatMap((p) => p.objects).find((o) => o.id === menu.objectId)
    : null;

  return (
    <div
      ref={shellRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="flex-1 min-h-0 h-full flex flex-col outline-none"
    >
      <EditorToolbar
        api={api}
        onInsertImage={() => imageInputRef.current?.click()}
        onInsertHeaderImage={() => pickBandImage("header")}
        onInsertFooterImage={() => pickBandImage("footer")}
        onInsertFieldPanel={() => {
          setRightOpen(true);
          setRightTab("fields");
        }}
      />

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {leftOpen && (
          <div className="w-36 shrink-0 hidden md:block min-h-0 overflow-hidden">
            <PageNavigator api={api} zoom={zoom / 100} />
          </div>
        )}

        <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#151922]">
          <div className="flex items-center justify-between px-2 py-0.5 border-b border-[#1E2638] text-[10px] text-slate-400 shrink-0">
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => setLeftOpen((v) => !v)} className="p-1 rounded hover:bg-[#1A2236] hidden md:inline-flex" title="Pages">
                <PanelLeft className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setRightOpen((v) => !v)} className="p-1 rounded hover:bg-[#1A2236]" title="Properties">
                <PanelRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setFitMode(false);
                  setZoom((z) => Math.max(35, z - 10));
                }}
                className="p-1 rounded hover:bg-[#1A2236]"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              {ZOOM_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setFitMode(false);
                    setZoom(preset);
                  }}
                  className={`px-1.5 py-0.5 rounded ${!fitMode && zoom === preset ? "bg-indigo-600 text-white" : "hover:bg-[#1A2236]"}`}
                >
                  {preset}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setFitMode(false);
                  setZoom((z) => Math.min(200, z + 10));
                }}
                className="p-1 rounded hover:bg-[#1A2236]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setFitMode(true);
                  setFitTick((n) => n + 1);
                }}
                className={`ml-0.5 px-1.5 py-0.5 rounded flex items-center gap-1 ${fitMode ? "bg-indigo-600 text-white" : "hover:bg-[#1A2236]"}`}
              >
                <Maximize2 className="w-3 h-3" /> Fit
              </button>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewOpenChange(true);
              }}
              className="px-2 py-0.5 rounded-md text-slate-300 hover:text-white hover:bg-[#1A2236] flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>

          <div ref={workspaceRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-auto p-3">
            <div className="flex flex-col items-center pb-10">
              <PageCanvas
                api={api}
                zoom={zoom / 100}
                onContextMenu={(e, objectId) => {
                  e.preventDefault();
                  if (objectId) api.selectObject(objectId);
                  setMenu({ x: e.clientX, y: e.clientY, objectId });
                }}
                onRequestReplaceImage={(id) => {
                  setReplaceTargetId(id);
                  replaceInputRef.current?.click();
                }}
                onPickBandImage={pickBandImage}
                onBandImageFile={uploadBandImage}
              />
            </div>
          </div>
        </div>

        {rightOpen && (
          <div className="w-60 shrink-0 border-l border-[#1E2638] bg-[#0A0D17] flex flex-col hidden sm:flex">
            <div className="flex border-b border-[#1E2638]">
              {[
                { id: "fields" as const, label: "Fields", icon: FormInput },
                { id: "properties" as const, label: "Props", icon: Settings2 },
                { id: "layers" as const, label: "Layers", icon: Columns3 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRightTab(tab.id)}
                  className={`flex-1 h-8 text-[10px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1 ${
                    rightTab === tab.id ? "text-white border-b-2 border-indigo-500" : "text-slate-500"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {rightTab === "fields" && (
                <DynamicFieldsPanel
                  fields={fields}
                  loading={fieldsLoading}
                  onInsert={(key) => api.insertFieldIntoSelection(key)}
                />
              )}
              {rightTab === "properties" && (
                <div>
                  <PropertiesPanel
                    api={api}
                    onPickBandImage={pickBandImage}
                    onUploadBandImage={uploadBandImage}
                  />
                  <div className="px-2 pb-3">
                    <button
                      type="button"
                      onClick={() => bgInputRef.current?.click()}
                      className="w-full h-8 rounded-lg border border-[#202B44] text-[11px] text-slate-300"
                    >
                      {api.selectedPage.background.image ? "Replace background image" : "Add background image"}
                    </button>
                    {api.selectedPage.background.image && (
                      <button
                        type="button"
                        onClick={() =>
                          api.patchPage(api.selectedPage.id, {
                            background: { ...api.selectedPage.background, image: null },
                          })
                        }
                        className="w-full h-8 mt-2 rounded-lg border border-[#202B44] text-[11px] text-rose-300"
                      >
                        Remove background image
                      </button>
                    )}
                  </div>
                </div>
              )}
              {rightTab === "layers" && <LayersPanel api={api} />}
            </div>
          </div>
        )}
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) insertImage(file);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) insertImage(file, replaceTargetId);
          e.target.value = "";
          setReplaceTargetId(null);
        }}
      />
      <input
        ref={headerInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (isImageFile(file)) uploadBandImage("header", file);
          e.target.value = "";
        }}
      />
      <input
        ref={footerInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (isImageFile(file)) uploadBandImage("footer", file);
          e.target.value = "";
        }}
      />
      <input
        ref={bgInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const src = await readImageFile(file);
            api.patchPage(api.selectedPage.id, {
              background: { ...api.selectedPage.background, image: src },
            });
          } catch (err: unknown) {
            showError(err instanceof Error ? err.message : "Background image failed.");
          }
          e.target.value = "";
        }}
      />

      {menu && (
        <DesignerContextMenu
          menu={menu}
          isText={menuObject?.type === "text"}
          isImage={menuObject?.type === "image" || menuObject?.type === "watermark"}
          locked={!!menuObject?.locked}
          onClose={() => setMenu(null)}
          onEdit={() => menu.objectId && api.setEditingObjectId(menu.objectId)}
          onDuplicate={() => {
            if (menu.objectId) api.selectObject(menu.objectId);
            api.duplicateSelected();
          }}
          onCopy={() => {
            if (menu.objectId) api.selectObject(menu.objectId);
            api.copySelected();
          }}
          onDelete={() => {
            if (menu.objectId) api.selectObject(menu.objectId);
            api.deleteSelected();
          }}
          onReplaceImage={() => {
            if (menu.objectId) {
              setReplaceTargetId(menu.objectId);
              replaceInputRef.current?.click();
            }
          }}
          onFront={() => api.changeLayer("front")}
          onForward={() => api.changeLayer("forward")}
          onBackward={() => api.changeLayer("backward")}
          onBack={() => api.changeLayer("back")}
          onLock={() => menuObject && api.patchObject(menuObject.id, { locked: !menuObject.locked })}
        />
      )}

      <PreviewModal
        open={previewOpen}
        html={html}
        orientation={api.doc.orientation}
        onClose={() => onPreviewOpenChange(false)}
      />

      {toast && (
        <div className="fixed bottom-4 right-4 z-[130] px-4 py-2 rounded-xl bg-rose-950/90 border border-rose-500/40 text-rose-100 text-xs">
          {toast}
        </div>
      )}
    </div>
  );
}
