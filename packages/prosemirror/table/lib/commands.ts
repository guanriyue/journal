import { isNumber } from 'lodash-es';
import { Command, Selection } from 'prosemirror-state';
import {
  addColumn,
  addRow,
  removeRow as rawRemoveRow,
  removeColumn as rawRemoveColumn,
  CellSelection,
  TableMap,
} from 'prosemirror-tables';

export const selectRow = (
  pos: number | undefined,
  rowIndex: number,
): Command => {
  return (state, dispatch) => {
    if (!isNumber(pos)) {
      return false;
    }

    const node = state.doc.nodeAt(pos);
    if (!node || node.type.spec.tableRole !== 'table') {
      return false;
    }

    const tableMap = TableMap.get(node);
    const tableStart = pos + 1;
    const cells = tableMap.cellsInRect({
      top: rowIndex,
      bottom: rowIndex + 1,
      left: 0,
      right: tableMap.width,
    });

    if (!cells.length) {
      return false;
    }

    const startCellPos = tableStart + cells[0];
    const endCellPos = tableStart + cells[cells.length - 1]

    const tr = state.tr;
    tr.setSelection(CellSelection.create(tr.doc, startCellPos, endCellPos));

    if (dispatch) {
      dispatch(tr);
    }

    return true;
  };
};

export const selectColumn = (
  pos: number | undefined,
  columnIndex: number,
): Command => {
  return (state, dispatch) => {
    if (!isNumber(pos)) {
      return false;
    }

    const node = state.doc.nodeAt(pos);
    if (!node || node.type.spec.tableRole !== 'table') {
      return false;
    }

    const tableMap = TableMap.get(node);
    const tableStart = pos + 1;
    const cells = tableMap.cellsInRect({
      top: 0,
      bottom: tableMap.height,
      left: columnIndex,
      right: columnIndex + 1,
    });

    if (!cells.length) {
      return false;
    }

    const startCellPos = tableStart + cells[0];
    const endCellPos = tableStart + cells[cells.length - 1];

    const tr = state.tr;
    tr.setSelection(CellSelection.create(tr.doc, startCellPos, endCellPos));
    tr.scrollIntoView();

    if (dispatch) {
      dispatch(tr);
    }

    return true;
  };
};

export const insertRow = (
  pos: number | undefined,
  rowIndex: number,
): Command => {
  return (state, dispatch) => {
    if (!isNumber(pos)) {
      return false;
    }

    const node = state.doc.nodeAt(pos);
    if (!node || node.type.spec.tableRole !== 'table') {
      return false;
    }

    const map = TableMap.get(node);
    const tableStart = pos + 1;

    const tr = state.tr;
    addRow(tr, { map, tableStart, table: node } as never, rowIndex);
    const selectionPos =
      rowIndex < map.height
        ? tableStart + map.positionAt(rowIndex, 0, node) + 1
        : pos + node.nodeSize;
    tr.setSelection(Selection.near(tr.doc.resolve(selectionPos)));
    tr.scrollIntoView();

    if (dispatch) {
      dispatch(tr);
    }

    return true;
  };
};

export const insertColumn = (
  pos: number | undefined,
  columnIndex: number,
): Command => {
  return (state, dispatch) => {
    if (!isNumber(pos)) {
      return false;
    }

    const node = state.doc.nodeAt(pos);
    if (!node || node.type.spec.tableRole !== 'table') {
      return false;
    }

    const map = TableMap.get(node);
    const tableStart = pos + 1;

    const tr = state.tr;
    addColumn(tr, { map, tableStart, table: node } as never, columnIndex);
    tr.setSelection(
      Selection.near(
        tr.doc.resolve(tableStart + map.positionAt(0, columnIndex, node) + 1),
      ),
    );

    if (dispatch) {
      dispatch(tr);
    }

    return true;
  };
};

export const removeRow = (
  pos: number | undefined,
  rowIndex: number,
): Command => {
  return (state, dispatch) => {
    if (!isNumber(pos)) {
      return false;
    }

    const node = state.doc.nodeAt(pos);
    if (!node || node.type.spec.tableRole !== 'table') {
      return false;
    }

    const map = TableMap.get(node);
    const tableStart = pos + 1;

    const tr = state.tr;
    if (map.height > 1) {
      rawRemoveRow(tr, { map, tableStart, table: node } as never, rowIndex);
    } else {
      tr.delete(pos, pos + node.nodeSize);
      tr.setSelection(Selection.near(tr.doc.resolve(pos)));
    }

    if (dispatch) {
      dispatch(tr);
    }

    return true;
  };
};

export const removeColumn = (
  pos: number | undefined,
  columnIndex: number,
): Command => {
  return (state, dispatch) => {
    if (!isNumber(pos)) {
      return false;
    }

    const node = state.doc.nodeAt(pos);
    if (!node || node.type.spec.tableRole !== 'table') {
      return false;
    }

    const map = TableMap.get(node);
    const tableStart = pos + 1;

    const tr = state.tr;
    if (map.width > 1) {
      rawRemoveColumn(
        tr,
        { map, tableStart, table: node } as never,
        columnIndex,
      );
    } else {
      tr.delete(pos, pos + node.nodeSize);
      tr.setSelection(Selection.near(tr.doc.resolve(pos)));
    }

    if (dispatch) {
      dispatch(tr);
    }

    return true;
  };
};
