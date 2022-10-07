import { useEffect, useState } from "react";
import "./App.css";

import io from "socket.io-client";
import { sortBy } from "lodash";
import Editor from "react-simple-code-editor";

const socket = io("localhost:5000");

type User = {
  id: string;
  name: string;
  index: number;
};

// type Turn = {
//   userId: string;
// }

const isUser = (u: unknown): u is User =>
  typeof u === "object" && !!u && "name" in u && "index" in u && "id" in u;

const useSocket = () => {
  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);

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

    socket.on("setUsers", (users: unknown[]) => {
      setUsers(users.filter(isUser));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return { connected, users, currentUser, currentTurnId };
};

const UserList = ({
  users,
  currentUser,
}: {
  users: User[];
  currentUser: User;
}) => {
  const sorted = [...users];
  sortBy(sorted, "index");

  return (
    <div>
      {users.map((u) => (
        <div>
          {u.name}
          {u.id === currentUser.id ? "*" : ""}
        </div>
      ))}
    </div>
  );
};

// const GroupEditor = ({ value, isTurn }: { value: string; isTurn: boolean }) => {
//   return <Editor value={value} onValueChange={(newValue) => {

//     if
//   }} />;
// };

const App = () => {
  const { connected, currentUser, users } = useSocket();

  return (
    <>
      <div className="App">connection status: {connected ? "yes!" : "no"}</div>
      {currentUser && <UserList users={users} currentUser={currentUser} />}
    </>
  );
};

export default App;
