export const TOTAL_BUDGET = 100_000;

export enum SquadFormation {
  ThreeTwoOne = "3-2-1",
  TwoThreeOne = "2-3-1",
  OneThreeThree = "1-3-3",
  TwoTwoThree = "2-2-3",
  OneTwoFour = "1-2-4"
}


 
export const formationLayouts = {

  ThreeTwoOne : [[1], [2, 3], [4, 5, 6], [7]],
  TwoThreeOne: [[1], [2, 3, 4], [5, 6], [7]],
   OneThreeThree: [[1], [2, 3, 4], [5, 6, 7]],
  TwoTwoThree: [[1], [2, 3], [4, 5], [6, 7]],
  OneTwoFour: [[1], [2, 3], [4, 5, 6, 7]]
};
