import Snake from "@src/classes/Snake";
import Grid from "@src/classes/Grid";
import Apple from "@src/classes/Apple";
import {CardinalDirectionsEnum, GridPosition} from "@src/definitions";
import {determinePositionInDirection} from "@src/helperFunctions";

export interface AlgorithmStep {
    position: GridPosition,
    direction: CardinalDirectionsEnum
}

/**
 * The algorithm class
 * Is responsible for directing the snake towards the given apple, on the given grid.
 * Calculates the route once and then feeds the next steps sequentially.
 * Recalculates if the apple changes
 *
 * @notice incomplete, will frequently die - the correction is too naive and will leave the head in an unrecoverable position
 * @notice deprecated for EdgeAdjacencyAlgorithm, left for posterity.
 */
export default class NaiveAlgorithm {
    private lastTarget: GridPosition;
    private pathSteps: Array<AlgorithmStep>;

    constructor(private snake: Snake, private grid: Grid, private apple?: Apple) {}

    get getPathSteps(): Array<AlgorithmStep> {
        return this.pathSteps;
    }

    /**
     * Updates the current target apple
     * @param value
     */
    set setApple(value: Apple) {
        this.apple = value;
    }

    /**
     * Determines if the current state requires recalculating the route.
     * This is done on the initial call, as well as whenever the apple changes position.
     */
    needsRecalculation(): boolean{
        return (typeof this.lastTarget === 'undefined' || this.lastTarget.x !== this.apple.getPosition.x || this.lastTarget.y !== this.apple.getPosition.y)
    }

    /**
     * The main algorithm call
     */
    calculatePath(){
        this.pathSteps = [];
        let workingPosition: GridPosition = this.snake.head;
        const targetX = this.apple.getPosition.x;
        const targetY = this.apple.getPosition.y
        console.log('**********************************************')
        console.log('**********************************************')
        console.log('************************ALGO******************')
        console.log('**********************************************')
        console.log('**********************************************')
        console.log('**********************************************')
        let step = 0;
        while(true){
            let direction = undefined;
            // Working is outside upwards spine
            if(workingPosition.x > 1){
                // target is above current, move left if possible otherwise down
                if(targetY < workingPosition.y){
                    direction = this.grid.maySnakeMoveInDirection(workingPosition,CardinalDirectionsEnum.Left, step) ? CardinalDirectionsEnum.Left : CardinalDirectionsEnum.Down;

                // On same column, attempt to move down
                } else if(targetX === workingPosition.x && this.grid.maySnakeMoveInDirection(workingPosition,CardinalDirectionsEnum.Down, step)){
                    direction = CardinalDirectionsEnum.Down
                }
            }

            // Default back to basic loop algorithm if no shortcut has been found
            if(typeof direction === 'undefined')
                direction = this.calculateNextBasicMoveDirection(workingPosition);

            direction = this.attemptCorrectDirection(workingPosition,direction,step);
            console.log('determined direction: '+direction)
            this.pathSteps.push({
                position: workingPosition,
                direction: direction
            })
            workingPosition = determinePositionInDirection(workingPosition,direction)
            if(workingPosition.x === targetX && workingPosition.y === targetY)
                break;

            step++;
        }
        this.lastTarget = this.apple.getPosition
    }

    /**
     * Attempts to naively correct the direction based on allowed directions from the grid
     *
     * @param position
     * @param direction
     * @param inSteps
     */
    attemptCorrectDirection(position: GridPosition, direction: CardinalDirectionsEnum, inSteps: number): CardinalDirectionsEnum {
        if (this.grid.maySnakeMoveInDirection(position, CardinalDirectionsEnum.Down, inSteps))
            return direction;

        // The directions prioritized - Attempt to go to the right spine, otherwise down, otherwise left, otherwise up
        let directions = [
            CardinalDirectionsEnum.Right,
            CardinalDirectionsEnum.Down,
            CardinalDirectionsEnum.Left,
            CardinalDirectionsEnum.Up
        ]

        directions.splice(directions.indexOf(direction), 1);

        for(let i = 0; i < directions.length; i++){
            if(this.grid.maySnakeMoveInDirection(position, directions[i], inSteps)){
                console.log('hey')
                return directions[i];
            }
        }

        return direction;
    }

    /**
     * Calculates the next direction a snake head at the given position should move in.
     * This is the default algorithm the snake falls back to, if it cannot determine another, better route.
     *
     * @notice Only works when the grid size is even
     *
     * @param position
     */
    calculateNextBasicMoveDirection(position: GridPosition){
        let direction: CardinalDirectionsEnum;
        const mod = position.y % 2;
        // If we are not in the 2 leftmost columns
        if(position.x > 1) {
            // If at the rightmost edge, go left every other time, else down
            if (position.x === this.grid.getSize - 1) {
                direction = mod === 1 ? CardinalDirectionsEnum.Left : CardinalDirectionsEnum.Down

            // If on the leftmost edge of the regular pattern (x = 2), not in the top row and not in the bottom row, alternative between right and down
            } else if (position.x === 2 && position.y !== 0 && position.y !== this.grid.getSize - 1) {
                direction = mod === 0 ? CardinalDirectionsEnum.Right : CardinalDirectionsEnum.Down

            // Else move across the grid, alternating between right and left
            } else {
                direction = mod === 0 ? CardinalDirectionsEnum.Right : CardinalDirectionsEnum.Left
            }

        // In 0,0 - always go right
        } else if(position.y === 0){
            direction = CardinalDirectionsEnum.Right

        // In the leftmost position (x = 0), go right every other time, else up
        } else if(position.x === 0){
            direction = mod === 0 ? CardinalDirectionsEnum.Right : CardinalDirectionsEnum.Up;

        // One off the leftmost (x = 1), go left every other time, else up
        } else {
            direction = mod === 1 ? CardinalDirectionsEnum.Left : CardinalDirectionsEnum.Up;
        }
        return direction;
    }

    /**
     * Gets the next move direction the Snake should take and removes it from the current path
     * If necessary, recalculates the route.
     */
    determineNextMoveDirection(): CardinalDirectionsEnum{
        if(this.needsRecalculation())
            this.calculatePath();

        const nextStep: AlgorithmStep = this.pathSteps.shift();
        return nextStep.direction;
    }
}
