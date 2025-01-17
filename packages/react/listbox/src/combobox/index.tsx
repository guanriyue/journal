import { useMemo, useRef, useState } from 'react';
import * as ListBox from '../../lib/index';
import './style.css';

const data = [
  {
    groupLabel: 'Fruits',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'blueberry', label: 'Blueberry' },
      { value: 'grapes', label: 'Grapes' },
      { value: 'pineapple', label: 'Pineapple' },
    ],
  },
  {
    groupLabel: 'Vegetables',
    items: [
      { value: 'aubergine', label: 'Aubergine' },
      { value: 'broccoli', label: 'Broccoli' },
      { value: 'carrot', label: 'Carrot', disabled: true },
      { value: 'courgette', label: 'Courgette' },
      { value: 'leek', label: 'Leek' },
    ],
  },
  {
    groupLabel: 'Meat',
    items: [
      { value: 'beef', label: 'Beef' },
      { value: 'chicken', label: 'Chicken' },
      { value: 'lamb', label: 'Lamb' },
      { value: 'pork', label: 'Pork' },
    ],
  },
];

export const Combobox = () => {
  const [isFocused, setFocused] = useState(false);
  const [search, setSearch] = useState('');
  const [value, setValue] = useState('');
  const [showListbox, setShowListbox] = useState(false);
  const listBoxRef = useRef<ListBox.ListBoxRootRef>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const dataFiltered = useMemo(() => {
    return data.map((group) => {
      const items = group.items.filter((item) => {
        return item.label.toLowerCase().includes(search.toLowerCase());
      });

      return { ...group, items };
    });
  }, [search]);

  return (
    <div className="combobox">
      <input
        className="combobox-input"
        type="text"
        value={isFocused && showListbox ? search : value}
        placeholder={isFocused && showListbox ? value || 'Type to search' : 'Select a value'}
        onFocus={() => {
          setFocused(true);
          setShowListbox(true);
        }}
        onBlur={(e) => {
          setFocused(false);
          if (!wrapperRef.current || !wrapperRef.current.contains(e.relatedTarget)) {
            setShowListbox(false);
          }
        }}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setShowListbox(false);
            e.preventDefault();
            return;
          }

          if (e.key === 'ArrowDown' && !showListbox) {
            setShowListbox(true);
            e.preventDefault();
            return;
          }

          if (listBoxRef.current && listBoxRef.current.keydown(e)) {
            e.preventDefault();
          }
        }}
      />
      <ListBox.Root
        ref={listBoxRef}
        value={value}
        onSelect={(value) => {
          setValue(value);
          setSearch('');
          setShowListbox(false);
        }}
      >
        <div className="combobox-listbox-wrapper" hidden={!showListbox} ref={wrapperRef}>
          <ListBox.List className="combobox-listbox">
            <ListBox.Empty className="combobox-empty">No results found.</ListBox.Empty>
            {dataFiltered.map((group) => (
              <ListBox.Group key={group.groupLabel}>
                <ListBox.GroupLabel>{group.groupLabel}</ListBox.GroupLabel>
                {group.items.map((item) => (
                  <ListBox.Item key={item.value} value={item.value} disabled={item.disabled}>
                    {item.label}
                  </ListBox.Item>
                ))}
              </ListBox.Group>
            ))}
          </ListBox.List>
        </div>
      </ListBox.Root>
    </div>
  );
};
