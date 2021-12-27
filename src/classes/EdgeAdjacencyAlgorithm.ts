import Snake from "@src/classes/Snake";
import Grid, {GridSquareStateEnum} from "@src/classes/Grid";
import Apple from "@src/classes/Apple";
import {
    CardinalDirectionsEnum,
    CardinalDirectionsMap,
    getArrayOfAllDirections, GridMap,
    GridPosition,
    ReverseCardinalDirection
} from "@src/definitions";
import {
    determineEdgedViableGrid,
    determinePositionInDirection,
    getWeightedDirections,
    isPositionsAdjacent,
    isPositionsIdentical, isPositionValid, isPositionViable
} from "@src/helperFunctions";

/**
 * The algorithm class
 *
 * Attempts to define the grid into a series of edges, in an adjacency format.
 * Based on these edges, the algorithm attempts to determine the route to the apple or,
 * if not possible, loiter the snake in the most optimal path to wait
 */
export default class EdgeAdjacencyAlgorithm {
    private desiredPathLength: number;

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
    private availableGrid: GridMap<0|1> = {};

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
        this.buildAvailableGrid();
        // Is square empty, go there
        let direction = this.getNextDirectDirection();
        if(!this.grid.maySnakeMoveInDirection(this.snake.head,direction))
            direction = this.attemptNaiveCollisionCorrect(direction);

        if(this.shouldUseHamiltonian(direction)) {
            // Hamiltonian logic
            const hamDirection = this.determineByHamiltonian(tempPath);
            if (hamDirection !== null)
                return hamDirection;
        }


        return direction
    }

    /**
     * Determines if hamiltonian logic should be applied to the next step
     * Since it is a much heavier process, we should disable it when possible
     */
    shouldUseHamiltonian(defaultDirection: CardinalDirectionsEnum){
        // Since it is impossible to kill on own body before 4 bodyparts and the regular algorithm works fine till then
        if(this.snake.getBodyLength < 4)
            return false;

        const nextPosition = determinePositionInDirection(this.snake.head,defaultDirection);

        if(this.wouldFillSplitGrid(nextPosition))
            return true;

        return false;
    }

    /**
     * Attempts to determine a direction that allows for a hamiltonian path
     */
    determineByHamiltonian(tempPath: Array<number>): Array<number>|CardinalDirectionsEnum|null{
        let currentWeightedDirections = getWeightedDirections(this.snake.head,this.apple.getPosition);
        currentWeightedDirections = this.sortDirectionsByEdgesOnAdjacentPositions(currentWeightedDirections,this.snake.head);

        const start = tempPath.length === 0 ? 0 : tempPath[0]
        for(let i = start; i < currentWeightedDirections.length; i++){
            if(i !== tempPath[0])
                tempPath = [i];
            const start = determinePositionInDirection(this.snake.head,currentWeightedDirections[i]);
            const constrainedGrid = determineEdgedViableGrid(1,start,this.availableGrid,{});
            this.desiredPathLength = Object.keys(constrainedGrid).filter((key) => constrainedGrid[key] === true).length;
            if(this.isLocalPositionViable(start)){
                this.path = [start];
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
            return true;
        }


        // Get directions weighted towards the source
        let directions = getWeightedDirections(previousPath,this.path[0])
        // Remove the direction we came from
        directions.splice(directions.indexOf(ReverseCardinalDirection[originatingDirection]),1);
        directions = directions.filter((direction) => this.isLocalPositionViable(determinePositionInDirection(previousPath,direction)));
        // Reverse the array, we want the path to trend towards the edges away from the target
        directions.reverse();

        directions = this.sortDirectionsByEdgesOnAdjacentPositions(directions,previousPath);

        //directions = this.deprioritizeDirectionsResultingInGridSplit(directions,previousPath);

        // Check all directions in succession
        for (let i = typeof tempPath[tempPosition] !== 'undefined' ? tempPath[tempPosition] : 0 ; i < 3; i++) {
            // Get the position with the new direction
            const newPosition = determinePositionInDirection(previousPath,directions[i]);
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

                // Remove from path if not viable
                this.path.splice(this.path.length-1,1);
                delete this.added[coords]
                this.availableGrid[newPosition.x][newPosition.y] = 1;
                tempPath.splice(tempPosition,1)
            }
        }

        /* If no vertex can be added to Hamiltonian Cycle
      constructed so far, then return false */
        return false;
    }

    /**
     * Deprioritizes directions which results in splitting the grid into multiple subgrids
     */
    deprioritizeDirectionsResultingInGridSplit(directions: Array<CardinalDirectionsEnum>, source: GridPosition){
        // If there isn't enough elements to sort, short circuit
        if(directions.length < 2)
            return directions;

        const directionResults: Record<number, boolean> = directions.map((direction) => this.wouldFillSplitGrid(determinePositionInDirection(source,direction)));
        directions.sort((a,b) => {
            if(directionResults[a] === directionResults[b]) return 0;
            return (directionResults[a] === true) ? 1 : -1;
        })
        return directions;
    }

    /**
     * Determines if filling the given position, would result in split grids.
     * @param position
     */
    wouldFillSplitGrid(position: GridPosition): boolean{
        if(!this.isLocalPositionViable(position))
            return false;

        const testGrid = this.buildPartialAvailabilityGrid(position,1);
        let gridsBefore = [];


        console.log(position,testGrid);

        return false;
    }

    /**
     * Builds a partial grid based on the full availability grid, filling a square surrounding the center with a given radius
     *
     * @param center
     * @param radius How far from the center should be filled (ie, 1 will result in a 3x3 grid)
     */
    buildPartialAvailabilityGrid(center: GridPosition, radius: number): GridMap<0|1>{
        let grid: GridMap<0|1> = {};
        let currentX = 0;

        const startX = center.x-radius
        const startY = center.y-radius;
        const maxX = center.x+radius;
        const maxY = center.y+radius;
        for(let x = startX; x <= maxX; x++){
            let currentY = 0;
            grid[currentX] = {};
            for(let y = startY; y <= maxY; y++){
                grid[currentX][currentY] = this.isLocalPositionViable({x:x,y:y}) ? 1 : 0;
                currentY++;
            }
            currentX++;
        }

        return grid;
    }

    /**
     * Sorts an array of directions, based on the number of edges adjacent to a neighbor of the source in the single direction
     * @param directions
     * @param source
     */
    sortDirectionsByEdgesOnAdjacentPositions(directions: Array<CardinalDirectionsEnum>, source: GridPosition){
        directions.sort((a,b) => {
            const aEdges = this.determineAdjacentEdgesInDirection(source,a);
            const bEdges = this.determineAdjacentEdgesInDirection(source,b);
            if(aEdges === bEdges) return 0;
            return (aEdges < bEdges) ? 1 : -1;
        })
        return directions;
    }

    /**
     * Determines the number of edges present on a position in a given direction from the given position
     */
    determineAdjacentEdgesInDirection(position: GridPosition, direction: CardinalDirectionsEnum): number{
        const newPosition = determinePositionInDirection(position,direction);
        if(!this.isLocalPositionViable(newPosition))
            return 0;

        let edges = 4;
        const directions = getArrayOfAllDirections();
        for(let i = 0; i < directions.length; i++){
            if(this.isLocalPositionViable(determinePositionInDirection(newPosition,directions[i]))){
                edges--;
            }
        }
        return edges;
    }

    /**
     * generic local helper for the isPositionViable function
     * @param position
     */
    isLocalPositionViable(position: GridPosition): boolean {
        return isPositionViable(1, position, this.availableGrid)
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
