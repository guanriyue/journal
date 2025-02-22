import { isNumber } from "lodash-es";
import { Command } from "prosemirror-state";
import { CellSelection, deleteColumn, deleteRow, deleteTable } from "prosemirror-tables";
import { EditorView } from "prosemirror-view";

export const isCellSelection = (s: unknown): s is CellSelection => {
  return s instanceof CellSelection;
};

const biggerThan1 = (n: unknown) => {
  return isNumber(n) && n > 1;
};

export const getCellsMergeState = (view: EditorView) => {
  const { selection } = view.state;

  if (!isCellSelection(selection)) {
    return undefined;
  }

  const cells: boolean[] = [];

  selection.forEachCell((node) => {
    const { colspan, rowspan } = node.attrs;

    cells.push(biggerThan1(colspan) || biggerThan1(rowspan));
  })

  const isMergedCell = cells.length === 1 && cells[0];
  const disabled = cells.length === 1 && !cells[0];

  return {
    /**
     * 当前选区内是否只有一个 cell，且这个 cell 由多个 cell 合并而来
     */
    isMergedCell,

    /**
     * 仅选中了单个 cell，禁止分割，也禁止合并
     */
    disabled,
  }
};

export const removeRowCurrentState: Command = (state, dispatch) => {
  const { selection } = state;

  if (!isCellSelection(selection)) {
    return false;
  }

  if (selection.isRowSelection() && selection.isColSelection()) {
    return deleteTable(state, dispatch);
  }

  return deleteRow(state, dispatch);
};

export const removeColumnCurrentState: Command = (state, dispatch) => {
  const { selection } = state;

  if (!isCellSelection(selection)) {
    return false;
  }

  if (selection.isRowSelection() && selection.isColSelection()) {
    return deleteTable(state, dispatch);
  }

  return deleteColumn(state, dispatch);
};
