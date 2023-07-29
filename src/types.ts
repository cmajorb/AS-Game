export type GameState = {
    world: string,
    playerList: { [key: string]: PlayerType },
    items: { [key: string]: Item },
    creatures: { [key: string]: Creature }
  }

  export type GameStates = {
    allGameStates: { [key: string]: GameState }
  }
  
  export type  PlayerType = {
    playerId: string,
    x: number,
    y: number,
    type: string,
    health: number,
    money: number,
    name: string,
    inventory: Item[]
  }
  
  export type  Item = {
    id: number,
    x: number,
    y: number,
    type: string,
    quantity: number
  }
  
  export type  Creature = {
    id: number,
    x: number,
    y: number,
    type: string,
    health: number
  }