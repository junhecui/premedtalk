import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style'; 

const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      fontSize: {
        default: '16px',
        parseHTML: element => element.style.fontSize || '16px',
        renderHTML: attributes => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },
  addCommands() {
    return {
      setFontSize: size => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: size }).run();
      },
    };
  },
});

document.addEventListener('DOMContentLoaded', () => {
  const editorElement = document.querySelector('#editor');
  const formElement = document.querySelector('form');

  if (editorElement) {
    const editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit,
        TextAlign.configure({
          types: ['heading', 'paragraph'], 
        }),
        FontSize,
        Color.configure({ types: ['textStyle'] }), 
      ],
      content: '',
      onUpdate({ editor }) {
        const postBody = document.getElementById('postBody');
        postBody.value = editor.getHTML(); 
      },
    });

    document.getElementById('bold-btn').addEventListener('click', () => {
      editor.chain().focus().toggleBold().run();
    });

    document.getElementById('italic-btn').addEventListener('click', () => {
      editor.chain().focus().toggleItalic().run();
    });

    document.getElementById('font-size-input').addEventListener('input', (event) => {
      const fontSize = event.target.value;
      editor.chain().focus().setFontSize(fontSize + 'px').run();
    });

    document.getElementById('color-input').addEventListener('input', (event) => {
      const color = event.target.value;
      editor.chain().focus().setColor(color).run();
    });

    document.getElementById('center-btn').addEventListener('click', () => {
      editor.chain().focus().setTextAlign('center').run();
    });

    document.getElementById('left-btn').addEventListener('click', () => {
      editor.chain().focus().setTextAlign('left').run();
    });

    document.getElementById('right-btn').addEventListener('click', () => {
      editor.chain().focus().setTextAlign('right').run();
    });

    formElement.addEventListener('submit', (event) => {
      event.preventDefault();
      const postBody = document.getElementById('postBody');
      postBody.value = editor.getHTML();
      formElement.submit();
    });
  }
});