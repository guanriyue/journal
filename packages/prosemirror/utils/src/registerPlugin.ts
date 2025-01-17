import { Plugin } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

/**
 * 注册一个或多个 plugin
 * @param view
 * @param plugins 需要注册的 plugins
 * @param position 在当前 state 已注册的 plugins 头部或者尾部插入将要注册的 plugins，默认在尾部。插件顺序影响插件被应用的优先级
 * @returns 返回一个函数用于取消注册；或者 `undefined` 代表未注册成果
 */
export const registerPlugin = (view: EditorView, plugins: Plugin | Plugin[], position?: 'head' | 'tail') => {
  if (view.isDestroyed) {
    return undefined;
  }

  const pluginsToRegister = Array.isArray(plugins) ? plugins : [plugins];

  const currentPlugins = view.state.plugins;
  const nextPlugins = position === 'head' ? [...pluginsToRegister, ...currentPlugins] : [...currentPlugins, ...pluginsToRegister];

  view.updateState(view.state.reconfigure({ plugins: nextPlugins }));

  return () => {
    unregisterPlugin(view, pluginsToRegister)
  };
};

const unregisterPlugin = (view: EditorView, plugins: Plugin | Plugin[]) => {
  if (view.isDestroyed) {
    return;
  }

  const pluginsToUnregister = Array.isArray(plugins) ? plugins : [plugins];

  const nextPlugins = [...view.state.plugins];
  let changed = false;

  for (const plugin of pluginsToUnregister) {
    const index = nextPlugins.indexOf(plugin);
    
    if (index >= 0) {
      changed = true;
      nextPlugins.splice(index, 1);
    }
  }

  if (changed) {
    view.updateState(view.state.reconfigure({ plugins: nextPlugins }));
  }
};
