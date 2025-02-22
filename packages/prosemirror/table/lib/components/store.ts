import { EditorView } from "prosemirror-view";
import { createContext, useContext } from "react";
import { StoreApi, useStore } from "zustand";

export interface TableOperationAreaInfo {
  id: string;

  tableView: HTMLElement;

  table: HTMLTableElement;

  tableScrollWrapper: HTMLDivElement;

  colgroup: HTMLTableColElement;

  tableBody: HTMLTableSectionElement;

  dom: HTMLElement;

  getPos: () => number | undefined;
}

export interface TableMenuStoreValue {
  view: EditorView;

  /**
   * Operation areas for tables.
   *
   * A table only has one operation area.
   *
   * There maybe multiple operation areas for multiple tables.
   */
  operationAreas: Record<string, TableOperationAreaInfo>;

  insertHandleSize: number;

  /**
   * The type of the active bubble menu.
   */
  menuType: 'column' | 'row' | 'cell' | undefined;

  /**
   * The anchor element for the active bubble menu.
   *
   * Only if the menuType is 'column' or 'row'.
   */
  menuAnchor: HTMLElement | null | undefined;

  /**
   * The anchor element for inserting a column.
   */
  insertColumnAnchor: HTMLElement | null | undefined;

  /**
   * The anchor element for inserting a row.
   */
  insertRowAnchor: HTMLElement | null | undefined;
}

export interface TableMenuStoreAction {
  selectColumn: (pos: number | undefined, columnIndex: number, event?: MouseEvent | PointerEvent) => void;

  selectRow: (pos: number | undefined, rowIndex: number, event?: MouseEvent | PointerEvent) => void;

  insertColumn: (pos: number | undefined, columnIndex: number) => void;

  insertRow: (pos: number | undefined, rowIndex: number) => void;

  removeColumn: (pos: number | undefined, columnIndex: number) => void;

  removeRow: (pos: number | undefined, rowIndex: number) => void;

  setInsertColumnAnchor: (anchor: HTMLElement | undefined) => void;

  setInsertRowAnchor: (anchor: HTMLElement | undefined) => void;

  getPopoverContainer: () => Element;
}

export interface TableMenuStoreState extends TableMenuStoreValue, TableMenuStoreAction {}

const Context = createContext<StoreApi<TableMenuStoreState> | null>(null);

Context.displayName = "TableMenuContext";

export const TableMenuProvider = Context.Provider;

export const useTableMenuStore = <T>(selector: (state: TableMenuStoreState) => T) => {
  const store = useContext(Context);

  if (!store) {
    throw new Error("useTableMenuStore must be used within a TableMenuProvider");
  }

  return useStore(store, selector);
};
