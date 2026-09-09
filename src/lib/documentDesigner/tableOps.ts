import type { TableCell, TableObject } from "@/types/documentDesigner.types";
import { emptyCell } from "./model";

export function addTableRow(table: TableObject, afterIndex?: number): TableObject {
  const index = afterIndex == null ? table.rows : afterIndex + 1;
  const row = Array.from({ length: table.cols }, () => emptyCell());
  const cells = [...table.cells];
  cells.splice(index, 0, row);
  return {
    ...table,
    rows: cells.length,
    cells,
    height: table.height + 32,
  };
}

export function deleteTableRow(table: TableObject, rowIndex: number): TableObject {
  if (table.rows <= 1) return table;
  const cells = table.cells.filter((_, i) => i !== rowIndex);
  return {
    ...table,
    rows: cells.length,
    cells,
    height: Math.max(48, table.height - 32),
  };
}

export function addTableColumn(table: TableObject, afterIndex?: number): TableObject {
  const index = afterIndex == null ? table.cols : afterIndex + 1;
  const cells = table.cells.map((row) => {
    const next = [...row];
    next.splice(index, 0, emptyCell());
    return next;
  });
  return {
    ...table,
    cols: cells[0]?.length || table.cols + 1,
    cells,
    width: table.width + 90,
  };
}

export function deleteTableColumn(table: TableObject, colIndex: number): TableObject {
  if (table.cols <= 1) return table;
  const cells = table.cells.map((row) => row.filter((_, i) => i !== colIndex));
  return {
    ...table,
    cols: cells[0]?.length || 1,
    cells,
    width: Math.max(120, table.width - 90),
  };
}

export function mergeWithRight(table: TableObject, row: number, col: number): TableObject {
  const cell = table.cells[row]?.[col];
  const next = table.cells[row]?.[col + 1];
  if (!cell || !next || next.skipped) return table;
  const cells = table.cells.map((r) => r.map((c) => ({ ...c })));
  cells[row][col] = {
    ...cell,
    colspan: cell.colspan + next.colspan,
    html: `${cell.html}${next.html}`.trim(),
  };
  cells[row][col + 1] = { ...next, skipped: true, html: "" };
  return { ...table, cells };
}

export function mergeWithBelow(table: TableObject, row: number, col: number): TableObject {
  const cell = table.cells[row]?.[col];
  const below = table.cells[row + 1]?.[col];
  if (!cell || !below || below.skipped) return table;
  const cells = table.cells.map((r) => r.map((c) => ({ ...c })));
  cells[row][col] = {
    ...cell,
    rowspan: cell.rowspan + below.rowspan,
    html: `${cell.html}${below.html}`.trim(),
  };
  cells[row + 1][col] = { ...below, skipped: true, html: "" };
  return { ...table, cells };
}

export function splitCell(table: TableObject, row: number, col: number): TableObject {
  const cell = table.cells[row]?.[col];
  if (!cell || (cell.colspan <= 1 && cell.rowspan <= 1)) return table;
  const cells = table.cells.map((r) => r.map((c) => ({ ...c })));
  for (let r = row; r < row + cell.rowspan; r += 1) {
    for (let c = col; c < col + cell.colspan; c += 1) {
      if (r === row && c === col) continue;
      if (cells[r]?.[c]) {
        cells[r][c] = { ...emptyCell() };
      }
    }
  }
  cells[row][col] = { ...cell, colspan: 1, rowspan: 1 };
  return { ...table, cells };
}

export function updateCell(
  table: TableObject,
  row: number,
  col: number,
  patch: Partial<TableCell>
): TableObject {
  const cells = table.cells.map((r, ri) =>
    r.map((c, ci) => (ri === row && ci === col ? { ...c, ...patch } : c))
  );
  return { ...table, cells };
}
