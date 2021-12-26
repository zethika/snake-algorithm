import {CardinalDirectionsEnum, GridPosition, gridSquareSize} from "@src/definitions";
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
