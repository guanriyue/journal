import { EditorView } from 'prosemirror-view';
import { clamp } from 'lodash-es'

export const domRectAt = (view: EditorView, from: number, to: number) => {
  const minPos = 0;
  const maxPos = view.state.doc.content.size;
  const resolvedFrom = clamp(from, minPos, maxPos);
  const resolvedEnd = clamp(to, minPos, maxPos);
  const start = view.coordsAtPos(resolvedFrom);
  const end = view.coordsAtPos(resolvedEnd, -1);
  const top = Math.min(start.top, end.top);
  const bottom = Math.max(start.bottom, end.bottom);
  const left = Math.min(start.left, end.left);
  const right = Math.max(start.right, end.right);
  const width = right - left;
  const height = bottom - top;
  const x = left;
  const y = top;
  const data = {
    top,
    bottom,
    left,
    right,
    width,
    height,
    x,
    y,
  };

  return {
    ...data,
    toJSON: () => data,
  };
};
