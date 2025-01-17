import { isFunction, isNil, isString } from 'lodash-es';
import { Command, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { DecorationSet, Decoration, DecorationAttrs, EditorView } from 'prosemirror-view';
import { ResolvedPos } from 'prosemirror-model';
import { domRectAt, Range } from '@journal/prosemirror-utils';

type SuggestionMatch = {
  /**
   * 匹配开始的位置
   */
  from: number;

  /**
   * 匹配结束的位置
   */
  to: number;

  /**
   * 当前匹配范围内的文案
   */
  text: string;

  /**
   * 当前匹配对应的查询关键字
   */
  query: string;

  /**
   * 当前是否是刚开始匹配到。一个 suggest 如果需要激活，至少要有一次 [isStart=true] 的情况
   */
  isStart: boolean;
};

export type SuggestionMatcher = ($pos: ResolvedPos) => SuggestionMatch | undefined | null;

const createMatcherByChar = (char: string): SuggestionMatcher => {
  return ($pos) => {
    if (!$pos.nodeBefore?.isText) {
      return undefined;
    }

    const currentText = $pos.nodeBefore.text!;
    const index = currentText.lastIndexOf(char);

    if (index < 0) {
      return undefined;
    }

    const text = currentText.slice(index);
    if (text.includes(' ')) {
      return undefined;
    }

    const from = $pos.pos - currentText.length + index;

    return {
      from,
      to: $pos.pos, 
      text,
      isStart: text === char,
      query: currentText.slice(index + char.length),
    };
  };
};

interface SuggestionMetadata {
  forceDisable?: boolean;
}

export interface SuggestionUpdateHandlerProps {
  range: Range;

  text: string;

  query: string;

  element: Element | null;

  virtualElement: {
    getBoundingClientRect: () => DOMRect;

    contextElement: Element;
  };
}

interface SuggestionHandler {
  onStart: (props: SuggestionUpdateHandlerProps) => void;

  onUpdate: (props: SuggestionUpdateHandlerProps) => void;

  onEnd: () => void;

  onKeydown: (event: KeyboardEvent) => boolean | void;
}

export interface SuggestionConfig {
  key?: PluginKey | string;

  matcher: string | SuggestionMatcher;

  view: EditorView;

  decorationAttrs?: () => DecorationAttrs;

  handler: SuggestionHandler | (() => SuggestionHandler);
}

interface SuggestionState {
  id: string;

  active: boolean;

  range: Range;

  text: string;

  query: string;

  composing: boolean;
}

const createPluginKey = (key: PluginKey | string | undefined) => {
  if (isNil(key)) {
    return undefined;
  }

  if (isString(key)) {
    return new PluginKey(key);
  }

  return key;
};

const randomId = () => Math.floor(Math.random() * 0xffffffff);

const createSuggestId = () => `suggest_id_${randomId}`;

const defaultState: SuggestionState = {
  id: createSuggestId(),
  active: false,
  query: '',
  text: '',
  range: {
    from: 0,
    to: 0,
  },
  composing: false,
};

export const suggest = (config: SuggestionConfig) => {
  const { view } = config;

  const pluginKey = createPluginKey(config.key);
  const handler = isFunction(config.handler) ? config.handler() : config.handler;
  const matcher = isFunction(config.matcher) ? config.matcher : createMatcherByChar(config.matcher);

  const plugin: Plugin<SuggestionState> = new Plugin<SuggestionState>({
    key: pluginKey,

    state: {
      init: () => {
        return defaultState;
      },

      apply: (tr, prev) => {
        const meta = tr.getMeta(plugin) as SuggestionMetadata | undefined;
        if (meta && meta.forceDisable) {
          return defaultState;
        }

        const { composing, editable } = view;
        const { selection } = tr;
        const { empty, from: pos } = selection;
        const next = {
          ...defaultState,
          composing,
        }

        if (tr.getMeta('pointer') || tr.getMeta('uiEvent')) {
          return next;
        }

        if (!editable) {
          return next;
        }

        if (!empty && !composing) {
          return next;
        }

        const $pos = selection.$from;
        const match = matcher($pos);

        if (!match) {
          return next;
        }

        // 如果已经处于激活状态，判断位置是否是从上一次的位置通过键盘输入和删除变换来的
        // 否则判断当前必须是 match 的初始激活状态
        const isValidPos = prev.active ? pos === tr.mapping.map(prev.range.to) : match.isStart;

        if (!isValidPos) {
          return next;
        }

        const range = { from: match.from, to: match.to };

        return {
          composing,
          id: prev.id || createSuggestId(),
          active: true,
          range,
          query: match.query,
          text: match.text,
        };
      },
    },

    view: (editorView) => {
      return {
        update: (view, prevState) => {
          if (!view.editable) {
            return;
          }

          const pluginState = plugin.getState(view.state);
          const prevPluginState = plugin.getState(prevState) || defaultState;

          if (!pluginState) {
            handler.onEnd();
            return;
          }

          const isStart = !prevPluginState.active && pluginState.active;
          const isEnd = prevPluginState.active && !pluginState.active;
          const isSuggesting = prevPluginState.active && pluginState.active;
          const isQueryChanged = isSuggesting && prevPluginState.query !== pluginState.query;
          const isPosChanged = isSuggesting && prevPluginState.range.from !== pluginState.range.from;
          const isCompositionEnd = isSuggesting && pluginState.composing && !view.composing;

          const buildProps = (): SuggestionUpdateHandlerProps => {
            const { query, range, text, id } = pluginState;

            const parentPos = view.state.selection.$from.before();
            const parentDOM = view.nodeDOM(parentPos);

            return {
              query,
              range,
              text,
              element: view.dom.querySelector(`[data-suggest-id=${CSS.escape(id)}]`),
              virtualElement: {
                contextElement: parentDOM instanceof Element ? parentDOM : view.dom,
                getBoundingClientRect: () => {
                  return domRectAt(view, range.from, range.to);
                },
              },
            };
          };

          if (isEnd || isPosChanged) {
            handler.onEnd();
          }

          if (isQueryChanged || isCompositionEnd) {
            handler.onUpdate(buildProps());
          }

          if (isStart) {
            handler.onStart(buildProps());
            ensureUniqueActiveSuggest(plugin)(view.state, view.dispatch);
          }
        },
        destroy: () => {
          if (view.isDestroyed || !plugin.getState(editorView.state)?.active) {
            handler.onEnd();
          }
        },
      };
    },
    props: {
      handleKeyDown: (view, event) => {
        const pluginState = plugin.getState(view.state);

        if (pluginState && pluginState.active) {
          return handler.onKeydown(event);
        }
      },

      decorations: (state) => {
        if (!config.decorationAttrs) {
          return undefined;
        }

        const pluginState = plugin.getState(state);

        if (!pluginState || !pluginState.active) {
          return undefined;
        }

        const { id, range } = pluginState;

        return DecorationSet.create(state.doc, [
          Decoration.inline(
            range.from,
            range.to,
            {
              ...config.decorationAttrs(),
              'data-suggest-id': id,
            }
          ),
        ]);
      },
    },

    [suggestionPluginSymbol]: true,
  });

  return plugin;
};

const suggestionPluginSymbol = `__suggestion_plugin_symbol__`;

const isSuggestionPlugin = (plugin: Plugin) => {
  return plugin.spec[suggestionPluginSymbol];
};

const forceDisableSuggest = (metaKey: Plugin | PluginKey, tr: Transaction) => {
  tr.setMeta(metaKey, { forceDisable: true } satisfies SuggestionMetadata);
  return true;
};

const ensureUniqueActiveSuggest = (activeMetaKey: Plugin | PluginKey): Command => {
  return (state, dispatch) => {
    const plugins = state.plugins.filter(p => isSuggestionPlugin(p) && p !== activeMetaKey && p.spec.key !== activeMetaKey);
    const tr = state.tr;

    if (plugins.length) {
      plugins.forEach(plugin => forceDisableSuggest(plugin, tr));
  
      if (dispatch) {
        dispatch(tr);
      }
    }

    return true;
  };
}
