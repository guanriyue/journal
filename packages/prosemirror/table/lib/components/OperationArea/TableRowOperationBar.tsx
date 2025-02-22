import { TableOperationAreaInfo } from '../store';
import { TableRowInsertBar } from './TableRowInsertBar';
import { TableRowSelectBar } from './TableRowSelectBar';

export interface TableRowOperationBarProps {
  area: TableOperationAreaInfo;

  rowsHeight: number[];
}

export const TableRowOperationBar = (props: TableRowOperationBarProps) => {
  return (
    <div data-row-operation-bar="">
      <TableRowInsertBar {...props} />
      <TableRowSelectBar {...props} />
    </div>
  );
};

TableRowOperationBar.displayName = 'TableRowOperationBar' as const;
