import React from "react";
import { useState, useEffect, useRef } from "react";
import "./App.css";
import io from "socket.io-client";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Peer from "simple-peer";

const socket = io.connect("http://localhost:5000");

const App = () => {
  const [me, setMe] = useState("");
  const [name, setName] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState();
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState();
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        myVideo.current.srcObject = stream;
      });

    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("callUser", (data) => [
      setReceivingCall(true),
      setCaller(data.from),
      setName(data.name),
      setCallerSignal(data.signal),
    ]);
  }, []);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });

    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal = signal;
    });
    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });
    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destoy();
  };
  return (
    <div className="page">
      <div className="header-container">
        <div className="header">
          <p className="header-text">Z-Connect</p>
        </div>
      </div>
    </div>
  );
};

export default App;
