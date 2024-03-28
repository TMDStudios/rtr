const gameData = {
    "startTime": 0,
    "time": 0,
    "lastBullet": 0,
    "gameOver": true,
    "muzzleFlash": false,
    "message": "Press 'a' to start",
    "lastMessage": 0,
    "soundVolume": 1
}

const canvas = document.querySelector('canvas');
// canvas.width = window.innerWidth;
canvas.width = 400;
canvas.height = window.innerHeight;
let ctx = canvas.getContext('2d');
ctx.font = '32px Arial';
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
const music = new Audio('media/level1.ogg');
const shotSound = new Audio('media/shot.ogg');
const enemySound = new Audio('media/enemy.ogg');
const playerSound = new Audio('media/player.ogg');
const sounds = [shotSound, enemySound, playerSound];

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
            x: 200,
            y: 600
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

        contain(this.position,this.width,this.height);
    }
}

class Explosion {
    constructor(x,y){
        this.position = {
            x: x,
            y: y
        }

        this.currentFrame = 0;
        this.spriteLoc = [[106,0],[106,0],[106,0],[138,13],[138,13],[170,13],[170,13],[163,45],[170,13],[170,13],[138,13],[138,13],[106,0],[106,0]];
        this.width = 32;
        this.height = 32;

        this.image = new Image();
        this.image.src = 'media/spritesheet.png';
    }

    draw(){
        if(this.currentFrame<14){
            ctx.drawImage(this.image, 
                this.spriteLoc[this.currentFrame][0], 
                this.spriteLoc[this.currentFrame][1], 
                this.width, this.height, this.position.x, this.position.y, this.width, this.height);
            this.currentFrame++;
        }else{
            explosions.shift();
        }
    }
}

const detectCollisions = _ => {
    let bulletsToRemove = [];
    let enemiesToRemove = [];
    for(let i=bullets.length-1; i>=0; i--){
        for(let j=enemies.length-1; j>=0; j--){
            if(bullets[i].position.y<=enemies[j].position.y+enemies[j].height
                &&bullets[i].position.y+bullets[i].height>=enemies[j].position.y
                &&bullets[i].position.x>=enemies[j].position.x
                &&bullets[i].position.x<enemies[j].position.x+enemies[j].width){
                explosions.push(new Explosion(enemies[j].position.x, enemies[j].position.y));
                enemySound.currentTime=0;
                enemySound.play();
                bulletsToRemove.push(i);
                enemiesToRemove.push(j);
            }
        }
    }
    for(let i=enemies.length-1; i>=0; i--){
        enemies[i].distance.y = enemies[i].position.y-player.position.y;

        if(enemies[i].distance.y>-player.height*3){
            if(enemies[i].distance.y<player.height){
                enemies[i].distance.x = enemies[i].position.x-player.position.x;
                if(enemies[i].distance.x>0){
                    if(enemies[i].distance.y%10==0){
                        enemies[i].position.x-=1;
                    }
                }else{
                    if(enemies[i].distance.y%10==0){
                        enemies[i].position.x+=1;
                    }
                }
                if(enemies[i].position.y+enemies[i].height>=player.position.y
                    &&enemies[i].position.x+enemies[i].width>=player.position.x
                    &&enemies[i].position.x<=player.position.x+player.width){
                    explosions.push(new Explosion(player.position.x, player.position.y));
                    player.position.x=0; // Handle this later
                    playerSound.play();
                    enemiesToRemove.push(i);
                }
            }
        }
    }
    for(let i=0; i<enemiesToRemove.length; i++){
        enemies.splice(enemiesToRemove[i],1);
    }
    enemiesToRemove=[];
    for(let i=0; i<bulletsToRemove.length; i++){
        bullets.splice(bulletsToRemove[i],1);
    }
    bulletsToRemove=[];
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
const explosions = [];

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
        if(gameData["time"]-gameData["lastBullet"]>250){
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
    detectCollisions();
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
    for(let i=0; i<explosions.length; i++){
        explosions[i].draw();
    }
    if(gameData["gameOver"]){
        ctx.fillText(gameData["message"], canvas.width/2, canvas.height/2);
    }else{
        if(gameData["lastMessage"]>gameData["time"]){
            ctx.fillText(`Vol ${gameData["soundVolume"]}`, canvas.width/2, canvas.height/2);
        }
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
        keys["space"] = true;
    }
    if(e.key === 'q'){
        gameData["gameOver"] = true;
    }
    if(e.key === 'a'){
        if(gameData["gameOver"]){
            gameData["gameOver"]=false;
            // music.play();
            gameLoop();
        }
    }
    if(e.key === 'n'){
        enemies.push(new Enemy());
    }
    if(e.key === 'v'){
        gameData["soundVolume"]++;
        if(gameData["soundVolume"]>3){
            gameData["soundVolume"]=0;
        }
        for(let i=0; i<sounds.length; i++){
            switch(gameData["soundVolume"]){
                case 0:
                    sounds[i].volume=0;
                    break;
                case 1:
                    sounds[i].volume=0.33;
                    break;
                case 2:
                    sounds[i].volume=0.66;
                    break;
                default:
                    sounds[i].volume=1;
                    break;
            }
        }
        gameData["lastMessage"]=gameData["time"]+500;
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