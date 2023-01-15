const pauseScreen = document.getElementById("pauseMenu");
const winScreen = document.getElementById("winMenu");
const gameOverScreen = document.getElementById("gameOverMenu");
const timerScreen = document.getElementById("timer");
const scoreScreen = document.getElementById("score");

const shipImgPath = "./images/shooter.png";
const invaderImgPath = "./images/invader.png";

const INVADER_ROWS = 3;
const INVADER_COLUMNS = 6;

let isGameOver = false;
let isWin = false;
let isPause = false;

let sec = 0;
let min = 0;
timerScreen.innerText = `0:0`;

//Timer function counts time since starting of game
function Timer() {
    if (!isGameOver && !isWin && !isPause) {
        sec++;
        if (sec === 60) {
            min++;
            sec = 0;
        }
    }
    timerScreen.innerText = `${min}:${sec}`;
}

//runs Timer function each one second repeatedly
intervalId = setInterval(Timer, 1000);

//class Entity consists method of subclasses
class Entity {
    constructor({ tag = "div", className = "" } = {}) {
        this.el = document.createElement(tag);
        document.body.appendChild(this.el);
        this.el.className = "entity " + className;
    }

    setX(x) {
        this.x = x;
        this.el.style.left = `${this.x}px`;
    }

    setY(y) {
        this.y = y;
        this.el.style.top = `${this.y}px`;
    }

    remove() {
        this.el.remove();
        this.el = null;
    }
}

//class Ship subclass of Entity
//consists itself method for Ship
class Ship extends Entity {
    constructor({ removeLife, getOverlappingBullet, removeBullet }) {
        super({ tag: "img" });
        this.el.src = shipImgPath;
        document.body.appendChild(this.el);

        this.SPEED = 8;
        this.CanShoot = true;
        this.isAlive = true;

        this.removeLife = removeLife;
        this.getOverlappingBullet = getOverlappingBullet;
        this.removeBullet = removeBullet;

        this.spawn();
    }
    //spawns Spip - bottom of the screen
    spawn() {
        this.isAlive = true;
        this.el.style.opacity = 1;
        this.setX(window.innerWidth / 2);
        this.setY(window.innerHeight - 100);
    }
    //moves Ship to the right
    moveRight() {
        if (!this.isAlive) return;
        this.setX(this.x + this.SPEED);
    }
    //moves Ship to the left
    moveLeft() {
        if (!this.isAlive) return;
        this.setX(this.x - this.SPEED);
    }
    //make Ship shooting
    shoot({ createBullet }) {
        if (this.CanShoot && this.isAlive) {
            this.CanShoot = false;
            createBullet({
                x: this.x + 43 / 2,
                y: this.y,
            });

            setTimeout(() => {
                this.CanShoot = true;
            }, 300);
        }
    }
    //if Ship is killed - disappears for 2 secon
    kill() {
        this.isAlive = false;
        if (!isGameOver) {
            setTimeout(() => {
                this.spawn();
            }, 2000);
        }

        this.el.style.opacity = 0;
    }
    //updates Ship's lives and removes enemy's bullet
    update() {
        const bullet = this.getOverlappingBullet(this);
        if (bullet && bullet.isInvader && this.isAlive) {
            // kill ship
            this.removeBullet(bullet);
            this.removeLife();
            this.kill();
        }
    }
}

//subclass Bullet of class Entity
//consist itself methods of Bullet
class Bullet extends Entity {
    constructor({ x, y, isInvader }) {
        if (isInvader) {
            super({ className: "bullet-invader" });
        } else {
            super({ className: "bullet" });
        }
        this.SPEED = 10;
        this.isInvader = isInvader;

        this.setX(x);
        this.setY(y);
    }
    //determines whose bullet and acts accordingly
    update() {
        const dy = this.isInvader ? this.SPEED : -this.SPEED;
        this.setY(this.y + dy);
    }
}

const RIGHT = "right";
const LEFT = "left";
const POINT_PER_KILL = 20;

//Invader subclass of Entity class
class Invader extends Entity {
    constructor({ x, y, getOverlappingBullet, removeInvader, removeBullet, addToScore }) {
        super({ tag: "img" });
        this.el.src = invaderImgPath;
        this.SPEED = 7;
        this.DOWN_DISTANCE = 25;
        this.direction = LEFT;

        this.getOverlappingBullet = getOverlappingBullet;
        this.removeInvader = removeInvader;
        this.removeBullet = removeBullet;
        (this.addToScore = addToScore), this.setX(x);
        this.setY(y);
    }
    //setting directon to the right
    setDirectionRight() {
        this.direction = RIGHT;
    }
    //setting direction to the left
    setDirectionLeft() {
        this.direction = LEFT;
    }
    //once reaches left/right border moves down for $DOWN_DISTANCE px
    moveDown() {
        this.setY(this.y + this.DOWN_DISTANCE);
    }
    //determines which direction moving: right/left
    update() {
        if (this.direction === LEFT) {
            this.setX(this.x - this.SPEED);
        } else {
            this.setX(this.x + this.SPEED);
        }

        // if the bullet hits me, delete the bullet
        // delete me as well
        const bullet = this.getOverlappingBullet(this);
        if (bullet && !bullet.isInvader) {
            this.removeInvader(this);
            this.removeBullet(bullet);
            this.addToScore(POINT_PER_KILL);
        }
    }
}

//Score subclass of Entity class
class Score extends Entity {
    constructor() {
        super();
        this.score = 0;
        this.setX(window.innerWidth / 2);
        this.setY(20);
        this.refreshText();
    }
    //adds to score points of killed invadors
    addToScore(amount) {
        this.score += amount;
        this.refreshText();
        let invaderNum = INVADER_COLUMNS * INVADER_ROWS * POINT_PER_KILL;
        if (this.score === invaderNum) {
            winScreen.style.display = "flex";
            clearInterval(intervalId);
            return;
        }
    }
    //refreshes points after killed invader
    refreshText() {
        scoreScreen.innerText = `Press 'P' to pause the game
        Score: ${this.score}\n`;
    }
}

//Lives subclass of Entity class
//lives of ship
class Lives extends Entity {
    constructor() {
        super({});
        this.lives = 3;
        this.setX(window.innerWidth / 2);
        this.setY(window.innerHeight - 30);
        this.refreshText();
    }
    //removing live of gamer after loosings
    removeLife() {
        if (this.lives === 1) {
            isGameOver = true;
            gameOverScreen.style.display = "flex";
            this.lives--;

            this.refreshText();
            return;
        }
        this.lives--;
        this.refreshText();
    }
    //refreshes text of live score
    refreshText() {
        this.el.innerText = new Array(this.lives).fill(`💛`).join(" ");
    }
}

//=====================================================

const scoreGui = new Score();
const livesGui = new Lives();

const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
};

//awaits for key-pressing of player
document.addEventListener("keydown", (event) => {
    if (event.key === "R" || event.key === "r") {
        location.reload();
    }

    if ((event.key === "p" || event.key === "P") && !isPause) {
        isPause = true;
        pauseScreen.style.display = "flex";
    } else if ((event.key === "p" || event.key === "P") && isPause) {
        isPause = false;
        pauseScreen.style.display = "none";
    }
    keys[event.key] = true;
});

//awaits for removing key-press of player
document.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});

//array of bullets
const bullets = [];

//removes invader after catching bullet
const removeInvader = (invader) => {
    invaders.splice(invaders.indexOf(invader), 1);
    invader.remove();

    for (let row = 0; row < invadersGrid.length; row++) {
        for (let col = 0; col < invadersGrid[row].length; col++) {
            if (invadersGrid[row][col] === invader) {
                invadersGrid[row][col] = null;
            }
        }
    }
};

//removes bullet after catching it
const removeBullet = (bullet) => {
    bullets.splice(bullets.indexOf(bullet), 1);
    bullet.remove();
};

//detects catched bullet
const isOverlapping = (entity1, entity2) => {
    const rect1 = entity1.el.getBoundingClientRect();
    const rect2 = entity2.el.getBoundingClientRect();
    return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
};

//receives catched bullet
const getOverlappingBullet = (entity) => {
    for (let bullet of bullets) {
        if (isOverlapping(entity, bullet)) {
            return bullet;
        }
    }
    return null;
};

//creates entity of Ship class
const ship = new Ship({
    removeLife: () => livesGui.removeLife(),
    removeBullet,
    getOverlappingBullet,
});

const invaders = [];
const invadersGrid = [];

//creates invaders on the grid
for (let row = 0; row < INVADER_ROWS; row++) {
    const invadersCol = [];
    for (let col = 0; col < INVADER_COLUMNS; col++) {
        const invader = new Invader({
            x: col * 100 + 100,
            y: row * 60 + 50,
            getOverlappingBullet,
            removeInvader,
            removeBullet,
            addToScore: (amount) => scoreGui.addToScore(amount),
        });
        invaders.push(invader);
        invadersCol.push(invader);
    }
    invadersGrid.push(invadersCol);
}

//receives invaders on the bottom row
const getBottomInvaders = () => {
    const bottomInvaders = [];
    for (let col = 0; col < invadersGrid[invadersGrid.length - 1].length; col++) {
        for (let row = invadersGrid.length - 1; row >= 0; row--) {
            if (invadersGrid[row][col]) {
                bottomInvaders.push(invadersGrid[row][col]);
                break;
            }
        }
    }
    return bottomInvaders;
};

//get random invader from bottom row
const getRandomInvaders = (invadersList) => {
    return invadersList[parseInt(Math.random() * invadersList.length)];
};

//allow invader shooting
const invaderFireBullet = () => {
    if (!isPause && !isGameOver) {
        const bottomInvaders = getBottomInvaders();
        const randomInvader = getRandomInvaders(bottomInvaders);

        createBullet({
            x: randomInvader.x + 15,
            y: randomInvader.y + 33,
            isInvader: true,
        });
    }
};

setInterval(invaderFireBullet, 2000);

//receive most left invader in the grid
const getLeftMostInvader = () => {
    return invaders.reduce((minimumInvader, currentInvader) => {
        return currentInvader.x < minimumInvader.x ? currentInvader : minimumInvader;
    });
};

//receive most right invader in the grid
const getRightMostInvader = () => {
    return invaders.reduce((maximumInvader, currentInvader) => {
        return currentInvader.x > maximumInvader.x ? currentInvader : maximumInvader;
    });
};

//creating bulling by key-press
const createBullet = ({ x, y, isInvader = false }) => {
    bullets.push(
        new Bullet({
            x,
            y,
            isInvader,
        })
    );
};

//moving of invaders and ship
//updates position
const update = () => {
    if (!isPause) {
        //moves ship until it reaches right border
        //else: moves ship until it reaches left border
        if (keys["ArrowRight"] && ship.x < window.innerWidth - 60) {
            ship.moveRight();
        } else if (keys["ArrowLeft"] && ship.x > 10) {
            ship.moveLeft();
        }

        //creates bullet and allows ship to shoot
        if (keys["ArrowUp"]) {
            ship.shoot({
                createBullet,
            });
        }

        //detects if ship is havent been shooted
        ship.update();

        //kills bullet model if reaches border
        bullets.forEach((bullet) => {
            bullet.update();
            if (bullet.y < 0) {
                bullets.splice(bullets.indexOf(bullet), 1);
                bullet.remove();
            }
        });

        //checks if invader is alive
        invaders.forEach((invader) => {
            invader.update();
        });

        //checks if invader reaches left border, then goes down
        const leftMostInvader = getLeftMostInvader();
        if (leftMostInvader.x < 30) {
            invaders.forEach((invader) => {
                invader.setDirectionRight();
                invader.moveDown();
            });
        }

        //checks if invader reaches right border, then goes down
        const rightMostInvader = getRightMostInvader();
        if (rightMostInvader.x > window.innerWidth - 60) {
            invaders.forEach((invader) => {
                invader.setDirectionLeft();
                invader.moveDown();
            });
        }

        //checks if bottom invader's row reached bottom
        const bottomInvaders = getBottomInvaders();
        const randomInvader = getRandomInvaders(bottomInvaders);
        if (randomInvader.y > window.innerHeight - 150) {
            gameOverScreen.style.display = "flex";
            clearInterval(intervalId);
            return;
        }
    }
};

setInterval(update, 16.6);
