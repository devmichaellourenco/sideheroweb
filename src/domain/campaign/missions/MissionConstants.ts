/** Constantes calibráveis do board de missões normais (BAL-014).
 * O intervalo MIN–MAX aplica-se **somente** à oferta de missões normais.
 * Principal e secundárias não entram nessa contagem e podem coexistir no mapa. */
export const NORMAL_MISSION_OFFER_MIN = 2;
export const NORMAL_MISSION_OFFER_MAX = 4;

/**
 * Quantas visitas ao acampamento até renovar a oferta de missões normais.
 * 2 = renova a cada duas voltas ao camp (calibração Fase 6).
 */
export const NORMAL_MISSION_REFRESH_EVERY_N_CAMP_VISITS = 2;
