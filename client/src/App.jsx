import "./App.css";
import { useState, useEffect } from "react";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io("http://localhost:5000");

export default function App() {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState(() => sessionStorage.getItem("roomId") || "");
  const [userName, setUserName] = useState(() => sessionStorage.getItem("userName") || "");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Welcome to CodeColab!\n\nfunction helloWorld() {\n  console.log('Hello, world!');\n}");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");

  useEffect(() => {
    const savedRoomId = sessionStorage.getItem("roomId");
    const savedUserName = sessionStorage.getItem("userName");
    if (savedRoomId && savedUserName) {
      socket.emit("join_room", { roomId: savedRoomId, userName: savedUserName });
      setJoined(true);
    }

    socket.on("initial_state", ({ code, language }) => {
      setCode(code);
      setLanguage(language);
    });

    socket.on("userJoined", (usersList) => {
      setUsers(usersList);
    });

    socket.on("code_change", (newCode) => {
      setCode(newCode);
    });

    socket.on("language_change", (newLang) => {
      setLanguage(newLang);
    });

    socket.on("typing", (name) => {
      setTyping(`${name} is typing...`);
      setTimeout(() => setTyping(""), 2000);
    });

    return () => {
      socket.off("initial_state");
      socket.off("userJoined");
      socket.off("code_change");
      socket.off("language_change");
      socket.off("typing");
    };
  }, []);

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join_room", { roomId, userName });
      sessionStorage.setItem("roomId", roomId);
      sessionStorage.setItem("userName", userName);
      setJoined(true);
    }
  };

  const leaveRoom = () => {
    socket.emit("leave_room");
    sessionStorage.removeItem("roomId");
    sessionStorage.removeItem("userName");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("// Welcome to CodeColab!\n\nfunction helloWorld() {\n  console.log('Hello, world!');\n}");
    setLanguage("javascript");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("code_change", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    socket.emit("language_change", { roomId, language: newLang });
  };

  if (!joined) {
    return (
      <div className="app">
        <div className="join-container">
          <div className="join-card">
            <h1 className="title">CodeColab</h1>
            <p className="subtitle">Real-time collaborative code editor</p>
            <input
              className="input"
              type="text"
              placeholder="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <input
              className="input"
              type="text"
              placeholder="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <button className="join-btn" onClick={joinRoom}>
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="brand">
          <h1>CodeColab</h1>
        </div>
        <div className="room-info">
          <div className="room-id-container">
            <h2>Room: {roomId}</h2>
            <button className="copy-btn" onClick={copyRoomId}>
              {copySuccess ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        
        <div className="users-list-container">
          <h3>Users in Room</h3>
          <ul className="users-list">
            {users.map((user, index) => (
              <li key={index} className={user === userName ? "current-user" : ""}>
                <div className="user-avatar">{user.charAt(0).toUpperCase()}</div>
                <span className="user-name">{user} {user === userName && <span className="you-badge"> (You)</span>}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="typing-indicator-container">
          <p className={`typing-indicator ${typing ? 'active' : ''}`}>{typing || '\u00A0'}</p>
        </div>
        
        <div className="controls">
          <select 
            value={language} 
            onChange={handleLanguageChange} 
            className="language-selector"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>
          <button className="leave-room" onClick={leaveRoom}>Leave Room</button>
        </div>
      </div>
      <div className="editor-wrapper">
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            wordWrap: "on",
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            padding: { top: 20 },
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          }}
        />
      </div>
    </div>
  );
}
