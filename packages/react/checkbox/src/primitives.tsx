/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, forwardRef, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef } from 'react';
import { CheckboxGroupProps, CheckboxProps, CheckboxSectionProps } from './types';
import { createStore, StoreApi, useStore } from 'zustand';
import { CheckboxGroupStore, CheckboxItemDataToRegister, CheckboxSectionContextValue } from './store';
import { useShallow } from 'zustand/shallow';
import { isNil, } from 'lodash-es';
import { composeRefs } from '@journal/react-hooks';
import { Primitive, PrimitivePropsWithRef } from '@radix-ui/react-primitive';

const uniq = <T,>(array?: T[]) => {
  return array ? Array.from(new Set(array)) : [];
};

const isValuesSame = (arr1: unknown[], arr2: unknown[]) => {
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);

  if (set1.size !== set2.size) return false;

  for (const item of set1) {
    if (!set2.has(item)) return false;
  }

  return true;
};

const noop = () => undefined;

const stringifyValue = (value: unknown) => {
  const typeOfValue = typeof value;

  if (typeOfValue === 'string' || typeOfValue === 'number' || typeOfValue === 'boolean') {
    return String(value);
  }

  return undefined;
};

const CheckboxGroupContext = createContext<StoreApi<CheckboxGroupStore> | null>(null);

const useCallbackRef = <T extends (...args: any[]) => any>(fn: T | undefined): T => {
  const ref = useRef(fn);

  useEffect(() => {
    ref.current = fn;
  });

  return useMemo(() => {
    return (...args: any[]) => ref.current?.(...args);
  }, []) as T;
};

/**
 * structure of the CheckboxGroup component
 * ```
 * <CheckboxGroup value={value} onChange={onChange} disabled={disabled} name={name}>
 *   <CheckboxSelectAll />
 *   <CheckboxReverse />
 *   <Checkbox value={value} />
 *   <CheckboxSection>
 *     <CheckboxSelectAll />
 *     <CheckboxReverse />
 *     <Checkbox value={value} />
 *     <Checkbox value={value} />
 *     <Checkbox value={value} />
 *   </CheckboxSection>
 * </CheckboxGroup>
 * ```
 */
const CheckboxGroup = <V,>(props: CheckboxGroupProps<V>) => {
  const { value, onChange, disabled, name, children } = props;

  const initialProps = useRef(props);
  const onChangeEvent = useCallbackRef(onChange);

  const store = useMemo(() => {
    return createStore<CheckboxGroupStore<V>>((set, get) => {
      const setValueAndEmit = (values: V[]) => {
        set({ selectedValues: values });
        onChangeEvent?.(values);
      };

      const removeItem = (item: CheckboxItemDataToRegister<V>) => {
        set((prevState) => {
          if (!prevState.availableValues.has(item.value)) {
            return prevState;
          }

          const newAvailableValues = new Set(prevState.availableValues);
          newAvailableValues.delete(item.value);

          if (item.sectionIds) {
            const newSectionToValuesMap = new Map(prevState.sectionToValuesMap);
            item.sectionIds.forEach((sectionId) => {
              if (newSectionToValuesMap.has(sectionId)) {
                const items = newSectionToValuesMap.get(sectionId)!;
                items.delete(item.value);
                if (!items.size) {
                  newSectionToValuesMap.delete(sectionId);
                }
              }
            });

            return {
              availableValues: newAvailableValues,
              sectionToValuesMap: newSectionToValuesMap,
            };
          }

          return {
            availableValues: newAvailableValues,
          };
        });
      };

      const addItem = (item: CheckboxItemDataToRegister<V>) => {
        set((prevState) => {
          if (prevState.availableValues.has(item.value)) {
            return prevState;
          }

          const newAvailableValues = new Set(prevState.availableValues);
          newAvailableValues.add(item.value);

          if (item.sectionIds) {
            const newSectionToValuesMap = new Map(prevState.sectionToValuesMap);
            item.sectionIds.forEach((sectionId) => {
              if (!newSectionToValuesMap.has(sectionId)) {
                newSectionToValuesMap.set(sectionId, new Set<V>());
              }
              const items = newSectionToValuesMap.get(sectionId)!;
              items.add(item.value);
            });

            return {
              availableValues: newAvailableValues,
              sectionToValuesMap: newSectionToValuesMap,
            };
          }

          return {
            availableValues: newAvailableValues,
          };
        });
      };

      const selectAll = (sectionId?: string) => {
        if (!sectionId) {
          const nextSelectedValues = uniq([...get().selectedValues, ...get().availableValues]);
          setValueAndEmit(nextSelectedValues);
          return;
        }

        const { sectionToValuesMap } = get();
        const sectionValues = sectionToValuesMap.get(sectionId);
        if (!sectionValues || sectionValues.size === 0) {
          return;
        }

        const nextSelectedValues = uniq([...get().selectedValues, ...sectionValues]);
        setValueAndEmit(nextSelectedValues);
      };

      const unselectAll = (sectionId?: string) => {
        const { sectionToValuesMap, selectedValues } = get();
        if (!selectedValues.length) {
          return;
        }

        if (!sectionId) {
          setValueAndEmit([]);
          return;
        }

        const sectionValues = sectionToValuesMap.get(sectionId);
        if (!sectionValues) {
          return;
        }

        const nextSelectedValues = selectedValues.filter((v) => !sectionValues.has(v));
        if (nextSelectedValues.length !== selectedValues.length) {
          setValueAndEmit(nextSelectedValues);
        }
      };

      const reverse = (sectionId?: string) => {
        const { availableValues, selectedValues } = get();

        if (!availableValues.size) {
          return;
        }

        if (sectionId) {
          const { sectionToValuesMap } = get();
          const sectionValues = sectionToValuesMap.get(sectionId);
          if (!sectionValues || sectionValues.size === 0) {
            return;
          }

          const nextSelectedValues = new Set(selectedValues);

          for (const value of sectionValues) {
            if (nextSelectedValues.has(value)) {
              nextSelectedValues.delete(value);
            } else {
              nextSelectedValues.add(value);
            }
          }

          setValueAndEmit(Array.from(nextSelectedValues));
        } else {
          const nextSelectedValues = Array.from(availableValues).filter((v) => !selectedValues.includes(v));
          setValueAndEmit(nextSelectedValues);
        }
      };

      const select = (value: V) => {
        const { selectedValues } = get();
        if (!selectedValues.includes(value)) {
          const nextSelectedValues = [...selectedValues, value];
          setValueAndEmit(nextSelectedValues);
        }
      };

      const unselect = (value: V) => {
        const { selectedValues } = get();
        if (selectedValues.includes(value)) {
          const nextSelectedValues = selectedValues.filter((v) => v !== value);
          setValueAndEmit(nextSelectedValues);
        }
      };

      const resolveCheckedStatusOfAll = () => {
        const { availableValues, selectedValues } = get();
        if (!selectedValues.length) {
          return false;
        }

        const isSelectAll = Array.from(availableValues).every((v) => selectedValues.includes(v));
        if (isSelectAll) {
          return true;
        }

        return 'indeterminate';
      };

      const resolveCheckedStatusOfSection = (sectionId: string) => {
        const { sectionToValuesMap, selectedValues } = get();
        if (!selectedValues.length) {
          return false;
        }

        const sectionValues = sectionToValuesMap.get(sectionId);
        if (!sectionValues || sectionValues.size === 0) {
          return false;
        }

        let isSelectAll = false;

        for (const value of sectionValues) {
          if (selectedValues.includes(value)) {
            isSelectAll = true;
          } else {
            if (isSelectAll) {
              return 'indeterminate';
            }
          }
        }

        return isSelectAll;
      };

      const resolveCheckedStatusOf = (sectionId?: string) => {
        if (sectionId) {
          return resolveCheckedStatusOfSection(sectionId);
        } else {
          return resolveCheckedStatusOfAll();
        }
      };

      return {
        sectionToValuesMap: new Map<string, Set<V>>(),
        availableValues: new Set<V>(),
        selectedValues: uniq(initialProps.current.value),
        name: initialProps.current.name,
        disabled: !!initialProps.current.disabled,

        setSelectedValues: (values: V[]) => {
          set((state) => {
            if (isValuesSame(state.selectedValues, values)) {
              return state;
            }

            return {
              selectedValues: uniq(values),
            };
          });
        },
        setDisabled: (disabled: boolean | undefined) => {
          const booleanDisabled = !!disabled;

          set((state) => {
            return state.disabled === booleanDisabled ? state : { disabled: booleanDisabled };
          });
        },
        setName: (name: string | undefined) => {
          set((state) => {
            return state.name === name ? state : { name };
          });
        },
        registerItem: (item) => {
          if (isNil(item)) {
            return noop;
          }

          if (item.disabled) {
            // no need to register disabled items
            return noop;
          }

          addItem(item);

          return () => {
            removeItem(item);
          };
        },
        select,
        unselect,
        reverse,
        selectAll,
        unselectAll,
        allCheckedStatus: resolveCheckedStatusOf,
      };
    });
  }, []);

  useEffect(() => {
    store.getState().setName(name);
  }, [name]);

  useEffect(() => {
    store.getState().setDisabled(disabled);
  }, [disabled]);

  useEffect(() => {
    store.getState().setSelectedValues(value || []);
  }, [value]);

  return (
    <CheckboxGroupContext.Provider value={store}>
      <div role="group" aria-disabled={disabled}>
        {children}
      </div>
    </CheckboxGroupContext.Provider>
  );
};

const CheckboxSectionContext = createContext<CheckboxSectionContextValue | null>(null);

const CheckboxSection = (props: CheckboxSectionProps) => {
  const { disabled, children } = props;
  const groupStore = useContext(CheckboxGroupContext);
  const parentSectionContext = useContext(CheckboxSectionContext);
  const id = useId();

  if (!groupStore) {
    throw new Error('CheckboxSection must be used within a CheckboxGroup');
  }

  const contextValue = useMemo<CheckboxSectionContextValue>(() => {
    if (parentSectionContext) {
      return {
        disabled: disabled || parentSectionContext.disabled,
        sectionId: id,
        sectionIds: [...parentSectionContext.sectionIds, id],
      };
    }

    return {
      disabled,
      sectionId: id,
      sectionIds: [id],
    };
  }, [disabled, id, parentSectionContext]);

  return (
    <CheckboxSectionContext.Provider value={contextValue}>
      <div role="group" aria-disabled={disabled}>
        {children}
      </div>
    </CheckboxSectionContext.Provider>
  );
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>((props: CheckboxProps, ref) => {
  const groupStore = useContext(CheckboxGroupContext);

  if (groupStore) {
    return <GroupedCheckbox ref={ref} {...props} groupStore={groupStore} />;
  }

  return <StandaloneCheckbox ref={ref} {...props} />;
}) as <V>(props: CheckboxProps<V> & { ref?: React.Ref<HTMLInputElement> }) => React.JSX.Element;

const GroupedCheckbox = forwardRef<
  HTMLInputElement,
  CheckboxProps & {
    groupStore: StoreApi<CheckboxGroupStore>;
  }
>((props, ref) => {
  const { groupStore, ...checkboxProps } = props;
  const { value, disabled: propDisabled } = props;
  const sectionContext = useContext(CheckboxSectionContext);

  const { registerItem, select, unselect, checked } = useStore(
    groupStore!,
    useShallow((state) => {
      return {
        registerItem: state.registerItem,
        select: state.select,
        unselect: state.unselect,
        checked: state.selectedValues.includes(value),
      };
    })
  );

  const disabledToRegister = !!(propDisabled || sectionContext?.disabled);
  const sectionIds = sectionContext?.sectionIds;

  useEffect(() => {
    return registerItem({
      value,
      disabled: disabledToRegister,
      sectionIds,
    });
  }, [value, disabledToRegister, sectionIds]);

  return (
    <StandaloneCheckbox
      ref={ref}
      {...checkboxProps}
      checked={props.checked ? props.checked : checked}
      onChange={(checked) => {
        if (value) {
          if (checked) {
            select(value);
          } else {
            unselect(value);
          }
        }

        checkboxProps.onChange?.(checked);
      }}
    />
  );
});

const StandaloneCheckbox = forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
  const { value, checked, onChange, ...rest } = props;

  const inputRef = useRef<HTMLInputElement>(null);
  const composedRef = composeRefs(ref, inputRef);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked);
  };

  useLayoutEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = checked === 'indeterminate';
    }
  }, [checked]);

  return (
    <input
      ref={composedRef}
      {...rest}
      type="checkbox"
      value={stringifyValue(value)}
      checked={checked === true}
      onChange={handleChange}
    />
  );
}) as <V>(props: CheckboxProps<V> & { ref?: React.Ref<HTMLInputElement> }) => React.JSX.Element;

const CheckboxSelectAll = forwardRef<HTMLInputElement, Omit<CheckboxProps, 'value' | 'name'>>((props, ref) => {
  const groupStore = useContext(CheckboxGroupContext);
  const sectionContext = useContext(CheckboxSectionContext);
  const sectionId = sectionContext ? sectionContext.sectionId : undefined;

  if (!groupStore) {
    throw new Error('CheckboxSelectAll must be used within a CheckboxGroup');
  }

  const { selectAll, unselectAll, checked } = useStore(
    groupStore,
    useShallow((state) => {
      return {
        selectAll: state.selectAll,
        unselectAll: state.unselectAll,
        checked: state.allCheckedStatus(sectionId),
      };
    })
  );

  return (
    <StandaloneCheckbox
      ref={ref}
      {...props}
      checked={checked}
      onChange={(checked) => {
        if (checked) {
          selectAll(sectionId);
        } else {
          unselectAll(sectionId);
        }

        props.onChange?.(checked);
      }}
    />
  );
});

const CheckboxReverse = forwardRef<HTMLButtonElement, PrimitivePropsWithRef<'button'>>((props, ref) => {
  const groupStore = useContext(CheckboxGroupContext);
  const sectionContext = useContext(CheckboxSectionContext);

  if (!groupStore) {
    throw new Error('CheckboxReverse must be used within a CheckboxGroup');
  }

  const reverse = useStore(groupStore, (state) => state.reverse);

  return (
    <Primitive.button
      ref={ref}
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        if (!e.defaultPrevented) {
          reverse(sectionContext?.sectionId);
        }
      }}
    />
  );
});

export { CheckboxGroup, Checkbox, CheckboxSection, CheckboxSelectAll, CheckboxReverse };
