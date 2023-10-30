var out = console.log.bind(document)

// unavailable in tablet or mobile
if (window.matchMedia("screen and (max-width: 1023px)").matches){
    document.body.innerHTML = `<div class="unavailable">This game is only available in laptop or desktop devices</div>`
}

// generate grid
const container = document.querySelector(".boards")

for (let i = 1; i <= 100; i++){
    container.innerHTML += `<div class="board"></div>`
}

// open how to play
const howToPlayBtn = document.querySelector(".how-to-play-btn")
const closeHowToPlay = document.querySelector(".close-how-to-play")
const howToPlay = document.querySelector(".how-to-play")
const overlay = document.querySelector(".overlay")

howToPlayBtn.addEventListener("click", () => {
    overlay.classList.add("active")
    howToPlay.classList.add("active")
})

closeHowToPlay.addEventListener("click", () => {
    overlay.classList.remove("active")
    howToPlay.classList.remove("active")
})

overlay.addEventListener("click", () => {
    if (howToPlay.classList.contains("active")){
        overlay.classList.remove("active")
        howToPlay.classList.remove("active")
    }
})

const boards = document.querySelectorAll(".board")
const bombsArray = generateBombsLocation()
const numbersArray = generateNumbersLocation()

// sounds
const clickSound = document.querySelector(".click")
const flagSound = document.querySelector(".flag-click")
const bombSound = document.querySelector(".bomb-click")
const winSound = document.querySelector(".win")

boards.forEach((board, index) => {
    // click
    board.addEventListener("click", () => {
        if (!timeIsRunning){
            timer()
        }
        // click bomb
        if (bombsArray.includes(index)){
            clickOnBomb(index)
        }
        // click
        else {
            checkBomb(index, true)
        }
    })

    // right click
    board.addEventListener("contextmenu", (e) => {
        e.preventDefault()
        putFlag(index)
    })
})

// generate bombs location
function generateBombsLocation() {
    let bombsArray = [];
    while (bombsArray.length < 10){
        const randomLocation = Math.floor(Math.random() * 100);
        if (!bombsArray.includes(randomLocation)){
            bombsArray.push(randomLocation);
        }
    }
    return bombsArray;
}

// generate numbers location
function generateNumbersLocation(){
    let numbersArray = Array(100).fill(-1)

    const rows = 10
    const cols = 10

    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1], [1, 0], [1, 1]
    ]

    for (let i = 0; i < 100; i++){
        let number = 0

        if (bombsArray.includes(i)){
            continue
        }
      
        for (const [dr, dc] of directions){
            const newRow = Math.floor(i / rows) + dr;
            const newCol = (i % cols) + dc;
            
            const newBoard = newRow * rows + newCol;
      
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && bombsArray.includes(newBoard)) {
                number++;
            }
        }
        numbersArray[i] = number
    }

    return numbersArray
}

// click on bomb
function clickOnBomb(x){

    if (boards[x].querySelector("svg")){
        return
    }
    
    let bomb = 
    `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-bomb" width="28" height="28" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <path d="M15.349 5.349l3.301 3.301a1.2 1.2 0 0 1 0 1.698l-.972 .972a7.5 7.5 0 1 1 -5 -5l.972 -.972a1.2 1.2 0 0 1 1.698 0z"></path>
        <path d="M17 7l1.293 -1.293a2.414 2.414 0 0 0 .707 -1.707a1 1 0 0 1 1 -1h1"></path>
        <path d="M7 13a3 3 0 0 1 3 -3"></path>
    </svg>`

    boards[x].classList.add("open")
    boards[x].innerHTML = bomb
    
    setTimeout(() => {
        for (let bombLocation of bombsArray){
            if (bombLocation != x){
                boards[bombLocation].classList.add("open")
                boards[bombLocation].innerHTML = bomb
            }
        }
    }, 500)

    clickSound.play()

    setTimeout(() => {
        bombSound.play()
    }, 500);

    clearInterval(myInterval)
    finish(false)
}

// put flag
function putFlag(x){
    if (boards[x].classList.contains("open")){
        return
    }

    const totalFlag = document.querySelector(".flag > span")

    let flag = `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pennant" width="28" height="28" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <path d="M8 21l4 0"></path>
        <path d="M10 21l0 -18"></path>
        <path d="M10 4l9 4l-9 4"></path>
    </svg>`

    if (boards[x].querySelector("svg")){
        boards[x].innerHTML = ""
        flagSound.play()
    }
    else {
        if (parseInt(totalFlag.innerText) > 0){
            boards[x].innerHTML = flag
            flagSound.play()
        }
    }


    checkFlag()
}

// check how many flags in grid
function checkFlag(){
    const totalFlag = document.querySelector(".flag > span")

    let flags = 0
    for (let board of boards){
        if (board.querySelector(".icon-tabler-pennant")){
            flags++
        }
    }

    totalFlag.innerText = 10 - flags
}

// open board
function checkBomb(x, click){
    if (boards[x].classList.contains("open") || (boards[x].querySelector("svg") && click)){
        return
    }

    clickSound.play()
    
    let bombsAround = numbersArray[x]
    boards[x].classList.add("open", `number${bombsAround}`)
    boards[x].innerText = bombsAround > 0 ? bombsAround : ""

    numbersArray[x] = 0

    if (checkWin()){
        clearInterval(myInterval)
        finish(true)
        setTimeout(() => {
            winSound.play()
        }, 1000);
    }

    if (bombsAround > 0){
        return
    }

    const rows = 10
    const cols = 10
    const boardsAround = [];

    const row = Math.floor(x / rows);
    const col = x % cols;

    for (let dr = -1; dr <= 1; dr++){
        for (let dc = -1; dc <= 1; dc++){
            const newRow = row + dr;
            const newCol = col + dc;

            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                const board = newRow * rows + newCol;
                if (board != x){
                    boardsAround.push(board);
                }
            }
        }
    }

    for (const board of boardsAround){
        checkBomb(board, false)
    }

    checkFlag()
}

// check win
function checkWin(){
    let count = 0

    for (let number of numbersArray){
        count += number
    }

    return count == -10 ? true : false
}

// timer
const time = document.querySelector(".time")
let myInterval;
let timeIsRunning = false

function timer(){
    timeIsRunning = true
    let sec = 1
    let min = 0

    time.innerText = `${min < 10 ? `0${min}` : min}:${sec < 10 ? `0${sec}` : sec}`

    myInterval = setInterval(() => {
        sec++
        
        if (sec == 60){
            sec = 0;
            min++;
        }

        time.innerText = `${min < 10 ? `0${min}` : min}:${sec < 10 ? `0${sec}` : sec}`
    }, 1000);
}

// finish
function finish(status){
    setTimeout(() => {
        overlay.classList.add("active")
        document.querySelector(".score").classList.add("active")
    
        const statusElement = document.querySelector(".status")
        const statueTime = document.querySelector(".status-time")
    
        if (status){
            statusElement.innerText = "You won"
            statueTime.innerHTML = time.parentElement.innerHTML
        }
    
        else {
            statusElement.innerText = "You lost"
            statueTime.style.display = "none"
        }
    }, 1000);
}