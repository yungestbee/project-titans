const icons = [
    "assets/BallOne.png", "assets/BallTwo.png", "assets/pngwing.com.png",
    "assets/Satelite.png", "assets/enemy.png", "assets/EnemyTwo.png",
    "assets/Scary.png"
];

const btnStart = document.querySelector('.btnStart');
const btnPause = document.querySelector('.btnPause');
const pauseText = document.getElementById('pauseText');
const gameOverEle = document.getElementById('gameOverElement');
const container = document.getElementById('container');
const box = document.querySelector('.box');
const scoreDash = document.querySelector('.scoreDash');
const progressbar = document.querySelector('.progress-bar');
const backgroundEffect = document.getElementById('backgroundEffect');
const backgroundMusic = document.getElementById('backgroundMusic');
const shootSound = document.getElementById('shootSound');
const explosionSound = document.getElementById('explosionSound');
const collisionSound = document.getElementById('collisionSound');
const playerLevelElement = document.getElementById('levelValue'); 
let nextLevelSound = document.getElementById('nextLevel');
let nextLevelVoice = document.getElementById('nextLevelVoice');
nextLevelSound.volume = 0.8;
nextLevelVoice.volume = 0.8;

let link = document.getElementById('link');
let info = document.getElementById('info');
let gamePlayArea = document.getElementById('gamePlayArea');
let dashboard = document.getElementById('dashBoard');
const boxCenter = [box.offsetLeft + (box.offsetWidth / 2), box.offsetTop + (box.offsetHeight / 2)];

// Game state variables
let gamePlay = false;
let gamePaused = false;
let player;
let animateGame;
let minEnemySpeed = 0.3;
let maxEnemySpeed = 2.9;
let enemySpeedIncrement = 0.1;
let lastScore = 0;

let minEnemies = 5;
let maxEnemies = 15;
let enemyIncrement = 1;
let numEnemies = minEnemies;

let enemySpeed = minEnemySpeed;
let enemySpawnInterval = 2000;
let spawnTimer;
let currentLevel = 1; // Initialize current level

// Event listeners for buttons and mouse actions
btnStart.addEventListener('click', startGame);
btnPause.addEventListener('click', togglePause);
container.addEventListener('mousedown', mouseDown);
container.addEventListener('mousemove', movePosition);

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        togglePause();
    }
});

// Play initial background effect
backgroundEffect.play();

// Function to start the game
function startGame() {
    gamePlay = true;
    gameOverEle.style.display = 'none';
    info.style.display = 'block';
    link.style.display = 'none';
    document.querySelector('.turet').style.display = 'block';
    box.style.display = 'block';
    player = {
        score: 0,
        barwidth: 100,
        lives: 100
    };
    lastScore = 0;
    minEnemySpeed = 0.8; // Adjusted minimum enemy speed
    enemySpeed = minEnemySpeed;
    enemySpawnInterval = 2000;
    clearInterval(spawnTimer);
    setupBadguys(numEnemies);
    moveEnemy();
    spawnEnemies();
    spawnTimer = setInterval(spawnEnemies, enemySpawnInterval);
    animateGame = requestAnimationFrame(playGame);

    // Stop background effect and play game music
    backgroundEffect.pause();
    backgroundEffect.currentTime = 0;
    backgroundMusic.play();

    // Update current level display
    currentLevel = 1;
    playerLevelElement.textContent = currentLevel;
}

// Function to toggle pause/resume game
function togglePause() {
    if (gamePlay) {
        if (!gamePaused) {
            // Pause the game
            cancelAnimationFrame(animateGame);
            clearInterval(spawnTimer);
            backgroundMusic.pause();
            gamePaused = true;
            pauseText.style.display = 'block';
            btnPause.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            // Resume the game
            animateGame = requestAnimationFrame(playGame);
            spawnTimer = setInterval(spawnEnemies, enemySpawnInterval);
            backgroundMusic.play();
            gamePaused = false;
            pauseText.style.display = 'none';
            btnPause.innerHTML = '<i class="fas fa-pause"></i>';
        }
    }
}

// Function to play the game
function playGame() {
    if (gamePlay && !gamePaused) {
        moveShots();
        updateDash();
        moveEnemy();

        // Check if the player has reached the next level
        if (player.score >= currentLevel * 100) {
            currentLevel++; // Increase the current level
            playerLevelElement.textContent = currentLevel; // Update level display

            // Play the next level sound
            nextLevelSound.currentTime = 0;
            nextLevelSound.play();

            nextLevelVoice.currentTime = 0;
            nextLevelVoice.play();

             // Display popup message
             let popupMessage = document.querySelector('.popup-message');
             popupMessage.style.display = 'block';
 
             // Hide popup message after 2 seconds (adjust timing as needed)
             setTimeout(() => {
                 popupMessage.style.display = 'none';
             }, 2000);
        }

        animateGame = requestAnimationFrame(playGame);
    }
}

// Function to move the turret based on mouse position
function movePosition(e) {
    let deg = getDeg(e);
    box.style.webkitTransform = 'rotate(' + deg + 'deg)';
    box.style.mozTransform = 'rotate(' + deg + 'deg)';
    box.style.msTransform = 'rotate(' + deg + 'deg)';
    box.style.oTransform = 'rotate(' + deg + 'deg)';
    box.style.transform = 'rotate(' + deg + 'deg)';
}

// Function to move enemies towards the turret
function moveEnemy() {
    let tempEnemy = document.querySelectorAll('.baddy');
    let hitter = false;
    let tempShots = document.querySelectorAll('.fireme');

    for (let enemy of tempEnemy) {
        if (enemy.offsetTop > 550 || enemy.offsetTop < 0 || enemy.offsetLeft > 750 || enemy.offsetLeft < 0) {
            // Remove enemy if out of bounds and create a new one
            enemy.parentNode.removeChild(enemy);
            badmaker();
        } else {
            // Move enemies towards the turret
            let angleToTurret = Math.atan2(boxCenter[1] - enemy.offsetTop, boxCenter[0] - enemy.offsetLeft);
            enemy.moverx = Math.cos(angleToTurret) * enemySpeed;
            enemy.movery = Math.sin(angleToTurret) * enemySpeed;

            enemy.style.top = enemy.offsetTop + enemy.movery + 'px';
            enemy.style.left = enemy.offsetLeft + enemy.moverx + 'px';

            // Check collision between shots and enemies
            for (let shot of tempShots) {
                if (isCollide(shot, enemy) && gamePlay) {
                    player.score += enemy.points;
                    createExplosion(enemy.offsetLeft, enemy.offsetTop);
                    explosionSound.currentTime = 0;
                    explosionSound.play();
                    enemy.parentNode.removeChild(enemy);
                    shot.parentNode.removeChild(shot);
                    updateDash();
                    badmaker(); // Create a new enemy
                    break;
                }
            }
        }

        // Check collision between turret and enemies
        if (isCollide(box, enemy)) {
            hitter = true;
            enemy.parentNode.removeChild(enemy);
            player.lives -= 5; // Decrease lives on collision
            collisionSound.currentTime = 0;
            collisionSound.play();
            gamePlayArea.classList.add('blink-red');
            dashboard.classList.add('blink-red');
            setTimeout(() => {
                gamePlayArea.classList.remove('blink-red');
                dashboard.classList.remove('blink-red');
            }, 500); // Remove the class after the blinking effect
            if (player.lives < 0) {
                gameOver();
            }
            updateDash();
        }
    }

    // Highlight the turret on collision with enemies
    if (hitter) {
        box.style.backgroundColor = 'red';
        hitter = false;
    } else {
        box.style.backgroundColor = '';
    }

    // Calculate enemy speed based on player score and level
    enemySpeed = 0.9 + Math.floor(player.score / 100) * 0.6;

    // Adjust spawn interval based on score and level
    if (enemySpawnInterval > 100) {
        enemySpawnInterval = Math.max(50, 2000 - player.score * 20);
        clearInterval(spawnTimer);
        spawnTimer = setInterval(spawnEnemies, enemySpawnInterval);
    }
}

// Function to create explosion effect
function createExplosion(x, y) {
    let explosion = document.createElement('div');
    explosion.setAttribute('class', 'explosion');
    explosion.style.left = x + 'px';
    explosion.style.top = y + 'px';
    container.appendChild(explosion);

    setTimeout(() => {
        explosion.parentNode.removeChild(explosion);
    }, 500); // Remove the explosion after animation
}

// Function to handle game over
function gameOver() {
    cancelAnimationFrame(animateGame);
    clearInterval(spawnTimer);
    gameOverEle.style.display = 'block';
    document.querySelector('.turet').style.display = 'none';
    document.querySelector('.box').style.display = 'none';
    gameOverEle.querySelector('span').innerHTML = 'GAME OVER<br>Your Score: ' + player.score + '<br>';
    updateHighScore(player.score); // Update high score
    gamePlay = false;
    gamePaused = false;
    backgroundMusic.pause(); // Pause background music
    backgroundMusic.currentTime = 0;
    backgroundEffect.play(); // Play background effect
    clearGameArea(); // Clear all enemies and shots

    currentLevel = 1;
    playerLevelElement.textContent = currentLevel; 
}

// Function to update high score in UI
function updateHighScore(score) {
    let highScore = localStorage.getItem('highScore');
    if (!highScore || score > highScore) {
        localStorage.setItem('highScore', score);
        gameOverEle.querySelector('span').innerHTML += 'New High Score: ' + score;
    } else {
        gameOverEle.querySelector('span').innerHTML += 'High Score: ' + highScore;
    }
}

// Function to update score and progress bar in UI
function updateDash() {
    scoreDash.innerHTML = player.score;
    let tempPer = (player.lives / player.barwidth) * 100 + '%';
    progressbar.style.width = tempPer;
}

// Function to check collision between two elements
function isCollide(a, b) {
    let aRect = a.getBoundingClientRect();
    let bRect = b.getBoundingClientRect();
    return !(
        (aRect.bottom < bRect.top) || (aRect.top > bRect.bottom) ||
        (aRect.right < bRect.left) || (aRect.left > bRect.right)
    );
}

// Function to calculate degrees from mouse position
function getDeg(e) {
    let angle = Math.atan2(e.clientX - boxCenter[0], -(e.clientY - boxCenter[1]));
    return angle * (180 / Math.PI);
}

// Function to convert degrees to radians
function degRad(deg) {
    return deg * (Math.PI / 180);
}

// Function to handle mouse click for shooting
function mouseDown(e) {
    if (gamePlay && !gamePaused) {
        let deg = getDeg(e);
        createProjectile(deg);

        // Check if player score is 800 or more
        if (player.score >= 800) {
            // Create two projectiles with slight angle offsets
            createProjectile(deg + 10); // Adjust the angle as needed
            createProjectile(deg - 10); // Adjust the angle as needed
        }

        // Play shooting sound effect
        shootSound.currentTime = 0;
        shootSound.play();

        info.style.display = 'none';
        link.style.display = 'block';
    }
}

// Function to create a projectile at a given angle
function createProjectile(deg) {
    let div = document.createElement('div');
    div.setAttribute('class', 'fireme');
    div.moverx = 10 * Math.sin(degRad(deg)); // Increase the speed here
    div.movery = -10 * Math.cos(degRad(deg)); // Increase the speed here
    div.style.left = (boxCenter[0] - 5) + 'px';
    div.style.top = (boxCenter[1] - 5) + 'px';
    div.style.width = 10 + 'px';
    div.style.height = 10 + 'px';
    container.appendChild(div);
}
// Function to set up initial enemies
function setupBadguys(num) {
    let currentEnemies = document.querySelectorAll('.baddy').length;
    for (let x = 0; x < num - currentEnemies; x++) {
        badmaker();
    }
}

// Function to generate a random number
function randomMe(num) {
    return Math.floor(Math.random() * num);
}

// Function to create a new enemy
function badmaker() {
    let div = document.createElement('div');
    let myIcon = icons[randomMe(icons.length)];
    let x, y;

    // Generate a random position on the border of the container
    let edge = Math.floor(Math.random() * 4);
    let posX = Math.random() * container.offsetWidth;
    let posY = Math.random() * container.offsetHeight;

    switch (edge) {
        case 0: // Top edge
            x = posX;
            y = 0;
            break;
        case 1: // Right edge
            x = container.offsetWidth;
            y = posY;
            break;
        case 2: // Bottom edge
            x = posX;
            y = container.offsetHeight;
            break;
        case 3: // Left edge
            x = 0;
            y = posY;
            break;
    }

    div.style.backgroundImage = `url(${myIcon})`;
    div.style.backgroundSize = 'cover';
    div.setAttribute('class', 'baddy');
    div.style.width = '105px'; // Set the width of the enemy
    div.style.height = '105px'; // Set the height of the enemy
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    div.points = randomMe(5) + 1;
    div.moverx = 0; // Initialize movement to zero
    div.movery = 0; // Initialize movement to zero
    container.appendChild(div);
}

// Function to move all shots
function moveShots() {
    let tempShots = document.querySelectorAll('.fireme');
    for (let shot of tempShots) {
        if (shot.offsetTop > 600 || shot.offsetTop < 0 || shot.offsetLeft > 800 || shot.offsetLeft < 0) {
            shot.parentNode.removeChild(shot);
        } else {
            shot.style.top = shot.offsetTop + shot.movery + 'px';
            shot.style.left = shot.offsetLeft + shot.moverx + 'px';
        }
    }
}

// Function to spawn enemies continuously
function spawnEnemies() {
    let currentEnemies = document.querySelectorAll('.baddy').length;
    if (currentEnemies < numEnemies) {
        setupBadguys(numEnemies - currentEnemies);
    }
}

// Function to clear the game area (remove all enemies and shots)
function clearGameArea() {
    let tempEnemy = document.querySelectorAll('.baddy');
    for (let enemy of tempEnemy) {
        enemy.parentNode.removeChild(enemy);
    }
    let tempShots = document.querySelectorAll('.fireme');
    for (let shot of tempShots) {
        shot.parentNode.removeChild(shot);
    }
}