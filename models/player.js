class Player {
    constructor(nickname, socketId, points = 0, imagesDone = 0) {
        this.nickname = nickname;
        this.socketId = socketId;
        this.points = points;
        this.imagesDone = imagesDone;
    }
}

const playerConverter = {
    toFirestore: (player) => {
        return {
            nickname: player.nickname,
            socketId: player.socketId,
            points: player.points,
            imagesDone: player.imagesDone,
        };
    },
    fromFirestore: (snapshot, options) => {
        const data = snapshot.data(options);
        return new Player(data.nickname, data.socketId, data.points, data.imagesDone);
    }
};

export {Player, playerConverter};