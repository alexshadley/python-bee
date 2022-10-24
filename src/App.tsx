import { useEffect, useState } from "react";
import "./App.css";

import io from "socket.io-client";
import { sortBy } from "lodash";
import Editor from "./Editor";
import TerminalOutput from "./TerminalOutput";

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

const socket = io("localhost:5001");

const isUser = (u: unknown): u is User =>
  typeof u === "object" && !!u && "name" in u && "index" in u && "id" in u;

const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);
  const [questionName, setQuestionName] = useState<string | null>(null);
  const [questionDescription, setQuestionDescription] = useState<string | null>(
    null
  );
  const [submissionResult, setSubmissionResult] = useState<string | null>(null);
  const [scoreboard, setScoreboard] = useState<{ [key: string]: number }>({});
  const [role, setRole] = useState<string | null>(null);
  const [questionStub, setQuestionStub] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [code, setCode] = useState<string>("");

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connect");
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
      let question: QuestionContent = JSON.parse(msg);
      setQuestionName(question.name);
      setQuestionDescription(question.description);
      setQuestionStub(question.stub);
    });

    socket.on("scoreboardUpdate", (msg: string) => {
      let results: { [key: string]: number } = JSON.parse(msg);
      console.log(results);
      setScoreboard(results);
    });

    socket.on("submissionResults", (msg: string) => {
      let results: string[] = JSON.parse(msg);
      setSubmissionResult(results.join("\n"));
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

    socket.on("setRole", (role: string) => {
      setRole(role);
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
    socket.emit("submit");
  };

  const nextQuestion = () => {
    socket.emit("clearCode");
    socket.emit("getQuestion");
    setSubmissionResult(null);
  };

  return {
    connected,
    users,
    currentUser,
    currentTurnId,
    questionName,
    questionDescription,
    questionStub,
    role,
    code,
    submissionResult,
    scoreboard,
    setCode,
    emitKeyPress,
    submitQuestion,
    nextQuestion,
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
    <div style={{ textAlign: "left", background: "#f3f4f6" }}>
      <div style={{ padding: "5px", fontWeight: "bold" }}>Player order</div>
      {users.map((u) => (
        <UserListItem
          user={u}
          currentTurnId={currentTurnId}
          currentUser={currentUser}
        />
      ))}
      <div style={{ padding: "5px", fontWeight: "bold", marginTop: "20px" }}>
        You
      </div>
      <UserListItem
        user={currentUser}
        currentTurnId={currentTurnId}
        currentUser={currentUser}
      />
    </div>
  );
};

const UserListItem = ({
  user,
  currentUser,
  currentTurnId,
}: {
  user: User;
  currentUser: User;
  currentTurnId: string;
}) => {
  const style =
    user.id === currentTurnId
      ? { border: "4px solid #53db56", padding: "5px" }
      : { padding: "5px" };
  return (
    <div style={style}>
      {user.name}
      {user.id === currentUser.id ? "*" : ""}
    </div>
  );
};

const getTurnsAway = (
  users: User[],
  currentTurnId: string,
  currentUser: User
) => {
  const sorted = [...users];
  sortBy(sorted, "index");

  const playerIndex = sorted.findIndex((u) => u.id == currentUser.id);
  const currentIndex = sorted.findIndex((u) => u.id === currentTurnId);
  if (playerIndex >= currentIndex) {
    return playerIndex - currentIndex;
  } else {
    return playerIndex - currentIndex + sorted.length;
  }
};

const StatusBar = ({
  users,
  currentUser,
  currentTurnId,
}: {
  users: User[];
  currentUser: User;
  currentTurnId: string;
}) => {
  let text;
  const style: { backgroundColor?: string } = {};

  if (currentTurnId === currentUser.id) {
    style.backgroundColor = "#53db56";
    text = "It's your turn!!";
  } else {
    const turns = getTurnsAway(users, currentTurnId, currentUser);
    text = `${turns} turn${turns === 1 ? "" : "s"} away`;
  }
  return (
    <div style={{ ...style, padding: "10px", textAlign: "left" }}>
      <b>Status: </b>
      {text}
    </div>
  );
};

const isApprovedKey = (key: string) => {
  return key.length === 1 || ["Enter", "Backspace", "Tab"].includes(key);
};

const App = () => {
  const {
    connected,
    currentUser,
    users,
    code,
    submissionResult,
    currentTurnId,
    questionName,
    questionDescription,
    questionStub,
    emitKeyPress,
    submitQuestion,
    nextQuestion,
    role,
    scoreboard,
  } = useSocket();

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div className="Role">You are a {role ? role : "Player"}</div>
      <div className="App">connection status: {connected ? "yes!" : "no"}</div>
      <div style={{ marginBottom: "10px" }}>
        <b>{questionName}:</b> {questionDescription}
      </div>
      {currentUser && currentTurnId && (
        <>
          <div style={{ border: "1px solid #d2d6dc", width: "min-content" }}>
            <StatusBar
              users={users}
              currentUser={currentUser}
              currentTurnId={currentTurnId}
            />
            <div style={{ display: "flex" }}>
              <Editor
                value={questionStub + code}
                onKeyDown={(key) => {
                  if (currentTurnId === currentUser.id && isApprovedKey(key)) {
                    emitKeyPress(key);
                  }
                }}
              />
              <UserList
                users={users}
                currentUser={currentUser}
                currentTurnId={currentTurnId}
              />
            </div>
          </div>
          {submissionResult ? (
            <>
              <button onClick={nextQuestion}>Next Question</button>
              <TerminalOutput text={submissionResult} />
              <button onClick={submitQuestion}>Submit Answer</button>
            </>
          ) : (
            <button onClick={submitQuestion}>Submit Answer</button>
          )}
          {scoreboard ? (
            <table>
              <tbody>
                {Object.entries(scoreboard).map((entry) => (
                  <tr>
                    <td>{entry[0]}</td>
                    <td>{entry[1]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div></div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
