// Réglages globaux : modifie ici pour équilibrer le jeu
const CFG = {
  TILE: 16,        // taille d'une tuile en pixels
  MW: 24, MH: 24,  // taille de la map en tuiles (agrandis plus tard)
  VIEW_W: 350,     // largeur logique de l'écran en jeu (plus grand = vue plus dézoomée)
  MENU_W: 480,     // largeur logique du décor du menu
  // vie : 150 PV max ; après regenDelay s sans être touché, la vie remonte de regenRate PV/s jusqu'au max
  PLAYER: { speed: 62, hp: 150, regenDelay: 3, regenRate: 20, fireRate: 0.16, bulletSpeed: 230, range: 0.7 },
  // grenades : stock de départ/max, +1 par vague, portée et rayon d'explosion en pixels, dégâts au centre, durées en s
  GRENADE: { start: 2, max: 4, perWave: 1, range: 110, radius: 34, damage: 10, fuse: 1.4, flight: 0.55, cooldown: 0.6 },
  SCORE: { hit: 10, kill: 90 },
  // atouts vendus par les machines en haut de la map ; chaque atout ne s'achète qu'une fois
  // prix : 2500 pour le premier atout acheté, puis +500 à chaque achat (3000, 3500, 4000)
  PERK_PRICE: { start: 2500, step: 500 },
  PERKS: {
    health: { name: 'Blindage', color: '#e0382a', desc: '250 PV max', maxHp: 250 },
    regen:  { name: 'Second Souffle', color: '#3a86f0', desc: 'Régénération rapide', delay: 2, rate: 40 },
    speed:  { name: 'Pied Léger', color: '#ff8a2a', desc: 'Déplacement x1,5', mult: 1.5 },
    fire:   { name: 'Double Détente', color: '#ffd23a', desc: 'Cadence de tir x2', mult: 2 }
  },   // points par balle qui touche un zombie, et bonus quand il meurt
  ZOMBIE: { speed: 16, speedPerWave: 1.5, speedMaxBonus: 15, dmg: 30, dmgCd: 0.8 }   // vitesse = speed + bonus par vague (plafonné) + petit aléa
};
