# Dead Yard
Zombie shooter pixel art vu du dessus, jouable sur mobile (Android/iOS) et PC.

## Structure
- index.html : page et éléments d'interface
- css/style.css : mise en page, HUD, joysticks
- js/config.js : réglages (taille de la map, vitesses, vies)
- js/input.js : joysticks tactiles + clavier/souris
- js/sprites.js : pixel art dessiné par code
- js/map.js : map fermée, tuiles, collisions
- js/entities.js : joueurs et zombies
- js/menu.js : décor animé du menu
- js/game.js : boucle, vagues, tirs, rendu

## Préparation au multijoueur
Le jeu est solo, mais le code est organisé pour accueillir un mode multijoueur plus tard :
- **Simulation séparée de l'affichage** : `Game.step()` fait avancer le monde (joueurs, zombies, balles, vagues)
  sans toucher à l'écran. C'est la partie qui tournera chez l'hôte ou sur un serveur.
- **Intentions** : chaque joueur est piloté par `{ move, aim, fire }`. En local elle vient de `readLocalIntent()` ;
  pour un joueur distant, elle viendra du réseau.
- **Événements** : la simulation émet `shoot`, `impact`, `hit`, `kill`, `hurt`, `wave`, `gameover` ;
  `onEvent()` les transforme en sang, secousses, bannières. Ce sont eux qu'on enverra aux autres joueurs.
- **Plusieurs joueurs** : `Game.players` est une liste, `Game.localId` désigne le joueur de cette machine,
  `GameMap.playerSpawn(i)` donne un point d'apparition par joueur. Les zombies poursuivent le joueur vivant
  le plus proche, et la partie se termine quand plus personne n'est en vie.
- **Pas de temps fixe** (60 pas/seconde) et **identifiants uniques** pour les zombies et les balles, pour les
  synchroniser entre les machines.

## Publier sur GitHub Pages
1. Crée un dépôt GitHub et envoie tous ces fichiers à la racine.
2. Settings > Pages > Source : "Deploy from a branch", branche main, dossier /(root).
3. Ouvre l'URL https://TON-PSEUDO.github.io/NOM-DU-DEPOT/ sur ton téléphone.

## Contrôles
Mobile : pouce gauche = bouger, pouce droit = viser et tirer.
PC : ZQSD/WASD ou flèches pour bouger, clic maintenu pour viser et tirer.
