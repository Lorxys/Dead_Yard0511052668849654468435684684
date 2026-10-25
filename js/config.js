// Réglages globaux : modifie ici pour équilibrer le jeu
const CFG = {
  TILE: 16,        // taille d'une tuile en pixels
  MW: 24, MH: 24,  // taille de la map en tuiles (agrandis plus tard)
  VIEW_W: 350,     // largeur logique de l'écran en jeu (plus grand = vue plus dézoomée)
  MENU_W: 480,     // largeur logique du décor du menu
  PLAYER: { speed: 62, hp: 5, fireRate: 0.16, bulletSpeed: 230, range: 0.7 },
  ZOMBIE: { speed: 16, speedPerWave: 1.5, speedMaxBonus: 15, dmgCd: 0.8 }   // vitesse = speed + bonus par vague (plafonné) + petit aléa
};
