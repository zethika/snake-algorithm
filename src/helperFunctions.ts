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
