import {
  columnResizing,
  ResizeState,
  tableNodeTypes,
} from 'prosemirror-tables';
import { InteractiveTableView, TableOperationAreaRender } from './tableview';

export interface InteractiveTableOptions {
  /**
   * The width of the handle that is displayed to resize columns.
   * @default 5
   */
  resizeHandleWidth?: number;
  /**
   * Minimum width of a cell /column. The column cannot be resized smaller than this.
   * @default 25
   */
  cellMinWidth?: number;
  /**
   * The default minWidth of a cell / column when it doesn't have an explicit width (i.e.: it has not been resized manually)
   * @default 100
   */
  defaultCellMinWidth?: number;
  lastColumnResizable?: boolean;

  operationAreaRender: TableOperationAreaRender;
}

export const interactiveTable = (options: InteractiveTableOptions) => {
  const {
    defaultCellMinWidth = 100,
    operationAreaRender,
    cellMinWidth = 25,
    resizeHandleWidth: handleWidth = 5,
    lastColumnResizable,
  } = options;

  const plugin = columnResizing({
    cellMinWidth,
    handleWidth,
    lastColumnResizable,
    defaultCellMinWidth,
  });

  plugin.spec.state!.init = (_, state) => {
    const nodeViews = plugin.spec?.props?.nodeViews;
    const tableName = tableNodeTypes(state.schema).table.name;

    if (nodeViews) {
      nodeViews[tableName] = (node, view, getPos) => {
        return new InteractiveTableView({
          node,
          view,
          defaultCellMinWidth,
          operationAreaRender,
          getPos,
        });
      };
    }

    return new ResizeState(-1, false);
  };

  return plugin;
};
