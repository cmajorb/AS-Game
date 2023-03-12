import { PlayerType, GameState } from '../types'

export function clientConnection(io: any) {

  const gameState = { playerList: {}, items: {}, creatures: {}, world : "test" } as GameState ;

  io.on('connection', function (socket) {
    console.log('a user connected');
    let newPlayer = {
      playerId: socket.id,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      type: (Math.floor(Math.random() * 2) == 0) ? 'alien1' : 'alien2',
      health: 3,
      money: 0,
      name: "bob",
      inventory: []
    } as PlayerType;
    gameState.playerList[socket.id] = newPlayer;
    // send the players object to the new player
  // socket.emit('currentPlayers', gameState.playerList);

  socket.emit('setState', gameState);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', gameState.playerList[socket.id]);
    // GameCommunication(io, socket, currentUsers)  
    
    //remove the users data when they disconnect.
    socket.on('disconnect', function () {
      console.log('user disconnected');

    // remove this player from our players object
    delete gameState.playerList[socket.id];
    // emit a message to all players to remove this player
    io.emit('player_disconnect', socket.id);
    });

    socket.on('playerMovement', function (movementData) {
      gameState.playerList[socket.id].x = movementData.x;
      gameState.playerList[socket.id].y = movementData.y;
      // emit a message to all players about the player that moved
      socket.broadcast.emit('playerMoved', gameState.playerList[socket.id]);
    });

  })
  }


 