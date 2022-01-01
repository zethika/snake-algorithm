import * as p5 from "p5"
import Snake from "@src/classes/Snake";
import Grid, {GridSquareStateEnum} from "@src/classes/Grid";
import {
    CardinalDirectionsEnum,
    drawCalculations,
    GridPosition,
    gridSquareSize,
    gridSquaresPrAxis, slowdownPower, StepState
} from "@src/definitions";
import Apple from "@src/classes/Apple";
import EdgeAdjacencyAlgorithm from "@src/classes/EdgeAdjacencyAlgorithm";

function game(sketch: p5) {
    let snake: Snake;
    let grid: Grid;
    let apple: Apple;
    let algo: EdgeAdjacencyAlgorithm;

    let iterations: Array<number> = [];
    let algoTimes: Array<number> = [];
    let iteration: number = 0;
    let tempPath:Array<number> = [];

    let isStopped: boolean = false;
    let stopButton: p5.Element;

    let moveBackwardsButton: p5.Element;
    let moveForwardsButton: p5.Element;

    let steps: Array<StepState> = [];
    let showingStep: number|false = false;

    sketch.setup = () => {
        // Environment setup
        sketch.createCanvas(gridSquareSize*gridSquaresPrAxis, gridSquareSize*gridSquaresPrAxis);

        stopButton = sketch.createButton('Start/Stop')
        stopButton.position(8, gridSquareSize*gridSquaresPrAxis+10);
        stopButton.mousePressed(startStop);

        moveBackwardsButton = sketch.createButton('Back')
        moveBackwardsButton.position(90, gridSquareSize*gridSquaresPrAxis+10);
        moveBackwardsButton.mousePressed(stepBack);
        moveBackwardsButton.attribute('disabled','')


        moveForwardsButton = sketch.createButton('Forward')
        moveForwardsButton.position(145, gridSquareSize*gridSquaresPrAxis+10);
        moveForwardsButton.mousePressed(stepForward);
        moveBackwardsButton.attribute('disabled','')

        // Game setup
        snake = new Snake();
        //snake = new Snake([{"x":8,"y":5},{"x":8,"y":4},{"x":8,"y":3},{"x":7,"y":3},{"x":7,"y":4},{"x":6,"y":4},{"x":6,"y":5},{"x":5,"y":5},{"x":5,"y":6},{"x":4,"y":6},{"x":4,"y":7},{"x":3,"y":7},{"x":3,"y":8},{"x":2,"y":8},{"x":2,"y":9},{"x":1,"y":9},{"x":1,"y":10},{"x":0,"y":10},{"x":0,"y":11},{"x":0,"y":12},{"x":0,"y":13},{"x":0,"y":14},{"x":1,"y":14},{"x":1,"y":15},{"x":2,"y":15},{"x":2,"y":16},{"x":3,"y":16},{"x":3,"y":17}],28)
        grid = new Grid(gridSquaresPrAxis,snake);
        algo = new EdgeAdjacencyAlgorithm(snake,grid,undefined,drawCalculations);
        refreshApple();

    };

    sketch.draw = () => {
        // Base
        sketch.background(51);

        // Update states
        if(!isStopped) {
            const algoStart = Date.now();
            const nextMove: CardinalDirectionsEnum | Array<number> = algo.determineNextMoveDirection(tempPath);
            algoTimes.push(Date.now() - algoStart);
            if (Array.isArray(nextMove)) {
                tempPath = nextMove;
            } else {
                tempPath = [];
                console.log(JSON.stringify(snake.getBodyParts))
                console.log(snake.getBodyLength)
                if (!grid.maySnakeMoveInDirection(snake.head, nextMove)) {
                    console.log(JSON.stringify(snake.getBodyParts))
                    console.log(snake.getBodyLength)
                    alert('Dead');
                    startStop();
                } else {
                    const snakeMove = snake.move(nextMove)
                    grid.applySnakeMove(snakeMove)
                    // If the snake has moved into the apple
                    if (snakeMove.newHead.x === apple.getPosition.x && snakeMove.newHead.y === apple.getPosition.y) {
                        snake.increaseBodyLength();
                        refreshApple();
                    }

                    // Save current step state
                    steps.push({
                        snakeBodyParts: JSON.parse(JSON.stringify(snake.getBodyParts)),
                        apple: Object.assign({},apple.getPosition)
                    })
                    console.log(steps)
                }
            }
        }

        // Draw

        // Render snake body
        sketch.fill(255)
        snake.getBodyParts.forEach((position: GridPosition) => {
            sketch.rect(position.x*gridSquareSize,position.y*gridSquareSize,gridSquareSize,gridSquareSize)
        })

        // Render snake head
        sketch.fill(127,255,0)
        sketch.rect(snake.getBodyParts[0].x*gridSquareSize,snake.getBodyParts[0].y*gridSquareSize,gridSquareSize,gridSquareSize)

        // Render apple
        sketch.fill(220,20,60);
        sketch.rect(apple.getPosition.x*gridSquareSize,apple.getPosition.y*gridSquareSize,gridSquareSize,gridSquareSize)

        // Render algorithm
        if(drawCalculations) {
            sketch.stroke(135, 206, 250)
            algo.getPath.forEach((position: GridPosition, i: number) => {
                if (typeof algo.getPath[i - 1] !== 'undefined') {
                    const x1 = algo.getPath[i - 1].x * gridSquareSize + gridSquareSize / 2;
                    const y1 = algo.getPath[i - 1].y * gridSquareSize + gridSquareSize / 2;

                    const x2 = position.x * gridSquareSize + gridSquareSize / 2;
                    const y2 = position.y * gridSquareSize + gridSquareSize / 2;
                    sketch.line(x1, y1, x2, y2);
                }
            })

            // We can't show the algorithm intermediary steps when moving backwards and forwards atm.
            if(showingStep === false){
                sketch.fill(255,0,255);
                for(let x = 0; x < grid.getSize; x++){
                    for(let y = 0; y < grid.getSize; y++){
                        if(algo.getPositionState({x:x,y:y}) === 0){
                            sketch.rect(x*gridSquareSize+10,y*gridSquareSize,5,5)
                        }
                    }
                }
            }
        }

        // Render grid snake state
        sketch.fill(220,20,60);
        sketch.textSize(10);
        for(let x = 0; x < grid.getSize; x++){
            for(let y = 0; y < grid.getSize; y++){
                if(grid.getPositionState({x:x,y:y}) === GridSquareStateEnum.Snake){
                    sketch.rect(x*gridSquareSize,y*gridSquareSize,5,5)

                    sketch.text(x+'.'+y, x*gridSquareSize+5, y*gridSquareSize+gridSquareSize/2);
                }
            }
        }


        updateButtonStates();
        finish()

        if(slowdownPower !== 0) {
            // Slow down!
            let sleepIteration = 0;
            const target = Math.pow(10,slowdownPower)
            while (sleepIteration < target) {
                sleepIteration++;
            }
        }
    };

    /**
     * Refreshes the apple instance being shown.
     * If there is another apple being shown, and its state is still present in the grid, removes it.
     */
    const refreshApple = (setPosition?: GridPosition) => {
        if (apple instanceof Apple && typeof setPosition === 'undefined') {
            if(grid.getPositionState(apple.getPosition) === GridSquareStateEnum.Apple){
                grid.setPositionState(apple.getPosition, GridSquareStateEnum.Empty);
            }
        }

        const start = typeof setPosition === 'undefined' ? grid.findRandomEmptyGridPosition() : setPosition

        apple = new Apple(start)
        grid.setPositionState(apple.getPosition,GridSquareStateEnum.Apple)
        algo.setApple = apple;
    }

    /**
     * End of cycle actions
     */
    const finish = () => {
        iteration++;
        iterations.push(Date.now());
        iterations = iterations.slice(-100);
        algoTimes = algoTimes.slice(-100);

        if(iteration === 10){
            iteration = 0;
            const total = algoTimes.reduce((a, b) => a + b, 0)
            console.log('Average over last 100 iterations: \n\tIteration length: '+((iterations[iterations.length-1] - iterations[0])/100) + 'ms\n\tAlgorithm: '+(total/100)+'ms')
        }
    }

    /**
     * Starts and stops the simulation
     */
    const startStop = () => {
        isStopped = !isStopped;
        // If we have moved around on the steps and are starting up again, start from the designated step
        if(isStopped === false && showingStep !== false){
            steps = steps.slice(0,showingStep);
            showingStep = false;
        }
    }

    /**
     * Steps a single step back, if possible
     */
    const stepBack = () => {
        if(showingStep === 0)
            return;

        showingStep = showingStep === false ? steps.length - 2 : showingStep-1;
        applyStep(showingStep);
    }

    /**
     * Steps a single step forward, if possible
     */
    const stepForward = () => {
        if(showingStep === false || showingStep === steps.length - 1)
            return;

        showingStep = showingStep+1;
        applyStep(showingStep);
    }

    /**
     * Applies a given step to the current state
     * @param step
     */
    const applyStep = (step: number|false) => {
        const stepData = step === false ? steps[steps.length - 1] : steps[step];
        console.log(stepData)
        snake = new Snake(stepData.snakeBodyParts,stepData.snakeBodyParts.length);
        grid = new Grid(gridSquaresPrAxis,snake);
        algo = new EdgeAdjacencyAlgorithm(snake,grid,undefined,drawCalculations);
        refreshApple(stepData.apple);
    }

    /**
     * Updates the disabled state of the various buttons
     */
    const updateButtonStates = () => {
        if(isStopped === false || steps.length === 0){
            moveBackwardsButton.attribute('disabled','')
            moveForwardsButton.attribute('disabled','')
        } else if(showingStep === 0) {
            moveBackwardsButton.attribute('disabled','')
            moveForwardsButton.removeAttribute('disabled')
        } else if(showingStep === steps.length - 1 || showingStep === false) {
            moveBackwardsButton.removeAttribute('disabled')
            moveForwardsButton.attribute('disabled','')
        } else {
            moveBackwardsButton.removeAttribute('disabled')
            moveForwardsButton.removeAttribute('disabled')
        }
    }
}

const myGame = new p5(game);
