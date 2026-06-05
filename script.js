// Canvas and context
const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Get device type
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTablet = /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent);
const isDesktop = !isMobile && !isTablet;

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
const paddleSpeed = canvas.height * 0.015;
const ballSpeedInitial = canvas.width * 0.006;

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
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    mouseY: canvas.height / 2,
    touchY: canvas.height / 2,
    proximityDistance: null
};

// Touch tracking for mobile
let lastTouchY = null;
let touchStartY = null;

// Proximity Sensor API (for compatible devices)
function requestProximitySensor() {
    if ('ProximitySensor' in window) {
        try {
            const sensor = new ProximitySensor();
            sensor.addEventListener('reading', () => {
                // Use proximity distance to control paddle
                // Closer = move up, farther = move down
                keys.proximityDistance = sensor.distance;
            });
            sensor.start();
        } catch (error) {
            console.log('Proximity sensor not available:', error);
        }
    }
}

// Request permission for sensors on mobile
function requestSensorPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    requestProximitySensor();
                }
            })
            .catch(console.error);
    } else {
        // Non-iOS or older devices
        requestProximitySensor();
    }
}

// Mobile controls detection and setup
function setupMobileControls() {
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (isMobile || isTablet) {
        // Show mobile buttons
        document.getElementById('mobileControls').classList.add('show');
        resetBtn.classList.add('show');

        // Start button
        startBtn.addEventListener('click', toggleGameState);
        startBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleGameState();
        });

        // Reset button
        resetBtn.addEventListener('click', resetGame);
        resetBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            resetGame();
        });

        // Request proximity sensor permission
        if (isMobile) {
            requestSensorPermission();
        }
    }
}

// Desktop controls setup
function setupDesktopControls() {
    if (!isDesktop) return;

    // Keyboard events
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

    // Mouse events
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        keys.mouseY = e.clientY - rect.top;
    });
}

// Touch events for mobile/tablet (direct canvas touch)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchStartY = touch.clientY - rect.top;
    lastTouchY = touch.clientY - rect.top;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    keys.touchY = touch.clientY - rect.top;
    lastTouchY = keys.touchY;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    lastTouchY = null;
    touchStartY = null;
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
    const speed = ballSpeedInitial;
    ball.dx = speed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = speed * (Math.random() > 0.5 ? 1 : -1);
}

function updateGameStatus() {
    const statusElement = document.getElementById('gameStatus');
    if (!gameRunning) {
        if (isMobile || isTablet) {
            statusElement.textContent = 'TAP START BUTTON';
        } else {
            statusElement.textContent = 'Press SPACE to Start';
        }
    } else if (gamePaused) {
        if (isMobile || isTablet) {
            statusElement.textContent = 'PAUSED - TAP START';
        } else {
            statusElement.textContent = 'PAUSED - Press SPACE';
        }
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
    let targetY = playerPaddle.y;

    // Desktop: Mouse control
    if (isDesktop && keys.mouseY !== canvas.height / 2) {
        targetY = keys.mouseY - paddleHeight / 2;
    }

    // Desktop: Arrow key control
    if (isDesktop) {
        if (keys.ArrowUp) {
            targetY = playerPaddle.y - paddleSpeed;
        } else if (keys.ArrowDown) {
            targetY = playerPaddle.y + paddleSpeed;
        }
    }

    // Mobile/Tablet: Touch control
    if ((isMobile || isTablet) && lastTouchY !== null) {
        targetY = lastTouchY - paddleHeight / 2;
    }

    // Mobile: Proximity sensor control (if available)
    if ((isMobile || isTablet) && keys.proximityDistance !== null) {
        // Map proximity distance to paddle position
        // Closer = higher on screen, Farther = lower on screen
        const maxDistance = 20; // Maximum usable proximity distance in cm
        const proximityRatio = Math.min(keys.proximityDistance / maxDistance, 1);
        targetY = proximityRatio * (canvas.height - paddleHeight);
    }

    // Constrain paddle within canvas
    playerPaddle.y = Math.max(0, Math.min(targetY, canvas.height - paddleHeight));
}

function moveComputerPaddle() {
    // AI: follow the ball
    const computerCenter = computerPaddle.y + paddleHeight / 2;
    const deadZone = paddleHeight * 0.35;

    if (computerCenter < ball.y - deadZone) {
        computerPaddle.y += paddleSpeed;
    } else if (computerCenter > ball.y + deadZone) {
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
        // Calculate collision angle
        const collidePoint = ball.y - (paddle.y + paddle.height / 2);
        const collideNorm = collidePoint / (paddle.height / 2);
        const bounceAngle = collideNorm * (Math.PI / 4);

        // Increase ball speed slightly
        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy) * 1.05;

        // Set new trajectory
        ball.dx = speed * (paddle === playerPaddle ? 1 : -1) * Math.cos(bounceAngle);
        ball.dy = speed * Math.sin(bounceAngle);

        // Prevent ball from getting stuck
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
    ctx.setLineDash([canvas.width * 0.02, canvas.width * 0.02]);
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

// Initialize
setupMobileControls();
setupDesktopControls();
draw();
updateGameStatus();
