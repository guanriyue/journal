/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef } from 'react';

export const useCallbackRef = <T extends (...args: any[]) => any>(fn: T | undefined): T => {
  const ref = useRef(fn);

  useEffect(() => {
    ref.current = fn;
  })

  return useMemo(() => {
    return (...args: any[]) => ref.current?.(...args);
  }, []) as T;
};
