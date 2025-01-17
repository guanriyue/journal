import { TextSelection } from 'prosemirror-state';

export const isTextSelection = (s: unknown): s is TextSelection => {
  return s instanceof TextSelection;
}
