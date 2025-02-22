import { updateColumnsOnResize } from 'prosemirror-tables';
import { EditorView, NodeView, ViewMutationRecord } from 'prosemirror-view';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { nanoid } from 'nanoid';

const isSelectionInTable = (
  view: EditorView,
  tableNode: ProseMirrorNode,
): boolean => {
  const { $from, $to } = view.state.selection;

  const blockRange = $from.blockRange($to, (n) => n === tableNode);
  if (blockRange) {
    return true;
  }

  return false;
};

export interface TableOperationAreaSpec {
  /**
   * The operation area element. The table view will append or remove this element.
   */
  dom: HTMLElement;

  /**
   * triggered when the operation area is mounted.
   */
  mount: () => void;

  /**
   * triggered when the operation area is unmounted.
   */
  unmount: () => void;
}

export type TableOperationAreaRender = (options: {
  id: string;

  tableView: HTMLDivElement;

  table: HTMLTableElement;

  tableScrollWrapper: HTMLDivElement;

  colgroup: HTMLTableColElement;

  tableBody: HTMLTableSectionElement;

  getPos: () => number | undefined;
}) => TableOperationAreaSpec;

export interface InteractiveTableViewProps {
  node: ProseMirrorNode;

  view: EditorView;

  getPos: () => number | undefined;

  defaultCellMinWidth: number;

  operationAreaRender: TableOperationAreaRender;
}

export class InteractiveTableView implements NodeView {
  private readonly id = nanoid();
  public dom: HTMLDivElement;
  public contentDOM: HTMLTableSectionElement;
  private table: HTMLTableElement;
  private colgroup: HTMLTableColElement;
  private node: ProseMirrorNode;
  private defaultCellMinWidth: number;
  private operationAreaRender: () => TableOperationAreaSpec;
  private operationArea: TableOperationAreaSpec | undefined;
  private isFocused = false;
  private isMouseOver = false;
  private view: EditorView;

  constructor(props: InteractiveTableViewProps) {
    const { node, defaultCellMinWidth, operationAreaRender, view, getPos } =
      props;

    const tableView = document.createElement('div');
    tableView.className = 'table-wrapper';
    tableView.setAttribute('data-node-type', 'table');
    tableView.style.setProperty(
      '--default-cell-min-width',
      `${defaultCellMinWidth}px`,
    );
    const tableScrollWrapper = tableView.appendChild(
      document.createElement('div'),
    );
    tableScrollWrapper.className = 'table-scroll-wrapper';
    const table = tableScrollWrapper.appendChild(
      document.createElement('table'),
    );
    const colgroup = table.appendChild(document.createElement('colgroup'));
    const tableBody = table.appendChild(document.createElement('tbody'));

    this.dom = tableView;
    this.contentDOM = tableBody;
    this.table = table;
    this.colgroup = colgroup;
    this.node = node;
    this.defaultCellMinWidth = defaultCellMinWidth;
    this.view = view;
    this.operationAreaRender = () => {
      return operationAreaRender({
        id: this.id,
        tableView,
        table,
        tableScrollWrapper,
        colgroup,
        tableBody,
        getPos,
      });
    };

    updateColumnsOnResize(node, colgroup, table, defaultCellMinWidth);

    tableView.addEventListener('mouseenter', this.handleMouseEnter);
    tableView.addEventListener('mouseleave', this.handleMouseLeave);
    this.isFocused = isSelectionInTable(this.view, this.node);
    this.updateOperationArea();
  }

  handleMouseEnter = () => {
    this.isMouseOver = true;
    this.updateOperationArea();
  };

  handleMouseLeave = () => {
    this.isMouseOver = false;
    this.updateOperationArea();
  };

  updateOperationArea() {
    if (this.isFocused || this.isMouseOver) {
      if (!this.operationArea) {
        const area = this.operationAreaRender();
        this.operationArea = area;
        area.dom.contentEditable = 'false';
        this.dom.appendChild(area.dom);
        area.mount();
      }
    } else {
      if (this.operationArea) {
        this.operationArea.dom.remove();
        this.operationArea.unmount();
        this.operationArea = undefined;
      }
    }
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type != this.node.type) return false;

    this.node = node;
    this.isFocused = isSelectionInTable(this.view, this.node);
    updateColumnsOnResize(
      node,
      this.colgroup,
      this.table,
      this.defaultCellMinWidth,
    );
    this.updateOperationArea();

    return true;
  }

  destroy() {
    this.dom.removeEventListener('mouseenter', this.handleMouseEnter);
    this.dom.removeEventListener('mouseleave', this.handleMouseLeave);
    if (this.operationArea) {
      this.operationArea.dom.remove();
      this.operationArea.unmount();
      this.operationArea = undefined;
    }
  }

  ignoreMutation(record: ViewMutationRecord): boolean {
    if (this.operationArea) {
      const areaDOM = this.operationArea.dom;
      if (areaDOM == record.target || areaDOM.contains(record.target)) {
        return true;
      }

      if (record.type === 'childList' && record.target === this.dom) {
        if (
          !record.removedNodes.length &&
          record.addedNodes.length === 1 &&
          record.addedNodes[0] === areaDOM
        ) {
          // The operation area is added to the DOM.
          return true;
        }

        if (
          !record.addedNodes.length &&
          record.removedNodes.length === 1 &&
          record.removedNodes[0] === areaDOM
        ) {
          // The operation area is removed from the DOM.
          return true;
        }
      }
    }

    return (
      record.type == 'attributes' &&
      (record.target == this.table || this.colgroup.contains(record.target))
    );
  }
}
