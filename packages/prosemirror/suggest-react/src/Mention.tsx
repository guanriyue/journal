import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { searchRandomUser } from './randomuser';
import * as Suggestion from '../lib';
import { useCurrentEditor } from '@tiptap/react';

export const MentionExample = () => {
  const { editor } = useCurrentEditor();
  const [query, setQuery] = useState<string>();

  const { data, isFetching, error } = useQuery({
    queryKey: ['queryUser', query],
    queryFn: () => searchRandomUser(query!),
    enabled: !!query,
  });

  if (!editor) {
    return;
  }

  return (
    <Suggestion.Root
      className="listbox-container"
      view={editor.view}
      matcher="@"
      onSearch={setQuery}
      onSelect={(value, range) => {
        const item = data?.results.find((i) => i.login.uuid === value);
        if (!item) {
          return;
        }

        editor
          .chain()
          .deleteRange(range)
          .insertContentAt(range.from, {
            type: 'atomicText',
            attrs: { text: `@${item.name.last} ${item.name.first}` },
            marks: [{ type: 'link', attrs: { href: item.picture.large } }],
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
        {data?.results.map((item) => {
          return (
            <Suggestion.Item key={item.login.uuid} value={item.login.uuid}>
              <img alt="" src={item.picture.thumbnail} className="listbox-img" />
              <span>{`${item.name.last} ${item.name.first}`}</span>
            </Suggestion.Item>
          );
        })}
      </Suggestion.List>
    </Suggestion.Root>
  );
};
