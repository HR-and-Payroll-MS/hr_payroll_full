import React, { useCallback } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes } from "@lexical/html";

export default function LexicalEditor({ onChange }) {
  const config = {
    namespace: "SimpleEditor",
    theme: {},
    onError(error) {
      console.error(error);
    }
  };

  const handleChange = useCallback(
    (editorState, editor) => {
      const json = editorState.toJSON();

      // ALSO convert to HTML (required by your new request)
      let html = "";
      editorState.read(() => {
        html = $generateHtmlFromNodes(editor);
      });

      onChange && onChange({ json, html });
    },
    [onChange]
  );

  return (
    <LexicalComposer initialConfig={config}>
      <div className="border border-gray-300 rounded-xl p-4 bg-white">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-[160px] outline-none text-gray-800" />
          }
          placeholder={<div className="text-gray-400">Start typing…</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={handleChange} />
      </div>
    </LexicalComposer>
  );
}
