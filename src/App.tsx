import { useEffect, useState } from "react";
import "./App.css";

import io from "socket.io-client";
import { sortBy } from "lodash";
import Editor from "./Editor";

const socket = io("localhost:5001");

type User = {
  id: string;
  name: string;
  index: number;
};

const isUser = (u: unknown): u is User =>
  typeof u === "object" && !!u && "name" in u && "index" in u && "id" in u;

const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);
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

  return {
    connected,
    users,
    currentUser,
    currentTurnId,
    code,
    setCode,
    emitKeyPress,
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
  const { connected, currentUser, users, code, currentTurnId, emitKeyPress } =
    useSocket();

  return (
    <>
      <div className="App">connection status: {connected ? "yes!" : "no"}</div>
      {currentUser && currentTurnId && (
        <>
          <UserList
            users={users}
            currentUser={currentUser}
            currentTurnId={currentTurnId}
          />
          <Editor
            value={code}
            onKeyDown={(key) => {
              if (currentTurnId === currentUser.id) {
                console.log(key);
                emitKeyPress(key);
              }
            }}
          />
        </>
      )}
    </>
  );
};

export default App;
