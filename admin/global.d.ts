declare module '@ckeditor/ckeditor5-react' {
    import * as React from 'react';
    const CKEditor: React.FC<any>;
    export { CKEditor };
}

declare module '@ckeditor/ckeditor5-build-classic' {
    const ClassicEditor: any;
    export default ClassicEditor;
}
