import {Slime} from './slime.js'

//*DATA
const canvas = document.getElementById('slimerun-game')
const context = canvas.getContext('2d')
resizeCanvas()

let statesArray = [
  {
    type: 'idle',
    framesTotal: 24,
    framecount: 0
  },
  {
    type: 'jumping',
    framesTotal: 24,
    framecount: 0
  },
  {
    type: 'falling',
    framesTotal: 4,
    framecount: 0
  },
  {
    type: 'sliding',
    framesTotal: 4,
    framecount: 0
  },
  {
    type: 'moving',
    framesTotal: 24,
    framecount: 0
  },
  {
    type: 'running',
    framesTotal: 24,
    framecount: 0
  },
]
let playerSquare = 32
let player = new Slime(playerSquare, playerSquare, 0, canvas.height - playerSquare, statesArray[0], null)
let playerSpeedX = 6
let playerSpeedY = 6

let gravity = 16

let isGameOn = false

let enemyCollision = true

let playerMovement = {
  up: false,
  down: false,
  left: false,
  right: false,
  jump: false,
}
let opositesVertical = false
let opositesHorizontal = false

//*Methods
function clearCanvas(){
  context.clearRect(0,0,player.width,player.height);
}

function drawPlayer(){
  context.fillStyle = 'black';
  context.fillRect(player.posX,player.posY,player.width,player.height);
}

function resizeCanvas(){
  canvas.width =  window.innerWidth
  canvas.height = window.innerHeight - 3.0001
  console.log(canvas.width, canvas.height);
}

function drawCanvas(){
  context.beginPath();
  context.fillStyle='rgb(142, 213, 239)';
  context.fillRect(0,0,canvas.width, canvas.height);
}

function gameLoop(){
  if(isGameOn){
    clearCanvas()
    updatePlayer()
    drawCanvas()
    drawPlayer()

    if(!enemyCollision) window.requestAnimationFrame(gameLoop)
    return
  }
  
}

function updatePlayer(){
  opositesVertical = false
  opositesHorizontal = false
  if(playerMovement.up && playerMovement.down) opositesVertical = true
  if(playerMovement.left && playerMovement.right) opositesHorizontal = true

  if(!opositesHorizontal){

    if(playerMovement.left){
      if(isPlayerInBounds('left')){
        player.posX = 0
      }else player.posX -= playerSpeedX
      
    }

    if(playerMovement.right){
      if(isPlayerInBounds('right')){
        player.posX = canvas.width - player.width
      }else player.posX += playerSpeedX
    }
  }

  if(!opositesVertical){
    if(playerMovement.up){
      if(isPlayerInBounds('up')){
        player.posY = 0
      }else player.posY -= playerSpeedY
    }
    if(playerMovement.down){
      if(isPlayerInBounds('down')){
         player.posY = canvas.height - player.height
      }else  player.posY += playerSpeedY
    }
    //if(player.posY < (canvas - player.height)) player.posY += gravity
  }
}

function isPlayerInBounds(bound){
  if(bound == 'left'){
    if(player.posX - playerSpeedX <= 0) return true
  }
  if(bound == 'right'){
    if(player.posX + playerSpeedX >= canvas.width - player.width) return true
  }
  if(bound == 'up'){
    if(player.posY - playerSpeedY <= 0) return true
  }
  if(bound == 'down'){
    if(player.posY + playerSpeedY >= canvas.height - player.height) return true
  }
}

//*Watch
menu_button_start.addEventListener('click', () => {
  main_menu.classList.add('closed')
})

game_state.addEventListener('click', () => {
  isGameOn = true
  enemyCollision = false
  window.requestAnimationFrame(gameLoop)
})

document.addEventListener('keydown', (key) => {
  /* if(key.code == "Escape"){
    if(pause_menu.classList.contains('closed')){
      pause_menu.classList.remove('closed')
      isGameOn = false
    }else{
      pause_menu.classList.add('closed')
      isGameOn = true
      window.requestAnimationFrame(gameLoop)
    }
  } */

  if(key.code == "KeyS") playerMovement.down = true

  if(key.code == "KeyW") playerMovement.up = false

  if(key.code == "KeyD") playerMovement.right = true

  if(key.code == "KeyA") playerMovement.left = true

  if(key.code == 'Space') playerMovement.jump = true;
})

document.addEventListener('keyup', (key) => {
  if(key.code == "KeyS") playerMovement.down = false

  if(key.code == "KeyW") playerMovement.up = false

  if(key.code == "KeyD") playerMovement.right = false

  if(key.code == "KeyA") playerMovement.left = false

  
})

window.addEventListener('resize', () => {
  resizeCanvas()
})

//*Run
resizeCanvas()
clearCanvas()
drawPlayer()

