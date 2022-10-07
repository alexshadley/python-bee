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
  console.log(value);
  const content = hljs.highlight(value, { language: "python" }).value;
  return (
    <div style={{ border: "1px solid black" }}>
      <div
        onKeyDown={(e) => onKeyDown(e.key)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      {/* <CodeEditor
        value={value}
        onValueChange={(newCode) => {
          // lib makes us implement this
        }}
        onKeyDown={(e) => onKeyDown(e.key)}
        highlight={(code) => {
          return hljs.highlight(code, { language: "python" }).value;
        }}
        padding={10}
        style={{
          width: "400px",
          height: "300px",
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 16,
        }}
      /> */}
    </div>
  );
};

export default Editor;
