// types/ckeditor.d.ts
declare module '@ckeditor/ckeditor5-react' {
    import { ComponentType } from 'react';
    import { Editor } from '@ckeditor/ckeditor5-core';
  
    export interface CKEditorProps {
      editor: any;
      data?: string;
      config?: Record<string, any>;
      onReady?: (editor: Editor) => void;
      onChange?: (event: Event, editor: Editor) => void;
      onBlur?: (event: Event, editor: Editor) => void;
      onFocus?: (event: Event, editor: Editor) => void;
    }
  
    export const CKEditor: ComponentType<CKEditorProps>;
  }
  