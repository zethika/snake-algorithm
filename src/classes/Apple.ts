import {GridPosition} from "@src/definitions";

/**
 * Class representing an apple on the board
 */
export default class Apple{
    constructor(private position: GridPosition) {}

    get getPosition(): GridPosition {
        return this.position;
    }
}
