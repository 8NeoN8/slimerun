import { collisionTile } from "./collisionTile.js"
export class Slime extends collisionTile{
  constructor(width, height, posX, posY, state, effect){
    super(width, height, posX, posY)
    this.state = state
    this.effect = effect
  }
}