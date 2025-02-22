import { pick } from 'lodash-es';
import { TableOperationAreaInfo, useTableMenuStore } from '../store';
import { useShallow } from 'zustand/shallow';

interface TableRowInsertBarProps {
  area: TableOperationAreaInfo;

  rowsHeight: number[];
}

export const TableRowInsertBar = (props: TableRowInsertBarProps) => {
  const { area, rowsHeight } = props;

  const { insertHandleSize, insertRow, setInsertRowAnchor } =
      useTableMenuStore(
        useShallow((state) =>
          pick(state, [
            'insertHandleSize',
            'insertRow',
            'setInsertRowAnchor',
          ]),
        ),
      );

  const insertHandleMarginTop = [-insertHandleSize / 2].concat(rowsHeight.map(height => height - insertHandleSize))

  return (
    <div data-row-insert-bar="">
      {insertHandleMarginTop.map((marginTop, index) => {
        return (
          <span
            key={index}
            data-row-insert-bar-item=""
            data-row-index={index}
            data-table-id={area.id}
            style={{ marginTop }}
            onPointerEnter={(e) =>
              setInsertRowAnchor(e.target as HTMLElement)
            }
            onPointerLeave={() => setInsertRowAnchor(undefined)}
            onClick={() => insertRow(area.getPos(), index)}
          />
        );
      })}
    </div>
  );
};

TableRowInsertBar.displayName = 'TableRowInsertBar' as const;
