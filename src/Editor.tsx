import CodeEditor from "react-simple-code-editor";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import "highlight.js/styles/github.css";
import { useEffect, useState } from "react";

hljs.registerLanguage("python", python);

const BLINK_SPEED = 500;

const Editor = ({
  value,
  onKeyDown,
}: {
  value: string;
  onKeyDown: (key: string) => void;
}) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const doBlink = () => {
      setTimeout(() => {
        setBlink((b) => !b);
        doBlink();
      }, BLINK_SPEED);
    };

    doBlink();
  }, []);

  let content = hljs.highlight(value, { language: "python" }).value;
  if (blink) {
    content = content + "_";
  }
  return (
    <div
      style={{
        border: "1px solid black",
        width: "600px",
        height: "300px",
        padding: "10px",
        textAlign: "left",
        fontFamily: "monospace",
        whiteSpace: "pre",
        overflowX: "scroll",
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
