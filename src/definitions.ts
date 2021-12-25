/**
 * Interface describing a position is on the grid.
 * Values can only be positive, with the bottom left corner of the grid being 0,0
 */
export interface GridPosition {
    x: number,
    y: number
}

/**
 * How large (in pixels) a single square on both axis is
 */
export const gridSquareSize: number = 15;

/**
 * The number of squares pr. axis of the grid
 */
export const gridSquaresPrAxis: number = 20;

/**
 * An enum designating the various cardinal directions as a number.
 */
export enum CardinalDirectionsEnum {
    Up,
    Down,
    Left,
    Right
}

/**
 * An interface allowing for maps of cardinal directions of a given type
 */
export interface CardinalDirectionsMap<T> {
    0: T,
    1: T,
    2: T,
    3: T,
}
