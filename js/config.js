// Réglages globaux : modifie ici pour équilibrer le jeu
const CFG = {
  TILE: 16,        // taille d'une tuile en pixels
  VIEW_W: 350,     // largeur logique de l'écran en jeu (plus grand = vue plus dézoomée)
  MENU_W: 480,     // largeur logique du décor du menu
  WORLD_W: 640,    // largeur logique de la carte du monde (choix du front)
  // vie : 150 PV max ; après regenDelay s sans être touché, la vie remonte de regenRate PV/s jusqu'au max
  // score = points au départ de la partie (100000 temporaire, pour tester la boîte mystère et les portes ; remettre à 0 ensuite)
  PLAYER: { speed: 52, hp: 150, regenDelay: 3, regenRate: 20, weapon: 'rifle', score: 100000 },
  // armes : rate = délai entre deux tirs (s), dmg = dégâts par balle de près, far = dégâts au-delà de fall[1] px
  // (baisse progressive entre fall[0] et fall[1]), pellets = plombs par tir, spread = dispersion (rad),
  // speed = vitesse des balles (px/s), range = durée de vie des balles (s)
  WEAPONS: {
    rifle:   { name: 'M1 Garand',  rate: 0.16, dmg: 1,   speed: 230, range: 0.7,  spread: 0.08 },
    pistol:  { name: 'Colt M1911', rate: 0.28, dmg: 1.8, speed: 220, range: 0.65, spread: 0.05 },
    smg:     { name: 'Thompson',   rate: 0.09, dmg: 1.5, far: 0.4, fall: [40, 110], speed: 230, range: 0.6, spread: 0.16 },
    ar:      { name: 'StG 44',     rate: 0.11, dmg: 1.3, speed: 260, range: 0.85, spread: 0.07 },
    shotgun: { name: 'Trench Gun', rate: 0.8,  dmg: 1.6, far: 0.2, fall: [20, 75], pellets: 7, speed: 220, range: 0.38, spread: 0.55 },
    sniper:  { name: 'Kar98k',     rate: 1.2,  dmg: 9,   speed: 420, range: 0.6,  spread: 0 }
  },
  // boîte mystère : arme au hasard (parmi weapons) ; elle tourne roll s puis attend keep s qu'on vienne la prendre
  BOX: { name: 'Boîte Mystère', info: 'Obtenez une arme aléatoire', color: '#8ad4ff', price: 950, roll: 4, keep: 12, weapons: ['pistol', 'smg', 'ar', 'shotgun', 'sniper'],
    // tête de mort (seulement sur les maps à plusieurs emplacements) : impossible pendant les `after` premiers tirages sur un
    // emplacement, puis `chance` au tirage suivant et +`step` à chaque tirage ; le crâne reste `show` s, puis la boîte s'envole
    // en `fly` s et réapparaît sur un autre emplacement (compteur de tirages remis à 0). Le joueur est remboursé.
    skull: { after: 4, chance: 0.2, step: 0.1, show: 3, fly: 3 } },
  // grenades : stock de départ/max, +1 par vague, portée et rayon d'explosion en pixels, dégâts au centre, durées en s
  GRENADE: { start: 2, max: 4, perWave: 1, range: 110, radius: 34, damage: 10, fuse: 1.4, flight: 0.55, cooldown: 0.6 },
  SCORE: { hit: 10, kill: 90 },   // points par balle qui touche un zombie, et bonus quand il meurt
  // atouts vendus par les machines en haut de la map ; chaque atout ne s'achète qu'une fois
  // prix : 2500 pour le premier atout acheté, puis +500 à chaque achat (3000, 3500, 4000)
  PERK_PRICE: { start: 2500, step: 500 },
  PERKS: {
    health: { name: 'Blindage', color: '#e0382a', desc: '250 PV max', info: 'Augmente la santé du joueur', maxHp: 250 },
    regen:  { name: 'Second Souffle', color: '#3a86f0', desc: 'Régénération rapide', info: 'Augmente la vie du joueur', delay: 2, rate: 40 },
    speed:  { name: 'Pied Léger', color: '#ff8a2a', desc: 'Déplacement x1,5', info: 'Augmente la vitesse du joueur', mult: 1.5 },
    fire:   { name: 'Double Détente', color: '#ffd23a', desc: 'Cadence de tir x1,7', info: 'Augmente la vitesse de tir', mult: 1.7 }
  },
  // machine d'amélioration en bas de la map : l'arme en main fait mult fois plus de dégâts ;
  // l'amélioration est perdue si on change d'arme (il faut la racheter pour la nouvelle)
  UPGRADE: { name: 'Arme Améliorée', color: '#b060ff', price: 5000, desc: 'Dégâts x2', info: 'Augmente la puissance de l\'arme', mult: 2 },
  // portes achetables (barricades entre les zones) : prix, et durée en s pendant laquelle elles s'effondrent avant de laisser passer
  DOOR: { name: 'Barricade', color: '#c9b48a', price: 1000, fade: 2.5 },
  // pas d'invincibilité : chaque zombie qui frappe doit attendre dmgCd s avant de refrapper, les autres peuvent toujours toucher
  // vitesse = speed + bonus par vague (plafonné) + petit aléa
  // dégâts par coup selon la manche : [à partir de la manche, dégâts] -> 30, puis 50 dès la manche 11, puis 75 dès la manche 50
  ZOMBIE: { speed: 16, speedPerWave: 1.5, speedMaxBonus: 15, dmg: [[1, 30], [11, 50], [50, 75]], dmgCd: 1 }
};
