class Player {
    constructor(nickname, socketId, points, imagesDone) {
        this.nickname = nickname;
        this.socketId = socketId;
        this.points = points;
        this.imagesDone = imagesDone;
    }
}

export default Player;