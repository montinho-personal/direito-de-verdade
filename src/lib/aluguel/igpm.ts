// IGP-M (FGV), variação mensal em centésimos de ponto percentual: 1,57% vira 157.
// Fonte: Banco Central do Brasil, SGS, série 189 (api.bcb.gov.br), baixada em 16/11/2026.
// Atualizar a cada divulgação, sem mexer nos meses já publicados.

export const PRIMEIRO_MES_DO_IGPM = { ano: 2015, mes: 1 };
export const ULTIMO_MES_DO_IGPM = { ano: 2026, mes: 10 };

// Um valor por mês, em ordem, de PRIMEIRO_MES_DO_IGPM a ULTIMO_MES_DO_IGPM
export const IGPM_VARIACAO_X100: readonly number[] = [
  76, 27, 98, 117, 41, 67, 69, 28, 95, 189, 152, 49, // 2015
  114, 129, 51, 33, 82, 169, 18, 15, 20, 16, -3, 54, // 2016
  64, 8, 1, -110, -93, -67, -72, 10, 47, 20, 52, 89, // 2017
  76, 7, 64, 57, 138, 187, 51, 70, 152, 89, -49, -108, // 2018
  1, 88, 126, 92, 45, 80, 40, -67, -1, 68, 30, 209, // 2019
  48, -4, 124, 80, 28, 156, 223, 274, 434, 323, 328, 96, // 2020
  258, 253, 294, 151, 410, 60, 78, 66, -64, 64, 2, 87, // 2021
  182, 183, 174, 141, 52, 59, 21, -70, -95, -97, -56, 45, // 2022
  21, -6, 5, -95, -184, -193, -72, -14, 37, 50, 59, 74, // 2023
  7, -52, -47, 31, 89, 81, 61, 29, 62, 152, 130, 94, // 2024
  27, 106, -34, 24, -49, -167, -77, 36, 42, -36, 27, -1, // 2025
  41, -73, 52, 273, 84, -50, -116, -22, 157, 147, // 2026
];
