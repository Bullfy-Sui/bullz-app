export const TOTAL_BUDGET = 100_000;

export enum SquadFormation {
  OneThreeTwoOne = "1-3-2-1",
  OneTwoThreeOne = "1-2-3-1",
  OneTwoTwoTwo = "1-2-2-2",
  OneThreeOneTwo = "1-3-1-2",
  OneTwoOneThree = "1-2-1-3",
}

export const formationLayouts = {
  OneThreeTwoOne: [[1], [2, 3, 4], [5, 6], [7]],
  OneTwoThreeOne: [[1], [2, 3], [4, 5, 6], [7]],
  OneTwoTwoTwo: [[1], [2, 3], [4, 5], [6, 7]],
  OneThreeOneTwo: [[1], [2, 3, 4], [5], [6, 7]],
  OneTwoOneThree: [[1], [2, 3], [4], [5, 6, 7]],
};
