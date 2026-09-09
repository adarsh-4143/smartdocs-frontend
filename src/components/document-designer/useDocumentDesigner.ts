"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import type {
  DesignerDocument,
  DesignerObject,
  DesignerPage,
  ObjectType,
  PageBand,
  PageOrientation,
  ResizeHandle,
  TableObject,
  TextObject,
} from "@/types/documentDesigner.types";
import { HISTORY_LIMIT, cloneJson, pageSize } from "@/lib/documentDesigner/constants";
import {
  cloneObject,
  copyPageBands,
  createBlankPage,
  createDivider,
  createImageObject,
  createLineObject,
  createShapeObject,
  createTableObject,
  createTextObject,
  createWatermarkObject,
  duplicateObject,
  findObject,
  nextZIndex,
  normalizeBand,
} from "@/lib/documentDesigner/model";
import {
  addTableColumn,
  addTableRow,
  deleteTableColumn,
  deleteTableRow,
  mergeWithBelow,
  mergeWithRight,
  splitCell,
  updateCell,
} from "@/lib/documentDesigner/tableOps";
import { insertPageBreakHtml, splitFlowHtml } from "@/lib/documentDesigner/flow";
import { isBlankHtml } from "@/lib/documentDesigner/cleanHtml";

interface HistoryState {
  doc: DesignerDocument;
  selectedPageId: string;
  selectedObjectId: string | null;
}

export function useDocumentDesigner(initialDoc: DesignerDocument) {
  const [doc, setDoc] = useState<DesignerDocument>(initialDoc);
  const [selectedPageId, setSelectedPageId] = useState(initialDoc.pages[0].id);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [editingFlow, setEditingFlow] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [clipboard, setClipboard] = useState<DesignerObject | null>(null);
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });

  const pastRef = useRef<HistoryState[]>([]);
  const futureRef = useRef<HistoryState[]>([]);
  const skipHistoryRef = useRef(false);
  const [historyTick, setHistoryTick] = useState(0);

  const selectedPage = useMemo(
    () => doc.pages.find((p) => p.id === selectedPageId) || doc.pages[0],
    [doc.pages, selectedPageId]
  );
  const selectedObject = useMemo(() => {
    if (!selectedObjectId) return null;
    return findObject(doc, selectedObjectId)?.object ?? null;
  }, [doc, selectedObjectId]);

  const snapshot = useCallback((): HistoryState => {
    return {
      doc: cloneJson(doc),
      selectedPageId,
      selectedObjectId,
    };
  }, [doc, selectedPageId, selectedObjectId]);

  const pushHistory = useCallback(() => {
    if (skipHistoryRef.current) return;
    pastRef.current.push(snapshot());
    if (pastRef.current.length > HISTORY_LIMIT) pastRef.current.shift();
    futureRef.current = [];
    setHistoryTick((n) => n + 1);
  }, [snapshot]);

  const replaceDocument = useCallback((next: DesignerDocument) => {
    skipHistoryRef.current = true;
    setDoc(next);
    setSelectedPageId(next.pages[0]?.id || "");
    setSelectedObjectId(null);
    setEditingObjectId(null);
    setEditingFlow(false);
    pastRef.current = [];
    futureRef.current = [];
    skipHistoryRef.current = false;
  }, []);

  const commitDoc = useCallback(
    (updater: (current: DesignerDocument) => DesignerDocument, selectId?: string | null) => {
      pushHistory();
      setDoc((current) => updater(current));
      if (selectId !== undefined) {
        setSelectedObjectId(selectId);
      }
    },
    [pushHistory]
  );

  const updateDocSilent = useCallback((updater: (current: DesignerDocument) => DesignerDocument) => {
    setDoc((current) => updater(current));
  }, []);

  const patchPage = useCallback(
    (pageId: string, patch: Partial<DesignerPage> | ((page: DesignerPage) => DesignerPage)) => {
      commitDoc((current) => ({
        ...current,
        pages: current.pages.map((page) => {
          if (page.id !== pageId) return page;
          return typeof patch === "function" ? patch(page) : { ...page, ...patch };
        }),
      }));
    },
    [commitDoc]
  );

  const patchObject = useCallback(
    (objectId: string, patch: Partial<DesignerObject> | ((obj: DesignerObject) => DesignerObject)) => {
      commitDoc((current) => ({
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          objects: page.objects.map((obj) => {
            if (obj.id !== objectId) return obj;
            return typeof patch === "function" ? patch(obj) : ({ ...obj, ...patch } as DesignerObject);
          }),
        })),
      }));
    },
    [commitDoc]
  );

  const patchObjectSilent = useCallback(
    (objectId: string, patch: Partial<DesignerObject>) => {
      updateDocSilent((current) => ({
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          objects: page.objects.map((obj) =>
            obj.id === objectId ? ({ ...obj, ...patch } as DesignerObject) : obj
          ),
        })),
      }));
    },
    [updateDocSilent]
  );

  const addObject = useCallback(
    (factory: (page: DesignerPage, z: number) => DesignerObject) => {
      const page = doc.pages.find((p) => p.id === selectedPageId) || doc.pages[0];
      const obj = factory(page, nextZIndex(page.objects));
      commitDoc(
        (current) => ({
          ...current,
          pages: current.pages.map((p) =>
            p.id === page.id ? { ...p, objects: [...p.objects, obj] } : p
          ),
        }),
        obj.id
      );
      setEditingObjectId(obj.type === "text" ? obj.id : null);
      setEditingFlow(false);
      return obj;
    },
    [commitDoc, doc.pages, selectedPageId]
  );

  const addTextBox = useCallback(
    (x?: number, y?: number, html?: string) =>
      addObject((page, z) =>
        createTextObject(x ?? 48, y ?? 64 + (page.objects.length % 6) * 28, z, html)
      ),
    [addObject]
  );

  const addImage = useCallback(
    (src: string, x?: number, y?: number) =>
      addObject((page, z) => createImageObject(x ?? 80, y ?? 80, z, src)),
    [addObject]
  );

  const addTable = useCallback(
    (rows: number, cols: number) => addObject((page, z) => createTableObject(40, 120, z, rows, cols)),
    [addObject]
  );

  const addShape = useCallback(
    (shape: "rectangle" | "rounded-rect" | "circle") =>
      addObject((page, z) => createShapeObject(80, 160, z, shape)),
    [addObject]
  );

  const addLine = useCallback(
    (orientation: "horizontal" | "vertical" = "horizontal") =>
      addObject((page, z) =>
        orientation === "horizontal" ? createDivider(48, 200, z) : createLineObject(200, 80, z, "vertical")
      ),
    [addObject]
  );

  const addWatermark = useCallback(
    (mode: "text" | "image" = "text") => {
      addObject((page, z) => {
        const size = pageSize(doc.orientation);
        return createWatermarkObject(size.widthPx, size.heightPx, z, mode);
      });
    },
    [addObject, doc.orientation]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedObjectId) return;
    const found = findObject(doc, selectedObjectId);
    if (!found || found.object.locked) return;
    commitDoc(
      (current) => ({
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          objects: page.objects.filter((obj) => obj.id !== selectedObjectId),
        })),
      }),
      null
    );
    setEditingObjectId(null);
    setSelectedCell(null);
  }, [commitDoc, doc, selectedObjectId]);

  const duplicateSelected = useCallback(() => {
    if (!selectedObjectId) return;
    const found = findObject(doc, selectedObjectId);
    if (!found) return;
    const copy = duplicateObject(found.object);
    copy.zIndex = nextZIndex(found.object ? doc.pages[found.pageIndex].objects : []);
    commitDoc(
      (current) => ({
        ...current,
        pages: current.pages.map((page, index) =>
          index === found.pageIndex ? { ...page, objects: [...page.objects, copy] } : page
        ),
      }),
      copy.id
    );
  }, [commitDoc, doc, selectedObjectId]);

  const copySelected = useCallback(() => {
    if (!selectedObject) return;
    setClipboard(cloneObject(selectedObject));
  }, [selectedObject]);

  const pasteClipboard = useCallback(() => {
    if (!clipboard) return;
    const page = selectedPage;
    const copy = duplicateObject(clipboard, 24);
    copy.zIndex = nextZIndex(page.objects);
    commitDoc(
      (current) => ({
        ...current,
        pages: current.pages.map((p) => (p.id === page.id ? { ...p, objects: [...p.objects, copy] } : p)),
      }),
      copy.id
    );
  }, [clipboard, commitDoc, selectedPage]);

  const changeLayer = useCallback(
    (direction: "front" | "forward" | "back" | "backward") => {
      if (!selectedObjectId || !selectedPage) return;
      const objects = [...selectedPage.objects].sort((a, b) => a.zIndex - b.zIndex);
      const index = objects.findIndex((o) => o.id === selectedObjectId);
      if (index < 0) return;
      let next = objects;
      if (direction === "front") {
        const [item] = next.splice(index, 1);
        next.push(item);
      } else if (direction === "back") {
        const [item] = next.splice(index, 1);
        next.unshift(item);
      } else if (direction === "forward" && index < next.length - 1) {
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
      } else if (direction === "backward" && index > 0) {
        [next[index], next[index - 1]] = [next[index - 1], next[index]];
      }
      commitDoc((current) => ({
        ...current,
        pages: current.pages.map((page) =>
          page.id === selectedPage.id
            ? { ...page, objects: next.map((obj, i) => ({ ...obj, zIndex: i + 1 })) }
            : page
        ),
      }));
    },
    [commitDoc, selectedObjectId, selectedPage]
  );

  const alignSelected = useCallback(
    (kind: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
      if (!selectedObject || !selectedPage) return;
      const size = pageSize(doc.orientation);
      const patch: Partial<DesignerObject> = {};
      if (kind === "left") patch.x = 0;
      if (kind === "center") patch.x = Math.round((size.widthPx - selectedObject.width) / 2);
      if (kind === "right") patch.x = size.widthPx - selectedObject.width;
      if (kind === "top") patch.y = 0;
      if (kind === "middle") patch.y = Math.round((size.heightPx - selectedObject.height) / 2);
      if (kind === "bottom") patch.y = size.heightPx - selectedObject.height;
      patchObject(selectedObject.id, patch);
    },
    [doc.orientation, patchObject, selectedObject, selectedPage]
  );

  const patchBand = useCallback(
    (kind: "header" | "footer", patch: Partial<PageBand>, options?: { allPages?: boolean }) => {
      commitDoc((current) => ({
        ...current,
        pages: current.pages.map((page) => {
          if (!options?.allPages && page.id !== selectedPageId) return page;
          const fallback = kind === "header" ? 80 : 56;
          const next = { ...normalizeBand(page[kind], fallback), ...patch };
          if (patch.image && patch.enabled === undefined) next.enabled = true;
          return { ...page, [kind]: next };
        }),
      }));
    },
    [commitDoc, selectedPageId]
  );

  const applyBandsToAllPages = useCallback(() => {
    const source = selectedPage;
    commitDoc((current) => ({
      ...current,
      pages: current.pages.map((page) => copyPageBands(source, page)),
    }));
  }, [commitDoc, selectedPage]);

  const addPage = useCallback(() => {
    const source = doc.pages.find((p) => p.id === selectedPageId);
    const page = source ? copyPageBands(source, createBlankPage()) : createBlankPage();
    commitDoc((current) => ({ ...current, pages: [...current.pages, page] }));
    setSelectedPageId(page.id);
    setSelectedObjectId(null);
  }, [commitDoc, doc.pages, selectedPageId]);

  const duplicatePage = useCallback(
    (pageId?: string) => {
      const source = doc.pages.find((p) => p.id === (pageId || selectedPageId));
      if (!source) return;
      const copy: DesignerPage = {
        ...cloneJson(source),
        id: createBlankPage().id,
        objects: source.objects.map((obj) => duplicateObject(obj, 0)),
      };
      const index = doc.pages.findIndex((p) => p.id === source.id);
      commitDoc((current) => {
        const pages = [...current.pages];
        pages.splice(index + 1, 0, copy);
        return { ...current, pages };
      });
      setSelectedPageId(copy.id);
    },
    [commitDoc, doc.pages, selectedPageId]
  );

  const deletePage = useCallback(
    (pageId?: string) => {
      const id = pageId || selectedPageId;
      if (doc.pages.length <= 1) return;
      const index = doc.pages.findIndex((p) => p.id === id);
      commitDoc((current) => ({
        ...current,
        pages: current.pages.filter((p) => p.id !== id),
      }));
      const fallback = doc.pages[index - 1] || doc.pages[index + 1] || doc.pages[0];
      setSelectedPageId(fallback.id);
      setSelectedObjectId(null);
    },
    [commitDoc, doc.pages, selectedPageId]
  );

  const movePage = useCallback(
    (pageId: string, direction: -1 | 1) => {
      const index = doc.pages.findIndex((p) => p.id === pageId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= doc.pages.length) return;
      commitDoc((current) => {
        const pages = [...current.pages];
        const [item] = pages.splice(index, 1);
        pages.splice(nextIndex, 0, item);
        return { ...current, pages };
      });
    },
    [commitDoc, doc.pages]
  );

  const setOrientation = useCallback(
    (orientation: PageOrientation) => {
      commitDoc((current) => ({ ...current, orientation }));
    },
    [commitDoc]
  );

  const insertPageBreak = useCallback(() => {
    const page = selectedPage;
    const html = `${page.flowHtml || ""}${insertPageBreakHtml()}`;
    const chunks = splitFlowHtml(html);
    commitDoc((current) => {
      const pages = current.pages.map((p) => ({ ...p }));
      const start = pages.findIndex((p) => p.id === page.id);
      chunks.forEach((chunk, offset) => {
        const targetIndex = start + offset;
        if (!pages[targetIndex]) pages.push(copyPageBands(page, createBlankPage()));
        pages[targetIndex] = { ...pages[targetIndex], flowHtml: chunk };
      });
      return { ...current, pages };
    });
    setEditingFlow(false);
  }, [commitDoc, selectedPage]);

  const reflowFromPage = useCallback(
    (pageId: string, flowHtml: string) => {
      const chunks = splitFlowHtml(flowHtml);
      commitDoc((current) => {
        const pages = current.pages.map((p) => ({ ...p }));
        const start = pages.findIndex((p) => p.id === pageId);
        if (start < 0) return current;
        chunks.forEach((chunk, offset) => {
          const targetIndex = start + offset;
          if (!pages[targetIndex]) pages.push(copyPageBands(pages[start], createBlankPage()));
          pages[targetIndex] = {
            ...pages[targetIndex],
            flowHtml: offset === 0 || !isBlankHtml(chunk) ? chunk : pages[targetIndex].flowHtml,
          };
        });
        if (chunks.length === 1) {
          pages[start] = { ...pages[start], flowHtml: chunks[0] };
        }
        return { ...current, pages };
      });
    },
    [commitDoc]
  );

  const setFlowHtml = useCallback(
    (pageId: string, html: string) => {
      patchPage(pageId, { flowHtml: html });
    },
    [patchPage]
  );

  const insertFieldIntoSelection = useCallback(
    (fieldKey: string, at?: { x: number; y: number }) => {
      const token = `{{${fieldKey}}}`;
      const active = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
      if (active?.isContentEditable) {
        document.execCommand("insertText", false, token);
        return;
      }
      if (editingObjectId && selectedObject?.type === "text") {
        const textObj = selectedObject as TextObject;
        patchObject(textObj.id, { html: `${textObj.html.replace(/<\/p>$/i, "")}${token}</p>` });
        return;
      }
      if (selectedObject?.type === "text") {
        const textObj = selectedObject as TextObject;
        const next = textObj.html.includes("</p>")
          ? textObj.html.replace(/<\/p>(?![\s\S]*<\/p>)/i, `${token}</p>`)
          : `${textObj.html}${token}`;
        patchObject(textObj.id, { html: next });
        return;
      }
      if (editingFlow) {
        const next = `${selectedPage.flowHtml || "<p></p>"}${token}`;
        setFlowHtml(selectedPage.id, next);
        return;
      }
      addTextBox(at?.x ?? 48, at?.y ?? 80, `<p>${token}</p>`);
    },
    [addTextBox, editingFlow, editingObjectId, patchObject, selectedObject, selectedPage, setFlowHtml]
  );

  const patchTable = useCallback(
    (mutator: (table: TableObject) => TableObject) => {
      if (selectedObject?.type !== "table") return;
      patchObject(selectedObject.id, (obj) => mutator(obj as TableObject));
    },
    [patchObject, selectedObject]
  );

  const tableActions = {
    addRow: () => patchTable((t) => addTableRow(t, selectedCell?.row)),
    deleteRow: () => selectedCell && patchTable((t) => deleteTableRow(t, selectedCell.row)),
    addColumn: () => patchTable((t) => addTableColumn(t, selectedCell?.col)),
    deleteColumn: () => selectedCell && patchTable((t) => deleteTableColumn(t, selectedCell.col)),
    mergeRight: () => selectedCell && patchTable((t) => mergeWithRight(t, selectedCell.row, selectedCell.col)),
    mergeBelow: () => selectedCell && patchTable((t) => mergeWithBelow(t, selectedCell.row, selectedCell.col)),
    split: () => selectedCell && patchTable((t) => splitCell(t, selectedCell.row, selectedCell.col)),
    updateSelectedCell: (patch: Parameters<typeof updateCell>[3]) =>
      selectedCell && patchTable((t) => updateCell(t, selectedCell.row, selectedCell.col, patch)),
  };

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current.push(snapshot());
    skipHistoryRef.current = true;
    setDoc(prev.doc);
    setSelectedPageId(prev.selectedPageId);
    setSelectedObjectId(prev.selectedObjectId);
    setEditingObjectId(null);
    skipHistoryRef.current = false;
    setHistoryTick((n) => n + 1);
  }, [snapshot]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(snapshot());
    skipHistoryRef.current = true;
    setDoc(next.doc);
    setSelectedPageId(next.selectedPageId);
    setSelectedObjectId(next.selectedObjectId);
    setEditingObjectId(null);
    skipHistoryRef.current = false;
    setHistoryTick((n) => n + 1);
  }, [snapshot]);

  const selectPage = useCallback((pageId: string) => {
    setSelectedPageId(pageId);
    setSelectedObjectId(null);
    setEditingObjectId(null);
    setEditingFlow(false);
    setSelectedCell(null);
  }, []);

  const selectObject = useCallback((objectId: string | null) => {
    setSelectedObjectId(objectId);
    if (objectId !== editingObjectId) setEditingObjectId(null);
    setEditingFlow(false);
  }, [editingObjectId]);

  const canUndo = historyTick >= 0 && pastRef.current.length > 0;
  const canRedo = historyTick >= 0 && futureRef.current.length > 0;

  return {
    doc,
    selectedPage,
    selectedPageId,
    selectedObject,
    selectedObjectId,
    editingObjectId,
    editingFlow,
    selectedCell,
    clipboard,
    guides,
    canUndo,
    canRedo,
    setGuides,
    setEditingObjectId,
    setEditingFlow,
    setSelectedCell,
    replaceDocument,
    patchPage,
    patchBand,
    applyBandsToAllPages,
    patchObject,
    patchObjectSilent,
    addTextBox,
    addImage,
    addTable,
    addShape,
    addLine,
    addWatermark,
    deleteSelected,
    duplicateSelected,
    copySelected,
    pasteClipboard,
    changeLayer,
    alignSelected,
    addPage,
    duplicatePage,
    deletePage,
    movePage,
    setOrientation,
    insertPageBreak,
    reflowFromPage,
    setFlowHtml,
    insertFieldIntoSelection,
    tableActions,
    undo,
    redo,
    beginGesture: pushHistory,
    selectPage,
    selectObject,
    commitDoc,
    addObject,
  };
}

export type DocumentDesignerApi = ReturnType<typeof useDocumentDesigner>;

export const OBJECT_TYPE_LABELS: Record<ObjectType, string> = {
  text: "Text",
  image: "Image",
  table: "Table",
  shape: "Shape",
  line: "Line",
  watermark: "Watermark",
};

export function handleCursor(handle: ResizeHandle): string {
  const map: Record<ResizeHandle, string> = {
    n: "ns-resize",
    s: "ns-resize",
    e: "ew-resize",
    w: "ew-resize",
    ne: "nesw-resize",
    sw: "nesw-resize",
    nw: "nwse-resize",
    se: "nwse-resize",
  };
  return map[handle];
}
