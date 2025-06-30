import {Slime} from './slime.js'

//*DATA
const canvas = document.getElementById('slimerun-game')
const context = canvas.getContext('2d')

let player = new Slime(64,64,10,10,'idle',null)
let playerSpeedX = 6
let playerSpeedY = 6

let gravity = 3

let isGameOn = false

let enemyCollision = true

let playerMovement = {
  up: false,
  down: false,
  left: false,
  right: false
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
    if(playerMovement.left) player.posX -= playerSpeedX
    if(playerMovement.right) player.posX += playerSpeedX
  }
  if(!opositesVertical){
    if(playerMovement.up) player.posY -= playerSpeedY
    if(playerMovement.down) player.posY += playerSpeedY
    if(player.posY < (canvas - player.height)) player.posY += gravity
  }

}


//*Computed


//*Watch
menu_button_start.addEventListener('click', () => {
  main_menu.classList.add('closed')
})

game_state.addEventListener('click', () => {
  isGameOn = !isGameOn
  enemyCollision = !enemyCollision
  window.requestAnimationFrame(gameLoop)
})

document.addEventListener('keydown', (key) => {
  if(key.code == "Escape"){
    if(pause_menu.classList.contains('closed')){
      pause_menu.classList.remove('closed')
      isGameOn = false
    }else{
      pause_menu.classList.add('closed')
      isGameOn = true
      window.requestAnimationFrame(gameLoop)
    }
  }

  if(key.code == "KeyS"){
    playerMovement.down = true
  }

  if(key.code == "KeyW"){
    playerMovement.up = true
  }

  if(key.code == "KeyD"){
    playerMovement.right = true
  }

  if(key.code == "KeyA"){
    playerMovement.left = true
  }
})

document.addEventListener('keyup', (key) => {
  if(key.code == "KeyS"){
    playerMovement.down = false
  }

  if(key.code == "KeyW"){
    playerMovement.up = false
  }

  if(key.code == "KeyD"){
    playerMovement.right = false
  }

  if(key.code == "KeyA"){
    playerMovement.left = false
  }
})

window.addEventListener('resize', () => {
  resizeCanvas()
})

//*Run

resizeCanvas()
clearCanvas()
drawPlayer()

