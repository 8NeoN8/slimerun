export class collisionTile {
  constructor(width, height, posX, posY, type){
    this.width = width,
    this.height = height,
    this.posX = posX,
    this.posY = posY
    this.type = type
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