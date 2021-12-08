import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate} from 'react-router-dom';
//import Form from "react-bootstrap/Form";
//import Button from "react-bootstrap/Button";
import "../styles/Game.css";
import axios from "axios";
import * as constants from './Constants';
//import { useLocation } from "react-router";
import 'react-chatbox-component/dist/style.css';
import { ChatBox } from 'react-chatbox-component';
import io from "socket.io-client";
//import $ from "jquery";
import useToken from "../components/useToken";
import { Modal } from "react-bootstrap"
import Button from "react-bootstrap/Button";
import "bootstrap/dist/css/bootstrap.min.css"
import $ from 'jquery';
import Confetti from 'react-dom-confetti';



export default function Game() {
  // Variables
  // Get User and Token
  const { token, user } = useToken();
  const navigate = useNavigate();
  const [mount, setMount] = useState({});
  const [messages, setMessages] = useState([]);
  const [card, setCard] = useState([]);
  const [startVisible, setStartVisible] = useState(true);
  const [disableStart, setDisableStart] = useState(false);
  const [waitVisible, setWaitVisible] = useState(false);
  let initialGameState = 0;
  const { state } = useLocation();
  const { roomID } = state;
  const turn = useRef(false)
  let count = 0;
  const [playerTurn, setPlayerTurn] = useState("");
  let pointArray = [];
  const userObj = {
    uid: user
  }
  // Config object for the confetti
  const config = {
    angle: "213",
    spread: 360,
    startVelocity: 40,
    elementCount: "200",
    dragFriction: 0.12,
    duration: 3000,
    stagger: "5",
    width: "10px",
    height: "10px",
    perspective: "500px",
    colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
  };
  const [activeConfetti, setActiveConfetti] = useState(false);
  // Initialize Webssockets
  let chatSocket = useRef();
  let gameSocket = useRef();
  //Modal Data
  const [show, setShow] = useState(false);
  // Message array for chatbox
  const [message, setMessage] = useState("")
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleMessage = (text) => setMessage(text)
  //const { state } = useLocation();

  // Code that is run immediately 
  useEffect(() => {
    // connect to sockets
    startWebSocket();
    // Wait about a second to connect to websockets since they just
    // got created in the backend
    setTimeout(() => {
      // Connect to web sockets
      chatSocket.current = io("http://localhost:3003/chat/" + roomID);
      gameSocket.current = io("http://localhost:3003/game/" + roomID);
      // Add to message array when recieving a message
      chatSocket.current.on("text", (message) => {
        setMessages(array => [...array, message])
      })
      // On start
      gameSocket.current.on("start", (start) => {
        // disable start button
        setStartVisible(false);
        if (initialGameState === 0) {
          // Load the game state
          SetGameState(start);
          initialGameState++;
        }

      })
      // On win, show which user won 
      gameSocket.current.on("win", (username) => {
        handleMessage(`${username} wins!!!`)
        handleShow();
        // Shower with confetti
        setActiveConfetti(true)
        setTimeout(() => {
          navigate("/")
        }, 5000)
      })
      // On update, updatehe game state
      gameSocket.current.on("update", (data) => {
        SetGameState(data)
      })
    }, 1500);
    return () => { setMount({}); }
  }, [])

  // Code to initialize chat web socket
  async function startWebSocket() {
    try {
      console.log("roomID: ", roomID)
      await axios.post(constants.HOST + "/initialize", { roomID: roomID }, {
        headers: {
          "Authorization": "Bearer " + token
        }
      });
      //setUser(await jwtDecode(token).username);
    } catch (error) {
      handleMessage("Couldn't Connect To Socket. Try Refreshing the Page.")
      handleShow();
    }
  }

  // Code that is called when chat is sent. Sends chat to API
  const handleChat = async (message) => {
    try {
      console.log("roomID: ", roomID)
      await axios.post(constants.HOST + "/sendChat", {
        roomID: roomID,
        message: message
      }, {
        headers: {
          "Authorization": "Bearer " + token
        }
      });
    } catch (error) {
      console.log(error)
      handleMessage("Couldn't Send Chat Message. Try Again!")
      handleShow();
    }
  }

  // Code called when Start Game button is clicked
  async function handleStart() {
    try {
      await axios.put(constants.HOST + "/start/" + roomID, {}, {
        headers: {
          "Authorization": "Bearer " + token
        }
      });
      // Disable the start button
      setDisableStart(true);
      // Display message that you're waiting for the other person to continue
      setWaitVisible(true);
    } catch (error) {
      console.log(error)
      handleMessage("Couldn't Start Game. Try Again!")
      handleShow();
    }
  }

  function SetGameState(obj) {
    // Create CardArray
    let responseCard;
    if (obj.cards) {
      console.log("in Cards: ", obj.cards)
      setCard([])
      for (let i = 0; i < obj.cards.length; i++) {
        // Hide cards if the cards have already been matched
        const disabled = {
        }
        if (!obj.cards[i].active) {
          disabled["visibility"] = "hidden";
        }
        // Create card
        responseCard = <div key={obj.cards[i].key} style={disabled} className="cardContainer">
          <div id={obj.cards[i].key} className="card" onClick={(e) => flip(e)}>
            <div className="front">
              <svg xmlns="http://www.w3.org/2000/svg" height="100" width="100" >
                <image className="Card" href="/img/castle.svg" height="100" width="100" />
              </svg>
            </div>
            <div className="back">
              <svg xmlns="http://www.w3.org/2000/svg" height="100" width="100" >
                <image className="Card" href={"/img/" + obj.cards[i].key + ".svg"} height="100" width="100" />
              </svg>
            </div>
          </div>
        </div>
        setCard(array => [...array, responseCard])
      }
    }
    // set turn
    if (obj.users) {
      if (obj.users.filter(userObj => userObj.userID === user)) {
        turn.current = obj.users.filter(userObj => userObj.userID === user)[0].turn
      }
      // Set who's turn it is in string form
      if (obj.users.filter(userObj => userObj.turn === true)[0]) {
        setPlayerTurn(obj.users.filter(userObj => userObj.turn === true)[0].userID.split("#")[0])
      }
    }
  }
  // Responsible for flipping the cards
  function flip(event) {
    //increment count flip
    console.log(turn.current)
    if (turn.current) {
      count += 1;
      const id = event.target.parentNode.parentNode.parentNode.id;
      // On first flip
      if (count === 1) {
        // Add id to array
        pointArray.push(parseInt(id));
        // Disable then flip the card
        $(`#${id}`).css("pointer-events", "none")
        $(`#${id}`).toggleClass('flipped');
      }
      // On second flip
      if (count === 2) {
        // Add id to array
        pointArray.push(parseInt(id))
        $(`#${id}`).css("pointer-events", "none")
        $(`#${id}`).toggleClass('flipped');
        // If cards match, disable immediately
        verifyFlip().then(match => {
          console.log(match)
          // If the cards dont match
          if (!match) {
            // Enable the cards
            for (const card of pointArray) {
              $(`#${card}`).css("pointer-events", "")
            }
            // Flip the cards back over
            setTimeout(() => {
              for (const card of pointArray) {
                $(`#${card}`).toggleClass("flipped")
              }
              count = 0;
              pointArray = [];
            }, 1000)
          } else {
            // If the cards match, the gamestate will be updated
            count = 0;
            pointArray = [];
          }
        }).catch((error) => {
          console.log(error)
        })
      }
    }
  };

  // This function will send a request to check if the
  // cards the user sent matches.
  async function verifyFlip() {
    // check if it's user's turn
    try {
      const response = await axios.put(constants.HOST + "/room/points", { roomID: roomID, points: pointArray }, {
        headers: {
          "Authorization": "Bearer " + token
        }
      });
      return response.data.match;
    } catch (error) {
      console.log(error)
    }
  }

  // HTML
  return (
    <div id="container">
      <Confetti active={activeConfetti} config={config} />
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Message</Modal.Title>
        </Modal.Header>
        <Modal.Body>{message}</Modal.Body>
        <Modal.Footer>
          <Button variant="Primary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      {startVisible ?
        <div className="startGame">
          <h3>RoomID: {roomID}</h3>
          {waitVisible ? <h4>Waiting for other person to start the game...</h4> : null}
          <Button onClick={handleStart} disabled={disableStart}>Start Game</Button>
        </div> : null}
      {!startVisible ? <div className="Game">
        <h3>It's {playerTurn}'s turn</h3>
        {/* <img src="/img/abstract_scene.svg" className="Card" height="200" width="150"/> */}
        {/* <svg id="Container" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 285 50">
          <rect height="200" width="300" />
        </svg> */}
        {card}
      </div> : null}
      <div className="Chat">
        <h3>Chat</h3>
        <ChatBox messages={messages} user={userObj} onSubmit={handleChat} />
      </div>
    </div>
  );
}