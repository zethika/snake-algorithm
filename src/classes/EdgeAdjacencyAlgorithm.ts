import Snake from "@src/classes/Snake";
import Grid from "@src/classes/Grid";
import Apple from "@src/classes/Apple";
import {CardinalDirectionsEnum, CardinalDirectionsMap} from "@src/definitions";
import {determinePositionInDirection} from "@src/helperFunctions";
import {GridSquareStateEnum} from "@src/classes/GridSquare";

/**
 * The algorithm class
 *
 * Attempts to define the grid into a series of edges, in an adjacency format.
 * Based on these edges, the algorithm attempts to determine the route to the apple or,
 * if not possible, loiter the snake in the most optimal path to wait
 */
export default class EdgeAdjacencyAlgorithm {
    constructor(private snake: Snake, private grid: Grid, private apple?: Apple) {}

    /**
     * Updates the current target apple
     * @param value
     */
    set setApple(value: Apple) {
        this.apple = value;
    }

    /**
     * Gets the next move direction the Snake should take
     */
    determineNextMoveDirection(): CardinalDirectionsEnum{
        // Priorities
        // 1. is there a square next to the head with only 1 empty adjacency, go there
        // @todo is this necessary? Most scenarios I can think of of this being necessary, would implicitly be solved by the "don't split grids" rule?
        // Disabled for now.
        if(false && this.snake.getBodyLength !== 1) {
            const singularDirection = this.determineSingularDirection()
            if(singularDirection !== null)
                return singularDirection;
        }

        // 2. Don't split grids

        // 3. If must split grids, move into the larger grid afterwards


        // Is square empty, go there
        let direction = this.getNextDirectDirection();
        if(!this.grid.maySnakeMoveInDirection(this.snake.head,direction))
            direction = this.attemptNaiveCollisionCorrect(direction);
        return direction
    }

    /**
     * Determines if there is any adjacent blocks to the snake head with only a single open path.
     *
     * @todo make it smarter so it doesn't loop over the same squares multiple times?
     *
     * @returns The direction of the square, or null if none exists
     */
    determineSingularDirection(): CardinalDirectionsEnum|null {
        for (let direction in CardinalDirectionsEnum) {
            if(!this.grid.maySnakeMoveInDirection(this.snake.head,Number(direction)))
                continue;

            const adjacentSquare = determinePositionInDirection(this.snake.head,Number(direction));
            const squaresAdjacent: CardinalDirectionsMap<GridSquareStateEnum|null> = this.grid.getAdjacentSquareStates(adjacentSquare);
            let empty = 0;
            Object.entries(squaresAdjacent).forEach(value => {
                const state: GridSquareStateEnum = value[1];
                if(state === GridSquareStateEnum.Empty || state === GridSquareStateEnum.Apple)
                    empty++;
            })
            if(empty === 1)
                return Number(direction);
        }
        return null;
    }
    /**
     * Gets the next direction the snake should take to move directly towards the apple.
     */
    getNextDirectDirection(): CardinalDirectionsEnum{
        // If further from the x coordinate than the y coordinate, go left or right
        if(Math.abs(this.snake.head.x - this.apple.getPosition.x) > Math.abs(this.snake.head.y - this.apple.getPosition.y) || this.snake.head.y === this.apple.getPosition.y){
            return this.snake.head.x < this.apple.getPosition.x ? CardinalDirectionsEnum.Right : CardinalDirectionsEnum.Left;
        // otherwise, go up or down
        } else {
            return this.snake.head.y < this.apple.getPosition.y ? CardinalDirectionsEnum.Down : CardinalDirectionsEnum.Up;
        }
    }

    /**
     * Attempts to naively correct the given direction for the snake head, simply moving it out of a collision if possible.
     *
     * @param direction
     */
    attemptNaiveCollisionCorrect(direction: CardinalDirectionsEnum): CardinalDirectionsEnum {
        const isHigher = this.snake.head.y < this.apple.getPosition.y;
        const isLeftOf = this.snake.head.x < this.apple.getPosition.x;
        // Preset direction priorities based on where the apple is in relation to the head
        let directions: Array<CardinalDirectionsEnum> = [];
            if(this.snake.head.y === this.apple.getPosition.y){
                directions = (isLeftOf) ?
                    [CardinalDirectionsEnum.Right, CardinalDirectionsEnum.Left, CardinalDirectionsEnum.Down, CardinalDirectionsEnum.Up] :
                    [CardinalDirectionsEnum.Left, CardinalDirectionsEnum.Right, CardinalDirectionsEnum.Down, CardinalDirectionsEnum.Up]
            } else if(this.snake.head.x === this.apple.getPosition.x){
                directions = (isHigher) ?
                    [CardinalDirectionsEnum.Down, CardinalDirectionsEnum.Up, CardinalDirectionsEnum.Right, CardinalDirectionsEnum.Left] :
                    [CardinalDirectionsEnum.Up, CardinalDirectionsEnum.Down, CardinalDirectionsEnum.Right, CardinalDirectionsEnum.Left]
            } else if(isHigher){
            directions = (isLeftOf) ?
                [CardinalDirectionsEnum.Right, CardinalDirectionsEnum.Down, CardinalDirectionsEnum.Left, CardinalDirectionsEnum.Up] :
                [CardinalDirectionsEnum.Down, CardinalDirectionsEnum.Left, CardinalDirectionsEnum.Right, CardinalDirectionsEnum.Up]
        } else {
            directions = (isLeftOf) ?
                [CardinalDirectionsEnum.Right, CardinalDirectionsEnum.Up, CardinalDirectionsEnum.Left, CardinalDirectionsEnum.Down] :
                [CardinalDirectionsEnum.Up, CardinalDirectionsEnum.Left, CardinalDirectionsEnum.Right, CardinalDirectionsEnum.Down]
        }
        directions.splice(directions.indexOf(direction), 1);

        for(let i = 0; i < directions.length; i++){
            if(this.grid.maySnakeMoveInDirection(this.snake.head, directions[i])){
                return directions[i];
            }
        }

        return direction;
    }

}
