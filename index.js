import express from "express";
import http from "http";

import config from "./config.js";
import firebase from './firebase.js';
import { collection, updateDoc, getDoc, setDoc, doc, arrayUnion, deleteDoc } from "firebase/firestore";

const app = express();
const port = config.port;

var server = http.createServer(app);

import { Server } from "socket.io";
import { Room, roomConverter } from "./models/room.js";
import { Player, playerConverter } from "./models/player.js";
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
        room.players.push(player);

        try {

            const roomsRef = collection(firebase.firestore, 'rooms').withConverter(roomConverter);
            const roomId = (Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000).toString();
            room.id = roomId;

            console.log("Creating room: " + roomId);
            await setDoc(doc(roomsRef, roomId).withConverter(roomConverter), room);

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

    socket.on("joinRoom", async ({ nickname, roomId }) => {
        try {
            console.log("Joining Room " + roomId);
            if (!roomId.match(/^[0-9]{6}$/)) {
                socket.emit('errorOccurred', 'Please Enter a Valid Room ID.');
                console.log('errorOccurred:', 'Please Enter a Valid Room ID.', roomId)
                return;
            }
            const roomRef = doc(firebase.firestore, 'rooms', roomId).withConverter(roomConverter);
            const roomSnap = await getDoc(roomRef);

            if (!roomSnap.exists()) {
                socket.emit('errorOccurred', 'Room does not exists.');
                console.log('errorOccurred:', 'Room does not exists.', roomId);
                return;
            }

            let room = roomSnap.data();

            if (room.canJoin) {
                let player2 = new Player(nickname, socket.id);
                socket.join(roomId);

                // room.players.push(player2);
                // room.canJoin = false;

                await updateDoc(roomRef, { players: arrayUnion(playerConverter.toFirestore(player2)), canJoin: false });
                const roomSnap = await getDoc(roomRef);

                room = roomSnap.data();

                console.log("Joined Room " + roomId);
                
                io.to(roomId).emit("roomJoined", room);
                io.to(roomId).emit("updatePlayers", room.players);
                io.to(roomId).emit("updateRoom", room);

            } else {
                socket.emit("errorOccurred", 'Game is in Progress.');
                console.log("errorOccurred", 'Game is in Progress.', roomId);
            }
        } catch (e) {
            console.log(e);
        }
    });

    socket.on('destroyRoom', async ({ nickname, roomId }) => {
        try {
            console.log("Destroying Room " + roomId);
            if (!roomId.match(/^[0-9]{6}$/)) {
                socket.emit('errorOccurred', 'Please Enter a Valid Room ID.');
                console.log('errorOccurred:', 'Please Enter a Valid Room ID.', roomId)
                return;
            }
            const roomRef = doc(firebase.firestore, 'rooms', roomId);
            const roomSnap = await getDoc(roomRef);

            if (!roomSnap.exists()) {
                socket.emit('errorOccurred', 'Room does not exists.');
                console.log('errorOccurred:', 'Room does not exists.', roomId);
                return;
            }

            await deleteDoc(roomRef);

            io.to(roomId).emit("leaveRoom", 'deleted');

            
        } catch (e) {
            console.log(e);
        }
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server Started and running on port ${port}`);
});