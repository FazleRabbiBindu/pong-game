// Canvas and context
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const paddleWidth = 15;
const paddleHeight = 100;
const ballRadius = 8;
const paddleSpeed = 6;
const ballSpeedInitial = 5;

let gameRunning = false;
let gamePaused = false;

// Player paddle (left)
const playerPaddle = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    score: 0
};

// Computer paddle (right)
const computerPaddle = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    score: 0
};

// Ball
let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballRadius,
    dx: ballSpeedInitial,
    dy: ballSpeedInitial
};

// Input tracking
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    mouseY: canvas.height / 2
};

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') keys.ArrowUp = true;
    if (e.key === 'ArrowDown') keys.ArrowDown = true;
    if (e.key === ' ') {
        e.preventDefault();
        toggleGameState();
    }
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') keys.ArrowUp = false;
    if (e.key === 'ArrowDown') keys.ArrowDown = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    keys.mouseY = e.clientY - rect.top;
});

// Game functions
function toggleGameState() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        updateGameStatus();
        gameLoop();
    } else {
        gamePaused = !gamePaused;
        updateGameStatus();
        if (!gamePaused) {
            gameLoop();
        }
    }
}

function resetGame() {
    gameRunning = false;
    gamePaused = false;
    playerPaddle.score = 0;
    computerPaddle.score = 0;
    resetBall();
    updateScoreboard();
    updateGameStatus();
    draw();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = ballSpeedInitial * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = ballSpeedInitial * (Math.random() > 0.5 ? 1 : -1);
}

function updateGameStatus() {
    const statusElement = document.getElementById('gameStatus');
    if (!gameRunning) {
        statusElement.textContent = 'Press SPACE to Start';
    } else if (gamePaused) {
        statusElement.textContent = 'PAUSED - Press SPACE to Resume';
    } else {
        statusElement.textContent = 'PLAYING...';
    }
}

function updateScoreboard() {
    document.getElementById('playerScore').textContent = playerPaddle.score;
    document.getElementById('computerScore').textContent = computerPaddle.score;
}

// Movement functions
function movePlayerPaddle() {
    // Mouse control
    let targetY = keys.mouseY - paddleHeight / 2;

    // Arrow key control (overrides mouse if used)
    if (keys.ArrowUp) {
        targetY = playerPaddle.y - paddleSpeed;
    } else if (keys.ArrowDown) {
        targetY = playerPaddle.y + paddleSpeed;
    }

    // Constrain paddle within canvas
    playerPaddle.y = Math.max(0, Math.min(targetY, canvas.height - paddleHeight));
}

function moveComputerPaddle() {
    // Simple AI: follow the ball
    const computerCenter = computerPaddle.y + paddleHeight / 2;
    const difficulty = 0.08; // Adjust for difficulty (higher = easier)

    if (computerCenter < ball.y - 35) {
        computerPaddle.y += paddleSpeed;
    } else if (computerCenter > ball.y + 35) {
        computerPaddle.y -= paddleSpeed;
    }

    // Constrain paddle within canvas
    computerPaddle.y = Math.max(0, Math.min(computerPaddle.y, canvas.height - paddleHeight));
}

// Collision detection
function checkPaddleCollision(paddle) {
    if (
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.x + ball.radius > paddle.x &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.y + ball.radius > paddle.y
    ) {
        // Calculate collision angle based on where ball hits paddle
        const collidePoint = ball.y - (paddle.y + paddle.height / 2);
        const collideNorm = collidePoint / (paddle.height / 2);
        const bounceAngle = collideNorm * (Math.PI / 4); // 45 degrees max angle

        // Increase ball speed slightly
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy) * 1.05;

        // Set new trajectory
        ball.dx = speed * (paddle === playerPaddle ? 1 : -1) * Math.cos(bounceAngle);
        ball.dy = speed * Math.sin(bounceAngle);

        // Prevent ball from getting stuck in paddle
        if (paddle === playerPaddle) {
            ball.x = paddle.x + paddle.width + ball.radius;
        } else {
            ball.x = paddle.x - ball.radius;
        }

        return true;
    }
    return false;
}

function checkWallCollision() {
    // Top and bottom wall collision
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.dy *= -1;
    } else if (ball.y + ball.radius > canvas.height) {
        ball.y = canvas.height - ball.radius;
        ball.dy *= -1;
    }
}

function checkScoringAndReset() {
    if (ball.x - ball.radius < 0) {
        computerPaddle.score++;
        updateScoreboard();
        resetBall();
        return true;
    } else if (ball.x + ball.radius > canvas.width) {
        playerPaddle.score++;
        updateScoreboard();
        resetBall();
        return true;
    }
    return false;
}

// Update game state
function update() {
    if (!gameRunning || gamePaused) return;

    movePlayerPaddle();
    moveComputerPaddle();

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Check collisions
    checkWallCollision();
    checkPaddleCollision(playerPaddle);
    checkPaddleCollision(computerPaddle);
    checkScoringAndReset();
}

// Draw functions
function drawRectangle(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawCircle(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawCenterLine() {
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    drawCenterLine();

    // Draw paddles
    drawRectangle(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height, '#00ff88');
    drawRectangle(computerPaddle.x, computerPaddle.y, computerPaddle.width, computerPaddle.height, '#ff006e');

    // Draw ball
    drawCircle(ball.x, ball.y, ball.radius, '#ffff00');

    // Draw court borders
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

// Main game loop
function gameLoop() {
    update();
    draw();

    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Initial draw
draw();
updateGameStatus();
