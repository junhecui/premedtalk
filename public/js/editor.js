import { Editor } from 'https://cdn.skypack.dev/@tiptap/core'
import StarterKit from 'https://cdn.skypack.dev/@tiptap/starter-kit'
import TextAlign from 'https://cdn.skypack.dev/@tiptap/extension-text-align'
import Image from 'https://cdn.skypack.dev/@tiptap/extension-image'
import Link from 'https://cdn.skypack.dev/@tiptap/extension-link'

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
        Image,
        Link
      ],
      content: '',
    });

    // Function to handle form submission
    function submitEditorContent(event) {
      event.preventDefault();
      const postBody = document.getElementById('postBody');
      postBody.value = editor.getHTML();
      formElement.submit();
    }

    // Attach the submit handler to the form
    formElement.addEventListener('submit', submitEditorContent);
  }
});