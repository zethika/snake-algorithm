import {CardinalDirectionsEnum, getArrayOfAllDirections, GridMap, GridPosition, gridSquareSize} from "@src/definitions";
import * as p5 from "p5";

/**
 * Returns a new GridPosition object relative to the given position, moved one step in a given cardinal direction
 *
 * @param position
 * @param direction
 */
export function determinePositionInDirection(position: GridPosition, direction: CardinalDirectionsEnum){
    let newPosition: GridPosition = Object.assign({},position);
    if(direction === CardinalDirectionsEnum.Down || direction === CardinalDirectionsEnum.Up){
        newPosition.y = direction === CardinalDirectionsEnum.Down ? newPosition.y + 1 : newPosition.y - 1;
    }else{
        newPosition.x = direction === CardinalDirectionsEnum.Right ? newPosition.x + 1 : newPosition.x - 1
    }
    return newPosition
}

/**
 * Returns true if both positions are at the same coordinates
 * @param position1
 * @param position2
 */
export function isPositionsIdentical(position1: GridPosition, position2: GridPosition): boolean {
    return position1.x === position2.x && position1.y === position2.y
}

/**
 * Judges whether a given position is a valid position on a given grid
 */
export function isPositionValid(position: GridPosition, grid: GridMap<any>): boolean{
    return typeof grid[position.x] !== 'undefined' && typeof grid[position.x][position.y] !== 'undefined';
}

/**
 * Determines if the position is valid
 * @param viableValue
 * @param position
 * @param grid
 */
export function isPositionViable(viableValue: any, position: GridPosition, grid: GridMap<any>): boolean {
    if(!isPositionValid(position, grid))
        return false;

    return (grid[position.x][position.y] === viableValue)
}


/**
 * Recursive function which builds a coordinate grid constrained by position viability.
 * The returned object also contains all the edges of the constrained grid (represented by a false value)
 *
 * @param viableValue
 * @param position
 * @param grid
 * @param hasChecked
 * @return An object with the keys representing a position on the grid, and the value whether it was viable
 */
export function determineEdgedViableGrid(viableValue: any, position: GridPosition, grid: GridMap<any>, hasChecked: GridMap<boolean>): GridMap<boolean>{
    // If we have already checked this position, short circuit
    if(isPositionValid(position,hasChecked))
        return hasChecked;

    // If the position isn't valid, set as edge and short circuit
    if(!isPositionViable(viableValue,position,grid))
    {
        hasChecked = setGridPositionValue(position,false,hasChecked)
        return hasChecked;
    }

    // Set the current position as checked
    hasChecked = setGridPositionValue(position,true,hasChecked)

    // Loop through all directions and get their viable grid
    const directions = getArrayOfAllDirections();
    for(let i = 0; i < directions.length; i++){
        hasChecked = determineEdgedViableGrid(viableValue,determinePositionInDirection(position,directions[i]),grid,hasChecked);
    }

    return hasChecked;
}

/**
 * Counts the number of available squares in an edged grid
 * @param grid
 */
export function countAvailableInEdgedGrid(grid: GridMap<boolean>): number{
    let count = 0;
    Object.entries(grid).forEach(xRecord => {
        Object.entries(xRecord[1]).forEach(yRecord => {
            if(yRecord[1] === true)
                count++;
        })
    })

    return count
}

/**
 * Sets a value on a grid
 */
export function setGridPositionValue(position: GridPosition, value: any, grid: GridMap<any>){
    if(typeof grid[position.x] === 'undefined'){
        grid[position.x] = {}
    }
    grid[position.x][position.y] = value;

    return grid;
}

/**
 * Gets all separately edged grids present in a given grid
 *
 * @param viableValue
 * @param grid
 */
export function getEdgedViableGridsInGrid(viableValue: any, grid: GridMap<any>): Array<GridMap<boolean>>{
    let grids: Array<GridMap<boolean>> = [];
    let hasCheckedGlobal: Record<string, boolean> = {}

    // Loops over each position on the grid
    Object.entries(grid).forEach((xEntry) => {
        Object.entries(xEntry[1]).forEach((yEntry) => {
            const position: GridPosition = {x: Number(xEntry[0]), y: Number(yEntry[0])}
            // If the current position is viable to begin with, and hasn't already been checked once
            if(yEntry[1] === viableValue && typeof hasCheckedGlobal[getPositionCoordinatesAsString(position)] === 'undefined'){

                // Determine the edged viable grid from the given position
                const edgedGrid = determineEdgedViableGrid(viableValue,position,grid,{})

                // Assign the known state to the global has checked, to prevent duplicate checks
                Object.entries(edgedGrid).forEach((xEntry) => {
                    const xValue = Number(xEntry[0]);
                    Object.entries(xEntry[1]).forEach(yEntry => {
                        hasCheckedGlobal[getPositionCoordinatesAsString({x:xValue,y:Number(yEntry[0])})] = true;
                    })
                })
                // Save the grid - each edged grid will only be looped over once, on the first square encountered in it, due to saving the global state.
                grids.push(edgedGrid);
            }
        })
    })
    return grids;
}

/**
 * Returns an array of directions, weighted by one source position towards a target position
 */
export function getWeightedDirections(source: GridPosition, target: GridPosition): Array<CardinalDirectionsEnum>{
    const isHigher = source.y < target.y;
    const isLeftOf = source.x < target.x;

    let directions: Array<CardinalDirectionsEnum> = [];
    if(source.y === target.y){
        directions = (isLeftOf) ?
            [CardinalDirectionsEnum.Right, CardinalDirectionsEnum.Left, CardinalDirectionsEnum.Down, CardinalDirectionsEnum.Up] :
            [CardinalDirectionsEnum.Left, CardinalDirectionsEnum.Right, CardinalDirectionsEnum.Down, CardinalDirectionsEnum.Up]
    } else if(source.x === target.x){
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
    return directions;
}

/**
 * Gets the next direction that would move most towards the target position from the source position
 */
export function getNextDirectDirection(source: GridPosition, target: GridPosition): CardinalDirectionsEnum{
    // If further from the x coordinate than the y coordinate, go left or right
    if(Math.abs(source.x - target.x) > Math.abs(source.y - target.y) || source.y === target.y){
        return source.x < target.x ? CardinalDirectionsEnum.Right : CardinalDirectionsEnum.Left;
        // otherwise, go up or down
    } else {
        return source.y < target.y ? CardinalDirectionsEnum.Down : CardinalDirectionsEnum.Up;
    }
}

/**
 * Determines if two GridPositions are adjacent
 *
 * @todo should be possible with pure math - replace?
 *
 * @param position1
 * @param position2
 */
export function isPositionsAdjacent(position1: GridPosition, position2: GridPosition): boolean{
    if(position1.x === position2.x){
        return Math.abs(position1.y - position2.y) === 1
    } else if(position1.y === position2.y){
        return Math.abs(position1.x - position2.x) === 1
    }
    return false;
}

/**
 * Draws a triangle with its point pointing towards a given direction, in a given position
 * @param sketch
 * @param position
 * @param direction
 */
export function sketchDirectionalTriangleInPosition(sketch: p5, position: GridPosition, direction: CardinalDirectionsEnum){
    const startX = position.x*gridSquareSize;
    const startY = position.y*gridSquareSize;
    switch (direction){
        case CardinalDirectionsEnum.Down:
            sketch.triangle(startX, startY, startX+gridSquareSize, startY, startX+(gridSquareSize/2), startY+gridSquareSize);
            break;
        case CardinalDirectionsEnum.Left:
            sketch.triangle(startX+gridSquareSize, startY, startX+gridSquareSize, startY+gridSquareSize, startX, startY+(gridSquareSize/2));
            break;
        case CardinalDirectionsEnum.Right:
            sketch.triangle(startX, startY, startX, startY+gridSquareSize, startX+gridSquareSize, startY+(gridSquareSize/2));
            break;
        case CardinalDirectionsEnum.Up:
            sketch.triangle(startX, startY+gridSquareSize, startX+gridSquareSize, startY+gridSquareSize, startX+(gridSquareSize/2), startY);
            break;
    }
}

/**
 * Returns the grid coordinates as a string
 *
 * @param position
 */
export function getPositionCoordinatesAsString(position: GridPosition){
    return position.x+'-'+position.y;
}

/**
 * Returns a GridPosition object representing the first found position containing the viable value in a given grid,
 * or false if none could be found.
 * @param grid
 * @param viableValue
 */
export function getFirstViablePositionInGrid(viableValue: any,grid: GridMap<any>): GridPosition|false{
    let position: GridPosition|false = false;

    const xKeys = Object.keys(grid);
    xLoop: for(let i = 0; i < xKeys.length; i++){
        const x = Number(xKeys[i]);
        const yKeys = Object.keys(grid[x]);
        for(let n = 0; n < yKeys.length; n++){
            const y = Number(yKeys[n]);
            if(grid[x][y] === viableValue){
                position = {x:x,y:y};
                break xLoop;
            }
        }
    }

    return position;
}

/**
 * Determines which position a given element had, given an originally known position, and a position for the same element after a mutation.
 * If an element originally was 9,10, and after updated was 1,1 (for example for a smaller edged grid analysis),
 * Another element that in the updated grid was 0,0 will then be converted to 8,9
 *
 * @param subjectPosition The position to return a mutated position for
 * @param originalPosition
 * @param relativePosition
 */
export function mutatePositionByRelativePosition(subjectPosition: GridPosition, originalPosition: GridPosition, relativePosition: GridPosition): GridPosition
{
    const xDiff = subjectPosition.x - relativePosition.x;
    const yDiff = subjectPosition.y - relativePosition.y;

    return {
        x: originalPosition.x + xDiff,
        y: originalPosition.y + yDiff
    }
}

/**
 * Combines an object serializer and hash creator function to create a simple checksum-like object simplifier.
 *
 * @param object
 */
export function createHashFromObject(object: Record<string, any>):string{
    return createHash(serializePlainObject(object));
}

/**
 * Serializes a simple object into a string
 * @param object
 */
export function serializePlainObject (object: Record<string, any>): string {
    return Object.keys(object).sort().map(key => key+':'+serializePlainObject(object[key])).join('-')
}

/**
 * Creates a hash from a given string
 * @source https://stackoverflow.com/a/52171480
 * @param str
 * @param seed
 */
export function createHash(str: string, seed = 0): string {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    // @ts-ignore
    return 4294967296 * (2097151 & h2) + (h1>>>0);
};
