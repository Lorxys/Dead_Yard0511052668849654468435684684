// Réglages globaux : modifie ici pour équilibrer le jeu
const CFG = {
  TILE: 16,        // taille d'une tuile en pixels
  VIEW_W: 350,     // largeur logique de l'écran en jeu (plus grand = vue plus dézoomée)
  MENU_W: 480,     // largeur logique du décor du menu
  WORLD_W: 640,    // largeur logique de la carte du monde (choix du front)
  // vie : 150 PV max ; après regenDelay s sans être touché, la vie remonte de regenRate PV/s jusqu'au max
  // score = points au départ de la partie (100000 temporaire, pour tester la boîte mystère et les portes ; remettre à 0 ensuite)
  PLAYER: { speed: 52, hp: 150, regenDelay: 3, regenRate: 20, weapon: 'ray', score: 100000 },
  RELOAD: 2.5,       // durée d'un rechargement (s), lancé tout seul quand le chargeur est vide
  // armes : rate = délai entre deux tirs (s), dmg = dégâts par balle de près, far = dégâts au-delà de fall[1] px
  // (baisse progressive entre fall[0] et fall[1]), pellets = plombs par tir, spread = dispersion (rad),
  // speed = vitesse des balles (px/s), range = durée de vie des balles (s), mag = balles par chargeur, reserve = balles en réserve
  // (un tir de fusil à pompe = une cartouche), pierce = nombre de zombies que la balle traverse avant de s'arrêter
  // cls = famille (son de tir), pump / bolt = bruit de pompe / de culasse après le tir, slow = vitesse du joueur qui la porte
  // (mitrailleuses lourdes), splash = explosion à l'impact { r: rayon px, dmg } (arme à rayons), rare = chance à la boîte (1 = normale)
  // équilibrage : dégâts par seconde de près ~6-7 (pistolets), ~7-8 (fusils d'assaut), ~8 (pistolets mitrailleurs, qui faiblissent
  // de loin), ~12-15 (fusils à pompe, de très près), ~8 + traversée (snipers), ~11-13 (mitrailleuses, mais on marche moins vite)
  WEAPONS: {
    // fusil tactique
    rifle:    { cls: 'rifle',   name: 'M1 Garand',      mag: 14, reserve: 140, rate: 0.24,  dmg: 1,   speed: 230, range: 0.7,  spread: 0.08 },
    // pistolets
    pistol:   { cls: 'pistol',  name: 'Colt M1911',     mag: 18, reserve: 96,  rate: 0.28,  dmg: 1.8, speed: 220, range: 0.65, spread: 0.05 },
    luger:    { cls: 'pistol',  name: 'Luger P08',      mag: 14, reserve: 98,  rate: 0.25,  dmg: 1.6, speed: 225, range: 0.65, spread: 0.05 },
    revolver: { cls: 'pistol',  name: 'Webley Mk VI',   mag: 6,  reserve: 80,  rate: 0.5,   dmg: 3.5, pierce: 1, speed: 240, range: 0.7, spread: 0.03 },
    hipower:  { cls: 'pistol',  name: 'Browning HP',    mag: 13, reserve: 104, rate: 0.23,  dmg: 1.5, speed: 225, range: 0.65, spread: 0.06 },
    // pistolets mitrailleurs
    smg:      { cls: 'smg',     name: 'Thompson',       mag: 40, reserve: 180, rate: 0.18,  dmg: 1.5,  far: 0.4,  fall: [40, 110], speed: 230, range: 0.6, spread: 0.16 },
    mp40:     { cls: 'smg',     name: 'MP 40',          mag: 35, reserve: 180, rate: 0.17,  dmg: 1.4,  far: 0.4,  fall: [40, 110], speed: 230, range: 0.6, spread: 0.13 },
    ppsh:     { cls: 'smg',     name: 'PPSh-41',        mag: 40, reserve: 180, rate: 0.12,  dmg: 1,    far: 0.3,  fall: [35, 100], speed: 230, range: 0.55, spread: 0.2 },
    sten:     { cls: 'smg',     name: 'Sten Mk II',     mag: 35, reserve: 180, rate: 0.16,  dmg: 1.25, far: 0.35, fall: [40, 105], speed: 225, range: 0.6, spread: 0.17 },
    grease:   { cls: 'smg',     name: 'M3 Grease Gun',  mag: 35, reserve: 180, rate: 0.2,   dmg: 1.7,  far: 0.45, fall: [40, 110], speed: 225, range: 0.6, spread: 0.12 },
    pps:      { cls: 'smg',     name: 'PPS-43',         mag: 35, reserve: 180, rate: 0.15,  dmg: 1.2,  far: 0.35, fall: [40, 110], speed: 230, range: 0.6, spread: 0.15 },
    mab38:    { cls: 'smg',     name: 'Beretta MAB 38', mag: 40, reserve: 180, rate: 0.16,  dmg: 1.35, far: 0.45, fall: [45, 120], speed: 240, range: 0.65, spread: 0.11 },
    // fusils d'assaut
    ar:       { cls: 'ar',      name: 'StG 44',         mag: 50, reserve: 240, rate: 0.176, dmg: 1.3, speed: 260, range: 0.85, spread: 0.07 },
    bar:      { cls: 'ar',      name: 'BAR M1918',      mag: 30, reserve: 180, rate: 0.2,   dmg: 1.6, speed: 265, range: 0.85, spread: 0.08 },
    fg42:     { cls: 'ar',      name: 'FG 42',          mag: 30, reserve: 180, rate: 0.15,  dmg: 1.2, speed: 260, range: 0.85, spread: 0.09 },
    carbine:  { cls: 'ar',      name: 'M2 Carbine',     mag: 30, reserve: 180, rate: 0.14,  dmg: 0.95, speed: 250, range: 0.75, spread: 0.08 },
    avs:      { cls: 'ar',      name: 'AVS-36',         mag: 40, reserve: 200, rate: 0.17,  dmg: 1.2, speed: 260, range: 0.8,  spread: 0.1 },
    g43:      { cls: 'ar',      name: 'Gewehr 43',      mag: 30, reserve: 180, rate: 0.26,  dmg: 1.9, speed: 270, range: 0.9,  spread: 0.05 },
    svt:      { cls: 'ar',      name: 'SVT-40',         mag: 40, reserve: 200, rate: 0.24,  dmg: 1.7, speed: 270, range: 0.9,  spread: 0.05 },
    mkb42:    { cls: 'ar',      name: 'MKb 42',         mag: 40, reserve: 200, rate: 0.16,  dmg: 1.15, speed: 255, range: 0.8, spread: 0.09 },
    // fusils à pompe
    shotgun:  { cls: 'shotgun', name: 'Trench Gun',     mag: 10, reserve: 90,  rate: 0.8,   dmg: 1.6, far: 0.2, fall: [20, 75], pellets: 7, pump: true, speed: 220, range: 0.38, spread: 0.55 },
    ithaca:   { cls: 'shotgun', name: 'Ithaca 37',      mag: 8,  reserve: 80,  rate: 0.7,   dmg: 1.4, far: 0.2, fall: [20, 75], pellets: 7, pump: true, speed: 220, range: 0.38, spread: 0.5 },
    double:   { cls: 'shotgun', name: 'Double canon',   mag: 2,  reserve: 50,  rate: 0.35,  dmg: 2,   far: 0.3, fall: [20, 70], pellets: 9, speed: 220, range: 0.35, spread: 0.65 },
    auto5:    { cls: 'shotgun', name: 'Browning Auto-5', mag: 12, reserve: 98, rate: 0.45,  dmg: 1,   far: 0.15, fall: [20, 70], pellets: 7, speed: 220, range: 0.36, spread: 0.55 },
    // fusils de précision : la balle traverse les zombies
    sniper:   { cls: 'sniper',  name: 'Kar98k',         mag: 8,  reserve: 120, rate: 1.2,   dmg: 9,   pierce: 4, bolt: true, speed: 420, range: 0.6, spread: 0 },
    mosin:    { cls: 'sniper',  name: 'Mosin-Nagant',   mag: 5,  reserve: 80,  rate: 1.3,   dmg: 11,  pierce: 5, bolt: true, speed: 430, range: 0.65, spread: 0 },
    enfield:  { cls: 'sniper',  name: 'Lee-Enfield',    mag: 10, reserve: 80,  rate: 1,     dmg: 8,   pierce: 3, bolt: true, speed: 420, range: 0.6, spread: 0 },
    m1d:      { cls: 'sniper',  name: 'M1D Garand',     mag: 20, reserve: 120, rate: 0.55,  dmg: 5,   pierce: 2, speed: 400, range: 0.6, spread: 0.01 },
    // mitrailleuses : très grosse puissance de feu, mais on marche moins vite
    mg42:     { cls: 'lmg',     name: 'MG 42',          mag: 75, reserve: 225, rate: 0.07,  dmg: 0.9, slow: 0.8,  speed: 270, range: 0.85, spread: 0.13 },
    mg34:     { cls: 'lmg',     name: 'MG 34',          mag: 65, reserve: 210, rate: 0.09,  dmg: 1,   slow: 0.82, speed: 270, range: 0.85, spread: 0.11 },
    m1919:    { cls: 'lmg',     name: 'Browning M1919', mag: 75, reserve: 225, rate: 0.1,   dmg: 1.2, slow: 0.78, speed: 265, range: 0.85, spread: 0.1 },
    dp28:     { cls: 'lmg',     name: 'DP-28',          mag: 65, reserve: 210, rate: 0.12,  dmg: 1.35, slow: 0.85, speed: 265, range: 0.85, spread: 0.09 },
    // arme spéciale : rayon vert qui explose à l'impact ou au sol en bout de portée (blesse les zombies autour), rare à la boîte
    ray:      { cls: 'ray',     name: 'Pistolet à rayons', mag: 40, reserve: 220, rate: 0.3, dmg: 6,  splash: { r: 20, dmg: 4 }, rare: 0.63, speed: 190, range: 0.3, spread: 0.02 }
  },
  // boîte mystère : arme au hasard (toutes sauf celle qu'on a en main, rare = moins de chances ; le pistolet à rayons sort avec une lueur et une musique légendaires) ; elle tourne roll s puis attend keep s qu'on vienne la prendre
  BOX: { name: 'Boîte Mystère', info: 'Obtenez une arme aléatoire', color: '#8ad4ff', price: 950, roll: 4, keep: 12,
    // tête de mort (seulement sur les maps à plusieurs emplacements) : impossible pendant les `after` premiers tirages sur un
    // emplacement, puis `chance` au tirage suivant et +`step` à chaque tirage ; le crâne reste `show` s, puis la boîte s'envole
    // en `fly` s et réapparaît sur un autre emplacement (compteur de tirages remis à 0). Le joueur est remboursé.
    skull: { after: 4, chance: 0.2, step: 0.1, show: 3, fly: 3 } },
  // grenades : stock de départ/max, +1 par vague, portée et rayon d'explosion en pixels, dégâts au centre, durées en s
  GRENADE: { start: 2, max: 4, perWave: 1, range: 110, radius: 34, damage: 10, fuse: 1.4, flight: 0.55, cooldown: 0.6 },
  SCORE: { hit: 10, kill: 90 },   // points par balle qui touche un zombie, et bonus quand il meurt
  // atouts vendus par les machines en haut de la map ; chaque atout ne s'achète qu'une fois
  // prix : 2500 pour le premier atout acheté, puis +500 à chaque achat (3000, 3500, 4000, 4500)
  PERK_PRICE: { start: 2500, step: 500 },
  PERKS: {
    health: { name: 'Blindage', color: '#e0382a', desc: '250 PV max', info: 'Augmente la santé du joueur', maxHp: 250 },
    regen:  { name: 'Second Souffle', color: '#3a86f0', desc: 'Régénération rapide', info: 'Augmente la vie du joueur', delay: 2, rate: 40 },
    speed:  { name: 'Pied Léger', color: '#ff8a2a', desc: 'Déplacement x1,5', info: 'Augmente la vitesse du joueur', mult: 1.5 },
    fire:   { name: 'Double Détente', color: '#ffd23a', desc: 'Cadence de tir x1,7', info: 'Augmente la vitesse de tir', mult: 1.7 },
    reload: { name: 'Main Leste', color: '#4ad83a', desc: 'Rechargement 1,25 s', info: 'Accélère le rechargement', time: 1.25 }
  },
  // machine d'amélioration en bas de la map : l'arme en main fait mult fois plus de dégâts ;
  // l'amélioration est perdue si on change d'arme (il faut la racheter pour la nouvelle) ;
  // chargeur mag fois plus grand, réserve reserve fois plus grande, et l'arme ressort pleine
  UPGRADE: { name: 'Arme Améliorée', color: '#b060ff', price: 5000, desc: 'Dégâts x2', info: 'Augmente la puissance de l\'arme', mult: 2, mag: 2, reserve: 3 },
  // portes achetables (barricades entre les zones) : prix, et durée en s pendant laquelle elles s'effondrent avant de laisser passer
  DOOR: { name: 'Barricade', color: '#c9b48a', price: 1000, fade: 2.5 },
  // boîte de munitions : prix selon l'arme en main (normale ou améliorée) ; l'achat remplit le chargeur et la réserve (impossible s'ils sont déjà pleins)
  AMMO: { name: 'Munitions', info: 'Remplit chargeur et réserve', full: 'Munitions pleines', color: '#d8b04a', price: 500, priceUp: 2500 },
  // pas d'invincibilité : chaque zombie qui frappe doit attendre dmgCd s avant de refrapper, les autres peuvent toujours toucher
  // vitesse = speed + bonus par vague (plafonné) + petit aléa
  // dégâts par coup selon la manche : [à partir de la manche, dégâts] -> 30, puis 50 dès la manche 11, puis 75 dès la manche 50
  ZOMBIE: { speed: 16, speedPerWave: 1.5, speedMaxBonus: 15, dmg: [[1, 30], [11, 50], [50, 75]], dmgCd: 1 }
};
