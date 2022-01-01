import * as p5 from "p5"
import Snake from "@src/classes/Snake";
import Grid, {GridSquareStateEnum} from "@src/classes/Grid";
import {
    CardinalDirectionsEnum,
    drawCalculations,
    GridPosition,
    gridSquareSize,
    gridSquaresPrAxis, slowdownPower
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
    let stopButton;

    sketch.setup = () => {
        // Environment setup
        sketch.createCanvas(gridSquareSize*gridSquaresPrAxis, gridSquareSize*gridSquaresPrAxis);
        stopButton = sketch.createButton('Start/Stop')
        stopButton.position(8, gridSquareSize*gridSquaresPrAxis+10);
        stopButton.mousePressed(startStop);

        // Game setup
        snake = new Snake();
        //snake = new Snake([{"x":0,"y":16},{"x":1,"y":16},{"x":1,"y":15},{"x":2,"y":15},{"x":2,"y":14},{"x":3,"y":14},{"x":3,"y":13},{"x":4,"y":13},{"x":5,"y":13},{"x":6,"y":13},{"x":7,"y":13},{"x":8,"y":13},{"x":9,"y":13},{"x":9,"y":14},{"x":10,"y":14},{"x":10,"y":15},{"x":11,"y":15},{"x":11,"y":16},{"x":12,"y":16},{"x":12,"y":17},{"x":12,"y":18},{"x":13,"y":18},{"x":14,"y":18},{"x":15,"y":18},{"x":16,"y":18},{"x":17,"y":18},{"x":18,"y":18},{"x":19,"y":18},{"x":19,"y":17},{"x":19,"y":16},{"x":19,"y":15},{"x":19,"y":14},{"x":19,"y":13},{"x":18,"y":13},{"x":17,"y":13},{"x":16,"y":13},{"x":15,"y":13},{"x":15,"y":12},{"x":14,"y":12},{"x":13,"y":12},{"x":13,"y":11},{"x":12,"y":11},{"x":12,"y":10},{"x":13,"y":10},{"x":14,"y":10},{"x":15,"y":10},{"x":15,"y":9},{"x":14,"y":9},{"x":14,"y":8},{"x":13,"y":8},{"x":13,"y":9},{"x":12,"y":9},{"x":12,"y":8},{"x":11,"y":8},{"x":11,"y":7}],55)
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
                if (!grid.maySnakeMoveInDirection(snake.head, nextMove)) {
                    console.log(JSON.stringify(snake.getBodyParts))
                    console.log(snake.getBodyLength)
                    alert('Dead');
                    reset();
                    return;
                }

                const snakeMove = snake.move(nextMove)
                grid.applySnakeMove(snakeMove)
                // If the snake has moved into the apple
                if (snakeMove.newHead.x === apple.getPosition.x && snakeMove.newHead.y === apple.getPosition.y) {
                    snake.increaseBodyLength();
                    refreshApple();
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

        sketch.fill(255,0,255);
        for(let x = 0; x < grid.getSize; x++){
            for(let y = 0; y < grid.getSize; y++){
                if(algo.getPositionState({x:x,y:y}) === 0){
                    sketch.rect(x*gridSquareSize+10,y*gridSquareSize,5,5)

                }
            }
        }


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
     * Resets all the various states
     */
    const reset = () => {
        snake = new Snake();
        grid = new Grid(gridSquaresPrAxis,snake);
        algo = new EdgeAdjacencyAlgorithm(snake,grid);
        refreshApple();
    }

    /**
     * Refreshes the apple instance being shown.
     * If there is another apple being shown, and its state is still present in the grid, removes it.
     */
    const refreshApple = (setPosition?: GridPosition) => {
        if (apple instanceof Apple) {
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
    }
}

const myGame = new p5(game);
