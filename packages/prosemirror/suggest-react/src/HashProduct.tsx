import { useQuery } from "@tanstack/react-query";
import { useCurrentEditor } from "@tiptap/react";
import { useState } from "react";
import { searchProduct } from "./dummyjson";
import * as Suggestion from '../lib';

export const HashExample = () => {
  const { editor } = useCurrentEditor();
  const [query, setQuery] = useState<string>();

  const { data, isFetching, error } = useQuery({
    queryKey: ['searchProduct', query],
    queryFn: () => searchProduct(query!),
    enabled: !!query,
  });

  if (!editor) {
    return;
  }

  return (
    <Suggestion.Root
      className="listbox-container"
      view={editor.view}
      matcher="#"
      onSearch={setQuery}
      onSelect={(value, range) => {
        const item = data?.products.find((i) => String(i.id) === value);
        if (!item) {
          return;
        }

        editor
          .chain()
          .deleteRange(range)
          .insertContentAt(range.from, {
            type: 'atomicText',
            attrs: { text: `#${item.title}` },
            marks: [{ type: 'link', attrs: { href: item.images[0] } }],
          })
          .command(({ tr, commands }) => {
            return commands.focus(tr.mapping.map(range.to));
          })
          .run();
      }}
    >
      <Suggestion.Empty className="listbox-empty">
        {isFetching ? (
          'Data is loading'
        ) : error ? (
          <span style={{ color: 'red' }}>Failed to load data</span>
        ) : query ? (
          'No data available'
        ) : (
          'Enter keywords to search'
        )}
      </Suggestion.Empty>
      <Suggestion.List className="listbox">
        {data?.products.map((item) => {
          return (
            <Suggestion.Item key={item.id} value={String(item.id)}>
              <img alt="" src={item.thumbnail} className="listbox-img" />
              <span>{item.title}</span>
            </Suggestion.Item>
          );
        })}
      </Suggestion.List>
    </Suggestion.Root>
  );
};
