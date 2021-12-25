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
     * @param snakeDuration For how many steps, the square will continue to be in the snake state, if applicable
     */
    constructor(private position: GridPosition, public state: GridSquareStateEnum = GridSquareStateEnum.Empty, public snakeDuration: number|null = null) {}

    get getPosition(): GridPosition {
        return this.position;
    }

    get getSnakeDuration(): number|null {
        return this.snakeDuration;
    }
}
