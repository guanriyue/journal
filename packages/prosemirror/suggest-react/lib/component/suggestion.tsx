import { ListBoxRoot, ListBoxRootProps, ListBoxRootRef } from '@journal/react-listbox';
import type { EditorView } from 'prosemirror-view';
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { suggest, SuggestionConfig } from '../plugin';
import { Range, registerPlugin } from '@journal/prosemirror-utils';
import { autoUpdate, flip, hide, offset, shift, size, useFloating } from '@floating-ui/react-dom';
import { useCallbackRef, useComposedRef } from '@journal/react-hooks';
import { Primitive } from '@radix-ui/react-primitive';
import { isFunction } from 'lodash-es';

export type * from '@journal/react-listbox';

export { Empty, GroupLabel, Item, Group, List } from '@journal/react-listbox';

interface SuggestionRootProps extends Omit<React.ComponentPropsWithoutRef<typeof Primitive.div>, 'onSelect'>, Pick<ListBoxRootProps, 'onHighlight'>, Pick<SuggestionConfig, 'matcher'> {
  view: EditorView;

  /**
   * 触发 suggest 时调用
   * @param query 查询的关键字。可能为空，代表刚触发
   * @returns 
   */
  onSearch?: (query: string) => void;

  /**
   * 选中选项时触发
   * @param value 选项的值
   * @param range 当前 suggestion 的 range
   */
  onSelect?: (value: string, range: Range) => void;
}

const useZIndex = (ref: React.ForwardedRef<HTMLDivElement>) => {
  const [zIndex, rawSetZIndex] = useState<string>();

  const setZIndex = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      rawSetZIndex(window.getComputedStyle(el).zIndex)
    }
  }, []);

  const composedRef = useComposedRef(setZIndex, ref);

  return {
    zIndex,
    composedRef
  };
};

export const Root = forwardRef<HTMLDivElement, SuggestionRootProps>((props, ref) => {
  const { view, matcher, onSearch: propOnSearch, onSelect, onHighlight, ...contentProps } = props;

  const matcherFnRef = useCallbackRef(isFunction(matcher) ? matcher : undefined);
  const finalMatcher = isFunction(matcher) ? matcherFnRef : matcher;

  const [open, setOpen] = useState(false);
  const rangeRef = useRef<Range>(undefined);
  const listBoxRef = useRef<ListBoxRootRef>(null);
  const onSearch = useCallbackRef(propOnSearch);

  const plugin = useMemo(() => {
    const plugin = suggest({
      view,
      matcher: finalMatcher,
      handler: () => {
        return {
          onStart: ({ element, virtualElement, range, query }) => {
            setOpen(true);
            onSearch(query);
            refs.setReference(element || virtualElement);
            rangeRef.current = range;
          },
          onUpdate: ({ element, virtualElement, query, range }) => {
            onSearch(query);
            refs.setReference(element || virtualElement);
            rangeRef.current = range;
          },
          onEnd: () => {
            setOpen(false);
            refs.setReference(null);
            rangeRef.current = undefined;
          },
          onKeydown: (e) => {
            return listBoxRef.current?.keydown(e);
          },
        };
      },
    });

    return plugin;
  }, [view, finalMatcher]);

  useEffect(() => {
    return registerPlugin(view, plugin, 'head');
  }, [view, plugin]);

  const { refs, floatingStyles, isPositioned, placement, middlewareData } = useFloating({
    open,
    transform: true,
    strategy: 'fixed',
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset({ mainAxis: 12 }),
      shift({
        mainAxis: true,
        crossAxis: true,
      }),
      flip({}),
      size({
        apply: ({ elements, rects, availableWidth, availableHeight }) => {
          const { width: anchorWidth, height: anchorHeight } = rects.reference;
          const contentStyle = elements.floating.style;
          contentStyle.setProperty('--radix-popper-available-width', `${availableWidth}px`);
          contentStyle.setProperty('--radix-popper-available-height', `${availableHeight}px`);
          contentStyle.setProperty('--radix-popper-anchor-width', `${anchorWidth}px`);
          contentStyle.setProperty('--radix-popper-anchor-height', `${anchorHeight}px`);
        },
      }),
      hide({ strategy: 'referenceHidden' }),
    ],
  });

  const { composedRef, zIndex } = useZIndex(ref)
  const [placedSide, placedAlign] = placement.split('-');

  if (!open) {
    return null;
  }

  return (
    <div
      ref={refs.setFloating}
      data-radix-popper-content-wrapper=""
      style={{
        ...floatingStyles,
        transform: isPositioned ? floatingStyles.transform : 'translate(0, -200%)', // keep off the page when measuring
        minWidth: 'max-content',
        zIndex,
        ...(middlewareData.hide?.referenceHidden && {
          visibility: 'hidden',
          pointerEvents: 'none',
        }),
      }}
      dir={props.dir}
    >
      <Primitive.div
        data-side={placedSide}
        data-align={placedAlign}
        {...contentProps}
        ref={composedRef}
        style={{
          ...contentProps.style,
          animation: !isPositioned ? 'none' : undefined,
        }}
      >
        <ListBoxRoot ref={listBoxRef} onSelect={value => onSelect?.(value, rangeRef.current!)} onHighlight={onHighlight}>
          {props.children}
        </ListBoxRoot>
      </Primitive.div>
    </div>
  );
});

Root.displayName = 'SuggestionRoot' as const;
