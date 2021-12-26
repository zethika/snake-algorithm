import Snake from "@src/classes/Snake";
import Grid from "@src/classes/Grid";
import Apple from "@src/classes/Apple";
import {CardinalDirectionsEnum, CardinalDirectionsMap, GridPosition, ReverseCardinalDirection} from "@src/definitions";
import {
    determinePositionInDirection,
    getWeightedDirections,
    isPositionsAdjacent,
    isPositionsIdentical
} from "@src/helperFunctions";
import {GridSquareStateEnum} from "@src/classes/GridSquare";

/**
 * The algorithm class
 *
 * Attempts to define the grid into a series of edges, in an adjacency format.
 * Based on these edges, the algorithm attempts to determine the route to the apple or,
 * if not possible, loiter the snake in the most optimal path to wait
 */
export default class EdgeAdjacencyAlgorithm {
    private desiredPathLength: number;
    private currentWeightedDirections: Array<CardinalDirectionsEnum>;

    private path: Array<GridPosition> = [];

    /**
     * A set of coordinates in string format with an attached boolean.
     * Is used to determine whether the algorithm has already checked a given coordinate set as easily as possible.
     * @private
     */
    private added: Record<string,boolean> = {};

    /**
     * A grid the algorithm can use, of 1's and 0's based on the availability of the current grid.
     * This is then mutated while path is created to help simplify calculations and logical expressions
     * @private
     */
    private availableGrid: Record<number,Record<number, 0|1>> = {};

    constructor(private snake: Snake, private grid: Grid, private apple?: Apple) {}

    get getPath(){
        return this.path;
    }

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
    determineNextMoveDirection(tempPath: Array<number>): CardinalDirectionsEnum|Array<number>{
        // Hamiltonian logic
        const hamDirection = this.determineByHamiltonian(tempPath);
        if(hamDirection !== null)
            return hamDirection;

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
     * Attempts to determine a direction that allows for a hamiltonian cycle
     */
    determineByHamiltonian(tempPath: Array<number>): Array<number>|CardinalDirectionsEnum|null{
        this.buildAvailableGrid();
        this.desiredPathLength = this.grid.getSize*this.grid.getSize - this.snake.getBodyLength + 1;
        const currentWeightedDirections = getWeightedDirections(this.snake.head,this.apple.getPosition);
        currentWeightedDirections.sort((a,b) => {
            return (this.determineAdjacentEdgesInDirection(this.snake.head,a) > this.determineAdjacentEdgesInDirection(this.snake.head,b)) ? 1 : -1;
        })

        const start = tempPath.length === 0 ? 0 : tempPath[0]
        for(let i = start; i < currentWeightedDirections.length; i++){
            if(i !== tempPath[0])
            {
                tempPath = [i+0];
            }
            if(this.grid.maySnakeMoveInDirection(this.snake.head,currentWeightedDirections[i])){
                this.path = [determinePositionInDirection(this.snake.head,currentWeightedDirections[i])];
                this.added = {};
                this.added[this.path[0].x+'-'+this.path[0].y] = true;
                const hamResult = this.hamCycleUtil(currentWeightedDirections[i],tempPath, 1);
                if(Array.isArray(hamResult))
                    return hamResult;
                if(hamResult)
                    return currentWeightedDirections[i];
            }
        }

        // If none have been found by here, return null for fail
        return null;
    }

    /**
     * Populates the initial state of the available grid, based on the current grid.
     */
    buildAvailableGrid(){
        for(let x = 0; x < this.grid.getSize; x++){
            this.availableGrid[x] = [];
            for(let y = 0; y < this.grid.getSize; y++){
                this.availableGrid[x][y] = this.grid.getPositionState({x: x, y: y}) !== GridSquareStateEnum.Snake ? 1 : 0;
            }
        }
    }

    /**
     * A recursive utility function
     * to solve hamiltonian cycle problem
     * */
    hamCycleUtil(originatingDirection: CardinalDirectionsEnum,tempPath: Array<number>, tempPosition: number): boolean|Array<number> {
        const previousPath: GridPosition = this.path[this.path.length - 1];

        // If we are at the last expected position of the cycle
        if (this.path.length === this.desiredPathLength) {
            // Return true if the first and last positions are adjacent
            return isPositionsAdjacent(previousPath,this.path[0]);
        }

        // Get directions weighted towards the source
        let directions = getWeightedDirections(previousPath,this.path[0])
        // Remove the direction we came from
        directions.splice(directions.indexOf(ReverseCardinalDirection[originatingDirection]),1);
        // Reverse the array, we want the path to trend towards the edges away from the target
        directions.reverse();

        // Check all directions in succession
        for (let i = typeof tempPath[tempPosition] !== 'undefined' ? tempPath[tempPosition] : 0 ; i < 3; i++) {
            // Get the position with the new direction
            const newPosition = determinePositionInDirection(previousPath,directions[i]);
            // Check if a snake may move in that direction to begin with
            if (this.isPositionViable(newPosition)) {
                const coords = newPosition.x+'-'+newPosition.y;
                // If we have not already checked the position once
                if(typeof this.added[coords] === 'undefined'){
                    this.path.push(newPosition);
                    this.added[coords] = true;
                    this.availableGrid[newPosition.x][newPosition.y] = 0;

                    if(typeof tempPath[tempPosition] === 'undefined'){
                        tempPath[tempPosition] = i;
                        return tempPath;
                    }
                    // Proceed to the next point
                    const hamResult = this.hamCycleUtil(directions[i],tempPath,tempPosition+1);
                    if(Array.isArray(hamResult))
                        return hamResult;
                    if(hamResult === true)
                        return true;

                    //if (this.hamCycleUtil(directions[i],tempPath,tempPosition+1) === true) return true;

                    // Remove from path if not viable
                    this.path.splice(this.path.length-1,1);
                    delete this.added[coords]
                    this.availableGrid[newPosition.x][newPosition.y] = 1;
                    tempPath.splice(tempPosition,1)
                }
            }
        }

        /* If no vertex can be added to Hamiltonian Cycle
      constructed so far, then return false */
        return false;
    }

    /**
     * Determines the number of edges present on a position in a given direction from the given position
     */
    determineAdjacentEdgesInDirection(position: GridPosition, direction: CardinalDirectionsEnum): number{
        const newPosition = determinePositionInDirection(position,direction);
        let edges = 4;
        const directions = [CardinalDirectionsEnum.Right, CardinalDirectionsEnum.Left, CardinalDirectionsEnum.Down, CardinalDirectionsEnum.Up];
        for(let i = 0; i < directions.length; i++){
            if(this.isPositionViable(determinePositionInDirection(newPosition,directions[i]))){
                edges--;
            }
        }
        return edges;
    }

    /**
     * Determines if the position is valid
     * @param position
     */
    isPositionViable(position: GridPosition): boolean {
        if(!this.isPositionValid(position))
            return false;

        return (this.availableGrid[position.x][position.y] === 1)
    }

    /**
     * Judges whether a given position is a valid position on the available grid
     */
    isPositionValid(position: GridPosition): boolean{
        return typeof this.availableGrid[position.x] !== 'undefined' && typeof this.availableGrid[position.x][position.y] !== 'undefined';
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

        let directions = getWeightedDirections(this.snake.head,this.apple.getPosition);

        directions.splice(directions.indexOf(direction), 1);

        for(let i = 0; i < directions.length; i++){
            if(this.grid.maySnakeMoveInDirection(this.snake.head, directions[i])){
                return directions[i];
            }
        }

        return direction;
    }
}
