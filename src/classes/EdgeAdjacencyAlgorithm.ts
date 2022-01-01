import Snake from "@src/classes/Snake";
import Grid, {GridSquareStateEnum} from "@src/classes/Grid";
import Apple from "@src/classes/Apple";
import {
    CardinalDirectionsEnum,
    getArrayOfAllDirections, GridMap,
    GridPosition,
    ReverseCardinalDirection
} from "@src/definitions";
import {
    getEdgedViableGridsInGrid,
    determineEdgedViableGrid,
    determinePositionInDirection,
    getPositionCoordinatesAsString,
    getWeightedDirections,
    isPositionsAdjacent,
    isPositionsIdentical,
    isPositionValid,
    isPositionViable,
    getFirstViablePositionInGrid,
    mutatePositionByRelativePosition, getNextDirectDirection, countAvailableInEdgedGrid, createHashFromObject
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
     * Is used to hold checksum-like values for previously checked grids.
     * This is then used, such that if the same grid structure presents itself the pathfinder can short-circuit earlier.
     * This is different from the "added" property in the sense that it is safe across different recursion trees, while added is only usable in the same recursion instance.
     *
     * @todo does this mean that "added" is irrelevant, with this one?
     *
     * @private
     */
    private gridsChecked: Record<string,boolean> = {};

    /**
     * A grid the algorithm can use, of 1's and 0's based on the availability of the current grid.
     * This is then mutated while path is created to help simplify calculations and logical expressions
     * @private
     */
    private availableGrid: GridMap<0|1> = {};

    constructor(private snake: Snake, private grid: Grid, private apple?: Apple, private returnPartials?: boolean) {
        this.returnPartials = typeof returnPartials !== 'undefined' ? returnPartials : false
    }

    set setReturnPartials(returnPartials: boolean){
        this.returnPartials = returnPartials;
    }

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
     * Gets the state of the square on a given position
     * @param position
     */
    getPositionState(position: GridPosition): GridSquareStateEnum{
        return this.availableGrid[position.x][position.y]
    }

    /**
     * Gets the next move direction the Snake should take
     */
    determineNextMoveDirection(tempPath: Array<number>): CardinalDirectionsEnum|Array<number>{
        this.buildAvailableGrid();
        // Is square empty, go there
        let direction = getNextDirectDirection(this.snake.head,this.apple.getPosition);
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
    private shouldUseHamiltonian(defaultDirection: CardinalDirectionsEnum){
        // Since it is impossible to kill on own body before 4 bodyparts and the regular algorithm works fine till then
        if(this.snake.getBodyLength < 4)
            return false;

        const nextPosition = determinePositionInDirection(this.snake.head,defaultDirection);

        if(this.positionShareGridWithApple(nextPosition) === false){
            return true;
        }

        if(this.wouldFillSplitGrid(nextPosition)) {
            return true;
        }

        return false;
    }

    /**
     * Determines if a given position is on the same grid as the apple
     * @param position
     * @private
     */
    private positionShareGridWithApple(position: GridPosition): boolean{
        const edgedGrid = determineEdgedViableGrid(1,position,this.availableGrid,{});
        return isPositionValid(this.apple.getPosition,edgedGrid) !== false && edgedGrid[this.apple.getPosition.x][this.apple.getPosition.y] === true
    }

    /**
     * Attempts to determine a direction that allows for a hamiltonian path
     */
    private determineByHamiltonian(tempPath: Array<number>): Array<number>|CardinalDirectionsEnum|null{
        let currentWeightedDirections = getWeightedDirections(this.snake.head,this.apple.getPosition);
        currentWeightedDirections = this.weightDirectionsByLocalState(currentWeightedDirections,this.snake.head);

        this.gridsChecked = {};
        const start = tempPath.length === 0 ? 0 : tempPath[0]
        for(let i = start; i < currentWeightedDirections.length; i++){
            if(i !== tempPath[0])
                tempPath = [i];

            const start = determinePositionInDirection(this.snake.head,currentWeightedDirections[i]);

            this.desiredPathLength = countAvailableInEdgedGrid(determineEdgedViableGrid(1,start,this.availableGrid,{}));
            if(this.isLocalPositionViable(start)){
                this.path = [];
                this.added = {};
                this.addPosition(start);
                const hamResult = this.hamCycleUtil(currentWeightedDirections[i],tempPath, 1);
                if(Array.isArray(hamResult))
                    return hamResult;

                if(hamResult === true)
                    return currentWeightedDirections[i];

                this.removeLatestPosition(start);
            }
        }

        // If none have been found by here, return null for fail
        return null;
    }

    /**
     * Populates the initial state of the available grid, based on the current grid.
     */
    private buildAvailableGrid(){
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
    private hamCycleUtil(originatingDirection: CardinalDirectionsEnum,tempPath: Array<number>, tempPosition: number): boolean|Array<number> {
        const previousPath: GridPosition = this.path[this.path.length - 1];

        // If we have already checked the grid present from this position, short circuit as early as possible
        const edgedGridHash = createHashFromObject(determineEdgedViableGrid(1,previousPath, this.availableGrid,{}));
        if(typeof this.gridsChecked[edgedGridHash] !== 'undefined')
        {
            console.log('short circuit')
            return false;

        }

        this.gridsChecked[edgedGridHash] = true;

        // If we are at the last expected position of the cycle, or the calculated path is longer than the snake
        if (this.path.length === this.desiredPathLength || this.path.length > this.snake.getBodyLength+1) {
            return true;
        }

        // Get directions weighted towards the source
        let directions = getWeightedDirections(previousPath,this.path[0])
        // Remove the direction we came from
        directions.splice(directions.indexOf(ReverseCardinalDirection[originatingDirection]),1);
        directions = directions.filter((direction) => this.isLocalPositionViable(determinePositionInDirection(previousPath,direction)));
        // Reverse the array, we want the path to trend towards the edges away from the target
        directions.reverse();

        directions = this.weightDirectionsByLocalState(directions,previousPath);

        // Check all directions in succession
        for (let i = typeof tempPath[tempPosition] !== 'undefined' ? tempPath[tempPosition] : 0 ; i < 3; i++) {
            // Get the position with the new direction
            const newPosition = determinePositionInDirection(previousPath,directions[i]);
            const coords = getPositionCoordinatesAsString(newPosition);

            // If we have not already checked the position once
            if(isPositionViable(1,newPosition,this.availableGrid) && typeof this.added[coords] === 'undefined'){
                this.addPosition(newPosition,coords)
                if(this.returnPartials && typeof tempPath[tempPosition] === 'undefined'){
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
                this.removeLatestPosition(newPosition,coords)
                tempPath.splice(tempPosition,1)
            }
        }

        /* If no vertex can be added to Hamiltonian Cycle
      constructed so far, then return false */
        return false;
    }

    /**
     * Adds the given position to the various working states
     * @param position
     * @param coords
     * @private
     */
    private addPosition(position: GridPosition, coords?: string){
        if(typeof coords === 'undefined')
            coords = getPositionCoordinatesAsString(position);

        this.path.push(position);
        this.added[coords] = true;
        this.availableGrid[position.x][position.y] = 0;

    }

    /**
     * Removes the given position from the various working states
     * @param position
     * @param coords
     * @private
     */
    private removeLatestPosition(position: GridPosition, coords?: string){
        if(typeof coords === 'undefined')
            coords = getPositionCoordinatesAsString(position);

        this.path.splice(this.path.length-1,1);
        delete this.added[coords]
        this.availableGrid[position.x][position.y] = 1;
    }

    /**
     * Determines if filling the given position, would result in split grids.
     * @param position
     */
    private wouldFillSplitGrid(position: GridPosition): boolean {
        // If position isn't viable to begin with, it can't split
        if (!this.isLocalPositionViable(position))
            return false;

        // Test a 3x3 section of the grid, for if the number of edged grids in it would be different after changing the current position
        const testGrid = this.buildPartialAvailabilityGrid(position, 1);
        const gridsBefore = getEdgedViableGridsInGrid(1, testGrid);
        testGrid[1][1] = 0;
        const gridsAfter = getEdgedViableGridsInGrid(1, testGrid);

        // If there's only one grid before and after (ie. we've only filled a corner, no need to check further)
        if(gridsBefore.length === 1 && gridsBefore.length === gridsAfter.length)
            return false;

        // Check if a path can be found between the smaller edged grids - ie, they are still the same grid

        // Gets a copy of the real grid and applies the testing position to it
        const originalEdgedGrid = determineEdgedViableGrid(1,position,this.availableGrid,{})
        const copy = this.copyAvailableGrid();
        copy[position.x][position.y] = 0;

        let firstFoundGrid: GridMap<boolean>|false = false;
        for(let i = 0; i < gridsAfter.length; i++){
            // Finds a starting position that is available in the grid
            const firstViable = getFirstViablePositionInGrid(true,gridsAfter[i])
            if(firstViable !== false) {
                // Mutate the relative position of the testing grid to the original position on the real grid
                const mutatedViable = mutatePositionByRelativePosition(firstViable, position, {x: 1, y: 1});

                // If the position wasn't originally part of the edged grid, we can ignore it
                if(isPositionValid(mutatedViable,originalEdgedGrid) === false || originalEdgedGrid[mutatedViable.x][mutatedViable.y] === false)
                    continue;

                // Create an edged grid for the first found grid position
                if(firstFoundGrid === false){
                    firstFoundGrid = determineEdgedViableGrid(1,mutatedViable,copy,{})

                // Match all found grids after split, and check if the first viable position is present in the starting grid.
                } else {
                    if(isPositionValid(mutatedViable,firstFoundGrid) === false || firstFoundGrid[mutatedViable.x][mutatedViable.y] === false){
                        return true;
                    }
                }

            }
        }

        // If we get here, the grid wasn't split
        return false
    }

    /**
     * Returns a copy of the local grid
     */
    private copyAvailableGrid(): GridMap<0|1>{
        let copy:GridMap<0|1> = {};

        Object.entries(this.availableGrid).forEach((xEntry) => {
            const x = Number(xEntry[0]);
            copy[x] = {};
            Object.entries(xEntry[1]).forEach((yEntry) => {
                const y = Number(yEntry[0]);
                copy[x][y] = this.availableGrid[x][y];
            })
        })

        return copy;
    }

    /**
     * Builds a partial grid based on the full availability grid, filling a square surrounding the center with a given radius
     *
     * @param center
     * @param radius How far from the center should be filled (ie, 1 will result in a 3x3 grid)
     */
    private buildPartialAvailabilityGrid(center: GridPosition, radius: number): GridMap<0|1>{
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
     * Sorts an array of directions, based on the number of edges adjacent to a neighbor of the source in the single direction, as well as whether a direction would split grids
     * @param directions
     * @param source
     */
    private weightDirectionsByLocalState(directions: Array<CardinalDirectionsEnum>, source: GridPosition){

        directions.sort((a,b) => {
            const aPosition = determinePositionInDirection(source,a);
            const bPosition = determinePositionInDirection(source,b);

            // If the apple is adjacent to the snake, attempt that direction first always
            const aApple = isPositionsIdentical(aPosition,this.apple.getPosition)
            const bApple = isPositionsIdentical(bPosition,this.apple.getPosition)
            if(aApple || bApple)
                return aApple ? -1 : 1

            const aWouldSplit = this.wouldFillSplitGrid(aPosition)
            const bWouldSplit = this.wouldFillSplitGrid(bPosition)
            // If one direction would split the grid, deprioritize it
            if(aWouldSplit !== bWouldSplit)
                return aWouldSplit ? 1 : -1

            const aCount = countAvailableInEdgedGrid(determineEdgedViableGrid(1,aPosition,this.availableGrid,{}))
            const bCount = countAvailableInEdgedGrid(determineEdgedViableGrid(1,bPosition,this.availableGrid,{}))

            // If the space available in either of the directions is less than the space required for the snake, and not in the other, prioritize the one where the snake has enough space
            if((aCount < this.snake.getBodyLength || bCount < this.snake.getBodyLength) && (aCount >= this.snake.getBodyLength || bCount >= this.snake.getBodyLength))
                return aCount >= this.snake.getBodyLength  ? -1 : 1;

            const aIsInGridWithApple = this.positionShareGridWithApple(aPosition);
            const bIsInGridWithApple = this.positionShareGridWithApple(bPosition);

            // Prioritize the direction which is in the grid with the apple
            if(aIsInGridWithApple !== bIsInGridWithApple)
                return aIsInGridWithApple ? -1 : 1;

            // Prioritise the largest section
            if(aCount !== bCount)
                return aCount < bCount ? 1 : -1

            const aEdges = this.determineAdjacentEdgesOnPosition(aPosition);
            const bEdges = this.determineAdjacentEdgesOnPosition(bPosition);
            // All else being equal, stick to edges as much as possible
            if(aEdges === bEdges) return 0;
            return (aEdges < bEdges) ? 1 : -1;

        })

        return directions;
    }

    /**
     * Determines the number of edges present on a position in a given direction from the given position
     */
    private determineAdjacentEdgesOnPosition(position: GridPosition): number{
        if(!this.isLocalPositionViable(position))
            return 0;

        let edges = 4;
        const directions = getArrayOfAllDirections();
        for(let i = 0; i < directions.length; i++){
            if(this.isLocalPositionViable(determinePositionInDirection(position,directions[i]))){
                edges--;
            }
        }
        return edges;
    }

    /**
     * generic local helper for the isPositionViable function
     * @param position
     */
    private isLocalPositionViable(position: GridPosition): boolean {
        return isPositionViable(1, position, this.availableGrid)
    }

    /**
     * Attempts to naively correct the given direction for the snake head, simply moving it out of a collision if possible.
     *
     * @param direction
     */
    private attemptNaiveCollisionCorrect(direction: CardinalDirectionsEnum): CardinalDirectionsEnum {

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
