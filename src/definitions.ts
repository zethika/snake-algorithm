/**
 * Controls whether the algorithm steps should be drawn one-by-one or not
 */
export const drawCalculations:boolean = true;

/**
 * Forces a slowdown of each step by introducing a simple counter, that counts to a number that is 10 to the power of x ("10E<x>" where x is your number)
 * Set to 0 to disable
 */
export const slowdownPower:number = 0;

/**
 * Interface describing a position is on the grid.
 * Values can only be positive, with the bottom left corner of the grid being 0,0
 */
export interface GridPosition {
    x: number,
    y: number
}

/**
 * The grid map type, for a map of x.y values of type T.
 * Allows accessing the individual coordinates in a "variable[x][y]" fashion
 */
export type GridMap<T> = Record<number, Record<number, T>>

/**
 * How large (in pixels) a single square on both axis is
 */
export const gridSquareSize: number = 30;

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
 * Helper functions for getting the directions in an array format
 */
export function getArrayOfAllDirections():Array<CardinalDirectionsEnum>{
    return [CardinalDirectionsEnum.Up, CardinalDirectionsEnum.Down, CardinalDirectionsEnum.Left, CardinalDirectionsEnum.Right];
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

/**
 * Helper map over the reverse directions of a given cardinal direction
 */
export const ReverseCardinalDirection = {
    0: 1,
    1: 0,
    2: 3,
    3: 2
}
