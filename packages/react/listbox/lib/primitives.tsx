import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { Primitive, PrimitivePropsWithRef } from '@radix-ui/react-primitive';
import { createContext, forwardRef, useContext, useEffect, useId, useImperativeHandle, useMemo, useRef } from 'react';
import { createStore, StoreApi } from 'zustand';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { isEqual, isNil } from 'lodash-es';

const DATA_LIST_BOX_ITEM = 'data-listbox-item';

type PrimitiveDivProps = PrimitivePropsWithRef<'div'>

const useAsRef = <T,>(value: T) => {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  });

  return ref;
};

// #region RootStore

interface ItemData {
  value: string;

  disabled?: boolean;

  element: HTMLElement;

  onSelect?: (value: string, element: HTMLElement) => void;

  onHighlight?: (value: string, element: HTMLElement) => void;
};

interface ListBoxStoreState {
  highlightedValue: string | undefined;

  value: string | undefined;

  itemValueList: string[];

  groupToValueMap: Record<string, string[]>;

  /**
   * @constant
   */
  setListBox: (listBox: HTMLDivElement | null) => void;

  /**
   * @constant
   */
  registerItemValue: (value: string, groupId?: string) => (() => void) | undefined;

  /**
   * @constant
   */
  registerItemData: (el: HTMLElement | null, data: ItemData) => (() => void) | undefined;

  /**
   * @constant 高亮指定值，不可以是禁用项，同时触发 {@link ListBoxRootProps.onHighlight onHighlightChange}
   */
  highlight: (value: string) => void;

  /**
   * @constant 选定指定值，不可以是禁用项，同时触发 {@link ListBoxRootProps.onSelect onSelect} 和 {@link ListBoxRootProps.onValueChange onValueChange}
   */
  select: (value: string) => void;

  /**
   * @constant
   */
  keydown: (event: KeyboardEvent | React.KeyboardEvent) => void;

  /**
   * @constant
   */
  scrollIntoView: (value: string, options?: ScrollIntoViewOptions) => void;
}

const ListBoxContext = createContext<StoreApi<ListBoxStoreState>>(null as never);

ListBoxContext.displayName = 'ListBoxContext' as const;

const useListBoxStore = <T,>(selector: (state: ListBoxStoreState) => T, equalityFn?: (a: T, b: T) => boolean): T => {
  const store = useContext(ListBoxContext);

  if (!store) {
    throw new Error('useListBoxStore must be used within a ListBox component');
  }

  return useStoreWithEqualityFn(store, selector, equalityFn);
}

// #endregion

// #region Root

interface ListBoxRootProps {
  /**
   * 当前选中值
   */
  value?: string;

  /**
   * 当选中值时触发
   */
  onSelect?: (value: string) => void;

  /**
   * 当选中值，且值发生变化时触发
   * @param value
   */
  onValueChange?: (value: string) => void;

  /**
   * 当高亮值时触发
   * @param value 高亮的值
   * @param element 高亮的元素对应的 dom 节点
   */
  onHighlight?: (value: string, element: HTMLElement) => void;

  children: React.ReactNode;
}

interface ListBoxRootRef {
  keydown: (event: React.KeyboardEvent | KeyboardEvent) => void;

  scrollIntoView: (value: string, options?: ScrollIntoViewOptions) => void;
}

/**
 * structure:
 *
 * ```jsx
 * <ListBoxRoot>
 *   <ListBoxEmpty />
 *   <ListBoxList>
 *     <ListBoxGroup>
 *       <ListBoxGroupLabel />
 *       <ListBoxItem />
 *       <ListBoxItem />
 *       <ListBoxItem />
 *     </ListBoxGroup>
 *     <ListBoxItem />
 *     <ListBoxItem />
 *     <ListBoxItem />
 *   </ListBoxList>
 * </ListBoxRoot>
 * ```
 */
const ListBoxRoot = forwardRef<ListBoxRootRef, ListBoxRootProps>((props: ListBoxRootProps, ref) => {
  const { onValueChange, onSelect, value, onHighlight, children } = props;

  const initialValueRef = useRef(value);

  const onHighlightChangeRef = useAsRef(onHighlight);
  const onSelectRef = useAsRef(onSelect);
  const onValueChangeRef = useAsRef((newValue: string) => {
    if (newValue !== value && onValueChange) {
      onValueChange(newValue);
    }
  });

  const store = useMemo(() => {
    return createStore<ListBoxStoreState>((set, get) => {
      let listBox: HTMLDivElement | null = null;
      const itemMap = new Map<HTMLElement, ItemData>();

      const scrollIntoView = (value: string, options?: ScrollIntoViewOptions) => {
        const itemData = Array.from(itemMap.values()).find(item => item.value === value);
        if (itemData) {
          itemData.element.scrollIntoView(options);
        };
      };

      const highlight = (value: string | undefined) => {
        if (get().highlightedValue === value) {
          return false;
        }

        set({
          highlightedValue: value,
        });

        for (const itemData of itemMap.values()) {
          if (itemData.value === value) {
            if (itemData.disabled) {
              break;
            }

            itemData.onHighlight?.(itemData.value, itemData.element);
            onHighlightChangeRef.current?.(itemData.value, itemData.element);
          }
        }

        return true;
      };

      const setHighlightedValue = (value: string | undefined) => {
        highlight(value);

        if (!isNil(value)) {
          scrollIntoView(value, { block: 'nearest' });
        }
      }

      const getItemsData = () => {
        if (!listBox) {
          return [];
        }

        const displayedItems = Array.from(listBox.querySelectorAll<HTMLElement>(`[${DATA_LIST_BOX_ITEM}]`));

        return displayedItems.filter(i => itemMap.has(i)).map(i => itemMap.get(i)!);
      }

      const changeHighlightedValue = (change: 1 | -1) => {
        const availableItemsData = getItemsData().filter(item => !item.disabled);
        const length = availableItemsData.length;
        if (length <= 1) {
          return;
        }

        const currentHighlightedValue = get().highlightedValue;
        const currentIndex = availableItemsData.findIndex(item => item.value === currentHighlightedValue);

        if (currentIndex < 0) {
          const nextIndex = change === 1 ? 0 : length - 1;
          const nextItemData = availableItemsData[nextIndex];

          setHighlightedValue(nextItemData.value);

          return;
        }

        const nextIndex = (currentIndex + change + length) % length;
        const nextItemData = availableItemsData[nextIndex];

        setHighlightedValue(nextItemData.value);
      };

      const prevItem = () => changeHighlightedValue(-1);

      const nextItem = () => changeHighlightedValue(1);

      const firstItem = () => {
        const availableItemsData = getItemsData().filter(item => !item.disabled);
        const firstItemData = availableItemsData[0];

        if (firstItemData) {
          setHighlightedValue(firstItemData.value);
        }
      };

      const lastItem = () => {
        const availableItemsData = getItemsData().filter(item => !item.disabled);
        const lastItemData = availableItemsData[availableItemsData.length - 1];

        if (lastItemData) {
          setHighlightedValue(lastItemData.value);
        }
      };

      const navActionMap = {
        ArrowUp: prevItem,
        ArrowDown: nextItem,
        Home: firstItem,
        End: lastItem,
      };

      const select = (value: string | undefined) => {
        if (isNil(value)) {
          return false;
        }

        const itemData = Array.from(itemMap.values()).find(item => item.value === value);

        if (!itemData) {
          return false;
        }

        if (itemData.disabled) {
          return false;
        }

        onSelectRef.current?.(itemData.value);
        onValueChangeRef.current(itemData.value);

        if (itemData.onSelect) {
          itemData.onSelect(itemData.value, itemData.element);
        }

        return true;
      }

      return {
        highlightedValue: initialValueRef.current,
        value: initialValueRef.current,
        itemValueList: [],
        groupToValueMap: {},

        setListBox: a => {
          listBox = a;
        },

        registerItemValue: (value, groupId) => {
          const { itemValueList } = get();
          if (itemValueList.includes(value)) {
            return undefined;
          }

          const nextItemValueList = [...itemValueList, value];
          if (groupId) {
            const currentGroupToValueMap = get().groupToValueMap;
            const currentValues = currentGroupToValueMap[groupId] || [];
            const newValues = [...currentValues, value];

            set({
              itemValueList: nextItemValueList,
              groupToValueMap: {
                ...currentGroupToValueMap,
                [groupId]: newValues,
              }
            });
          } else {
            set({
              itemValueList: nextItemValueList,
            });
          }

          return () => {
            const nextItemValueList = get().itemValueList.filter(v => v !== value);
            if (groupId) {
              const currentGroupToValueMap = get().groupToValueMap;
              const currentValues = currentGroupToValueMap[groupId] || [];
              const newValues = currentValues.filter(v => v !== value);

              set({
                itemValueList: nextItemValueList,
                groupToValueMap: {
                  ...currentGroupToValueMap,
                  [groupId]: newValues,
                }
              });
            } else {
              set({
                itemValueList: nextItemValueList,
              });
            }
          };
        },

        registerItemData: (el, data) => {
          if (!el) {
            return undefined;
          }

          itemMap.set(el, data);

          return () => {
            itemMap.delete(el);
          };
        },
        
        highlight,

        select,

        keydown: event => {
          if (event.defaultPrevented) {
            return false;
          }

          const { key } = event;

          if (key in navActionMap) {
            navActionMap[key as keyof typeof navActionMap]();
            event.preventDefault();
            return true;
          }

          if (key === 'Enter') {
            if (select(get().highlightedValue)) {
              event.preventDefault();
              return true;
            }
          }

          return false;
        },

        scrollIntoView,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    store.setState(prev => {
      if (prev.value === value) {
        return prev;
      }

      return {
        value,
        highlightedValue: value,
      };
    });
  }, [store, value]);

  useImperativeHandle(ref, () => {
    return {
      keydown: (event: React.KeyboardEvent | KeyboardEvent) => {
        return store.getState().keydown(event);
      },
      scrollIntoView: (value: string, options?: ScrollIntoViewOptions) => {
        return store.getState().scrollIntoView(value, options);
      },
    };
  }, [store]);

  return (
    <ListBoxContext.Provider value={store}>
      {children}
    </ListBoxContext.Provider>
  );
});

ListBoxRoot.displayName = 'ListBoxRoot' as const;

// #endregion

// #region List

type ListBoxListProps = PrimitiveDivProps

const ListBoxList = forwardRef<HTMLDivElement, ListBoxListProps>((props, ref) => {
  const setListBox = useListBoxStore(state => state.setListBox);
  const composedRef = useComposedRefs(ref, setListBox);

  return (
    <Primitive.div
      role="listbox"
      tabIndex={-1}
      {...props}
      ref={composedRef}
    >
      {props.children}
    </Primitive.div>
  );
});

ListBoxList.displayName = 'ListBoxList' as const;

// #endregion

// #region GroupContext

interface ListBoxGroupContextValue {
  groupId: string;
}

const ListBoxGroupContext = createContext<ListBoxGroupContextValue>(null as never);

ListBoxGroupContext.displayName = 'ListBoxGroupContext' as const;

const useListBoxGroupId = () => {
  const context = useContext(ListBoxGroupContext);

  if (!context) {
    return undefined;
  }

  return context.groupId;
}

// #endregion

// #region Group

interface ListBoxGroupProps extends Omit<PrimitiveDivProps, 'hidden'> {
  forceMount?: boolean;
}

const ListBoxGroup = forwardRef<HTMLDivElement, ListBoxGroupProps>((props, ref) => {
  const { forceMount, ...otherProps } = props;

  const groupId = `listbox-group-${useId()}`;
  const shouldRender = useListBoxStore(state => forceMount || state.groupToValueMap[groupId]?.length > 0);

  const contextValue = useMemo<ListBoxGroupContextValue>(() => {
    return {
      groupId,
    };
  }, [groupId]);

  return (
    <ListBoxGroupContext.Provider value={contextValue}>
      <Primitive.div
        role="group"
        aria-labelledby={groupId}
        {...otherProps}
        data-listbox-group=""
        hidden={!shouldRender}
        ref={ref}
      />
    </ListBoxGroupContext.Provider>
  );
});

ListBoxGroup.displayName = 'ListBoxGroup' as const;

// #endregion

// #region GroupLabel

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ListBoxGroupLabelProps extends PrimitiveDivProps {}

const ListBoxGroupLabel = forwardRef<HTMLDivElement, ListBoxGroupLabelProps>((props, ref) => {
  const groupId = useListBoxGroupId();

  return (
    <Primitive.div
      role="presentation"
      id={groupId}
      {...props}
      data-listbox-group-label=""
      ref={ref}
    />
  );
});

ListBoxGroupLabel.displayName = 'ListBoxGroupLabel' as const;

// #endregion

// #region Item

interface ListBoxItemProps extends Omit<PrimitiveDivProps, 'onSelect'> {
  /**
   * 选项的值，确保唯一
   */
  value: string;

  /**
   * 是否禁用
   */
  disabled?: boolean;

  /**
   * 当选中时触发
   * @param value 即传入的 value
   * @returns 
   */
  onSelect?: (value: string, element: HTMLElement) => void;

  /**
   * 当前选项高亮时触发
   * @param value 
   * @param element 
   * @returns 
   */
  onHighlight?: (value: string, element: HTMLElement) => void;
}

const ListBoxItem = forwardRef<HTMLDivElement, ListBoxItemProps>((props, forwardedRef) => {
  const { value, disabled, onSelect, onHighlight, onPointerMove, onClick, ...otherProps } = props;

  const ref = useRef<HTMLDivElement | null>(null);
  const composedRef = useComposedRefs(forwardedRef, ref);
  const groupId = useListBoxGroupId();
  const { highlighted, selected, registerItemValue, registerItemData, highlight, select } = useListBoxStore(state => {
    return {
      highlighted: state.highlightedValue === value,
      selected: state.value === value,
      registerItemData: state.registerItemData,
      highlight: state.highlight,
      registerItemValue: state.registerItemValue,
      select: state.select,
    }
  }, isEqual);

  useEffect(() => {
    return registerItemData(ref.current, {
      value,
      disabled,
      element: ref.current!,
      onSelect,
      onHighlight,
    });
  });

  useEffect(() => {
    return registerItemValue(value, groupId);
  }, [groupId, value, registerItemValue]);

  return (
    <Primitive.div
      role="option"
      tabIndex={disabled ? undefined : -1}
      {...otherProps}
      data-listbox-item=""
      data-value={value}
      data-disabled={disabled ? '' : undefined}
      aria-disabled={disabled || undefined}
      data-highlighted={highlighted ? '' : undefined}
      aria-selected={disabled ? undefined : selected}
      data-selected={selected ? '' : undefined}
      onPointerMove={e => {
        onPointerMove?.(e);
        if (!e.defaultPrevented && !disabled) {
          highlight(value);
        }
      }}
      onClick={e => {
        onClick?.(e);
        if (!e.defaultPrevented && !disabled) {
          select(value);
        }
      }}
      ref={composedRef}
    >
      {props.children}
    </Primitive.div>
  );
});

ListBoxItem.displayName = 'ListBoxItem' as const;

// #endregion

// #region Empty

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ListBoxEmptyProps extends PrimitiveDivProps {}

/**
 * 当整个列表为空时显示
 */
const ListBoxEmpty = forwardRef<HTMLDivElement, ListBoxEmptyProps>((props, ref) => {
  const shouldRender = useListBoxStore(state => state.itemValueList.length === 0);

  if (!shouldRender) {
    return null;
  }

  return (
    <Primitive.div
      role="presentation"
      {...props}
      data-listbox-empty=""
      ref={ref}
    />
  );
});

ListBoxEmpty.displayName = 'ListBoxEmpty' as const;

// #endregion

// #region exports

export {
  ListBoxRoot,
  ListBoxList,
  ListBoxItem,
  ListBoxGroup,
  ListBoxGroupLabel,
  ListBoxEmpty,

  //
  ListBoxRoot as Root,
  ListBoxList as List,
  ListBoxItem as Item,
  ListBoxGroup as Group,
  ListBoxGroupLabel as GroupLabel,
  ListBoxEmpty as Empty,
};

export type {
  ListBoxRootProps,
  ListBoxRootRef,
  ListBoxListProps,
  ListBoxItemProps,
  ListBoxGroupProps,
  ListBoxGroupLabelProps,
  ListBoxEmptyProps,
}

// #endregion
