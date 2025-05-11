export interface CheckboxGroupProps<V = string> {
    /**
     * value is an array of selected values. It is used to control the selected state of the checkboxes in the group.
     */
    value?: V[];
    /**
     * onChange is a callback function that is called when the selected values change.
     * It receives the new array of selected values as an argument.
     */
    onChange?: (value: V[]) => void;
    /**
     * Flag to indicate if the group is disabled
     */
    disabled?: boolean;
    /**
     * Name of the checkbox group. Each checkbox in the group will have this name attribute.
     * This is useful for grouping checkboxes together for form submission.
     */
    name?: string;

    children?: React.ReactNode;
}

export interface CheckboxSectionProps {
    disabled?: boolean;

    children?: React.ReactNode;
}

export interface CheckboxProps<V = string> extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'checked'> {
    /**
     * The value of the checkbox. This is used to identify the checkbox in the group.
     */
    value?: V;
    /**
     * The checked state of the checkbox. This is controlled by the CheckboxGroup component.
     */
    checked?: boolean | 'indeterminate';
    /**
     * The onChange event handler for the checkbox. This is called when the checkbox is clicked.
     * It receives the new checked state as an argument.
     */
    onChange?: (checked: boolean) => void;
}
