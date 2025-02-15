import { createContext, useContext, useSyncExternalStore } from 'react';
import { Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

export type EditorEvents = {
  transaction: (transaction: Transaction) => void;
  update: (view: EditorView) => void;
  docChanged: (view: EditorView) => void;
  selectionUpdate: (view: EditorView) => void;
};

export type ProseMirrorEventContextValue = {
  view: EditorView;
  register: <Event extends keyof EditorEvents>(e: Event, callback: EditorEvents[Event]) => () => void;
  subscribe: (onUpdate: () => void) => () => void;
};

const ProseMirrorEventContext = createContext<ProseMirrorEventContextValue>(null as never);

ProseMirrorEventContext.displayName = 'ProseMirrorEventContext';

export const ProseMirrorEventContextProvider = ProseMirrorEventContext.Provider;

const useEditorEventContext = () => {
  const context = useContext(ProseMirrorEventContext);

  if (!context) {
    throw new Error(`useEditorEventContext must be used within ProseMirrorEventContext`);
  }

  return context;
};

export const useEditorState = <T,>(selector: (view: EditorView) => T) => {
  const context = useEditorEventContext();

  return useSyncExternalStore(
    context.subscribe,
    () => selector(context.view),
    () => selector(context.view)
  );
};

export const useEditorEventRegister = () => {
  const context = useEditorEventContext();

  return context.register;
};
