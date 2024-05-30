import { playerConverter } from "./player.js";

class Room {
    constructor(id, occupancy = 2, players, canJoin = true, scanningFinished = false, gameStarted = false) {
        this.id = id;
        this.occupancy = occupancy;
        this.players = players;
        this.canJoin = canJoin;
        this.scanningFinished = scanningFinished;
        this.gameStarted = gameStarted;
    }
}

const roomConverter = {
    toFirestore: (room) => {
        return {
            id: room.id,
            occupancy: room.occupancy,
            players: room.players.map(p => playerConverter.toFirestore(p)),
            canJoin: room.canJoin,
            scanningFinished: room.scanningFinished,
            gameStarted: room.gameStarted,
        };
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return new Room(data.id, data.occupancy, data.players, data.canJoin, data.scanningFinished, data.gameStarted);
    }
};

export { Room, roomConverter };