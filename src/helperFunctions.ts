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
    return position1.x === position2.x && position2.y === position2.y
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
export function determineEdgedViableGrid(viableValue: any, position: GridPosition, grid: GridMap<any>, hasChecked: Record<string, boolean>): Record<string, boolean>{
    const coords = position.x+'-'+position.y;
    // If we have already checked this position, short circuit
    if(typeof hasChecked[coords] !== 'undefined')
        return hasChecked;

    // If the position isn't valid, set as edge and short circuit
    if(!isPositionViable(viableValue,position,grid))
    {
        hasChecked[coords] = false;
        return hasChecked;
    }

    // Set the current position as checked
    hasChecked[coords] = true;

    // Loop through all directions and get their viable grid
    const directions = getArrayOfAllDirections();
    for(let i = 0; i < directions.length; i++){
        hasChecked = determineEdgedViableGrid(viableValue,determinePositionInDirection(position,directions[i]),grid,hasChecked);
    }

    return hasChecked;
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
