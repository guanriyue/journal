// import { composeRefs as _composeRefs, useComposedRefs } from '@radix-ui/react-compose-refs';

import { useComposedRefs } from '@radix-ui/react-compose-refs';

// export const composeRefs = _composeRefs as <T>(...refs: (React.Ref<T> | undefined)[]) => (instance: T | null) => void | React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES[keyof React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES]

// export const useComposedRef = useComposedRefs as <T>(...refs: (React.Ref<T> | undefined)[]) => (instance: T | null) => void | React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES[keyof React.DO_NOT_USE_OR_YOU_WILL_BE_FIRED_CALLBACK_REF_RETURN_VALUES]

export { composeRefs  } from '@radix-ui/react-compose-refs';

export const useComposedRef = useComposedRefs as (
  <T>(...refs: (React.Ref<T> | undefined)[]) => (instance: T | null) => void
);
