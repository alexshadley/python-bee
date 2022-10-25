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

type GameStatePayload = {
  code: string;
  users: User[];
  roles: { [key: string]: string };
  scores: { [userId: string]: number };
  currentTurn: string;
  question: QuestionContent;
  submissionResults: string[];
};

const socket = io("localhost:5001");

const useSocket = () => {
  const [socketId, setSocketId] = useState<string | null>(null);
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);
  const [questionName, setQuestionName] = useState<string | null>(null);
  const [questionDescription, setQuestionDescription] = useState<string | null>(
    null
  );
  const [submissionResult, setSubmissionResult] = useState<string | null>(null);
  // TODO: fix these
  const [scoreboard, setScoreboard] = useState<{ [key: string]: number }>({});
  const [role, setRole] = useState<string | null>(null);
  const [questionStub, setQuestionStub] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [code, setCode] = useState<string>("");

  useEffect(() => {
    socket.on("connect", () => {
      console.log("connect");
      // boo bad API socketio
      setSocketId(socket.id);
    });

    socket.on("disconnect", () => {
      setSocketId(null);
    });

    socket.on("updateState", (gameState: GameStatePayload) => {
      console.log("gameState", gameState);
      setCurrentTurnId(gameState.currentTurn);
      setQuestionName(gameState.question.name);
      setQuestionDescription(gameState.question.description);
      setQuestionStub(gameState.question.stub);
      setUsers(gameState.users);
      setCode(gameState.code);
      setSubmissionResult(gameState.submissionResults.join("\n"));
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
    socket.emit("getQuestion");
    setSubmissionResult(null);
  };

  const currentUser = users.find((u) => u.id === socketId) ?? null;

  return {
    socketId,
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
    <div style={{ textAlign: "left", background: "#f3f4f6", width: "200px" }}>
      <div style={{ margin: "10px", fontWeight: "bold" }}>Player order</div>
      {users.map((u) => (
        <UserListItem
          key={u.id}
          user={u}
          currentTurnId={currentTurnId}
          currentUser={currentUser}
        />
      ))}
      <div style={{ margin: "10px", fontWeight: "bold", marginTop: "30px" }}>
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
    user.id === currentTurnId ? { border: "2px solid #53db56" } : {};
  return (
    <div
      style={{
        ...style,
        padding: "5px",
        margin: "10px",
        borderRadius: "4px",
        backgroundColor: "white",
        boxShadow: "1px 1px 2px 1px rgba(0, 0, 0, 0.1)",
      }}
    >
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
  const style: { border?: string } = {};

  if (currentTurnId === currentUser.id) {
    // style.border = "2px solid #53db56";
    text = "It's your turn!!";
  } else {
    const turns = getTurnsAway(users, currentTurnId, currentUser);
    text = `${turns} turn${turns === 1 ? "" : "s"} away`;
  }
  return (
    <div
      style={{
        padding: "10px",
        textAlign: "left",
        borderBottom: "1px solid #d2d6dc",
      }}
    >
      <b>Status: </b>
      {text}
    </div>
  );
};

const isApprovedKey = (key: string) => {
  return key.length === 1 || ["Enter", "Backspace", "Tab"].includes(key);
};

const Button = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => {
  return (
    <button className="button" onClick={onClick}>
      {children}
    </button>
  );
};

const App = () => {
  const {
    socketId,
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
      <div className="App">
        connection status: {socketId ? `yes! (${socketId})` : "no"}
      </div>
      <div style={{ marginBottom: "10px" }}>
        <b>{questionName}:</b> {questionDescription}
      </div>
      {currentUser && currentTurnId && (
        <>
          <div
            style={{
              border: "1px solid #d2d6dc",
              width: "min-content",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
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
                canEdit={currentTurnId === currentUser.id}
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
              <div style={{ marginTop: "20px" }}>
                <TerminalOutput text={submissionResult} />
              </div>
              <div style={{ marginTop: "20px" }}>
                <Button onClick={nextQuestion}>Next Question</Button>
              </div>
            </>
          ) : (
            <div style={{ marginTop: "20px" }}>
              <Button onClick={submitQuestion}>Submit Answer</Button>
            </div>
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
