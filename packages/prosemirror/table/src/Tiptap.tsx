import { EditorConsumer, EditorProvider } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Table as TiptapTable } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { tableEditing } from 'prosemirror-tables';
import {
  TableCellMenu,
  TableColumnInsertIndicator,
  TableColumnMenu,
  TableMenu,
  TableMergeCells,
  TableRemoveColumn,
  TableRemoveRow,
  TableRowInsertIndicator,
  TableRowMenu,
} from '../lib';
import {
  MapPinPlusInside,
  TableCellsMergeIcon,
  Trash2Icon,
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { EditorView } from 'prosemirror-view';
import React from 'react';

const Table = TiptapTable.extend({
  addProseMirrorPlugins() {
    return [
      tableEditing({
        allowTableNodeSelection: this.options.allowTableNodeSelection,
      }),
    ];
  },
});

const extensions = [StarterKit, Table, TableCell, TableHeader, TableRow];

const content = `<p></p>
  <table style="min-width: 475px">
   <colgroup>
      <col style="width: 200px">
      <col style="width: 150px">
      <col style="width: 100px">
      <col style="min-width: 25px">
   </colgroup>
   <tbody>
      <tr>
         <th colspan="1" rowspan="1" colwidth="200">
            <p>Name</p>
         </th>
         <th colspan="3" rowspan="1" colwidth="150,100">
            <p>Description</p>
         </th>
      </tr>
      <tr>
         <td colspan="1" rowspan="1" style="background-color: null">
            <p>Cyndi Lauper</p>
         </td>
         <td colspan="1" rowspan="1" style="background-color: null">
            <p>Singer</p>
         </td>
         <td colspan="1" rowspan="1" style="background-color: null">
            <p>Songwriter</p>
         </td>
         <td colspan="1" rowspan="1" style="background-color: null">
            <p>Actress</p>
         </td>
      </tr>
      <tr>
         <td colspan="1" rowspan="1" style="background-color: null">
            <p>Marie Curie</p>
         </td>
         <td colspan="1" rowspan="1" style="background-color: null">
            <p>Scientist</p>
         </td>
         <td colspan="1" rowspan="1" style="background-color: null">
            <p>Chemist</p>
         </td>
         <td colspan="1" rowspan="1" style="background-color: null">
            <p>Physicist</p>
         </td>
      </tr>
      <tr>
         <td colspan="1" rowspan="1" style="background-color: null">
            <p>Indira Gandhi</p>
         </td>
         <td colspan="1" rowspan="1" style="background-color: null">
            <p>Prime minister</p>
         </td>
         <td colspan="2" rowspan="1" style="background-color: null">
            <p>Politician</p>
         </td>
      </tr>
   </tbody>
</table>`;

const TableMenuMemo = React.memo((props: { view: EditorView }) => {
  return (
    <TableMenu view={props.view}>
      <TableColumnMenu className="table-floating-menu">
        <TableMergeCells>
          <TableCellsMergeIcon />
        </TableMergeCells>
        <TableRemoveColumn className="danger">
          <Trash2Icon />
        </TableRemoveColumn>
      </TableColumnMenu>
      <TableRowMenu className="table-floating-menu">
        <TableMergeCells>
          <TableCellsMergeIcon />
        </TableMergeCells>
        <TableRemoveRow className="danger">
          <Trash2Icon />
        </TableRemoveRow>
      </TableRowMenu>
      <TableCellMenu className="table-floating-menu">
        <TableMergeCells>
          <TableCellsMergeIcon />
        </TableMergeCells>
      </TableCellMenu>
      <TableColumnInsertIndicator className="column-insert-indicator">
        <Tooltip.Provider>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger asChild>
              <MapPinPlusInside className="column-insert-icon" fill="#fff" />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="insert-tooltip" sideOffset={4}>
                Insert Column
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </TableColumnInsertIndicator>
      <TableRowInsertIndicator className="row-insert-indicator">
        <Tooltip.Provider>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger asChild>
              <MapPinPlusInside className="row-insert-icon" fill="#fff" />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="insert-tooltip" sideOffset={4}>
                Insert Row
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </TableRowInsertIndicator>
    </TableMenu>
  );
});

TableMenuMemo.displayName = 'TableMenuMemo' as const;

export const Tiptap = () => {
  return (
    <EditorProvider content={content} extensions={extensions}>
      <EditorConsumer>
        {({ editor }) => {
          Object.assign(window, { editor });
          const view = editor?.view;
          if (!view) {
            return null;
          }

          return <TableMenuMemo view={view} />;
        }}
      </EditorConsumer>
    </EditorProvider>
  );
};
