import { useShallow } from 'zustand/shallow';
import { TableOperationAreaInfo, useTableMenuStore } from '../store';
import { pick } from 'lodash-es';

interface TableColumnInsertBarProps {
  area: TableOperationAreaInfo;

  colsWidth: number[];
}

export const TableColumnInsertBar = (props: TableColumnInsertBarProps) => {
  const { area, colsWidth } = props;

  const { insertHandleSize, insertColumn, setInsertColumnAnchor } =
    useTableMenuStore(
      useShallow((state) =>
        pick(state, [
          'insertHandleSize',
          'insertColumn',
          'setInsertColumnAnchor',
        ]),
      ),
    );

  const insertHandleMarginLeft = [-insertHandleSize / 2].concat(
    colsWidth.map((width) => width - insertHandleSize),
  );

  return (
    <div data-column-insert-bar="">
      {insertHandleMarginLeft.map((marginLeft, index) => {
        return (
          <span
            key={index}
            data-column-insert-bar-item=""
            data-column-index={index}
            data-table-id={area.id}
            style={{ marginLeft }}
            onPointerEnter={(e) =>
              setInsertColumnAnchor(e.target as HTMLElement)
            }
            onPointerLeave={() => setInsertColumnAnchor(undefined)}
            onClick={() => insertColumn(area.getPos(), index)}
          />
        );
      })}
    </div>
  );
};

TableColumnInsertBar.displayName = 'TableColumnInsertBar' as const;
