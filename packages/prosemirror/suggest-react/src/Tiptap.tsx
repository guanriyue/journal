import { EditorProvider, Node } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import './style.css';
import { MentionExample } from './Mention';
import { HashExample } from './HashProduct';
import { DollarExample } from './DollarPost';

const AtomicText = Node.create({
  name: 'atomicText',

  inline: true,

  group: 'inline',

  atom: true,

  addAttributes() {
    return {
      text: {
        parseHTML: (element) => element.innerText,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ node }) {
    const { text } = node.attrs;

    return [
      'span',
      {
        'data-type': this.name,
      },
      text,
    ];
  },
});

const extensions = [
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
    },
  }),
  AtomicText,
  Link.extend({
    inclusive: false,
  }),
];

export const Tiptap = () => {
  return (
    <EditorProvider extensions={extensions}>
      <MentionExample />
      <HashExample />
      <DollarExample />
    </EditorProvider>
  );
};
