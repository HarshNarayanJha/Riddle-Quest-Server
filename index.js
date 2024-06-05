import express from "express";
import http from "http";
import fs from "fs";

import config from "./config.js";
import firebase from './firebase.js';
import gemini from './gemini.js';
import { collection, updateDoc, getDoc, setDoc, doc, arrayUnion, deleteDoc, increment } from "firebase/firestore";
import { deleteObject, ref, uploadBytes } from "firebase/storage";

const app = express();
const port = config.port;

var server = http.createServer(app);

import { Server } from "socket.io";
import { Room, roomConverter } from "./models/room.js";
import { Player, playerConverter } from "./models/player.js";
import { randomUUID } from "crypto";
const io = new Server(server);

// middle ware
app.use(express.json());

io.on("connection", (socket) => {
    console.log("socket.io connected to " + socket.id);

    socket.on("createRoom", async ({ nickname }) => {
        console.log(nickname);
        // create a Room
        let room = new Room();
        let player = new Player(nickname, socket.id, 0, 0);
        room.playerRoom = player;

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

                // Obselete
                // room.players.push(player2);
                // room.canJoin = false;

                await updateDoc(roomRef, { playerOther: playerConverter.toFirestore(player2), canJoin: false });
                const roomSnap = await getDoc(roomRef);

                room = roomSnap.data();

                console.log("Joined Room " + roomId);

                io.to(roomId).emit("roomJoined", room);
                io.to(roomId).emit("updatePlayers", [room.playerRoom, room.playerOther]);
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
                console.log('errorOccurred:', 'Please Enter a Valid Room ID.', roomId);
                io.to(roomId).emit("leaveRoom", 'deleted');
                return;
            }

            const imagesRef = ref(firebase.storage, `${roomId}/`);

            deleteObject(imagesRef).then(() => {
                console.log(`Delete all image files under ${roomId}/`);
            }).catch((error) => {
                console.log(`${error} in deleting images`);
            });

            const roomRef = doc(firebase.firestore, 'rooms', roomId);
            const roomSnap = await getDoc(roomRef);

            if (!roomSnap.exists()) {
                socket.emit('errorOccurred', 'Room does not exists.');
                console.log('errorOccurred:', 'Room does not exists.', roomId);
                io.to(roomId).emit("leaveRoom", 'deleted');
                return;
            }

            await deleteDoc(roomRef);

            io.to(roomId).emit("leaveRoom", 'deleted');


        } catch (e) {
            console.log(e);
        }
    });

    socket.on('startScan', async ({ environmentType, roomId }) => {
        console.log("Starting Scan " + roomId);
        if (!roomId.match(/^[0-9]{6}$/)) {
            socket.emit('errorOccurred', 'Please Enter a Valid Room ID.');
            console.log('errorOccurred:', 'Please Enter a Valid Room ID.', roomId)
            return;
        }
        const roomRef = doc(firebase.firestore, 'rooms', roomId);
        let roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            socket.emit('errorOccurred', 'Room does not exists.');
            console.log('errorOccurred:', 'Room does not exists.', roomId);
            return;
        }

        await updateDoc(roomRef, { gameStarted: true, environmentType: environmentType });
        roomSnap = await getDoc(roomRef);

        const room = roomSnap.data();

        console.log("Started Scanning " + roomId);

        io.to(roomId).emit("scanStarted", room);
    });

    socket.on('scanImage', async ({ image, roomId, didCreateRoom }) => {
        console.log("Scanned Image " + roomId);
        if (!roomId.match(/^[0-9]{6}$/)) {
            socket.emit('errorOccurred', 'Please Enter a Valid Room ID.');
            console.log('errorOccurred:', 'Please Enter a Valid Room ID.', roomId)
            return;
        }
        const roomRef = doc(firebase.firestore, 'rooms', roomId);
        let roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            socket.emit('errorOccurred', 'Room does not exists.');
            console.log('errorOccurred:', 'Room does not exists.', roomId);
            return;
        }

        console.log(socket.id);

        if (didCreateRoom) {
            await updateDoc(roomRef, { "playerRoom.imagesDone": increment(1) });
        } else {
            await updateDoc(roomRef, { "playerOther.imagesDone": increment(1) });
        }

        roomSnap = await getDoc(roomRef);
        var room = roomSnap.data();

        if (room.playerRoom.imagesDone === 5) {

            if (room.playerOther.imagesDone === 5) {
                await updateDoc(roomRef, { scanningFinished: true });
            }
            // socket.emit("finishedScan", room);

        } else if (room.playerOther.imagesDone === 5) {

            if (room.playerRoom.imagesDone == 5) {
                await updateDoc(roomRef, { scanningFinished: true });
            }
            // socket.emit("finishedScan", room);
        }

        // const imageRef = ref(firebase.storage, `${roomId}/${didCreateRoom ? 'playerRoom' : 'playerOther'}/${randomUUID()}.jpg`);
        // const metadata = {
        //     contentType: 'image/jpeg',
        // };

        // uploadBytes(imageRef, image, metadata).then((snapshop) => {
        //     console.log(snapshop);
        // });

        // const uploadResult = await gemini.fileManager.uploadFile("image.jpg", {
        //     mimeType: "image/jpeg",
        //     displayName: "Sample drawing",
        // });


        const prompt = config.generator_prompt;
        const imageData = {
            inlineData: {
                data: Buffer.from(image).toString("base64"),
                mimeType: "image/jepg",
            },
        };

        const result = await gemini.model.generateContent([imageData, prompt]);
        console.log(result.response.text());

        const data = JSON.parse(result.response.text().replace("```json", '').replace("```", ''));

        roomSnap = await getDoc(roomRef);
        room = roomSnap.data();

        console.log("Emitting with data");

        socket.emit("scannedImage", { 'players': [room.playerRoom, room.playerOther], 'riddle': { 'item': data['item'], 'riddle': data['riddle'] } });

        // fs.writeFile("test.jpg", image, "binary", () => { });
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Server Started and running on port ${port}`);
});