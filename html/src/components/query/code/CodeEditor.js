import { useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { loadLanguage } from "@uiw/codemirror-extensions-langs";
import { basicLight, whiteLight } from "@uiw/codemirror-themes-all";
import { EditorView } from "@codemirror/view";

const CodeEditor = ({ value, isCurrent, onValueChange }) => {
  const onChange = useCallback(
    (val, viewUpdate) => {
      onValueChange(val);
    },
    [onValueChange]
  );
  const onFocus = useCallback(() => {
    onValueChange(value);
  }, [value, onValueChange]);
  if (!isCurrent) {
    return (
      <div className="text-left border font-mono px-[6px] py-[4px] text-[13px] leading-[18px]">
        <pre>{value}</pre>
      </div>
    );
  }
  return (
    <div
      className="text-left border rounded overflow-hidden focus-within:shadow-lg mb-12"
      onFocus={onFocus}
    >
      <CodeMirror
        value={value}
        theme={isCurrent ? basicLight : whiteLight}
        editable={isCurrent}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          bracketMatching: true,
          highlightActiveLine: isCurrent,
        }}
        extensions={[
          loadLanguage("groovy"),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const lastLine = update.state.doc.lineAt(update.state.doc.length);
              if (lastLine.text !== "") {
                update.view.dispatch({
                  changes: {
                    from: update.state.doc.length,
                    insert: "\n",
                  },
                });
              }
            }
          }),
        ]}
        onChange={onChange}
      />
    </div>
  );
};

export default CodeEditor;
