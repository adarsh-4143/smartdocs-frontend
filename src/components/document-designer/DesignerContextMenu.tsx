"use client";

import React from "react";

export interface ContextMenuState {
  x: number;
  y: number;
  objectId: string | null;
}

interface DesignerContextMenuProps {
  menu: ContextMenuState;
  isText: boolean;
  isImage: boolean;
  locked: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onReplaceImage: () => void;
  onFront: () => void;
  onForward: () => void;
  onBackward: () => void;
  onBack: () => void;
  onLock: () => void;
}

export default function DesignerContextMenu({
  menu,
  isText,
  isImage,
  locked,
  onClose,
  onEdit,
  onDuplicate,
  onCopy,
  onDelete,
  onReplaceImage,
  onFront,
  onForward,
  onBackward,
  onBack,
  onLock,
}: DesignerContextMenuProps) {
  const Item = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button
      type="button"
      className="w-full text-left px-3 py-1.5 text-[12px] text-slate-200 hover:bg-[#1A2236]"
      onClick={() => {
        onClick();
        onClose();
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed z-[120] w-48 rounded-xl border border-[#202B44] bg-[#0F1422] shadow-2xl py-1"
      style={{ left: menu.x, top: menu.y }}
    >
      {isText && <Item label="Edit text" onClick={onEdit} />}
      {isImage && <Item label="Replace image" onClick={onReplaceImage} />}
      <Item label="Duplicate" onClick={onDuplicate} />
      <Item label="Copy" onClick={onCopy} />
      <Item label="Delete" onClick={onDelete} />
      <div className="h-px bg-[#1E2638] my-1" />
      <Item label="Bring to front" onClick={onFront} />
      <Item label="Bring forward" onClick={onForward} />
      <Item label="Send backward" onClick={onBackward} />
      <Item label="Send to back" onClick={onBack} />
      <div className="h-px bg-[#1E2638] my-1" />
      <Item label={locked ? "Unlock" : "Lock"} onClick={onLock} />
    </div>
  );
}
