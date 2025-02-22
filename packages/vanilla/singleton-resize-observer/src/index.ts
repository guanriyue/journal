// https://github.com/WICG/resize-observer/issues/59
// Question: one vs multiple ResizeObserver(s) performance
// The recommended pattern is to use one ResizeObserver to observe multiple elements.
// @atotic looked into the performance gains of using one-vs-many ROs – they are dramatic:
// https://groups.google.com/a/chromium.org/d/msg/blink-dev/z6ienONUb5A/F5-VcUZtBAAJ

type SingletonResizeObserverCallback = (entry: ResizeObserverEntry, observer: ResizeObserver) => void;

const defaultResizeObserverOptions: ResizeObserverOptions = {
  box: 'border-box',
};

export const createSingletonResizeObserver = (options = defaultResizeObserverOptions) => {
  const callbackMap = new Map<Element, SingletonResizeObserverCallback[]>();

  const observer = new ResizeObserver((entries, observer) => {
    for (const entry of entries) {
      const callbacks = callbackMap.get(entry.target);
      if (callbacks) {
        for (const callback of callbacks) {
          callback(entry, observer);
        }
      }
    }
  });

  const observe = (target: Element, callback: SingletonResizeObserverCallback) => {
    let callbacks = callbackMap.get(target);
    if (!callbacks) {
      callbacks = [];
      callbackMap.set(target, callbacks);
      observer.observe(target, options);
    }
    callbacks.push(callback);

    return () => unobserve(target, callback);
  };

  const unobserve = (target: Element, callback?: SingletonResizeObserverCallback) => {
    const callbacks = callbackMap.get(target);
    if (!callbacks) {
      return;
    }

    if (!callback) {
      callbackMap.delete(target);
      observer.unobserve(target);
      return;
    }

    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }

    if (callbacks.length === 0) {
      callbackMap.delete(target);
      observer.unobserve(target);
    }
  };

  return {
    /**
     * observe the target element.
     * @param callback the callback to call when the target element is resized.
     * @returns a function to remove the callback for the target element.
     */
    observe,

    /**
     * unobserve the target element.
     * @param target
     * @param callback the callback to remove. If not provided, all callbacks for the target will be removed.
     */
    unobserve,
  };
};

/**
 * A singleton ResizeObserver with default options whose box is 'border-box'.
 */
export const resizeObserver = createSingletonResizeObserver();
