/**
 * Stage scaling de monstros por tier de fase.
 *
 * A campanha tem 500 fases (tier global 1–500). A curva de referência (170 pontos)
 * é distribuída linearmente: tier 1 ≈ estágio 1; tier 500 = estágio 170.
 */
export interface StageScalingCurveEntry {
  readonly stageLevel: number;
  readonly atkDmgMultiplier: number;
  readonly hpMultiplier: number;
  readonly goldMultiplier: number;
  readonly expMultiplier: number;
}

export interface StageScalingEntry {
  readonly tier: number;
  readonly atkDmgMultiplier: number;
  readonly hpMultiplier: number;
  readonly goldMultiplier: number;
  readonly expMultiplier: number;
}

export interface StageScalingFactors {
  readonly atk: number;
  readonly hp: number;
  readonly gold: number;
  readonly exp: number;
}

/** Pontos na curva de referência usada para interpolação. */
export const STAGE_SCALING_CURVE_MAX = 170;

/** Tier global máximo da campanha Side Hero (1 fase = 1 tier). */
export const GAME_STAGE_MAX_TIER = 500;

/** Multiplicadores da curva em centésimos (100 = ×1,0). */
export const STAGE_SCALING_CURVE_TABLE: readonly StageScalingCurveEntry[] = [
  { stageLevel: 1, atkDmgMultiplier: 100, hpMultiplier: 100, goldMultiplier: 100, expMultiplier: 100 },
  { stageLevel: 2, atkDmgMultiplier: 130, hpMultiplier: 180, goldMultiplier: 150, expMultiplier: 130 },
  { stageLevel: 3, atkDmgMultiplier: 160, hpMultiplier: 220, goldMultiplier: 200, expMultiplier: 160 },
  { stageLevel: 4, atkDmgMultiplier: 190, hpMultiplier: 270, goldMultiplier: 300, expMultiplier: 300 },
  { stageLevel: 5, atkDmgMultiplier: 220, hpMultiplier: 320, goldMultiplier: 350, expMultiplier: 450 },
  { stageLevel: 6, atkDmgMultiplier: 260, hpMultiplier: 440, goldMultiplier: 380, expMultiplier: 650 },
  { stageLevel: 7, atkDmgMultiplier: 310, hpMultiplier: 590, goldMultiplier: 410, expMultiplier: 950 },
  { stageLevel: 8, atkDmgMultiplier: 350, hpMultiplier: 720, goldMultiplier: 440, expMultiplier: 1350 },
  { stageLevel: 9, atkDmgMultiplier: 380, hpMultiplier: 820, goldMultiplier: 470, expMultiplier: 1800 },
  { stageLevel: 10, atkDmgMultiplier: 410, hpMultiplier: 970, goldMultiplier: 550, expMultiplier: 2300 },
  { stageLevel: 11, atkDmgMultiplier: 440, hpMultiplier: 1070, goldMultiplier: 600, expMultiplier: 2900 },
  { stageLevel: 12, atkDmgMultiplier: 470, hpMultiplier: 1470, goldMultiplier: 650, expMultiplier: 3700 },
  { stageLevel: 13, atkDmgMultiplier: 500, hpMultiplier: 1970, goldMultiplier: 710, expMultiplier: 4700 },
  { stageLevel: 14, atkDmgMultiplier: 530, hpMultiplier: 2570, goldMultiplier: 780, expMultiplier: 5900 },
  { stageLevel: 15, atkDmgMultiplier: 560, hpMultiplier: 3270, goldMultiplier: 860, expMultiplier: 7300 },
  { stageLevel: 16, atkDmgMultiplier: 590, hpMultiplier: 4070, goldMultiplier: 950, expMultiplier: 8900 },
  { stageLevel: 17, atkDmgMultiplier: 620, hpMultiplier: 4970, goldMultiplier: 1050, expMultiplier: 10700 },
  { stageLevel: 18, atkDmgMultiplier: 650, hpMultiplier: 5970, goldMultiplier: 1160, expMultiplier: 12700 },
  { stageLevel: 19, atkDmgMultiplier: 680, hpMultiplier: 7070, goldMultiplier: 1280, expMultiplier: 15000 },
  { stageLevel: 20, atkDmgMultiplier: 710, hpMultiplier: 8270, goldMultiplier: 1410, expMultiplier: 17600 },
  { stageLevel: 21, atkDmgMultiplier: 740, hpMultiplier: 9570, goldMultiplier: 1550, expMultiplier: 20400 },
  { stageLevel: 22, atkDmgMultiplier: 770, hpMultiplier: 10970, goldMultiplier: 1700, expMultiplier: 23400 },
  { stageLevel: 23, atkDmgMultiplier: 800, hpMultiplier: 12470, goldMultiplier: 1860, expMultiplier: 26600 },
  { stageLevel: 24, atkDmgMultiplier: 830, hpMultiplier: 14070, goldMultiplier: 2030, expMultiplier: 30000 },
  { stageLevel: 25, atkDmgMultiplier: 860, hpMultiplier: 15770, goldMultiplier: 2210, expMultiplier: 33600 },
  { stageLevel: 26, atkDmgMultiplier: 890, hpMultiplier: 17570, goldMultiplier: 2400, expMultiplier: 37400 },
  { stageLevel: 27, atkDmgMultiplier: 920, hpMultiplier: 19470, goldMultiplier: 2600, expMultiplier: 41400 },
  { stageLevel: 28, atkDmgMultiplier: 950, hpMultiplier: 21470, goldMultiplier: 2810, expMultiplier: 45600 },
  { stageLevel: 29, atkDmgMultiplier: 980, hpMultiplier: 23570, goldMultiplier: 3030, expMultiplier: 50000 },
  { stageLevel: 30, atkDmgMultiplier: 1010, hpMultiplier: 25770, goldMultiplier: 3260, expMultiplier: 54600 },
  { stageLevel: 31, atkDmgMultiplier: 1045, hpMultiplier: 28070, goldMultiplier: 3500, expMultiplier: 59400 },
  { stageLevel: 32, atkDmgMultiplier: 1085, hpMultiplier: 30470, goldMultiplier: 3750, expMultiplier: 64400 },
  { stageLevel: 33, atkDmgMultiplier: 1130, hpMultiplier: 32970, goldMultiplier: 4010, expMultiplier: 69600 },
  { stageLevel: 34, atkDmgMultiplier: 1180, hpMultiplier: 35570, goldMultiplier: 4280, expMultiplier: 75000 },
  { stageLevel: 35, atkDmgMultiplier: 1235, hpMultiplier: 38270, goldMultiplier: 4560, expMultiplier: 80600 },
  { stageLevel: 36, atkDmgMultiplier: 1295, hpMultiplier: 41070, goldMultiplier: 4850, expMultiplier: 86400 },
  { stageLevel: 37, atkDmgMultiplier: 1360, hpMultiplier: 43970, goldMultiplier: 5150, expMultiplier: 92400 },
  { stageLevel: 38, atkDmgMultiplier: 1430, hpMultiplier: 46970, goldMultiplier: 5460, expMultiplier: 98600 },
  { stageLevel: 39, atkDmgMultiplier: 1510, hpMultiplier: 50070, goldMultiplier: 5780, expMultiplier: 105000 },
  { stageLevel: 40, atkDmgMultiplier: 1600, hpMultiplier: 53270, goldMultiplier: 6110, expMultiplier: 111600 },
  { stageLevel: 41, atkDmgMultiplier: 1700, hpMultiplier: 56570, goldMultiplier: 6450, expMultiplier: 118400 },
  { stageLevel: 42, atkDmgMultiplier: 1810, hpMultiplier: 59970, goldMultiplier: 6800, expMultiplier: 125400 },
  { stageLevel: 43, atkDmgMultiplier: 1930, hpMultiplier: 63470, goldMultiplier: 7160, expMultiplier: 132600 },
  { stageLevel: 44, atkDmgMultiplier: 2060, hpMultiplier: 67070, goldMultiplier: 7530, expMultiplier: 140000 },
  { stageLevel: 45, atkDmgMultiplier: 2200, hpMultiplier: 70770, goldMultiplier: 7910, expMultiplier: 147600 },
  { stageLevel: 46, atkDmgMultiplier: 2350, hpMultiplier: 74570, goldMultiplier: 8300, expMultiplier: 155400 },
  { stageLevel: 47, atkDmgMultiplier: 2510, hpMultiplier: 78470, goldMultiplier: 8700, expMultiplier: 163400 },
  { stageLevel: 48, atkDmgMultiplier: 2680, hpMultiplier: 82470, goldMultiplier: 9110, expMultiplier: 171600 },
  { stageLevel: 49, atkDmgMultiplier: 2855, hpMultiplier: 86570, goldMultiplier: 9530, expMultiplier: 180000 },
  { stageLevel: 50, atkDmgMultiplier: 3050, hpMultiplier: 90770, goldMultiplier: 9960, expMultiplier: 188600 },
  { stageLevel: 51, atkDmgMultiplier: 3265, hpMultiplier: 95070, goldMultiplier: 10400, expMultiplier: 197400 },
  { stageLevel: 52, atkDmgMultiplier: 3500, hpMultiplier: 99470, goldMultiplier: 10850, expMultiplier: 206400 },
  { stageLevel: 53, atkDmgMultiplier: 3755, hpMultiplier: 103970, goldMultiplier: 11310, expMultiplier: 215600 },
  { stageLevel: 54, atkDmgMultiplier: 4030, hpMultiplier: 108570, goldMultiplier: 11780, expMultiplier: 225000 },
  { stageLevel: 55, atkDmgMultiplier: 4325, hpMultiplier: 113270, goldMultiplier: 12260, expMultiplier: 234600 },
  { stageLevel: 56, atkDmgMultiplier: 4640, hpMultiplier: 118070, goldMultiplier: 12750, expMultiplier: 244400 },
  { stageLevel: 57, atkDmgMultiplier: 4975, hpMultiplier: 122970, goldMultiplier: 13250, expMultiplier: 254400 },
  { stageLevel: 58, atkDmgMultiplier: 5330, hpMultiplier: 127970, goldMultiplier: 13760, expMultiplier: 264600 },
  { stageLevel: 59, atkDmgMultiplier: 5705, hpMultiplier: 133070, goldMultiplier: 14280, expMultiplier: 275000 },
  { stageLevel: 60, atkDmgMultiplier: 6085, hpMultiplier: 138270, goldMultiplier: 14810, expMultiplier: 285600 },
  { stageLevel: 61, atkDmgMultiplier: 6515, hpMultiplier: 143570, goldMultiplier: 15350, expMultiplier: 296400 },
  { stageLevel: 62, atkDmgMultiplier: 6995, hpMultiplier: 148970, goldMultiplier: 15900, expMultiplier: 307400 },
  { stageLevel: 63, atkDmgMultiplier: 7525, hpMultiplier: 154470, goldMultiplier: 16460, expMultiplier: 318600 },
  { stageLevel: 64, atkDmgMultiplier: 8105, hpMultiplier: 160070, goldMultiplier: 17030, expMultiplier: 330000 },
  { stageLevel: 65, atkDmgMultiplier: 8735, hpMultiplier: 165770, goldMultiplier: 17610, expMultiplier: 341600 },
  { stageLevel: 66, atkDmgMultiplier: 9415, hpMultiplier: 171570, goldMultiplier: 18200, expMultiplier: 353400 },
  { stageLevel: 67, atkDmgMultiplier: 10145, hpMultiplier: 177470, goldMultiplier: 18800, expMultiplier: 365400 },
  { stageLevel: 68, atkDmgMultiplier: 10925, hpMultiplier: 183470, goldMultiplier: 19410, expMultiplier: 377600 },
  { stageLevel: 69, atkDmgMultiplier: 11755, hpMultiplier: 189570, goldMultiplier: 20030, expMultiplier: 390000 },
  { stageLevel: 70, atkDmgMultiplier: 12635, hpMultiplier: 195770, goldMultiplier: 20660, expMultiplier: 402600 },
  { stageLevel: 71, atkDmgMultiplier: 13565, hpMultiplier: 202070, goldMultiplier: 21300, expMultiplier: 415400 },
  { stageLevel: 72, atkDmgMultiplier: 14545, hpMultiplier: 208470, goldMultiplier: 21950, expMultiplier: 428400 },
  { stageLevel: 73, atkDmgMultiplier: 15625, hpMultiplier: 214970, goldMultiplier: 22610, expMultiplier: 441600 },
  { stageLevel: 74, atkDmgMultiplier: 16805, hpMultiplier: 221570, goldMultiplier: 23280, expMultiplier: 455000 },
  { stageLevel: 75, atkDmgMultiplier: 18085, hpMultiplier: 228270, goldMultiplier: 23960, expMultiplier: 468600 },
  { stageLevel: 76, atkDmgMultiplier: 19465, hpMultiplier: 235070, goldMultiplier: 24650, expMultiplier: 482400 },
  { stageLevel: 77, atkDmgMultiplier: 20945, hpMultiplier: 241970, goldMultiplier: 25350, expMultiplier: 496400 },
  { stageLevel: 78, atkDmgMultiplier: 22525, hpMultiplier: 248970, goldMultiplier: 26060, expMultiplier: 510600 },
  { stageLevel: 79, atkDmgMultiplier: 24205, hpMultiplier: 256070, goldMultiplier: 26780, expMultiplier: 525000 },
  { stageLevel: 80, atkDmgMultiplier: 26385, hpMultiplier: 263270, goldMultiplier: 27510, expMultiplier: 539600 },
  { stageLevel: 81, atkDmgMultiplier: 29065, hpMultiplier: 270570, goldMultiplier: 28250, expMultiplier: 554400 },
  { stageLevel: 82, atkDmgMultiplier: 32245, hpMultiplier: 277970, goldMultiplier: 29000, expMultiplier: 569400 },
  { stageLevel: 83, atkDmgMultiplier: 35925, hpMultiplier: 285470, goldMultiplier: 29760, expMultiplier: 584600 },
  { stageLevel: 84, atkDmgMultiplier: 40105, hpMultiplier: 293070, goldMultiplier: 30530, expMultiplier: 600000 },
  { stageLevel: 85, atkDmgMultiplier: 44785, hpMultiplier: 300770, goldMultiplier: 31310, expMultiplier: 615600 },
  { stageLevel: 86, atkDmgMultiplier: 50465, hpMultiplier: 308570, goldMultiplier: 32100, expMultiplier: 631400 },
  { stageLevel: 87, atkDmgMultiplier: 57145, hpMultiplier: 316470, goldMultiplier: 32900, expMultiplier: 647400 },
  { stageLevel: 88, atkDmgMultiplier: 64825, hpMultiplier: 324470, goldMultiplier: 33710, expMultiplier: 663600 },
  { stageLevel: 89, atkDmgMultiplier: 73505, hpMultiplier: 332570, goldMultiplier: 34530, expMultiplier: 680000 },
  { stageLevel: 90, atkDmgMultiplier: 87185, hpMultiplier: 340770, goldMultiplier: 35360, expMultiplier: 696600 },
  { stageLevel: 91, atkDmgMultiplier: 105865, hpMultiplier: 349070, goldMultiplier: 36200, expMultiplier: 713400 },
  { stageLevel: 92, atkDmgMultiplier: 129545, hpMultiplier: 357470, goldMultiplier: 37050, expMultiplier: 730400 },
  { stageLevel: 93, atkDmgMultiplier: 158225, hpMultiplier: 365970, goldMultiplier: 37910, expMultiplier: 747600 },
  { stageLevel: 94, atkDmgMultiplier: 196905, hpMultiplier: 374570, goldMultiplier: 38780, expMultiplier: 765000 },
  { stageLevel: 95, atkDmgMultiplier: 245585, hpMultiplier: 383270, goldMultiplier: 39660, expMultiplier: 782600 },
  { stageLevel: 96, atkDmgMultiplier: 304265, hpMultiplier: 392070, goldMultiplier: 40550, expMultiplier: 800400 },
  { stageLevel: 97, atkDmgMultiplier: 372945, hpMultiplier: 400970, goldMultiplier: 41450, expMultiplier: 818400 },
  { stageLevel: 98, atkDmgMultiplier: 451625, hpMultiplier: 409970, goldMultiplier: 42360, expMultiplier: 836600 },
  { stageLevel: 99, atkDmgMultiplier: 540305, hpMultiplier: 419070, goldMultiplier: 43280, expMultiplier: 855000 },
  { stageLevel: 100, atkDmgMultiplier: 638985, hpMultiplier: 428270, goldMultiplier: 44210, expMultiplier: 873600 },
  { stageLevel: 101, atkDmgMultiplier: 747665, hpMultiplier: 437570, goldMultiplier: 45150, expMultiplier: 892400 },
  { stageLevel: 102, atkDmgMultiplier: 866345, hpMultiplier: 446970, goldMultiplier: 46100, expMultiplier: 911400 },
  { stageLevel: 103, atkDmgMultiplier: 995025, hpMultiplier: 456470, goldMultiplier: 47060, expMultiplier: 930600 },
  { stageLevel: 104, atkDmgMultiplier: 1133705, hpMultiplier: 466070, goldMultiplier: 48030, expMultiplier: 950000 },
  { stageLevel: 105, atkDmgMultiplier: 1282385, hpMultiplier: 475770, goldMultiplier: 49010, expMultiplier: 969600 },
  { stageLevel: 106, atkDmgMultiplier: 1441065, hpMultiplier: 485570, goldMultiplier: 50000, expMultiplier: 989400 },
  { stageLevel: 107, atkDmgMultiplier: 1609745, hpMultiplier: 495470, goldMultiplier: 51000, expMultiplier: 1009400 },
  { stageLevel: 108, atkDmgMultiplier: 1788425, hpMultiplier: 505470, goldMultiplier: 52010, expMultiplier: 1029600 },
  { stageLevel: 109, atkDmgMultiplier: 1977105, hpMultiplier: 515570, goldMultiplier: 53030, expMultiplier: 1050000 },
  { stageLevel: 110, atkDmgMultiplier: 2175785, hpMultiplier: 525770, goldMultiplier: 54060, expMultiplier: 1070600 },
  { stageLevel: 111, atkDmgMultiplier: 2384465, hpMultiplier: 536070, goldMultiplier: 55100, expMultiplier: 1091400 },
  { stageLevel: 112, atkDmgMultiplier: 2603145, hpMultiplier: 546470, goldMultiplier: 56150, expMultiplier: 1112400 },
  { stageLevel: 113, atkDmgMultiplier: 2831825, hpMultiplier: 556970, goldMultiplier: 57210, expMultiplier: 1133600 },
  { stageLevel: 114, atkDmgMultiplier: 3070505, hpMultiplier: 567570, goldMultiplier: 58280, expMultiplier: 1155000 },
  { stageLevel: 115, atkDmgMultiplier: 3319185, hpMultiplier: 578270, goldMultiplier: 59360, expMultiplier: 1176600 },
  { stageLevel: 116, atkDmgMultiplier: 3577865, hpMultiplier: 589070, goldMultiplier: 60450, expMultiplier: 1198400 },
  { stageLevel: 117, atkDmgMultiplier: 3846545, hpMultiplier: 599970, goldMultiplier: 61550, expMultiplier: 1220400 },
  { stageLevel: 118, atkDmgMultiplier: 4125225, hpMultiplier: 610970, goldMultiplier: 62660, expMultiplier: 1242600 },
  { stageLevel: 119, atkDmgMultiplier: 4413905, hpMultiplier: 622070, goldMultiplier: 63780, expMultiplier: 1265000 },
  { stageLevel: 120, atkDmgMultiplier: 4712585, hpMultiplier: 633270, goldMultiplier: 64910, expMultiplier: 1287600 },
  { stageLevel: 121, atkDmgMultiplier: 5021265, hpMultiplier: 644570, goldMultiplier: 66050, expMultiplier: 1310400 },
  { stageLevel: 122, atkDmgMultiplier: 5339945, hpMultiplier: 655970, goldMultiplier: 67200, expMultiplier: 1333400 },
  { stageLevel: 123, atkDmgMultiplier: 5668625, hpMultiplier: 667470, goldMultiplier: 68360, expMultiplier: 1356600 },
  { stageLevel: 124, atkDmgMultiplier: 6007305, hpMultiplier: 679070, goldMultiplier: 69530, expMultiplier: 1380000 },
  { stageLevel: 125, atkDmgMultiplier: 6355985, hpMultiplier: 690770, goldMultiplier: 70710, expMultiplier: 1403600 },
  { stageLevel: 126, atkDmgMultiplier: 6714665, hpMultiplier: 702570, goldMultiplier: 71900, expMultiplier: 1427400 },
  { stageLevel: 127, atkDmgMultiplier: 7083345, hpMultiplier: 714470, goldMultiplier: 73100, expMultiplier: 1451400 },
  { stageLevel: 128, atkDmgMultiplier: 7462025, hpMultiplier: 726470, goldMultiplier: 74310, expMultiplier: 1475600 },
  { stageLevel: 129, atkDmgMultiplier: 7850705, hpMultiplier: 738570, goldMultiplier: 75530, expMultiplier: 1500000 },
  { stageLevel: 130, atkDmgMultiplier: 8249385, hpMultiplier: 750770, goldMultiplier: 76760, expMultiplier: 1524600 },
  { stageLevel: 131, atkDmgMultiplier: 8658065, hpMultiplier: 763070, goldMultiplier: 78000, expMultiplier: 1549400 },
  { stageLevel: 132, atkDmgMultiplier: 9076745, hpMultiplier: 775470, goldMultiplier: 79250, expMultiplier: 1574400 },
  { stageLevel: 133, atkDmgMultiplier: 9505425, hpMultiplier: 787970, goldMultiplier: 80510, expMultiplier: 1599600 },
  { stageLevel: 134, atkDmgMultiplier: 9944105, hpMultiplier: 800570, goldMultiplier: 81780, expMultiplier: 1625000 },
  { stageLevel: 135, atkDmgMultiplier: 10392785, hpMultiplier: 813270, goldMultiplier: 83060, expMultiplier: 1650600 },
  { stageLevel: 136, atkDmgMultiplier: 10851465, hpMultiplier: 826070, goldMultiplier: 84350, expMultiplier: 1676400 },
  { stageLevel: 137, atkDmgMultiplier: 11320145, hpMultiplier: 838970, goldMultiplier: 85650, expMultiplier: 1702400 },
  { stageLevel: 138, atkDmgMultiplier: 11798825, hpMultiplier: 851970, goldMultiplier: 86960, expMultiplier: 1728600 },
  { stageLevel: 139, atkDmgMultiplier: 12287505, hpMultiplier: 865070, goldMultiplier: 88280, expMultiplier: 1755000 },
  { stageLevel: 140, atkDmgMultiplier: 12786185, hpMultiplier: 878270, goldMultiplier: 89610, expMultiplier: 1781600 },
  { stageLevel: 141, atkDmgMultiplier: 13294865, hpMultiplier: 891570, goldMultiplier: 90950, expMultiplier: 1808400 },
  { stageLevel: 142, atkDmgMultiplier: 13813545, hpMultiplier: 904970, goldMultiplier: 92300, expMultiplier: 1835400 },
  { stageLevel: 143, atkDmgMultiplier: 14342225, hpMultiplier: 918470, goldMultiplier: 93660, expMultiplier: 1862600 },
  { stageLevel: 144, atkDmgMultiplier: 14880905, hpMultiplier: 932070, goldMultiplier: 95030, expMultiplier: 1890000 },
  { stageLevel: 145, atkDmgMultiplier: 15429585, hpMultiplier: 945770, goldMultiplier: 96410, expMultiplier: 1917600 },
  { stageLevel: 146, atkDmgMultiplier: 15988265, hpMultiplier: 959570, goldMultiplier: 97800, expMultiplier: 1945400 },
  { stageLevel: 147, atkDmgMultiplier: 16556945, hpMultiplier: 973470, goldMultiplier: 99200, expMultiplier: 1973400 },
  { stageLevel: 148, atkDmgMultiplier: 17135625, hpMultiplier: 987470, goldMultiplier: 100610, expMultiplier: 2001600 },
  { stageLevel: 149, atkDmgMultiplier: 17724305, hpMultiplier: 1001570, goldMultiplier: 102030, expMultiplier: 2030000 },
  { stageLevel: 150, atkDmgMultiplier: 18322985, hpMultiplier: 1015770, goldMultiplier: 103460, expMultiplier: 2058600 },
  { stageLevel: 151, atkDmgMultiplier: 18931665, hpMultiplier: 1030070, goldMultiplier: 104900, expMultiplier: 2087400 },
  { stageLevel: 152, atkDmgMultiplier: 19550345, hpMultiplier: 1044470, goldMultiplier: 106350, expMultiplier: 2116400 },
  { stageLevel: 153, atkDmgMultiplier: 20179025, hpMultiplier: 1058970, goldMultiplier: 107810, expMultiplier: 2145600 },
  { stageLevel: 154, atkDmgMultiplier: 20817705, hpMultiplier: 1073570, goldMultiplier: 109280, expMultiplier: 2175000 },
  { stageLevel: 155, atkDmgMultiplier: 21466385, hpMultiplier: 1088270, goldMultiplier: 110760, expMultiplier: 2204600 },
  { stageLevel: 156, atkDmgMultiplier: 22125065, hpMultiplier: 1103070, goldMultiplier: 112250, expMultiplier: 2234400 },
  { stageLevel: 157, atkDmgMultiplier: 22793745, hpMultiplier: 1117970, goldMultiplier: 113750, expMultiplier: 2264400 },
  { stageLevel: 158, atkDmgMultiplier: 23472425, hpMultiplier: 1132970, goldMultiplier: 115260, expMultiplier: 2294600 },
  { stageLevel: 159, atkDmgMultiplier: 24161105, hpMultiplier: 1148070, goldMultiplier: 116780, expMultiplier: 2325000 },
  { stageLevel: 160, atkDmgMultiplier: 24859785, hpMultiplier: 1163270, goldMultiplier: 118310, expMultiplier: 2355600 },
  { stageLevel: 161, atkDmgMultiplier: 25568465, hpMultiplier: 1178570, goldMultiplier: 119850, expMultiplier: 2386400 },
  { stageLevel: 162, atkDmgMultiplier: 26287145, hpMultiplier: 1193970, goldMultiplier: 121400, expMultiplier: 2417400 },
  { stageLevel: 163, atkDmgMultiplier: 27015825, hpMultiplier: 1209470, goldMultiplier: 122960, expMultiplier: 2448600 },
  { stageLevel: 164, atkDmgMultiplier: 27754505, hpMultiplier: 1225070, goldMultiplier: 124530, expMultiplier: 2480000 },
  { stageLevel: 165, atkDmgMultiplier: 28503185, hpMultiplier: 1240770, goldMultiplier: 126110, expMultiplier: 2511600 },
  { stageLevel: 166, atkDmgMultiplier: 29261865, hpMultiplier: 1256570, goldMultiplier: 127700, expMultiplier: 2543400 },
  { stageLevel: 167, atkDmgMultiplier: 30030545, hpMultiplier: 1272470, goldMultiplier: 129300, expMultiplier: 2575400 },
  { stageLevel: 168, atkDmgMultiplier: 30809225, hpMultiplier: 1288470, goldMultiplier: 130910, expMultiplier: 2607600 },
  { stageLevel: 169, atkDmgMultiplier: 31597905, hpMultiplier: 1304570, goldMultiplier: 132530, expMultiplier: 2640000 },
  { stageLevel: 170, atkDmgMultiplier: 32396585, hpMultiplier: 1320770, goldMultiplier: 134160, expMultiplier: 2672600 },
] as const;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateStageCurve(curveStage: number): StageScalingCurveEntry {
  const clamped = Math.max(1, Math.min(STAGE_SCALING_CURVE_MAX, curveStage));
  const low = Math.floor(clamped);
  const high = Math.min(STAGE_SCALING_CURVE_MAX, low + 1);
  const fraction = high === low ? 0 : clamped - low;
  const rowLow = STAGE_SCALING_CURVE_TABLE[low - 1];
  const rowHigh = STAGE_SCALING_CURVE_TABLE[high - 1];

  return {
    stageLevel: clamped,
    atkDmgMultiplier: Math.round(lerp(rowLow.atkDmgMultiplier, rowHigh.atkDmgMultiplier, fraction)),
    hpMultiplier: Math.round(lerp(rowLow.hpMultiplier, rowHigh.hpMultiplier, fraction)),
    goldMultiplier: Math.round(lerp(rowLow.goldMultiplier, rowHigh.goldMultiplier, fraction)),
    expMultiplier: Math.round(lerp(rowLow.expMultiplier, rowHigh.expMultiplier, fraction)),
  };
}

/** Posição na curva de referência para um tier global da campanha. */
export function scalingCurvePositionForTier(tier: number): number {
  const safeTier = Math.max(1, Math.min(GAME_STAGE_MAX_TIER, Math.floor(tier)));
  return 1 + ((safeTier - 1) / (GAME_STAGE_MAX_TIER - 1)) * (STAGE_SCALING_CURVE_MAX - 1);
}

/** Multiplicadores brutos (centésimos) para o tier global da fase. */
export function stageScalingEntryForTier(tier: number): StageScalingEntry {
  const safeTier = Math.max(1, Math.min(GAME_STAGE_MAX_TIER, Math.floor(tier)));
  const interpolated = interpolateStageCurve(scalingCurvePositionForTier(safeTier));

  return {
    tier: safeTier,
    atkDmgMultiplier: interpolated.atkDmgMultiplier,
    hpMultiplier: interpolated.hpMultiplier,
    goldMultiplier: interpolated.goldMultiplier,
    expMultiplier: interpolated.expMultiplier,
  };
}

/** Fatores normalizados (÷100) para aplicar sobre stats base dos inimigos. */
export function stageScalingFactorsForTier(tier: number, phaseMultiplier = 1): StageScalingFactors {
  const entry = stageScalingEntryForTier(tier);
  const phase = Math.max(0.01, phaseMultiplier);

  return {
    atk: (entry.atkDmgMultiplier / 100) * phase,
    hp: (entry.hpMultiplier / 100) * phase,
    gold: (entry.goldMultiplier / 100) * phase,
    exp: (entry.expMultiplier / 100) * phase,
  };
}
