import { playerConverter } from "./player.js";

class Room {
    constructor(id, playerRoom, playerOther, canJoin = true, gameStarted = false, environmentType = -1, scanningFinished = false) {
        this.id = id;
        this.playerRoom = playerRoom;
        this.playerOther = playerOther;
        this.canJoin = canJoin;
        this.gameStarted = gameStarted;
        this.environmentType = environmentType;
        this.scanningFinished = scanningFinished;
    }
}

const roomConverter = {
    toFirestore: (room) => {
        return {
            id: room.id,
            playerRoom: playerConverter.toFirestore(room.playerRoom),
            playerOther: (room.playerOther != null) ? playerConverter.toFirestore(room.playerOther) : null,
            canJoin: room.canJoin,
            gameStarted: room.gameStarted,
            environmentType: room.environmentType,
            scanningFinished: room.scanningFinished,
        };
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return new Room(data.id, data.playerRoom, data.playerOther, data.canJoin, data.gameStarted, data.environmentType, data.scanningFinished);
    }
};

export { Room, roomConverter };