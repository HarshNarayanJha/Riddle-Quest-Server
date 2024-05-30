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

export default Room;