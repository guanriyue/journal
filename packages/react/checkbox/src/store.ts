/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CheckboxItemDataToRegister<V> {
    value: V;
    disabled: boolean;
    sectionIds?: string[];
}

interface CheckboxGroupStoreValues<V = any> {
    availableValues: Set<V>;
    sectionToValuesMap: Map<string, Set<V>>;
    selectedValues: V[];
    name?: string;
    disabled?: boolean;
}

type Unref = () => void;

interface CheckboxGroupStoreActions<V = any> {
    setSelectedValues: (values: V[]) => void;
    setDisabled: (disabled: boolean | undefined) => void;
    setName: (name: string | undefined) => void;
    registerItem: (data: CheckboxItemDataToRegister<V>) => Unref;
    reverse: (sectionId?: string) => void;
    selectAll: (sectionId?: string) => void;
    unselectAll: (sectionId?: string) => void;
    select: (value: V) => void;
    unselect: (value: V) => void;
    allCheckedStatus: (sectionId?: string) => boolean | 'indeterminate';
}

export type CheckboxGroupStore<V = any> = CheckboxGroupStoreValues<V> & CheckboxGroupStoreActions<V>;

export interface CheckboxSectionContextValue {
    disabled?: boolean;
    sectionId: string;
    sectionIds: string[];
}
