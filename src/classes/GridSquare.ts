import {GridPosition} from "@src/definitions";

export enum GridSquareStateEnum {
    Empty,
    Snake,
    Apple
}

/**
 * The entity for a single grid square
 */
export default class GridSquare{
    /**
     * @param position The squares' position on the grid
     * @param state The squares' current state as a number
     */
    constructor(private position: GridPosition, public state: GridSquareStateEnum = GridSquareStateEnum.Empty) {}

    get getPosition(): GridPosition {
        return this.position;
    }
}
