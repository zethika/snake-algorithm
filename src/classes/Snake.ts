import {CardinalDirectionsEnum, GridPosition} from "@src/definitions";
import {determinePositionInDirection} from "@src/helperFunctions";
import Apple from "@src/classes/Apple";

export interface SnakeMoveResponse {
    newHead: GridPosition,
    removed?: GridPosition
}

/**
 * The games' snake entity
 * Is responsible for holding the data for the snakes' current state, namely where its body parts are.
 *
 * The first body part is the head.
 * There should only ever be one snake pr. Grid
 */
export default class {
    constructor(private bodyParts: Array<GridPosition> = [{x:2,y:2}], private bodyLength: number = 1) {}

    /**
     * Helper for getting the head of the snake.
     */
    get head(): GridPosition {
        return this.bodyParts[0];
    }

    get getBodyParts(): Array<GridPosition> {
        return this.bodyParts;
    }

    get getBodyLength(): number {
        return this.bodyLength;
    }

    /**
     * Increases the number of body parts the snake may have
     */
    increaseBodyLength(){
        this.bodyLength++;
    }

    /**
     * Adds a body part to the end of the tail
     */
    appendBodyPart(part: GridPosition){
        this.bodyParts.push(part)
    }

    /**
     * Moves the snake in a given direction.
     * Creates a new GridPosition based on the last head and applies the mutation.
     * If bodyParts array are longer than allowed, strips the last element and returns as "removed".
     * We should only ever need to remove one at a time, since we only ever add one.
     *
     * @param direction
     */
    move(direction: CardinalDirectionsEnum): SnakeMoveResponse{
        let newHead: GridPosition = determinePositionInDirection(this.bodyParts[0],direction);
        this.bodyParts.unshift(newHead);
        let response: SnakeMoveResponse = {newHead: newHead}
        if(this.bodyParts.length > this.bodyLength)
            response.removed = this.bodyParts.pop();

        return response;
    }
}
