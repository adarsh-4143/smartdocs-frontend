"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { templateMasterService } from "@/services/templateMaster.service";
import { templateBuilderService } from "@/services/templateBuilder.service";
import { TemplateMaster } from "@/types/templateMaster.types";
import { TemplateContentRecord } from "@/types/templateBuilder.types";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle, FontFamily, Color, FontSize } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { Image } from "@tiptap/extension-image";
import { Link as LinkExtension } from "@tiptap/extension-link";
import { dynamicFieldService } from "@/services/dynamicField.service";
import { DynamicField } from "@/types/dynamicField.types";
import { templateDocumentService } from "@/services/templateDocument.service";
import { TemplateDocument } from "@/types/templateDocument.types";

import {
  ArrowLeft,
  Save,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  Undo,
  Redo,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  FileCode2,
  Building2,
  FileSpreadsheet,
  UserCheck,
  ShieldCheck,
  Upload,
  Trash2,
  Image as ImageIcon,
  Table as TableIcon,
  Palette,
  Highlighter,
  Scissors,
  Plus,
  Rows,
  Columns,
  Sparkles,
  Link as LinkIcon,
  Subscript as SubIcon,
  Superscript as SuperIcon,
  FilePlus,
  Type,
  FormInput,
  Search,
  FileUp,
  FileCheck,
  FileWarning,
  Eye,
  Move,
  Layout,
} from "lucide-react";

// FontSize is now built-in to @tiptap/extension-text-style v3.x — no custom extension needed.

export default function TemplateBuilderClient() {
  const params = useParams();
  const router = useRouter();
  const templateId = params?.templateId as string;

  const [collapsed, setCollapsed] = useState(true);
  const [template, setTemplate] = useState<TemplateMaster | null>(null);
  const [contentRecord, setContentRecord] = useState<TemplateContentRecord | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingHeader, setUploadingHeader] = useState<boolean>(false);
  const [uploadingFooter, setUploadingFooter] = useState<boolean>(false);
  const [removingHeader, setRemovingHeader] = useState<boolean>(false);
  const [removingFooter, setRemovingFooter] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [liveHtmlContent, setLiveHtmlContent] = useState<string>("");

  // Toolbar UI State
  const [showTableMenu, setShowTableMenu] = useState<boolean>(false);

  // Notification Toast State
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Dynamic Fields Integration State
  const [showFieldsPanel, setShowFieldsPanel] = useState<boolean>(true);
  const [activeStudioTab, setActiveStudioTab] = useState<"text" | "fields" | "uploads" | "import">("text");
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState<boolean>(false);
  const [fieldsSearch, setFieldsSearch] = useState<string>("");
  const [debouncedFieldsSearch, setDebouncedFieldsSearch] = useState<string>("");

  const handleAddHeading = (level: 1 | 2 | 3) => {
    if (!editor) return;
    const tag = level === 1 ? "<h1>Heading 1</h1>" : level === 2 ? "<h2>Heading 2</h2>" : "<h3>Heading 3</h3>";
    editor.chain().focus().insertContent(tag).run();
  };

  const handleAddBodyText = () => {
    if (!editor) return;
    editor.chain().focus().insertContent("<p>Type body text here...</p>").run();
  };

  // Document Import Integration State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeDoc, setActiveDoc] = useState<TemplateDocument | null>(null);
  const [existingDocs, setExistingDocs] = useState<TemplateDocument[]>([]);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [isScratchConfirmed, setIsScratchConfirmed] = useState<boolean>(false);

  interface MovableBlock {
    id: string;
    text: string;
    x: number;
    y: number;
    width?: number;
  }

  // Interactive Draggable Free Text Blocks State
  const [movableBlocks, setMovableBlocks] = useState<MovableBlock[]>([]);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleAddFreeTextBlock = () => {
    const newBlock: MovableBlock = {
      id: "block_" + Date.now(),
      text: "Click to edit free text...",
      x: 60,
      y: 100 + (movableBlocks.length % 8) * 40,
      width: 220,
    };
    setMovableBlocks((prev) => [...prev, newBlock]);
    showToast("success", "Added draggable text box! Click and drag anywhere on the paper.");
  };

  const handleConvertSelectedTextToMovable = () => {
    let textToMove = "Type text here...";
    if (editor) {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, " ");
      if (text && text.trim() !== "") {
        textToMove = text.trim();
        editor.chain().focus().deleteSelection().run();
      }
    }

    const newBlock: MovableBlock = {
      id: "block_" + Date.now(),
      text: textToMove,
      x: 100,
      y: 120 + (movableBlocks.length % 6) * 50,
      width: 260,
    };
    setMovableBlocks((prev) => [...prev, newBlock]);
    showToast("success", "Text converted to movable box! Click & drag anywhere on paper.");
  };

  const handleMouseDownBlock = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDraggingBlockId(id);
    const block = movableBlocks.find((b) => b.id === id);
    if (block) {
      setDragOffset({
        x: e.clientX - block.x,
        y: e.clientY - block.y,
      });
    }
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (!draggingBlockId) return;
    const canvasRect = e.currentTarget.getBoundingClientRect();
    let newX = e.clientX - canvasRect.left - dragOffset.x;
    let newY = e.clientY - canvasRect.top - dragOffset.y;

    // Full 100% flexible paper page bounds (0 to extreme corners)
    newX = Math.max(0, Math.min(newX, 740));
    newY = Math.max(0, Math.min(newY, 1030));

    setMovableBlocks((prev) =>
      prev.map((b) => (b.id === draggingBlockId ? { ...b, x: newX, y: newY } : b))
    );
  };

  const handlePaperCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest(".group\\/box") || target.closest("button") || target.getAttribute("contenteditable")) {
      return;
    }
    const canvasRect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.round(e.clientX - canvasRect.left);
    const clickY = Math.round(e.clientY - canvasRect.top);

    const newBlock: MovableBlock = {
      id: "block_" + Date.now(),
      text: "Type text here...",
      x: Math.max(5, Math.min(clickX, 700)),
      y: Math.max(5, Math.min(clickY, 1000)),
      width: 220,
    };
    setMovableBlocks((prev) => [...prev, newBlock]);
    showToast("success", "Text box placed at double-clicked location!");
  };

  const handleMouseUpCanvas = () => {
    setDraggingBlockId(null);
  };

  const handleUpdateBlockText = (id: string, text: string) => {
    setMovableBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, text } : b))
    );
  };

  const handleDeleteMovableBlock = (id: string) => {
    setMovableBlocks((prev) => prev.filter((b) => b.id !== id));
    showToast("success", "Text box deleted.");
  };

  const fieldsSearchDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFieldsSearchChange = (val: string) => {
    setFieldsSearch(val);
    if (fieldsSearchDebounceTimer.current) {
      clearTimeout(fieldsSearchDebounceTimer.current);
    }
    fieldsSearchDebounceTimer.current = setTimeout(() => {
      setDebouncedFieldsSearch(val);
    }, 350);
  };

  const headerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);
  const contentImageInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper to format full image URL
  const getImageUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
    const origin = new URL(baseUrl).origin;
    return `${origin}${path}`;
  };

  // Helper to split HTML into A4 pages based on block element height costs and explicit page breaks
  const getPaginatedPages = (html: string): string[] => {
    if (!html || html.trim() === "" || html === "<p></p>") {
      return ["<p></p>"];
    }

    if (typeof window === "undefined") {
      return [html];
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const children = Array.from(doc.body.children);

      if (children.length === 0) {
        return [html];
      }

      const pages: string[] = [];
      let currentPageHtml = "";
      let currentHeightUnits = 0;
      const MAX_PAGE_UNITS = 22; // Precise A4 body height capacity for automatic Page 2 creation

      children.forEach((child) => {
        const textLen = child.textContent?.length || 0;
        const tagName = child.tagName.toLowerCase();
        const isExplicitPageBreak =
          child.getAttribute("data-page-break") === "true" ||
          child.classList.contains("page-break");

        if (isExplicitPageBreak) {
          if (currentPageHtml.trim() !== "") {
            pages.push(currentPageHtml);
          }
          currentPageHtml = "";
          currentHeightUnits = 0;
          return;
        }

        let unitCost = 1;
        if (tagName.startsWith("h1")) unitCost = 2.5;
        else if (tagName.startsWith("h2")) unitCost = 2;
        else if (tagName.startsWith("h3")) unitCost = 1.5;
        else if (tagName === "ul" || tagName === "ol") unitCost = Math.max(1, child.children.length * 0.8);
        else if (tagName === "table") unitCost = Math.max(2, child.querySelectorAll("tr").length * 1.1);
        else unitCost = Math.max(1, Math.ceil(textLen / 160));

        if (currentHeightUnits + unitCost > MAX_PAGE_UNITS && currentPageHtml.trim() !== "") {
          pages.push(currentPageHtml);
          currentPageHtml = child.outerHTML;
          currentHeightUnits = unitCost;
        } else {
          currentPageHtml += child.outerHTML;
          currentHeightUnits += unitCost;
        }
      });

      if (currentPageHtml.trim() !== "") {
        pages.push(currentPageHtml);
      }

      return pages.length > 0 ? pages : [html];
    } catch {
      return [html];
    }
  };

  // Helper to sanitize & auto-convert raw image JSON/base64 text into proper HTML <img> tags
  const cleanHtmlContent = useCallback((html: string): string => {
    if (!html || typeof window === "undefined") return html;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      let modified = false;

      const allElements = doc.body.querySelectorAll("*");
      allElements.forEach((el) => {
        if (el.children.length === 0 && el.textContent) {
          const text = el.textContent.trim();
          if (text.includes("data:image/") || (text.includes('"src"') && text.includes("base64"))) {
            const srcMatch =
              text.match(/"src"\s*:\s*"([^"]+)"/) ||
              text.match(/(data:image\/[a-zA-Z0-9+/=;,-]+)/);
            if (srcMatch && srcMatch[1]) {
              const alignMatch = text.match(/"align"\s*:\s*"([^"]+)"/);
              const align = alignMatch ? alignMatch[1] : "left";
              const img = doc.createElement("img");
              img.src = srcMatch[1];
              img.style.maxWidth = "100%";
              img.style.height = "auto";
              img.style.display = "block";
              if (align === "center") img.style.margin = "0 auto";
              else if (align === "right") img.style.margin = "0 0 0 auto";
              el.innerHTML = "";
              el.appendChild(img);
              modified = true;
            }
          }
        }
      });

      return modified ? doc.body.innerHTML : html;
    } catch {
      return html;
    }
  }, []);

  // Initialize Tiptap Editor with Full Extensions Suite
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: "<p>Loading document content...</p>",
    onUpdate: ({ editor }) => {
      setLiveHtmlContent(cleanHtmlContent(editor.getHTML()));
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none focus:outline-none min-h-[500px] p-8 text-slate-900 bg-white rounded-b-xl leading-relaxed text-sm selection:bg-indigo-200",
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.indexOf("image") === 0) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const src = e.target?.result as string;
                if (src && editor) {
                  editor.chain().focus().setImage({ src }).run();
                }
              };
              reader.readAsDataURL(file);
              return true;
            }
          }
        }

        const text = event.clipboardData?.getData("text/plain");
        if (text && (text.includes("data:image/") || (text.includes('"src"') && text.includes("base64")))) {
          const srcMatch = text.match(/"src"\s*:\s*"([^"]+)"/) || text.match(/(data:image\/[a-zA-Z0-9+/=;,-]+)/);
          if (srcMatch && srcMatch[1] && editor) {
            editor.chain().focus().setImage({ src: srcMatch[1] }).run();
            return true;
          }
        }

        return false;
      },
    },
  });

  // Load Template Master Metadata & Template Content Record & Existing Imported Documents
  const loadBuilderData = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    try {
      const [tData, cData, docs] = await Promise.all([
        templateMasterService.getTemplateById(templateId),
        templateBuilderService.getContentByTemplateId(templateId).catch(() => null),
        templateDocumentService.getDocumentsByTemplateId(templateId).catch(() => []),
      ]);

      const localHeader = typeof window !== "undefined" ? localStorage.getItem(`template_header_${templateId}`) : null;
      const localFooter = typeof window !== "undefined" ? localStorage.getItem(`template_footer_${templateId}`) : null;

      const mergedRecord = cData ? {
        ...cData,
        headerImage: cData.headerImage || (cData as any).header_image || localHeader,
        footerImage: cData.footerImage || (cData as any).footer_image || localFooter,
      } : (localHeader || localFooter ? {
        id: Date.now(),
        templateId: Number(templateId),
        contentType: "EDITOR" as const,
        content: "<p></p>",
        headerImage: localHeader,
        footerImage: localFooter,
        status: "draft" as const,
      } : null);

      setTemplate(tData);
      setContentRecord(mergedRecord);
      setExistingDocs(docs);

      if (docs.length > 0) {
        const latestDoc = docs[0];
        setActiveDoc(latestDoc);
        if (latestDoc.status === "UPLOADED") {
          setIsConverting(true);
          pollConversionStatus(latestDoc.id);
        }
      }

      const rawHtml = cData?.content || "<p></p>";

      const initialHtml = cleanHtmlContent(rawHtml);
      setLiveHtmlContent(initialHtml);
      if (editor) {
        editor.commands.setContent(initialHtml);
      }
    } catch (err: any) {
      console.error("Load builder data error:", err);
      setError(err?.message || "Failed to load template builder environment.");
    } finally {
      setLoading(false);
    }
  }, [templateId, editor, cleanHtmlContent]);

  useEffect(() => {
    if (editor) {
      loadBuilderData();
    }
  }, [editor, loadBuilderData]);

  // Fetch dynamic fields for the specific document type and global fields
  const fetchDynamicFields = useCallback(async () => {
    if (!template) return;
    setFieldsLoading(true);
    try {
      const docTypeId = template.documentTypeId;
      // Get document specific fields and all fields for global filtering
      const [specificFields, globalFields] = await Promise.all([
        docTypeId ? dynamicFieldService.getDynamicFields({ document_type_id: docTypeId, is_active: true }) : Promise.resolve([]),
        dynamicFieldService.getDynamicFields({ is_active: true })
      ]);

      const filteredGlobal = globalFields.filter(f => !f.documentTypeId);
      const combined = [...specificFields, ...filteredGlobal];
      // Filter out duplicate IDs
      const uniqueCombined = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setDynamicFields(uniqueCombined);
    } catch (err) {
      console.error("Error fetching template fields:", err);
    } finally {
      setFieldsLoading(false);
    }
  }, [template]);

  useEffect(() => {
    if (template) {
      fetchDynamicFields();
    }
  }, [template, fetchDynamicFields]);

  // Filtered list of dynamic fields based on search
  const filteredFields = dynamicFields.filter((field) => {
    if (!debouncedFieldsSearch) return true;
    const s = debouncedFieldsSearch.toLowerCase();
    return (
      (field.fieldName && field.fieldName.toLowerCase().includes(s)) ||
      (field.fieldKey && field.fieldKey.toLowerCase().includes(s)) ||
      (field.description && field.description.toLowerCase().includes(s))
    );
  });

  // Insert placeholder at current editor cursor position
  const handleInsertField = (fieldKey: string) => {
    if (!editor) return;
    editor.commands.focus();
    editor.chain().focus().insertContent(`{{${fieldKey}}}`).run();
    showToast("success", `Inserted placeholder {{${fieldKey}}}`);
  };

  // Poll Conversion Status logic for imported documents
  const pollConversionStatus = useCallback(async (docId: number) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 30) { // Timeout after 60 seconds
        clearInterval(interval);
        setIsConverting(false);
        setConversionError("Conversion timed out. Please retry conversion manually.");
        return;
      }

      try {
        const doc = await templateDocumentService.getDocumentById(docId);
        if (doc.status === "CONVERTED") {
          clearInterval(interval);
          setIsConverting(false);
          setActiveDoc(doc);
          if (editor && doc.convertedContent) {
            const cleaned = cleanHtmlContent(doc.convertedContent);
            editor.commands.setContent(cleaned);
            setLiveHtmlContent(cleaned);
          }
          showToast("success", "Document converted and loaded into editor successfully!");
        } else if (doc.status === "FAILED") {
          clearInterval(interval);
          setIsConverting(false);
          setActiveDoc(doc);
          setConversionError("Conversion failed. Please verify the document format or retry.");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);
  }, [editor, cleanHtmlContent]);

  // Handle document file selection and client-side validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast("error", "File exceeds maximum size limit of 10 MB");
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx" && ext !== "doc") {
      showToast("error", "Unsupported file format. Please upload PDF, DOCX, or DOC.");
      return;
    }

    setSelectedFile(file);
    setConversionError(null);
  };

  // Upload document file to backend API
  const handleUploadDocument = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setConversionError(null);
    try {
      const doc = await templateDocumentService.uploadDocument(Number(templateId), selectedFile);
      setActiveDoc(doc);
      setExistingDocs((prev) => [doc, ...prev]);
      showToast("success", "Document uploaded successfully!");

      if (doc.status === "UPLOADED") {
        setIsConverting(true);
        pollConversionStatus(doc.id);
      } else if (doc.status === "CONVERTED") {
        if (editor && doc.convertedContent) {
          const cleaned = cleanHtmlContent(doc.convertedContent);
          editor.commands.setContent(cleaned);
          setLiveHtmlContent(cleaned);
        }
      }
      setShowImportModal(false);
      setSelectedFile(null);
    } catch (err: any) {
      console.error("Upload document error:", err);
      showToast("error", err?.message || "Failed to upload document.");
      setConversionError(err?.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  // Manual conversion retry trigger
  const handleRetryConversion = async () => {
    if (!activeDoc) return;
    setIsConverting(true);
    setConversionError(null);
    try {
      const doc = await templateDocumentService.convertDocument(activeDoc.id);
      setActiveDoc(doc);
      if (doc.status === "UPLOADED") {
        pollConversionStatus(doc.id);
      } else if (doc.status === "CONVERTED") {
        setIsConverting(false);
        if (editor && doc.convertedContent) {
          const cleaned = cleanHtmlContent(doc.convertedContent);
          editor.commands.setContent(cleaned);
          setLiveHtmlContent(cleaned);
        }
        showToast("success", "Document converted successfully!");
      }
    } catch (err: any) {
      console.error("Retry conversion error:", err);
      setIsConverting(false);
      setConversionError(err?.message || "Conversion retry failed.");
      showToast("error", err?.message || "Conversion retry failed.");
    }
  };

  // Ensure TemplateContent Record Exists before Upload
  const ensureContentRecord = async (): Promise<TemplateContentRecord> => {
    if (contentRecord && contentRecord.id) return contentRecord;
    const htmlContent = editor ? editor.getHTML() : "<p></p>";
    const created = await templateBuilderService.createContent({
      templateId: Number(templateId),
      contentType: "EDITOR",
      content: htmlContent,
      status: "draft",
    });
    setContentRecord(created);
    return created;
  };

  // Handle Header & Footer File Selection
  const handleImageFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "header" | "footer"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Image file size exceeds maximum limit of 5 MB");
      e.target.value = "";
      return;
    }

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast("error", "Invalid file type. Please upload a PNG, JPG, or WEBP image.");
      e.target.value = "";
      return;
    }

    if (type === "header") setUploadingHeader(true);
    else setUploadingFooter(true);

    try {
      const record = await ensureContentRecord();
      let updatedRecord: TemplateContentRecord;
      try {
        updatedRecord = await templateBuilderService.uploadImage(record.id, type, file);
      } catch (uploadErr: any) {
        console.warn(`Server upload failed (${uploadErr?.message}), falling back to Data URL...`);
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const fieldKey = type === "header" ? "headerImage" : "footerImage";
        updatedRecord = await templateBuilderService.updateContent(record.id, {
          [fieldKey]: dataUrl,
          headerImage: type === "header" ? dataUrl : (record.headerImage || (record as any)?.header_image),
          footerImage: type === "footer" ? dataUrl : (record.footerImage || (record as any)?.footer_image),
        });
        updatedRecord = {
          ...record,
          ...updatedRecord,
          [fieldKey]: dataUrl,
        };
      }
      const fieldKey = type === "header" ? "headerImage" : "footerImage";
      const imgVal = updatedRecord[fieldKey] || (updatedRecord as any)[type === "header" ? "header_image" : "footer_image"] || (updatedRecord as any)[fieldKey];
      if (typeof window !== "undefined" && imgVal) {
        localStorage.setItem(`template_${type}_${templateId}`, imgVal);
      }
      setContentRecord((prev) => ({
        ...prev,
        ...updatedRecord,
        headerImage: type === "header" ? imgVal : (prev?.headerImage || (prev as any)?.header_image || null),
        footerImage: type === "footer" ? imgVal : (prev?.footerImage || (prev as any)?.footer_image || null),
      } as TemplateContentRecord));
      showToast("success", `${type === "header" ? "Header" : "Footer"} image saved successfully!`);
    } catch (err: any) {
      console.error(`Upload ${type} error:`, err);
      showToast("error", err?.message || `Failed to save ${type} image.`);
    } finally {
      if (type === "header") setUploadingHeader(false);
      else setUploadingFooter(false);
      e.target.value = "";
    }
  };

  // Insert Inline Image into Tiptap Document Content
  const handleInsertContentImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        editor.chain().focus().setImage({ src }).run();
        showToast("success", "Image inserted into document content!");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Insert Explicit Page Break Divider Node
  const handleInsertPageBreak = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent(
        '<p class="page-break font-mono text-[10px] uppercase border-y border-dashed border-indigo-400 bg-indigo-50 text-indigo-700 py-1.5 px-3 text-center my-4 font-bold select-none" data-page-break="true">--- PAGE BREAK ---</p><p></p>'
      )
      .run();
    showToast("success", "Page Break inserted!");
  };

  // Insert Free-Positioned Movable Container (Canva / Sejda Style)
  const handleInsertMovableTextBlock = () => {
    handleAddFreeTextBlock();
  };

  // Remove Header or Footer Image
  const handleRemoveImage = async (type: "header" | "footer") => {
    if (!contentRecord || !contentRecord.id) return;
    if (type === "header") setRemovingHeader(true);
    else setRemovingFooter(true);

    if (typeof window !== "undefined") {
      localStorage.removeItem(`template_${type}_${templateId}`);
    }

    try {
      let updatedRecord: TemplateContentRecord;
      try {
        updatedRecord = await templateBuilderService.removeImage(contentRecord.id, type);
      } catch (err) {
        const fieldKey = type === "header" ? "headerImage" : "footerImage";
        updatedRecord = await templateBuilderService.updateContent(contentRecord.id, {
          [fieldKey]: null,
        });
      }
      setContentRecord((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          ...updatedRecord,
          [type === "header" ? "headerImage" : "footerImage"]: null,
          [type === "header" ? "header_image" : "footer_image"]: null,
        };
      });
      showToast("success", `${type === "header" ? "Header" : "Footer"} image removed.`);
    } catch (err: any) {
      console.error(`Remove ${type} error:`, err);
      showToast("error", err?.message || `Failed to remove ${type} image.`);
    } finally {
      if (type === "header") setRemovingHeader(false);
      else setRemovingFooter(false);
    }
  };

  // Save Editor Content (POST for create, PUT for update)
  const handleSave = async () => {
    if (!editor || saving || !templateId) return;
    setSaving(true);

    let htmlContent = editor.getHTML();
    if (movableBlocks.length > 0) {
      const blocksHtml = movableBlocks
        .map(
          (b) =>
            `<div class="pdf-line" style="position: absolute; left: ${Math.round(b.x)}px; top: ${Math.round(
              b.y
            )}px; width: ${b.width || 220}px; font-family: sans-serif; background: #f5f3ff; border: 1px dashed #6366f1; padding: 8px; border-radius: 6px;">${b.text}</div>`
        )
        .join("\n");
      htmlContent += `\n<!-- MOVABLE BLOCKS -->\n` + blocksHtml;
    }

    const currentHeader = contentRecord?.headerImage || (contentRecord as any)?.header_image || null;
    const currentFooter = contentRecord?.footerImage || (contentRecord as any)?.footer_image || null;

    if (typeof window !== "undefined") {
      if (currentHeader) localStorage.setItem(`template_header_${templateId}`, currentHeader);
      if (currentFooter) localStorage.setItem(`template_footer_${templateId}`, currentFooter);
    }

    try {
      if (contentRecord && contentRecord.id) {
        const updated = await templateBuilderService.updateContent(contentRecord.id, {
          content: htmlContent,
          headerImage: currentHeader,
          footerImage: currentFooter,
          status: "draft",
        });
        setContentRecord((prev) => ({
          ...prev,
          ...updated,
          headerImage: updated?.headerImage || (updated as any)?.header_image || currentHeader,
          footerImage: updated?.footerImage || (updated as any)?.footer_image || currentFooter,
        }));
        showToast("success", "Template content updated successfully!");
      } else {
        const created = await templateBuilderService.createContent({
          templateId: Number(templateId),
          contentType: "EDITOR",
          content: htmlContent,
          headerImage: currentHeader,
          footerImage: currentFooter,
          status: "draft",
        });
        setContentRecord((prev) => ({
          ...prev,
          ...created,
          headerImage: created?.headerImage || (created as any)?.header_image || currentHeader,
          footerImage: created?.footerImage || (created as any)?.footer_image || currentFooter,
        }));
        showToast("success", "Template content created & saved successfully!");
      }
    } catch (err: any) {
      console.error("Save content error:", err);
      showToast("error", err?.message || "Failed to save template content.");
    } finally {
      setSaving(false);
    }
  };

  const headerPath = contentRecord?.headerImage || (contentRecord as any)?.header_image;
  const footerPath = contentRecord?.footerImage || (contentRecord as any)?.footer_image;

  const headerSrc = getImageUrl(headerPath);
  const footerSrc = getImageUrl(footerPath);

  // Available Fonts & Sizes
  const fontFamilies = [
    { label: "Default Font", value: "" },
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Times New Roman", value: "'Times New Roman', serif" },
    { label: "Calibri", value: "Calibri, sans-serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Verdana", value: "Verdana, sans-serif" },
    { label: "Inter", value: "Inter, sans-serif" },
  ];

  const fontSizes = ["8pt", "9pt", "10pt", "11pt", "12pt", "14pt", "16pt", "18pt", "20pt", "24pt", "28pt", "32pt"];

  return (
    <div className="min-h-screen bg-[#070911] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out p-4 sm:p-6 lg:p-8 ${collapsed ? "ml-20" : "ml-64"
          }`}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Notification Toast */}
          {toast && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold shadow-2xl flex items-center justify-between border animate-in slide-in-from-top duration-200 ${toast.type === "success"
                  ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
                  : "bg-rose-950/90 text-rose-200 border-rose-500/40"
                }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>{toast.msg}</span>
              </div>
              <button onClick={() => setToast(null)}>
                <X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
              </button>
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={headerInputRef}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={(e) => handleImageFileSelected(e, "header")}
            className="hidden"
          />
          <input
            type="file"
            ref={footerInputRef}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={(e) => handleImageFileSelected(e, "footer")}
            className="hidden"
          />
          <input
            type="file"
            ref={contentImageInputRef}
            accept="image/*"
            onChange={handleInsertContentImage}
            className="hidden"
          />

          {/* Top Bar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/template-builder"
                className="p-2.5 rounded-xl bg-[#0F1422] hover:bg-[#151C2F] text-slate-400 hover:text-white border border-[#1E2638] transition-all"
                title="Back to Template Builder Directory"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div>
                <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                  {template ? template.templateName : "Template Builder"}
                  {template && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                      {template.templateCode}
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Corporate Document Editor • Typography, Tables, Media & Page Breaks
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#0F1422] hover:bg-[#151C2F] text-slate-300 hover:text-white border border-[#1E2638] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Import PDF/Word Document"
              >
                <FileUp className="w-4 h-4 text-cyan-400" />
                <span>Import Doc</span>
              </button>

              <button
                onClick={loadBuilderData}
                className="p-2.5 rounded-xl bg-[#0F1422] hover:bg-[#151C2F] text-slate-400 hover:text-white border border-[#1E2638] transition-all"
                title="Reload Content"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="gradient-btn flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs cursor-pointer shadow-lg shadow-indigo-500/20 disabled:opacity-40"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Content..." : "Save Content"}</span>
              </button>
            </div>
          </div>

          {/* CHOICE OVERLAY FOR NEW TEMPLATES */}
          {!contentRecord?.content && !isScratchConfirmed && existingDocs.length === 0 && (
            <div className="glass-card p-12 rounded-2xl border border-[#1E2638] text-center space-y-6 max-w-2xl mx-auto my-12 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                <FileCode2 className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-white">How would you like to build this template?</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Start fresh with our rich corporate document editor, or import an existing PDF or Word document to extract and edit its content.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => setIsScratchConfirmed(true)}
                  className="p-5 rounded-2xl bg-[#0F1422] hover:bg-[#141B2D] border border-[#202B44] text-left space-y-2 transition-all cursor-pointer group"
                >
                  <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors block">
                    Start From Scratch
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-normal">
                    Create clean template layouts using our upgraded visual editor, table builder and typography tools.
                  </span>
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="p-5 rounded-2xl bg-[#0F1422] hover:bg-[#141B2D] border border-cyan-500/20 text-left space-y-2 transition-all cursor-pointer group"
                >
                  <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors block flex items-center gap-1.5">
                    Import Existing Document
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">PDF/Word</span>
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-normal">
                    Upload an existing contract, agreement, or letter. Our system will convert it into editable content automatically.
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* CONVERSION & IMPORT STATUS BANNERS */}
          {activeDoc && (
            <div className="glass-card p-4 rounded-xl border border-[#1E2638] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2.5">
                {activeDoc.status === "CONVERTED" && (
                  <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono text-[10px]">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> CONVERTED
                  </span>
                )}
                {activeDoc.status === "UPLOADED" && (
                  <span className="px-2 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 font-mono text-[10px] animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> CONVERTING
                  </span>
                )}
                {activeDoc.status === "FAILED" && (
                  <span className="px-2 py-1 rounded bg-rose-950 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-mono text-[10px]">
                    <FileWarning className="w-3.5 h-3.5 text-rose-400" /> CONVERSION FAILED
                  </span>
                )}

                <div className="space-y-0.5">
                  <span className="text-slate-300 font-semibold block">{activeDoc.originalFileName}</span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    Format: {activeDoc.originalFileType} • Uploaded: {new Date(activeDoc.createdAt || "").toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={templateDocumentService.getOriginalUrl(activeDoc.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1E2638] border border-[#202B44] text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Original</span>
                </a>

                {activeDoc.status === "FAILED" && (
                  <button
                    onClick={handleRetryConversion}
                    disabled={isConverting}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isConverting ? "animate-spin" : ""}`} />
                    <span>Retry Conversion</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* HEADER & FOOTER ASSETS MANAGEMENT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Header Asset Card */}
            <div className="glass-card p-4 rounded-xl border border-[#1E2638] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  Header Image Asset
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  PNG / JPG / WEBP (Max 5MB)
                </span>
              </div>

              {headerSrc ? (
                <div className="flex items-center justify-between gap-4 p-3 bg-[#111626] rounded-xl border border-[#1E2638]">
                  <div className="h-12 max-w-[200px] flex items-center overflow-hidden bg-white p-1 rounded border border-slate-300">
                    <img src={headerSrc} alt="Header Asset" className="max-h-full object-contain" />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => headerInputRef.current?.click()}
                      disabled={uploadingHeader || removingHeader}
                      className="px-3 py-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1E2638] text-slate-300 text-xs font-semibold border border-[#202B44] transition-colors"
                    >
                      {uploadingHeader ? "Uploading..." : "Change"}
                    </button>
                    <button
                      onClick={() => handleRemoveImage("header")}
                      disabled={uploadingHeader || removingHeader}
                      className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-colors"
                      title="Remove Header"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => headerInputRef.current?.click()}
                  disabled={uploadingHeader}
                  className="w-full p-4 rounded-xl border border-dashed border-[#202B44] bg-[#0F1422] hover:bg-[#141B2D] text-slate-400 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>{uploadingHeader ? "Uploading Header..." : "Upload Header Image"}</span>
                </button>
              )}
            </div>

            {/* Footer Asset Card */}
            <div className="glass-card p-4 rounded-xl border border-[#1E2638] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  Footer Image Asset
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  PNG / JPG / WEBP (Max 5MB)
                </span>
              </div>

              {footerSrc ? (
                <div className="flex items-center justify-between gap-4 p-3 bg-[#111626] rounded-xl border border-[#1E2638]">
                  <div className="h-12 max-w-[200px] flex items-center overflow-hidden bg-white p-1 rounded border border-slate-300">
                    <img src={footerSrc} alt="Footer Asset" className="max-h-full object-contain" />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => footerInputRef.current?.click()}
                      disabled={uploadingFooter || removingFooter}
                      className="px-3 py-1.5 rounded-lg bg-[#141A2C] hover:bg-[#1E2638] text-slate-300 text-xs font-semibold border border-[#202B44] transition-colors"
                    >
                      {uploadingFooter ? "Uploading..." : "Change"}
                    </button>
                    <button
                      onClick={() => handleRemoveImage("footer")}
                      disabled={uploadingFooter || removingFooter}
                      className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-colors"
                      title="Remove Footer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => footerInputRef.current?.click()}
                  disabled={uploadingFooter}
                  className="w-full p-4 rounded-xl border border-dashed border-[#202B44] bg-[#0F1422] hover:bg-[#141B2D] text-slate-400 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>{uploadingFooter ? "Uploading Footer..." : "Upload Footer Image"}</span>
                </button>
              )}
            </div>
          </div>

          {/* CANVA / GOOGLE DOCS STYLE A4 WORKSPACE */}
          {loading ? (
            <div className="glass-card p-16 rounded-2xl border border-[#1E2638] text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs font-mono text-slate-400">Loading Document Editor...</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-[#1E2638] overflow-hidden flex flex-col shadow-2xl">
              {/* STICKY RICH FORMATTING TOOLBAR */}
              {editor && (
                <div className="bg-[#0B0E1B] border-b border-[#1E2638] p-3 space-y-2 text-slate-300 sticky top-0 z-30 shadow-md">
                  {/* ROW 1: Typography & Formatting */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Font Family Selector */}
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") editor.chain().focus().unsetFontFamily().run();
                        else editor.chain().focus().setFontFamily(val).run();
                      }}
                      className="bg-[#141A2C] border border-[#202B44] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      title="Font Family"
                    >
                      {fontFamilies.map((f) => (
                        <option key={f.label} value={f.value} className="bg-[#0F1424]">
                          {f.label}
                        </option>
                      ))}
                    </select>

                    {/* Font Size Selector */}
                    <select
                      onChange={(e) => {
                        const size = e.target.value;
                        if (!size) {
                          (editor.chain().focus() as any).unsetFontSize().run();
                        } else {
                          (editor.chain().focus() as any).setFontSize(size).run();
                        }
                      }}
                      className="bg-[#141A2C] border border-[#202B44] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
                      title="Font Size"
                    >
                      <option value="">Size (Auto)</option>
                      {fontSizes.map((s) => (
                        <option key={s} value={s} className="bg-[#0F1424]">
                          {s}
                        </option>
                      ))}
                    </select>

                    <div className="w-px h-5 bg-[#1E2638] mx-1" />

                    {/* Text Style Controls */}
                    <button
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive("bold")
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Bold (Ctrl+B)"
                    >
                      <Bold className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive("italic")
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Italic (Ctrl+I)"
                    >
                      <Italic className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().toggleUnderline().run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive("underline")
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Underline (Ctrl+U)"
                    >
                      <UnderlineIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().toggleStrike().run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive("strike")
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Strikethrough"
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().toggleSubscript().run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive("subscript")
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Subscript"
                    >
                      <SubIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().toggleSuperscript().run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive("superscript")
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Superscript"
                    >
                      <SuperIcon className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-[#1E2638] mx-1" />

                    {/* Text Color Picker */}
                    <label
                      className="p-1.5 rounded-lg hover:bg-[#141A2C] text-slate-400 cursor-pointer flex items-center gap-1"
                      title="Text Color"
                    >
                      <Palette className="w-4 h-4 text-indigo-400" />
                      <input
                        type="color"
                        onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
                        className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0 hidden"
                      />
                    </label>

                    {/* Highlight Picker */}
                    <button
                      onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive("highlight")
                          ? "bg-yellow-500 text-slate-900"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Text Highlight (Yellow)"
                    >
                      <Highlighter className="w-4 h-4" />
                    </button>
                  </div>

                  {/* ROW 2: Alignments, Headings, Lists, Tables & Page Breaks */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1E2638]/60">
                    {/* Alignment controls */}
                    <button
                      onClick={() => editor.chain().focus().setTextAlign("left").run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive({ textAlign: "left" })
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Align Left"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().setTextAlign("center").run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive({ textAlign: "center" })
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Align Center"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().setTextAlign("right").run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive({ textAlign: "right" })
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Align Right"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive({ textAlign: "justify" })
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Justify"
                    >
                      <AlignJustify className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-[#1E2638] mx-1" />

                    {/* Lists */}
                    <button
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive("bulletList")
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive("orderedList")
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Ordered List"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-[#1E2638] mx-1" />

                    {/* Headings */}
                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive("heading", { level: 1 })
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Heading 1"
                    >
                      <Heading1 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive("heading", { level: 2 })
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Heading 2"
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={`p-1.5 rounded-lg transition-colors ${editor.isActive("heading", { level: 3 })
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-[#141A2C] text-slate-400"
                        }`}
                      title="Heading 3"
                    >
                      <Heading3 className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-[#1E2638] mx-1" />

                    {/* Table Menu Toggle Button */}
                    <div className="relative">
                      <button
                        onClick={() => setShowTableMenu((prev) => !prev)}
                        className="px-2 py-1 rounded-lg bg-[#141A2C] hover:bg-[#1E2638] text-slate-300 text-xs font-semibold border border-[#202B44] flex items-center gap-1.5 transition-colors"
                        title="Table Tools"
                      >
                        <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Table</span>
                      </button>

                      {/* Table Controls Dropdown Popover */}
                      {showTableMenu && (
                        <div className="absolute left-0 mt-2 w-48 bg-[#0F1424] border border-[#202B44] rounded-xl shadow-2xl p-2 z-50 space-y-1 text-xs text-slate-200 font-medium">
                          <button
                            onClick={() => {
                              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                              setShowTableMenu(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-[#192138] rounded flex items-center gap-2"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Insert 3x3 Table</span>
                          </button>
                          <button
                            onClick={() => {
                              editor.chain().focus().addRowAfter().run();
                              setShowTableMenu(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-[#192138] rounded flex items-center gap-2"
                          >
                            <Rows className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Add Row Below</span>
                          </button>
                          <button
                            onClick={() => {
                              editor.chain().focus().addColumnAfter().run();
                              setShowTableMenu(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-[#192138] rounded flex items-center gap-2"
                          >
                            <Columns className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Add Column Right</span>
                          </button>
                          <button
                            onClick={() => {
                              editor.chain().focus().deleteRow().run();
                              setShowTableMenu(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-[#192138] text-rose-300 rounded flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Delete Row</span>
                          </button>
                          <button
                            onClick={() => {
                              editor.chain().focus().deleteColumn().run();
                              setShowTableMenu(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-[#192138] text-rose-300 rounded flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Delete Column</span>
                          </button>
                          <button
                            onClick={() => {
                              editor.chain().focus().deleteTable().run();
                              setShowTableMenu(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 hover:bg-rose-950 text-rose-300 font-bold rounded flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Delete Entire Table</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Content Image Picker */}
                    <button
                      onClick={() => contentImageInputRef.current?.click()}
                      className="px-2 py-1 rounded-lg bg-[#141A2C] hover:bg-[#1E2638] text-slate-300 text-xs font-semibold border border-[#202B44] flex items-center gap-1.5 transition-colors"
                      title="Insert Image into Document Content"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Insert Image</span>
                    </button>

                    {/* Insert Explicit Page Break */}
                    <button
                      onClick={handleInsertPageBreak}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Insert Explicit Page Break"
                    >
                      <FilePlus className="w-3.5 h-3.5" />
                      <span>Page Break</span>
                    </button>

                    {/* Insert Canva / Sejda Style Movable Text Block */}
                    <button
                      onClick={handleInsertMovableTextBlock}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Insert Movable / Resizable Canva-style Text Block"
                    >
                      <Move className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Free Text Box</span>
                    </button>

                    {/* Toggle Dynamic Fields Panel */}
                    <button
                      type="button"
                      onClick={() => setShowFieldsPanel((prev) => !prev)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${showFieldsPanel
                          ? "bg-indigo-600 border-indigo-500/30 text-white shadow-md shadow-indigo-500/10"
                          : "bg-[#141A2C] border-[#202B44] text-slate-300 hover:bg-[#1E2638]"
                        }`}
                      title="Toggle Reusable Placeholder Sidebar"
                    >
                      <FormInput className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Fields</span>
                    </button>

                    <div className="w-px h-5 bg-[#1E2638] mx-1 ml-auto" />

                    {/* Undo / Redo */}
                    <button
                      onClick={() => editor.chain().focus().undo().run()}
                      disabled={!editor.can().undo()}
                      className="p-1.5 rounded-lg hover:bg-[#141A2C] text-slate-400 disabled:opacity-30"
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => editor.chain().focus().redo().run()}
                      disabled={!editor.can().redo()}
                      className="p-1.5 rounded-lg hover:bg-[#141A2C] text-slate-400 disabled:opacity-30"
                      title="Redo (Ctrl+Y)"
                    >
                      <Redo className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* CANVA STUDIO MAIN EDITOR WORKSPACE */}
              <div className="flex flex-1 bg-[#090C18] relative min-h-[85vh] overflow-hidden">
                {/* CANVA LEFT ELEMENTS DOCK */}
                <div className="w-16 bg-[#080B15] border-r border-[#1B2236] flex flex-col items-center py-4 space-y-4 shrink-0 z-30">
                  <button
                    onClick={() => setActiveStudioTab("text")}
                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${activeStudioTab === "text"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "text-slate-400 hover:text-white hover:bg-[#121829]"
                      }`}
                    title="Text Elements"
                  >
                    <Type className="w-5 h-5" />
                    <span className="text-[9px] font-bold">Text</span>
                  </button>

                  <button
                    onClick={() => setActiveStudioTab("fields")}
                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${activeStudioTab === "fields"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "text-slate-400 hover:text-white hover:bg-[#121829]"
                      }`}
                    title="Dynamic Fields"
                  >
                    <FormInput className="w-5 h-5" />
                    <span className="text-[9px] font-bold">Fields</span>
                  </button>

                  <button
                    onClick={() => setActiveStudioTab("uploads")}
                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${activeStudioTab === "uploads"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "text-slate-400 hover:text-white hover:bg-[#121829]"
                      }`}
                    title="Upload Assets"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[9px] font-bold">Uploads</span>
                  </button>

                  <button
                    onClick={() => setActiveStudioTab("import")}
                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${activeStudioTab === "import"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "text-slate-400 hover:text-white hover:bg-[#121829]"
                      }`}
                    title="Import Document"
                  >
                    <FileUp className="w-5 h-5" />
                    <span className="text-[9px] font-bold">Import</span>
                  </button>
                </div>

                {/* CANVA ACTIVE TAB DRAWER PANEL */}
                <div className="w-72 shrink-0 bg-[#0B0E1B] border-r border-[#1E2638] flex flex-col p-4 space-y-4 z-20 overflow-y-auto">
                  {/* TAB 1: TEXT ELEMENTS */}
                  {activeStudioTab === "text" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Text Styles</h3>
                        <p className="text-[10px] text-slate-400 mt-1">Click to insert headings, text or draggable text boxes.</p>
                      </div>

                      <div className="space-y-2.5">
                        <button
                          onClick={() => handleAddHeading(1)}
                          className="w-full p-3.5 rounded-xl bg-[#131A2D] hover:bg-[#1A233D] border border-[#202B44] text-left transition-all group"
                        >
                          <span className="text-lg font-black text-white group-hover:text-indigo-300 block">Add a Heading</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">32pt bold header text</span>
                        </button>

                        <button
                          onClick={() => handleAddHeading(2)}
                          className="w-full p-3 rounded-xl bg-[#131A2D] hover:bg-[#1A233D] border border-[#202B44] text-left transition-all group"
                        >
                          <span className="text-sm font-bold text-white group-hover:text-indigo-300 block">Add a Subheading</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">20pt section header text</span>
                        </button>

                        <button
                          onClick={handleAddBodyText}
                          className="w-full p-3 rounded-xl bg-[#131A2D] hover:bg-[#1A233D] border border-[#202B44] text-left transition-all group"
                        >
                          <span className="text-xs font-medium text-slate-200 group-hover:text-white block">Add Body Text</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">14pt standard paragraph text</span>
                        </button>

                        <button
                          onClick={handleAddFreeTextBlock}
                          className="w-full p-3.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-left transition-all group"
                        >
                          <span className="text-xs font-bold text-indigo-200 group-hover:text-white flex items-center gap-2">
                            <Move className="w-4 h-4 text-indigo-400" />
                            Add Movable Text Box
                          </span>
                          <span className="text-[10px] text-indigo-300/70 block mt-0.5">Click & drag anywhere across the paper canvas</span>
                        </button>

                        <button
                          onClick={handleConvertSelectedTextToMovable}
                          className="w-full p-3 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-left transition-all group"
                        >
                          <span className="text-xs font-bold text-cyan-200 group-hover:text-white flex items-center gap-2">
                            <Move className="w-4 h-4 text-cyan-400" />
                            Convert Highlighted Text to Movable
                          </span>
                          <span className="text-[10px] text-cyan-300/70 block mt-0.5">Converts any selected text into a drag & drop box</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DYNAMIC FIELDS */}
                  {activeStudioTab === "fields" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between">
                          <span>Dynamic Fields</span>
                          <span className="text-[10px] text-indigo-400">Active</span>
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">1-Click placeholder insertion into document.</p>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search placeholders..."
                          value={fieldsSearch}
                          onChange={(e) => handleFieldsSearchChange(e.target.value)}
                          className="w-full bg-[#141A2C] border border-[#202B44] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Fields List */}
                      <div className="space-y-2 max-h-[550px] overflow-y-auto custom-scrollbar pr-1">
                        {fieldsLoading ? (
                          <div className="text-center py-6 text-slate-500 flex items-center justify-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                            <span className="text-xs font-mono">Loading...</span>
                          </div>
                        ) : filteredFields.length === 0 ? (
                          <div className="text-center py-8 bg-[#0D111F]/50 rounded-xl border border-dashed border-[#1E2638] text-slate-500 px-3">
                            <p className="text-xs font-semibold">No Fields Available</p>
                          </div>
                        ) : (
                          filteredFields.map((field) => (
                            <div
                              key={field.id}
                              className="p-3 bg-[#111626] rounded-xl border border-[#1E2638] hover:border-indigo-500/30 transition-all flex flex-col justify-between gap-2 group"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                                    {field.fieldName}
                                  </span>
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/20">
                                    {field.fieldType}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                  <code className="text-indigo-400 font-mono font-semibold">{`{{${field.fieldKey}}}`}</code>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleInsertField(field.fieldKey)}
                                className="w-full py-1 rounded bg-[#1C253E] hover:bg-indigo-600 text-white font-semibold text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Insert</span>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: UPLOADS & ASSETS */}
                  {activeStudioTab === "uploads" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Image Assets</h3>
                        <p className="text-[10px] text-slate-400 mt-1">Upload Header, Footer or Body Images.</p>
                      </div>

                      <div className="space-y-3">
                        {/* Header Upload Card */}
                        <div className="p-3 bg-[#131A2D] rounded-xl border border-[#202B44] space-y-2">
                          <span className="text-xs font-bold text-white block">Header Image</span>
                          {headerSrc ? (
                            <div className="space-y-2">
                              <div className="h-10 bg-white p-1 rounded overflow-hidden flex items-center">
                                <img src={headerSrc} alt="Header" className="max-h-full object-contain mx-auto" />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => headerInputRef.current?.click()}
                                  className="flex-1 py-1 bg-[#1C253E] hover:bg-indigo-600 text-white text-[11px] font-semibold rounded transition-colors"
                                >
                                  Change
                                </button>
                                <button
                                  onClick={() => handleRemoveImage("header")}
                                  className="p-1 bg-rose-950 text-rose-300 border border-rose-500/40 rounded text-xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => headerInputRef.current?.click()}
                              className="w-full py-2.5 rounded-lg border border-dashed border-indigo-500/40 bg-indigo-950/40 text-indigo-300 text-xs font-semibold hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Header</span>
                            </button>
                          )}
                        </div>

                        {/* Footer Upload Card */}
                        <div className="p-3 bg-[#131A2D] rounded-xl border border-[#202B44] space-y-2">
                          <span className="text-xs font-bold text-white block">Footer Image</span>
                          {footerSrc ? (
                            <div className="space-y-2">
                              <div className="h-10 bg-white p-1 rounded overflow-hidden flex items-center">
                                <img src={footerSrc} alt="Footer" className="max-h-full object-contain mx-auto" />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => footerInputRef.current?.click()}
                                  className="flex-1 py-1 bg-[#1C253E] hover:bg-indigo-600 text-white text-[11px] font-semibold rounded transition-colors"
                                >
                                  Change
                                </button>
                                <button
                                  onClick={() => handleRemoveImage("footer")}
                                  className="p-1 bg-rose-950 text-rose-300 border border-rose-500/40 rounded text-xs"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => footerInputRef.current?.click()}
                              className="w-full py-2.5 rounded-lg border border-dashed border-cyan-500/40 bg-cyan-950/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-900/50 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Footer</span>
                            </button>
                          )}
                        </div>

                        {/* Inline Content Image */}
                        <button
                          onClick={() => contentImageInputRef.current?.click()}
                          className="w-full p-3 rounded-xl bg-[#131A2D] hover:bg-[#1A233D] border border-[#202B44] text-left transition-all flex items-center gap-2 group"
                        >
                          <ImageIcon className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-semibold text-white">Insert Image into Body</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: IMPORT DOCUMENT */}
                  {activeStudioTab === "import" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Import File</h3>
                        <p className="text-[10px] text-slate-400 mt-1">Convert PDF or Word document into template.</p>
                      </div>

                      <button
                        onClick={() => setShowImportModal(true)}
                        className="w-full p-4 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-left transition-all space-y-1 group"
                      >
                        <span className="text-xs font-bold text-cyan-200 flex items-center gap-2">
                          <FileUp className="w-4 h-4 text-cyan-400" />
                          Upload PDF / DOCX
                        </span>
                        <span className="text-[10px] text-cyan-300/70 block">Automatically converts document layout</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* VISUAL WHITE A4 PAPER CANVAS WORKSPACE (CANVA STYLE MULTI-PAGE FLOW) */}
                <div
                  className="flex-1 bg-[#0E121E] p-6 lg:p-12 flex flex-col items-center gap-8 overflow-y-auto select-none custom-scrollbar"
                  onMouseMove={handleMouseMoveCanvas}
                  onMouseUp={handleMouseUpCanvas}
                >
                  {getPaginatedPages(liveHtmlContent).map((pageHtml, pageIdx, pagesArr) => (
                    <div
                      key={pageIdx}
                      onDoubleClick={handlePaperCanvasDoubleClick}
                      className="w-full max-w-[794px] bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-300 font-sans leading-relaxed text-sm flex flex-col justify-between min-h-[1050px] relative overflow-hidden transition-all cursor-crosshair"
                    >
                      {/* DIRECT PAPER HEADER IMAGE FRAME */}
                      {headerSrc ? (
                        <div className="w-full shrink-0 relative group border-b border-slate-200">
                          <img src={headerSrc} alt="Header Asset" className="w-full h-auto block object-cover max-h-[160px]" />
                          {pageIdx === 0 && (
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                              <button
                                onClick={() => headerInputRef.current?.click()}
                                className="px-3 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-bold shadow hover:bg-slate-100 transition-colors"
                              >
                                Change Header Image
                              </button>
                              <button
                                onClick={() => handleRemoveImage("header")}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold shadow hover:bg-rose-700 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          onClick={() => headerInputRef.current?.click()}
                          className="w-full p-3 bg-slate-50 hover:bg-indigo-50/50 border-b border-dashed border-slate-300 text-center text-xs font-semibold text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors flex items-center justify-center gap-2 group"
                        >
                          <Upload className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                          <span>Click to Upload Top Header Image (Optional)</span>
                        </div>
                      )}

                      {/* DIRECT DOCUMENT BODY AREA */}
                      <div className="p-10 flex-1 min-h-[750px] relative bg-white select-text">
                        {pageIdx === 0 ? (
                          <EditorContent editor={editor} />
                        ) : (
                          <div
                            className="prose prose-slate max-w-none text-slate-900"
                            dangerouslySetInnerHTML={{ __html: pageHtml }}
                          />
                        )}

                        {/* INTERACTIVE DRAGGABLE TEXT BLOCKS OVERLAY (CANVA RECTANGLE SELECTION BOX) */}
                        {pageIdx === 0 &&
                          movableBlocks.map((block) => {
                            const isSelected = draggingBlockId === block.id;
                            return (
                              <div
                                key={block.id}
                                onMouseDown={(e) => handleMouseDownBlock(e, block.id)}
                                style={{
                                  position: "absolute",
                                  left: `${block.x}px`,
                                  top: `${block.y}px`,
                                  width: block.width ? `${block.width}px` : "auto",
                                  cursor: isSelected ? "grabbing" : "grab",
                                }}
                                className={`group/box p-2.5 rounded-md transition-all relative ${isSelected
                                    ? "border-2 border-indigo-500 bg-indigo-50/95 ring-4 ring-indigo-500/20 shadow-2xl z-30"
                                    : "border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50/90 shadow-md z-20"
                                  }`}
                              >
                                {/* Canva 4 Corner Resize / Selection Handles */}
                                <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow pointer-events-none" />
                                <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow pointer-events-none" />
                                <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow pointer-events-none" />
                                <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow pointer-events-none" />

                                {/* Drag Handle Bar */}
                                <div className="flex items-center justify-between gap-2 pb-1 border-b border-indigo-200/80 mb-1.5 select-none cursor-grab active:cursor-grabbing">
                                  <span className="text-[9px] font-mono font-extrabold text-indigo-700 uppercase flex items-center gap-1">
                                    <Move className="w-3 h-3 text-indigo-600" /> Movable Text Box
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMovableBlock(block.id);
                                    }}
                                    className="p-0.5 rounded text-rose-600 hover:bg-rose-100 transition-colors"
                                    title="Delete Box"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Editable Content */}
                                <div
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => handleUpdateBlockText(block.id, e.currentTarget.innerHTML)}
                                  dangerouslySetInnerHTML={{ __html: block.text }}
                                  className="focus:outline-none text-slate-900 text-sm font-sans min-w-[160px] p-1 bg-white/80 rounded border border-indigo-100 focus:bg-white"
                                />
                              </div>
                            );
                          })}
                      </div>

                      {/* DIRECT PAPER FOOTER IMAGE FRAME */}
                      {footerSrc ? (
                        <div className="w-full shrink-0 relative group border-t border-slate-200">
                          <img src={footerSrc} alt="Footer Asset" className="w-full h-auto block object-cover max-h-[160px]" />
                          {pageIdx === 0 && (
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
                              <button
                                onClick={() => footerInputRef.current?.click()}
                                className="px-3 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-bold shadow hover:bg-slate-100 transition-colors"
                              >
                                Change Footer Image
                              </button>
                              <button
                                onClick={() => handleRemoveImage("footer")}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold shadow hover:bg-rose-700 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          onClick={() => footerInputRef.current?.click()}
                          className="w-full p-3 bg-slate-50 hover:bg-cyan-50/50 border-t border-dashed border-slate-300 text-center text-xs font-semibold text-slate-400 hover:text-cyan-600 cursor-pointer transition-colors flex items-center justify-center gap-2 group"
                        >
                          <Upload className="w-4 h-4 text-slate-400 group-hover:text-cyan-600" />
                          <span>Click to Upload Bottom Footer Image (Optional)</span>
                        </div>
                      )}

                      {/* Page Number Badge */}
                      <div className="absolute top-3 right-4 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-mono shadow select-none">
                        Page {pageIdx + 1} of {pagesArr.length}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* IMPORT DOCUMENT MODAL UPLOAD UI */}
          {showImportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
              <div className="bg-[#0F1424] border border-[#1E273E] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#1E2638] bg-[#0C101D]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                      <FileUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Import Existing Document</h3>
                      <p className="text-xs text-slate-400">Upload PDF, DOCX or DOC file (Max 10MB)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="p-1.5 rounded-lg bg-[#141A2B] text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">Select Document File</label>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileChange}
                      className="w-full bg-[#141A2C] border border-[#202B44] rounded-xl px-4 py-2.5 text-xs text-white file:mr-4 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-600/20 file:text-indigo-400 file:hover:bg-indigo-600/30 cursor-pointer"
                    />
                  </div>

                  {selectedFile && (
                    <div className="p-3 bg-[#111626] rounded-xl border border-[#1E2638] space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">File Name:</span>
                        <span className="text-white font-semibold truncate max-w-[200px]">{selectedFile.name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">File Size:</span>
                        <span className="text-slate-200 font-mono">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </div>
                  )}

                  {conversionError && (
                    <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{conversionError}</span>
                    </div>
                  )}

                  {/* Modal Footer Controls */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#1E2638]">
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUploadDocument}
                      disabled={!selectedFile || isUploading}
                      className="gradient-btn px-5 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer shadow-md shadow-indigo-500/20 disabled:opacity-40"
                    >
                      {isUploading ? "Uploading Document..." : "Upload & Convert"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
