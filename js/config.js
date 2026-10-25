// Réglages globaux : modifie ici pour équilibrer le jeu
const CFG = {
  TILE: 16,        // taille d'une tuile en pixels
  MW: 24, MH: 24,  // taille de la map en tuiles (agrandis plus tard)
  VIEW_W: 350,     // largeur logique de l'écran en jeu (plus grand = vue plus dézoomée)
  MENU_W: 480,     // largeur logique du décor du menu
  PLAYER: { speed: 62, hp: 5, fireRate: 0.16, bulletSpeed: 230, range: 0.7 },
  // grenades : stock de départ/max, +1 par vague, portée et rayon d'explosion en pixels, dégâts au centre, durées en s
  GRENADE: { start: 2, max: 4, perWave: 1, range: 110, radius: 34, damage: 10, fuse: 1.4, flight: 0.55, cooldown: 0.6 },
  SCORE: { hit: 10, kill: 90 },   // points par balle qui touche un zombie, et bonus quand il meurt
  ZOMBIE: { speed: 16, speedPerWave: 1.5, speedMaxBonus: 15, dmgCd: 0.8 }   // vitesse = speed + bonus par vague (plafonné) + petit aléa
};
