import * as p5 from "p5"
import Snake from "@src/classes/Snake";
import Grid from "@src/classes/Grid";
import {CardinalDirectionsEnum, GridPosition, gridSquareSize, gridSquaresPrAxis} from "@src/definitions";
import Apple from "@src/classes/Apple";
import {GridSquareStateEnum} from "@src/classes/GridSquare";
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

    sketch.setup = () => {
        sketch.createCanvas(gridSquareSize*gridSquaresPrAxis, gridSquareSize*gridSquaresPrAxis);
        snake = new Snake();
        // @todo revert when not testing
        //snake = new Snake([{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:0,y:3},{x:0,y:4}],5);
        grid = new Grid(gridSquaresPrAxis,snake);
        algo = new EdgeAdjacencyAlgorithm(snake,grid);
        refreshApple();
    };

    sketch.draw = () => {
        // Base
        sketch.background(51);

        // Update states

        //If testing specific steps
        /*
        const testingSteps: Record<number, CardinalDirectionsEnum> = {
            0: CardinalDirectionsEnum.Right,
            1: CardinalDirectionsEnum.Right,
            2: CardinalDirectionsEnum.Down,
            3: CardinalDirectionsEnum.Down,
            4: CardinalDirectionsEnum.Left,
        }
        const nextMove: CardinalDirectionsEnum = typeof testingSteps[iteration] !== 'undefined' ? testingSteps[iteration] : algo.determineNextMoveDirection();
        */


        const algoStart = Date.now();
        const nextMove: CardinalDirectionsEnum|Array<number> =  algo.determineNextMoveDirection(tempPath);
        algoTimes.push(Date.now() - algoStart);
        if(Array.isArray(nextMove))
        {
            tempPath = nextMove;
        }
        /*        if(!grid.maySnakeMoveInDirection(snake.head,nextMove))
                {
                    alert('Dead');
                    reset();
                    return;
                }



                const snakeMove = snake.move(nextMove)
                grid.applySnakeMove(snakeMove)
                grid.applySnakeDuration(snake);

                // If the snake has moved into the apple
                if(snakeMove.newHead.x === apple.getPosition.x && snakeMove.newHead.y === apple.getPosition.y){
                    snake.increaseBodyLength();
                    snake.appendBodyPart(apple.getPosition);
                    refreshApple();
                }
        */

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

        sketch.stroke(135,206,250)
        algo.getPath.forEach((position:GridPosition,i:number) => {
            if(typeof algo.getPath[i-1] !== 'undefined'){
                const x1 = algo.getPath[i-1].x*gridSquareSize+gridSquareSize/2;
                const y1 = algo.getPath[i-1].y*gridSquareSize+gridSquareSize/2;

                const x2 = position.x*gridSquareSize+gridSquareSize/2;
                const y2 = position.y*gridSquareSize+gridSquareSize/2;
                sketch.line(x1, y1, x2, y2);
            }
        })
        sketch.stroke(0)

        // Only relevant for the NaiveAlgorithm
        /*let last: AlgorithmStep;
        sketch.fill(173,216,230,80)
        algo.getPathSteps.forEach((step: AlgorithmStep) => {
            if(typeof last === 'undefined' || last.direction !== step.direction){
                last = step;
                sketchDirectionalTriangleInPosition(sketch, step.position,step.direction)
            }
        })*/

        finish()
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
    const refreshApple = () => {
        if (apple instanceof Apple) {
            if(grid.getPositionState(apple.getPosition) === GridSquareStateEnum.Apple){
                grid.setPositionState(apple.getPosition, GridSquareStateEnum.Empty);
            }
        }

        apple = new Apple(grid.findRandomEmptyGridPosition())
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
}

const myGame = new p5(game);
