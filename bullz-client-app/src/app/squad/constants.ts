export const TOTAL_BUDGET = 100_000;

export enum SquadFormation {
  OneThreeTwoOne = "3-2-1",
  OneTwoThreeOne = "2-3-1",
  OneTwoTwoTwo = "2-2-2",
  OneThreeOneTwo = "3-1-2",
  OneTwoOneThree = "2-1-3",
}

export const formationLayouts = {
  // [position, multiplier]
  OneThreeTwoOne: [
    [[1, 2.0]],
    [
      [2, 1.6],
      [3, 1.4],
      [4, 1.3],
    ],
    [
      [5, 1.2],
      [6, 1.2],
    ],
    [[7, 1.1]],
  ],
  OneTwoThreeOne: [
    [[1, 2.0]],
    [
      [2, 1.4],
      [3, 1.4],
    ],
    [
      [4, 1.2],
      [5, 1.3],
      [6, 1.2],
    ],
    [[7, 1.1]],
  ],
  OneTwoTwoTwo: [
    [[1, 2.0]],
    [
      [2, 1.4],
      [3, 1.2],
    ],
    [
      [4, 1.3],
      [5, 1.2],
    ],
    [
      [6, 1.2],
      [7, 1.1],
    ],
  ],
  OneThreeOneTwo: [
    [[1, 2.0]],
    [
      [2, 1.4],
      [3, 1.4],
      [4, 1.3],
    ],
    [[5, 1.3]],
    [
      [6, 1.2],
      [7, 1.1],
    ],
  ],
  OneTwoOneThree: [
    [[1, 2.0]],
    [
      [2, 1.6],
      [3, 1.4],
    ],
    [[4, 1.4]],
    [
      [5, 1.3],
      [6, 1.2],
      [7, 1.1],
    ],
  ],
};
