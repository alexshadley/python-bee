import { useEffect, useState } from "react";
import "./App.css";

import io from "socket.io-client";
import { sortBy } from "lodash";
import Editor from "./Editor";
import TerminalOutput from "./TerminalOutput";

const socket = io("localhost:5001");

type User = {
  id: string;
  name: string;
  index: number;
};

type QuestionContent = {
  name: string;
  description: string;
  stub: string;
};

const isUser = (u: unknown): u is User =>
  typeof u === "object" && !!u && "name" in u && "index" in u && "id" in u;

const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);
  const [questionName, setQuestionName] = useState<string | null>(null);
  const [questionDescription, setQuestionDescription] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<string | null>(null);
  const [questionStub, setQuestionStub] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [code, setCode] = useState<string>("");

  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
    });

    
    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("assignUser", (user: unknown) => {
      if (isUser(user)) {
        setCurrentUser(user);
      }
    });

    socket.on("questionContent", (msg: string) => {
      let question: QuestionContent = JSON.parse(msg)
      setQuestionName(question.name);
      setQuestionDescription(question.description);
      setQuestionStub(question.stub);
    });

    socket.on("submissionResults", (msg: string) => {
      let results: string[] = JSON.parse(msg);
      setSubmissionResult(results.join('\n'));
    });


    socket.on("setTurn", (userId: string) => {
      setCurrentTurnId(userId);
    });

    socket.on("setCode", (code: string) => {
      setCode(code);
    });

    socket.on("setUsers", (users: unknown[]) => {
      setUsers(users.filter(isUser));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  const emitKeyPress = (key: string) => {
    socket.emit("keyPress", key);
  };

  const submitQuestion = () => {
    socket.emit('submit');
  }

  return {
    connected,
    users,
    currentUser,
    currentTurnId,
    questionName,
    questionDescription,
    questionStub,
    code,
    submissionResult,
    setCode,
    emitKeyPress,
    submitQuestion
  };
};

const UserList = ({
  users,
  currentUser,
  currentTurnId,
}: {
  users: User[];
  currentUser: User;
  currentTurnId: string;
}) => {
  const sorted = [...users];
  sortBy(sorted, "index");

  return (
    <div>
      {users.map((u) => (
        <div>
          {currentTurnId === currentUser.id ? ">" : ""}
          {u.name}
          {u.id === currentUser.id ? "*" : ""}
        </div>
      ))}
    </div>
  );
};

const App = () => {
  const { connected, currentUser, users, code, submissionResult, currentTurnId, questionName, questionDescription, questionStub, emitKeyPress, submitQuestion } =
    useSocket();

  return (
    <>
      <div className="App">connection status: {connected ? "yes!" : "no"}</div>
      <div className="QuestionText"> {questionName}: {questionDescription}</div>
      {currentUser && currentTurnId && (
        <>
          <UserList
            users={users}
            currentUser={currentUser}
            currentTurnId={currentTurnId}
          />
          <Editor
            value={questionStub + code}
            onKeyDown={(key) => {
              if (currentTurnId === currentUser.id) {
                console.log(key);
                emitKeyPress(key);
              }
            }}
          />
          {submissionResult ? 
            <>
            <TerminalOutput
              text={submissionResult}
            /> 
            <button onClick={submitQuestion}>Submit Answer</button>
            </>
            : 
            <button onClick={submitQuestion}>Submit Answer</button>
          }
        </>
      )}
      
    </>
  );
};

export default App;
