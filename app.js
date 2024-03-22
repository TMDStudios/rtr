const gameData = {
    "startTime": 0,
    "time": 0,
    "lastBullet": 0,
    "gameOver": true,
    "muzzleFlash": false,
    "message": "Press space to start"
}

const canvas = document.querySelector('canvas');
// canvas.width = window.innerWidth;
canvas.width = 400;
canvas.height = window.innerHeight;
let ctx = canvas.getContext('2d');
const music = new Audio('media/level1.ogg');
const shotSound = new Audio('media/shot.ogg');

const contain = (pos,width,height,isPlayer=false) => {
    if(!isPlayer){
        height=-height;
    }
    if(pos.x<0){
        pos.x=0;
    }else if(pos.x>canvas.width-width){
        pos.x=canvas.width-width;
    }
    if(pos.y<0){
        pos.y=0;
    }else if(pos.y>canvas.height-height){
        pos.y=canvas.height-height;
    }
    return pos;
}

class Player {
    constructor(){
        this.position = {
            x: 110,
            y: 110
        }
        this.velocity = {
            x: 0,
            y: 0
        }

        this.width = 26;
        this.height = 49;

        this.imgX = 144;
        this.imgY = 77;
        this.image = new Image();
        this.image.src = 'media/spritesheet.png';

        this.muzzleX = 246;
        this.muzzleY = 0;
        this.muzzleW = 10;
        this.muzzleH = 12;
    }

    draw(){
        ctx.drawImage(this.image, this.imgX, this.imgY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
        if(gameData["muzzleFlash"]){
            ctx.drawImage(this.image, this.muzzleX, this.muzzleY, this.muzzleW, this.muzzleH, this.position.x+8, this.position.y-8, this.muzzleW, this.muzzleH);
        }
    }

    move(){
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        contain(this.position,this.width,this.height,true);
    }
}

class Bullet {
    constructor(x,y){
        this.position = {
            x: x,
            y: y
        }

        this.width = 4;
        this.height = 10;

        this.imgX = 251;
        this.imgY = 119;
        this.image = new Image();
        this.image.src = 'media/spritesheet.png';
    }

    draw(){
        ctx.drawImage(this.image, this.imgX, this.imgY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
    }

    move(){
        this.position.y -= 4;
        if(this.position.y<0){
            bullets.shift();
        }
    }
}

class Enemy {
    constructor(){
        this.position = {
            x: Math.floor(Math.random() * canvas.width-25),
            y: 0
        }

        this.distance = {
            x: 0,
            y: 0
        }

        this.width = 25;
        this.height = 38;

        this.imgX = 106;
        this.imgY = 32;
        this.image = new Image();
        this.image.src = 'media/spritesheet.png';
    }

    draw(){
        ctx.drawImage(this.image, this.imgX, this.imgY, this.width, this.height, this.position.x, this.position.y, this.width, this.height);
    }

    move(){
        this.position.y++;
        if(this.position.y>canvas.height+this.height){
            this.position.x = Math.floor(Math.random() * canvas.width-25);
            this.position.y=-this.height*5;
        }
        
        this.distance.y = this.position.y-player.position.y;

        if(this.distance.y>-150){
            if(this.distance.y<50){
                this.distance.x = this.position.x-player.position.x;
                if(this.distance.x>0){
                    if(this.distance.y%10==0){
                        this.position.x-=1;
                    }
                }else{
                    if(this.distance.y%10==0){
                        this.position.x+=1;
                    }
                }
            }
        }

        contain(this.position,this.width,this.height);
    }
}

const keys = {
    "up": false,
    "down": false,
    "left": false,
    "right": false,
    "space": false
}

const enemies = [new Enemy(),new Enemy(),new Enemy()];

const bullets = [];

const handleKeys = _ => {
    if(keys["up"]){
        player.velocity.y=-2;
    }else if(keys["down"]){
        player.velocity.y=2;
    }else{
        player.velocity.y=0;
    }
    if(keys["left"]){
        player.velocity.x=-2;
    }else if(keys["right"]){
        player.velocity.x=2;
    }else{
        player.velocity.x=0;
    }
    if(keys["space"]){
        if(gameData["time"]-gameData["lastBullet"]>100){
            bullets.push(new Bullet(player.position.x+11, player.position.y));
            shotSound.currentTime=0;
            shotSound.play();
            gameData["muzzleFlash"] = true;
            gameData["lastBullet"]=gameData["time"];
        }
    }
}

const update = _ => {
    player.move();
    for(let i=0; i<bullets.length; i++){
        bullets[i].move();
    }
    for(let i=0; i<enemies.length; i++){
        enemies[i].move();
    }
}

const draw = _ => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.draw();
    for(let i=0; i<bullets.length; i++){
        bullets[i].draw();
    }
    for(let i=0; i<enemies.length; i++){
        enemies[i].draw();
    }
}

const gameLoop = _ => {
    gameData["time"] = new Date()-gameData["startTime"];
    gameData["muzzleFlash"] = false;
    handleKeys();
    update();
    draw();
    
    if(!gameData["gameOver"]){
        requestAnimationFrame(gameLoop);
    }else{
        music.pause();
    }
}

document.addEventListener('keydown', e => {
    if(e.key === 'ArrowLeft'){
        keys["left"] = true;
    }
    if(e.key === 'ArrowRight'){
        keys["right"] = true;
    }
    if(e.key === 'ArrowUp'){
        keys["up"] = true;
    }
    if(e.key === 'ArrowDown'){
        keys["down"] = true;
    }
    if(e.key === ' '){
        if(gameData["gameOver"]){
            gameData["gameOver"]=false;
            music.play();
            gameLoop();
        }
        keys["space"] = true;
    }
    if(e.key === 'q'){
        gameData["gameOver"] = true;
    }
});

document.addEventListener('keyup', e => {
    if(e.key === 'ArrowLeft'){
        keys["left"] = false;
    }
    if(e.key === 'ArrowRight'){
        keys["right"] = false;
    }
    if(e.key === 'ArrowUp'){
        keys["up"] = false;
    }
    if(e.key === 'ArrowDown'){
        keys["down"] = false;
    }
    if(e.key === ' '){
        keys["space"] = false;
    }
});

gameData["startTime"] = new Date();
const player = new Player();

gameLoop();