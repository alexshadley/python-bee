import CodeEditor from "react-simple-code-editor";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import "highlight.js/styles/github.css";

hljs.registerLanguage("python", python);

const Editor = ({
  value,
  onKeyDown,
}: {
  value: string;
  onKeyDown: (key: string) => void;
}) => {
  let content = hljs.highlight(value, { language: "python" }).value;
  content = content + "_";
  return (
    <div
      style={{
        border: "1px solid black",
        width: "400px",
        height: "300px",
        padding: "10px",
        textAlign: "left",
        fontFamily: "monospace",
        whiteSpace: "pre",
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Tab") {
          // prevent tabbing away
          e.preventDefault();
        }
        onKeyDown(e.key);
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default Editor;
