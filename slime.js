export class Slime {
  constructor(width, height, posX, posY, state, effect){
    this.width = width,
    this.height = height,
    this.posX = posX,
    this.posY = posY,
    this.state = state
    this.effect = effect
  }

  get name(){
    return this.sayName()
  }

  sayName(){
    return 'Rimuru'
  }
}