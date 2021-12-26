import GridSquare, {GridSquareStateEnum} from "@src/classes/GridSquare";
import Snake, {SnakeMoveResponse} from "@src/classes/Snake";
import {CardinalDirectionsEnum, CardinalDirectionsMap, GridPosition} from "@src/definitions";
import {determinePositionInDirection, isPositionsIdentical} from "@src/helperFunctions";

/**
 * The games' Grid entity
 * Holds the size
 */
export default class Grid {
    /**
     * Multidimensional object of the grids' current state.
     * @private
     */
    public squareMap: Record<number, Record<number, GridSquare>>

    /**
     * @param size The size of the grid, in squares, on both axis.
     * @param initialSnake The snakes' initial state
     */
    constructor(private size: number, private initialSnake: Snake) {
        this.squareMap = [];
        for(let x = 0; x < size; x++){
            this.squareMap[x] = []
            for(let y = 0; y < size; y++){
                this.squareMap[x][y] = new GridSquare({x: x, y: y})
            }
        }
        initialSnake.getBodyParts.forEach((part:GridPosition) => {
            this.setPositionState(part,GridSquareStateEnum.Snake)
        })
    }

    get getSize(): number {
        return this.size;
    }

    /**
     * Gets the state of the squares surrounding a given position.
     * If a square does not exist, returns null.
     * @param position
     */
    getAdjacentSquareStates(position: GridPosition): CardinalDirectionsMap<GridSquareStateEnum|null>{
        return {
            0: this.getStateOfAdjacentSquareInDirection(position,CardinalDirectionsEnum.Up),
            1: this.getStateOfAdjacentSquareInDirection(position,CardinalDirectionsEnum.Down),
            2: this.getStateOfAdjacentSquareInDirection(position,CardinalDirectionsEnum.Left),
            3: this.getStateOfAdjacentSquareInDirection(position,CardinalDirectionsEnum.Right)
        };
    }

    /**
     * Gets the state of a square in a given direction from a position.
     *
     * @param position
     * @param direction
     *
     * @returns The square state or null if no square exists in that direction
     */
    getStateOfAdjacentSquareInDirection(position: GridPosition, direction: CardinalDirectionsEnum): GridSquareStateEnum|null{
        const newPosition: GridPosition = determinePositionInDirection(position,direction);
        return this.isPositionValid(newPosition) ? this.getPositionState(newPosition) : null
    }

    /**
     * Gets the state of the square on a given position
     * @param position
     */
    getPositionState(position: GridPosition): GridSquareStateEnum{
        return this.squareMap[position.x][position.y].state
    }

    /**
     * Sets the state of the square on a given position
     * @param position
     * @param state
     */
    setPositionState(position: GridPosition, state: GridSquareStateEnum){
        this.squareMap[position.x][position.y].state = state
    }

    /**
     * Finds a random empty position on the grid, if any exists.
     * @todo insert some way of checking if we have checked all available combinations - otherwise infinite if filled.
     * @todo rewrite to proper searching algorithm - or maybe rewrite it so we have a map over the current "empty" squares instead?
     */
    findRandomEmptyGridPosition(): GridPosition{
        let square: GridSquare = undefined;
        while(typeof square === 'undefined'){
            const x = Math.floor(Math.random() * this.size);
            const y = Math.floor(Math.random() * this.size);
            if(this.squareMap[x][y].state === GridSquareStateEnum.Empty)
                square = this.squareMap[x][y];
        }
        return square.getPosition
    }

    /**
     * Determines if the snake head may move in a given direction on the current grid state.
     * It may move in that direction, if the new position is a valid square, and isn't a square already occupied by the snake.
     *
     * Can optionally be fed a inSteps parameter, denoting how many steps in the future the check should be made.
     *
     * @param head
     * @param direction
     * @param inSteps
     * @param allowedPosition The position of the snake head, if it should be allowed
     */
    maySnakeMoveInDirection(head: GridPosition, direction: CardinalDirectionsEnum, inSteps?: number, allowedPosition?: GridPosition): boolean{
        const newPosition = determinePositionInDirection(head, direction);
        console.log(newPosition,this.isPositionValid(newPosition))
        if(!this.isPositionValid(newPosition))
            return false;

        console.log(this.squareMap[newPosition.x][newPosition.y].state)
        return (this.squareMap[newPosition.x][newPosition.y].state !== GridSquareStateEnum.Snake || (typeof allowedPosition !== 'undefined' && isPositionsIdentical(allowedPosition,newPosition)))
    }

    /**
     * Judges whether a given position is a valid position on the grid
     */
    isPositionValid(position: GridPosition): boolean{
        return typeof this.squareMap[position.x] !== 'undefined' && typeof this.squareMap[position.x][position.y] !== 'undefined';
    }

    /**
     * Applies the response from a snake move to the grid squares
     * @param move
     */
    applySnakeMove(move: SnakeMoveResponse): void{
        this.setPositionState(move.newHead,GridSquareStateEnum.Snake)
        if(typeof move.removed !== 'undefined')
        {
            this.setPositionState(move.removed,GridSquareStateEnum.Empty)
        }
    }

    /**
     * Determines if a given position is on an edge
     * @param position
     */
    isPositionOnEdge(position: GridPosition): boolean{
        const max = this.size - 1;
        return position.x === 0 || position.y === 0 ||
            position.x === max || position.y === max

    }
}
