// Canvas and context
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Device detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTablet = /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent);
const isDesktop = !isMobile && !isTablet;
const isTouchDevice = isMobile || isTablet;

// Responsive canvas setup
function setupCanvas() {
    const containerWidth = canvas.parentElement.clientWidth;
    const maxWidth = Math.min(containerWidth * 0.95, 800);
    const aspectRatio = 2;
    
    canvas.width = maxWidth;
    canvas.height = maxWidth / aspectRatio;
}

setupCanvas();
window.addEventListener('resize', setupCanvas);

// Game variables
const paddleWidth = canvas.width * 0.02;
const paddleHeight = canvas.height * 0.25;
const ballRadius = canvas.width * 0.01;
const paddleSpeed = canvas.height * 0.02;
const ballSpeedInitial = canvas.width * 0.007;

let gameRunning = false;
let gamePaused = false;

// Player paddle (left)
const playerPaddle = {
    x: canvas.width * 0.01,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    score: 0
};

// Computer paddle (right)
const computerPaddle = {
    x: canvas.width - paddleWidth - canvas.width * 0.01,
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
const input = {
    keys: {
        ArrowUp: false,
        ArrowDown: false
    },
    mouse: {
        y: canvas.height / 2
    },
    touch: {
        y: null,
        active: false
    }
};

// Setup Controls
function setupControls() {
    if (isTouchDevice) {
        setupTouchControls();
    } else {
        setupDesktopControls();
    }
}

// Touch Controls
function setupTouchControls() {
    const touchpad = document.getElementById('touchpad');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const mobileControls = document.getElementById('mobileControls');
    const touchpadContainer = document.getElementById('touchpadContainer');

    // Show mobile UI
    mobileControls.classList.add('show');
    touchpadContainer.style.display = 'block';
    document.getElementById('desktopControls').style.display = 'none';

    // Touchpad for swiping
    let touchStartY = 0;
    let touchCurrentY = 0;

    touchpad.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        input.touch.active = true;
    });

    touchpad.addEventListener('touchmove', (e) => {
        e.preventDefault();
        touchCurrentY = e.touches[0].clientY;
        input.touch.y = touchCurrentY;
    });

    touchpad.addEventListener('touchend', () => {
        input.touch.active = false;
    });

    // Alternative: Direct canvas touch
    canvas.addEventListener('touchstart', (e) => {
        const rect = canvas.getBoundingClientRect();
        const touchY = e.touches[0].clientY - rect.top;
        input.touch.y = touchY;
        input.touch.active = true;
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        input.touch.y = e.touches[0].clientY - rect.top;
    });

    canvas.addEventListener('touchend', () => {
        input.touch.active = false;
    });

    // Buttons
    startBtn.addEventListener('click', toggleGameState);
    resetBtn.addEventListener('click', resetGame);
    startBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        toggleGameState();
    });
    resetBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        resetGame();
    });
}

// Desktop Controls
function setupDesktopControls() {
    document.getElementById('desktopControls').style.display = 'block';
    document.getElementById('mobileControls').classList.remove('show');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') input.keys.ArrowUp = true;
        if (e.key === 'ArrowDown') input.keys.ArrowDown = true;
        if (e.key === ' ') {
            e.preventDefault();
            toggleGameState();
        }
        if (e.key === 'r' || e.key === 'R') resetGame();
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowUp') input.keys.ArrowUp = false;
        if (e.key === 'ArrowDown') input.keys.ArrowDown = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        input.mouse.y = e.clientY - rect.top;
    });
}

// Game Functions
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
    const speed = ballSpeedInitial;
    ball.dx = speed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = speed * (Math.random() > 0.5 ? 1 : -1);
}

function updateGameStatus() {
    const statusElement = document.getElementById('gameStatus');
    if (!gameRunning) {
        statusElement.textContent = isTouchDevice ? 'TAP START' : 'Press SPACE';
    } else if (gamePaused) {
        statusElement.textContent = isTouchDevice ? 'PAUSED' : 'PAUSED';
    } else {
        statusElement.textContent = 'PLAYING...';
    }
}

function updateScoreboard() {
    document.getElementById('playerScore').textContent = playerPaddle.score;
    document.getElementById('computerScore').textContent = computerPaddle.score;
}

// Movement
function movePlayerPaddle() {
    let targetY = playerPaddle.y;

    // Mobile/Tablet touch control
    if (isTouchDevice && input.touch.y !== null) {
        targetY = input.touch.y - paddleHeight / 2;
    }

    // Desktop keyboard control
    if (isDesktop) {
        if (input.keys.ArrowUp) targetY -= paddleSpeed;
        if (input.keys.ArrowDown) targetY += paddleSpeed;
    }

    // Desktop mouse control
    if (isDesktop && input.mouse.y !== canvas.height / 2) {
        targetY = input.mouse.y - paddleHeight / 2;
    }

    playerPaddle.y = Math.max(0, Math.min(targetY, canvas.height - paddleHeight));
}

function moveComputerPaddle() {
    const computerCenter = computerPaddle.y + paddleHeight / 2;
    const deadZone = paddleHeight * 0.4;

    if (computerCenter < ball.y - deadZone) {
        computerPaddle.y += paddleSpeed;
    } else if (computerCenter > ball.y + deadZone) {
        computerPaddle.y -= paddleSpeed;
    }

    computerPaddle.y = Math.max(0, Math.min(computerPaddle.y, canvas.height - paddleHeight));
}

// Collision
function checkPaddleCollision(paddle) {
    if (
        ball.x - ball.radius < paddle.x + paddle.width &&
        ball.x + ball.radius > paddle.x &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.y + ball.radius > paddle.y
    ) {
        const collidePoint = ball.y - (paddle.y + paddle.height / 2);
        const collideNorm = collidePoint / (paddle.height / 2);
        const bounceAngle = collideNorm * (Math.PI / 4);

        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy) * 1.05;
        ball.dx = speed * (paddle === playerPaddle ? 1 : -1) * Math.cos(bounceAngle);
        ball.dy = speed * Math.sin(bounceAngle);

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
    } else if (ball.x + ball.radius > canvas.width) {
        playerPaddle.score++;
        updateScoreboard();
        resetBall();
    }
}

// Update and Draw
function update() {
    if (!gameRunning || gamePaused) return;

    movePlayerPaddle();
    moveComputerPaddle();

    ball.x += ball.dx;
    ball.y += ball.dy;

    checkWallCollision();
    checkPaddleCollision(playerPaddle);
    checkPaddleCollision(computerPaddle);
    checkScoringAndReset();
}

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
    ctx.setLineDash([canvas.width * 0.02, canvas.width * 0.02]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawCenterLine();
    drawRectangle(playerPaddle.x, playerPaddle.y, playerPaddle.width, playerPaddle.height, '#00ff88');
    drawRectangle(computerPaddle.x, computerPaddle.y, computerPaddle.width, computerPaddle.height, '#ff006e');
    drawCircle(ball.x, ball.y, ball.radius, '#ffff00');

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    update();
    draw();

    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Initialize
setupControls();
draw();
updateGameStatus();
updateScoreboard();
