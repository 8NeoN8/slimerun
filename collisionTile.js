export class collisionTile {
  constructor(width, height, posX, posY){
    this.width = width,
    this.height = height,
    this.posX = posX,
    this.posY = posY
  }

  get borders(){
    return this.getBorders()
  }

  getBorders(){
    let borders = {
      up: this.posY,
      down:this.posY + this.height,
      left: this.posX,
      right: this.posX + this.width
    }
    return borders
  }
}