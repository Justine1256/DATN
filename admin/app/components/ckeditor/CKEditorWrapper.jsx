import { useState, useEffect, useMemo } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";

import {
    ClassicEditor,
    Alignment, Autoformat, AutoImage, AutoLink, Autosave, BalloonToolbar,
    BlockQuote, Bold, Bookmark, Code, CodeBlock, Essentials, FindAndReplace,
    FontBackgroundColor, FontColor, FontFamily, FontSize, FullPage, Fullscreen,
    GeneralHtmlSupport, Heading, Highlight, HorizontalLine, HtmlComment, HtmlEmbed,
    ImageBlock, ImageCaption, ImageEditing, ImageInline, ImageInsert, ImageInsertViaUrl,
    ImageResize, ImageStyle, ImageTextAlternative, ImageToolbar, ImageUpload, ImageUtils,
    Indent, IndentBlock, Italic, Link, LinkImage, List, ListProperties, Markdown,
    MediaEmbed, PageBreak, Paragraph, PasteFromMarkdownExperimental, PasteFromOffice,
    PlainTableOutput, RemoveFormat, ShowBlocks, SimpleUploadAdapter, SourceEditing,
    SpecialCharacters, SpecialCharactersArrows, SpecialCharactersCurrency, SpecialCharactersEssentials,
    SpecialCharactersLatin, SpecialCharactersMathematical, SpecialCharactersText, Strikethrough,
    Style, Subscript, Superscript, Table, TableCaption, TableCellProperties, TableColumnResize,
    TableLayout, TableProperties, TableToolbar, TextPartLanguage, TextTransformation, Title,
    TodoList, Underline, WordCount,
} from "ckeditor5";

import translations from "ckeditor5/translations/vi.js";
import "ckeditor5/ckeditor5.css";
import "./CKEditorWrapper.module.css";

const LICENSE_KEY =
    'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NTM1NzQzOTksImp0aSI6ImYxMmY1NTBkLTk5ZjMtNDczZS04OWQzLTQ4N2RhODM0Nzk2YyIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6ImYwZjVlMTQwIn0.58pujZFqpFGaVyNn81Ul5ZXTQJbH3fmk-n_1TXyTIXStRHxD-i5BSHd14OAWn90XwCjHHL9pQ28DTmu6C3J2cw';

export function useCKEditorConfig() {
    const [isLayoutReady, setIsLayoutReady] = useState(false);

    useEffect(() => {
        setIsLayoutReady(true);
        return () => setIsLayoutReady(false);
    }, []);

    const editorConfig = useMemo(() => {
        if (!isLayoutReady) return null;

        return {
            toolbar: {
                items: [
                    "undo", "redo", "|", "sourceEditing", "showBlocks", "|",
                    "heading", "style", "|",
                    "fontSize", "fontFamily", "fontColor", "fontBackgroundColor", "|",
                    "bold", "italic", "underline", "|",
                    "link", "insertImage", "insertTable", "insertTableLayout",
                    "highlight", "blockQuote", "codeBlock", "|",
                    "alignment", "|",
                    "bulletedList", "numberedList", "todoList", "outdent", "indent",
                ],
                shouldNotGroupWhenFull: false,
            },
            plugins: [
                Alignment, Autoformat, AutoImage, AutoLink, Autosave, BalloonToolbar,
                BlockQuote, Bold, Bookmark, Code, CodeBlock, Essentials, FindAndReplace,
                FontBackgroundColor, FontColor, FontFamily, FontSize, FullPage, Fullscreen,
                GeneralHtmlSupport, Heading, Highlight, HorizontalLine, HtmlComment, HtmlEmbed,
                ImageBlock, ImageCaption, ImageEditing, ImageInline, ImageInsert, ImageInsertViaUrl,
                ImageResize, ImageStyle, ImageTextAlternative, ImageToolbar, ImageUpload, ImageUtils,
                Indent, IndentBlock, Italic, Link, LinkImage, List, ListProperties,
                MediaEmbed, PageBreak, Paragraph, PasteFromOffice,
                PlainTableOutput, RemoveFormat, ShowBlocks, SimpleUploadAdapter, SourceEditing,
                SpecialCharacters, SpecialCharactersArrows, SpecialCharactersCurrency, SpecialCharactersEssentials,
                SpecialCharactersLatin, SpecialCharactersMathematical, SpecialCharactersText, Strikethrough,
                Style, Subscript, Superscript, Table, TableCaption, TableCellProperties, TableColumnResize,
                TableLayout, TableProperties, TableToolbar, TextPartLanguage, TextTransformation, Title,
                TodoList, Underline, WordCount,
            ],
            balloonToolbar: ["bold", "italic", "|", "link", "insertImage", "|", "bulletedList", "numberedList"],
            fontFamily: { supportAllValues: true },
            fontSize: {
                options: [10, 12, 14, "default", 18, 20, 22],
                supportAllValues: true,
            },
            fullscreen: {
                onEnterCallback: (container) => {
                    container.classList.add(
                        "editor-container", "editor-container_classic-editor",
                        "editor-container_include-style", "editor-container_include-word-count",
                        "editor-container_include-fullscreen", "main-container"
                    );
                },
            },
            heading: {
                options: [
                    { model: "paragraph", view: "p", title: "Paragraph", class: "ck-heading_paragraph" },
                    { model: "heading1", view: "h1", title: "Heading 1", class: "ck-heading_heading1" },
                    { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
                    { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
                    { model: "heading4", view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
                    { model: "heading5", view: "h5", title: "Heading 5", class: "ck-heading_heading5" },
                    { model: "heading6", view: "h6", title: "Heading 6", class: "ck-heading_heading6" },
                ]
            },

            htmlSupport: {
                allow: [
                    {
                        name: /.*/,
                        attributes: true,
                        classes: true,
                        styles: true
                    }
                ]
            },

            image: {
                toolbar: [
                    "toggleImageCaption", "imageTextAlternative", "|",
                    "imageStyle:inline", "imageStyle:wrapText", "imageStyle:breakText", "|", "resizeImage",
                ],
            },
            language: "vi",
            licenseKey: LICENSE_KEY,
            link: {
                addTargetToExternalLinks: true,
                defaultProtocol: "https://",
                decorators: {
                    toggleDownloadable: {
                        mode: "manual",
                        label: "Downloadable",
                        attributes: { download: "file" },
                    },
                },
            },
            list: { properties: { styles: true, startIndex: true, reversed: true } },
            menuBar: { isVisible: true },
            placeholder: "Nhập nội dung tại đây...",
            style: {
                definitions: [
                    { name: "Article category", element: "h3", classes: ["category"] },
                    { name: "Title", element: "h2", classes: ["document-title"] },
                    { name: "Subtitle", element: "h3", classes: ["document-subtitle"] },
                    { name: "Info box", element: "p", classes: ["info-box"] },
                    { name: "CTA Link Primary", element: "a", classes: ["button", "button--green"] },
                    { name: "CTA Link Secondary", element: "a", classes: ["button", "button--black"] },
                    { name: "Marker", element: "span", classes: ["marker"] },
                    { name: "Spoiler", element: "span", classes: ["spoiler"] },
                ],
            },
            table: {
                contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableProperties", "tableCellProperties"],
            },
            translations: [translations],
        };
    }, [isLayoutReady]);

    return { ClassicEditor, editorConfig };
}
