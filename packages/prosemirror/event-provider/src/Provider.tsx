import { EditorView } from "prosemirror-view";
import { EventEmitter } from 'eventemitter3';
import { useEffect, useMemo } from "react";
import { EditorEvents, ProseMirrorEventContextProvider, ProseMirrorEventContextValue } from "./Context";
import { Plugin } from "prosemirror-state";
import { registerPlugin } from '@journal/prosemirror-utils';

export interface EditorEventProviderProps {
  view: EditorView;

  children?: React.ReactNode;
}

export const EditorEventProvider = (props: EditorEventProviderProps) => {
  const { view, children } = props;

  const { eventEmitter, plugin } = useMemo(() => {
    const eventEmitter = new EventEmitter<EditorEvents>();

    const plugin = new Plugin({
      state: {
        init: () => {},
        apply: tr => {
          eventEmitter.emit('transaction', tr);
        },
      },
      view: () => {
        return {
          update: (view, prevState) => {
            eventEmitter.emit('update', view);

            const eventNames= eventEmitter.eventNames();
            if (eventNames.includes('selectionUpdate')) {
              if (!view.state.selection.eq(prevState.selection)) {
                eventEmitter.emit('selectionUpdate', view);
              }
            }

            if (eventNames.includes('docChanged')) {
              if (!view.state.doc.eq(prevState.doc)) {
                eventEmitter.emit('docChanged', view);
              }
            }
          },
        };
      },
    });

    return { eventEmitter, plugin };
  }, []);

  useEffect(() => {
    return registerPlugin(view, plugin);
  }, [view, plugin]);

  const contextValue = useMemo<ProseMirrorEventContextValue>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const register = <Event extends keyof EditorEvents>(e: Event, callback: any) => {
      eventEmitter.on(e, callback);

      return () => {
        eventEmitter.off(e, callback);
      };
    };

    return {
      view,
      register,
      subscribe: onUpdate => register('update', onUpdate),
    };
  }, [view]);

  return (
    <ProseMirrorEventContextProvider value={contextValue}>
      {children}
    </ProseMirrorEventContextProvider>
  )
};
