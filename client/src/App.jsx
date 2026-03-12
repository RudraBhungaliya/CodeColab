import "./App.css";
import { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function App() {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");

  const joinRoom = () => {
    console.log(roomId, userName);
  };

  if (!joined) {
    return (
      <div className="app">
        <div className="join-container">
          <div className="join-card">
            <input
              type="text"
              placeholder="Room Id"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            ></input>

            <input
              type="text"
              placeholder="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            ></input>

            <button className="join-btn" onClick={joinRoom}>
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <></>;
}
