import hljs from "highlight.js/lib/core";
import console from "highlight.js/lib/languages/shell";

hljs.registerLanguage("console", console)

const TerminalOutput = ({
    text,
}: {
    text: string;
}) => {
    let content = hljs.highlight(text, { language: "console"}).value;
    return (
        <div style={{ border: "1px solid black" }}>
            <div
            style={{
                width: "400px",
                height: "300px",
                padding: "10px",
                textAlign: "left",
                fontFamily: "monospace",
                whiteSpace: "pre",
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
        </div>
    )
}

export default TerminalOutput;