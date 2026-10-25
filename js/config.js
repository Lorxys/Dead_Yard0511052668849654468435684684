// Réglages globaux : modifie ici pour équilibrer le jeu
const CFG = {
  TILE: 16,        // taille d'une tuile en pixels
  MW: 24, MH: 24,  // taille de la map en tuiles (agrandis plus tard)
  VIEW_W: 300,     // largeur logique de l'écran en jeu (plus grand = vue plus dézoomée)
  MENU_W: 480,     // largeur logique du décor du menu
  PLAYER: { speed: 62, hp: 5, fireRate: 0.16, bulletSpeed: 230, range: 0.7 },
  ZOMBIE: { speed: 20, dmgCd: 0.8 }
};
