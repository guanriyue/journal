import { resizeObserver } from '@journal/singleton-resize-observer';
import { useLayoutEffect, useMemo, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { TableOperationAreaInfo } from '../store';

type Size = {
  width: number;
  height: number;
};

const getColWidth = (col: HTMLTableColElement) => col.getBoundingClientRect().width;
const getRowHeight = (row: HTMLTableRowElement) => row.getBoundingClientRect().height;
const getElementClientSize = (el: HTMLElement): Size => {
  const { clientWidth: width, clientHeight: height } = el;
  return { width, height };
};

const correctSize = (total: number, items: number[]) => {
  const itemSum = items.reduce((prev, cur) => prev + cur, 0);
  const averageDiff = (total - itemSum) / items.length;
  return items.map(i => i + averageDiff);
};

const useElementClientSize = (el: HTMLElement) => {
  const [size, setSize] = useState(() => getElementClientSize(el));

  useLayoutEffect(() => {
    return resizeObserver.observe(el, entry => {
      const { blockSize, inlineSize } = entry.contentBoxSize[0];

      const next: Size = {
        width: inlineSize,
        height: blockSize,
      };

      setSize(prev => shallow(prev, next) ? prev : next);
    })
  }, [el]);

  return size;
};

export const useElementScroll = (el: HTMLElement) => {
  const [scrollLeft, setScrollLeft] = useState(() => el.scrollLeft);

  useLayoutEffect(() => {
    const handleScroll = () => {
      setScrollLeft(el.scrollLeft);
    };

    el.addEventListener('scroll', handleScroll);

    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [el]);

  return {
    scrollLeft
  };
};

export const useTableGrid = (area: TableOperationAreaInfo) => {
  const { colgroup, tableBody, table, tableScrollWrapper } = area;

  const [cols, setCols] = useState(() => Array.from(colgroup.children) as HTMLTableColElement[]);
  const [rows, setRows] = useState(() => Array.from(tableBody.children) as HTMLTableRowElement[]);
  const [rawColsWidth, setColsWidth] = useState(() => cols.map(getColWidth));
  const [rawRowsHeight, setRowsHeight] = useState(() => rows.map(getRowHeight));
  const tableSize = useElementClientSize(table);
  const scrollWrapperSize = useElementClientSize(tableScrollWrapper);

  useLayoutEffect(() => {
    const setColsEqCheck = (cols: HTMLTableColElement[]) => {
      setCols(prev => shallow(prev, cols) ? prev : cols);
    }

    const setRowsEqCheck = (rows: HTMLTableRowElement[]) => {
      setRows(prev => shallow(prev, rows) ? prev : rows);
    }

    const mutationObserver = new MutationObserver(() => {
      const cols = Array.from(colgroup.children) as HTMLTableColElement[];
      const rows = Array.from(tableBody.children) as HTMLTableRowElement[];

      setColsEqCheck(cols);
      setRowsEqCheck(rows);
      setColsWidth(cols.map(getColWidth));
      setRowsHeight(rows.map(getRowHeight));
    });

    mutationObserver.observe(colgroup, { childList: true });
    mutationObserver.observe(tableBody, { childList: true });

    return () => {
      mutationObserver.disconnect();
    };
  }, [colgroup, tableBody]);

  useLayoutEffect(() => {
    const unobserveRows = rows.map((row, index) => resizeObserver.observe(row, entry => {
      setRowsHeight(prev => {
        const height = Math.round(entry.borderBoxSize[0].blockSize);
        if (prev[index] === height) {
          return prev;
        }

        const next = [...prev];
        next[index] = height;
        return next;
      });
    }));

    return () => {
      unobserveRows.forEach(fn => fn());
    }
  }, [rows]);

  useLayoutEffect(() => {
    const handleColsWidthChange = () => {
      const nextColsWidth = cols.map(getColWidth);
      setColsWidth(prev => shallow(prev, nextColsWidth) ? prev : nextColsWidth);
    };

    const unobserveTableResize = resizeObserver.observe(table, handleColsWidthChange);

    const mutationObserver = new MutationObserver(handleColsWidthChange);
    mutationObserver.observe(colgroup, { subtree: true, attributes: true });

    return () => {
      unobserveTableResize();
      mutationObserver.disconnect();
    };
  }, [cols, colgroup, table]);

  const colsWidth = useMemo(() => correctSize(tableSize.width, rawColsWidth), [rawColsWidth, tableSize.width]);
  const rowsHeight = useMemo(() => correctSize(tableSize.height, rawRowsHeight), [rawRowsHeight, tableSize.height]);

  return {
    cols,
    rows,
    colsWidth,
    rowsHeight,
    scrollWrapperSize,
  };
};

export type TableGridData = ReturnType<typeof useTableGrid>;
