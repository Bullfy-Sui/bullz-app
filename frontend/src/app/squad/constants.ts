export const TOTAL_BUDGET = 100_000;

export enum SquadFormation {
  OneThreeTwoOne = "1-3-2-1",
  OneTwoThreeOne = "1-2-3-1",
  OneTwoTwoTwo = "1-2-2-2",
  OneThreeOneTwo = "1-3-1-2",
  OneTwoOneThree = "1-2-1-3",
}

export const formationLayouts = {
  OneThreeTwoOne: [
    [1], // GK
    [2, 3, 4], // Def
    [5, 6], // Mid
    [7], // Fwd
  ],
  OneTwoThreeOne: [
    [1], // GK
    [2, 3], // Def
    [4, 5, 6], // Defense
    [7], // Fwd
  ],
  OneTwoTwoTwo: [
    [1], // GK
    [2, 3], // Def
    [4, 5], // Mid
    [6, 7], // Fwd
  ],
  OneThreeOneTwo: [
    [1], // GK
    [2, 3, 4], // Def
    [5], // Mid
    [6, 7], // Fwd
  ],
  OneTwoOneThree: [
    [1], // GK
    [2, 3], // Def
    [4], // Mid
    [5, 6, 7], // Fwd
  ],
};
