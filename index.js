import express from "express";
import http from "http";

import config from "./config.js";
import firebase from './firebase.js';
import { collection, addDoc, getDoc, setDoc, doc } from "firebase/firestore";

const app = express();
const port = config.port;

var server = http.createServer(app);

import { Server } from "socket.io";
import Room from "./models/room.js";
import Player from "./models/player.js";
const io = new Server(server);

// middle ware
app.use(express.json());

// firestore

// const querySnapshot = await getDocs(collection(firebase.firestore, "rooms"));
// querySnapshot.forEach((doc) => {
//     console.log(`${doc.id} => ${doc.data()['player1']}`);
// });


io.on("connection", (socket) => {
    console.log("socket.io connected");

    socket.on("createRoom", async ({ nickname }) => {
        console.log(nickname);
        // create a Room
        let room = new Room();
        let player = new Player(nickname, socket.id, 0, 0);
        room.players = [];
        const {...firebasePlayer} = player;
        room.players.push(firebasePlayer);

        const {...firestoreRoom} = room;

        try {

            const roomsRef = collection(firebase.firestore, 'rooms');
            const roomId = (Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000).toString();
            firestoreRoom.id = roomId;
            
            console.log("Creating room: " + roomId);
            await setDoc(doc(roomsRef, roomId), firestoreRoom);

            // get the created room
            const roomRef = doc(firebase.firestore, 'rooms', roomId);
            const roomSnap = await getDoc(roomRef);

            console.log("Room create with ID: ", roomId);
            console.log("Room Data: ", roomSnap.data());

            socket.join(roomId);

            // tell the app to go to next page
            io.to(roomId).emit('roomCreated', roomSnap.data());

        } catch (e) {
            console.log("Error creating room: ", e);
        }

    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server Started and running on port ${port}`);
});