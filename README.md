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
- **Intentions** : chaque joueur est piloté par `{ move, aim, fire, grenade, buy }`. En local elle vient de `readLocalIntent()` ;
  pour un joueur distant, elle viendra du réseau.
- **Événements** : la simulation émet `shoot`, `throw`, `explode`, `impact`, `hit`, `kill`, `hurt`, `perk`, `buyfail`, `wave`, `gameover` ;
  `onEvent()` les transforme en sang, secousses, bannières. Ce sont eux qu'on enverra aux autres joueurs.
- **Plusieurs joueurs** : `Game.players` est une liste, `Game.localId` désigne le joueur de cette machine,
  `GameMap.playerSpawn(i)` donne un point d'apparition par joueur. Les zombies poursuivent le joueur vivant
  le plus proche, et la partie se termine quand plus personne n'est en vie.
- **Pas de temps fixe** (60 pas/seconde) et **identifiants uniques** pour les zombies et les balles, pour les
  synchroniser entre les machines.

## Version
Format `1.00.<nombre de push>`, affichée en bas à gauche du menu. À chaque push, on l'augmente dans `index.html`
(dans tous les `?v=` et dans le menu) : les téléphones téléchargent alors les nouveaux fichiers au lieu de garder
l'ancienne version en cache.

## Publier sur GitHub Pages
1. Crée un dépôt GitHub et envoie tous ces fichiers à la racine.
2. Settings > Pages > Source : "Deploy from a branch", branche main, dossier /(root).
3. Ouvre l'URL https://TON-PSEUDO.github.io/NOM-DU-DEPOT/ sur ton téléphone.

## Contrôles
Mobile : pouce gauche = bouger, pouce droit = viser et tirer,
joystick grenade (à droite, au-dessus de la zone de tir) = glisser pour viser, relâcher pour lancer
(plus on pousse, plus elle va loin ; un simple appui la lâche aux pieds du joueur).
PC : ZQSD/WASD ou flèches pour bouger, clic maintenu pour viser et tirer, clic droit ou G = grenade vers le curseur.
Machines à atout (en haut de la map) : en s'approchant, un bouton « Acheter » apparaît sur la machine avec le prix
en dessous (toucher le bouton sur mobile, E sur PC). Les points servent de monnaie. Chaque atout ne s'achète qu'une
fois. Le premier coûte 2500 points, et le prix augmente de 500 à chaque achat (3000, 3500, 4000).
- Rouge, Blindage : 250 PV max
- Bleue, Second Souffle : régénération après 2 s au lieu de 3, deux fois plus rapide
- Orange, Pied Léger : déplacement x1,5
- Jaune, Double Détente : cadence de tir x2

Machine d'amélioration d'arme (en bas de la map, violette) : 5000 points, achat unique. L'arme en main fait
2 fois plus de dégâts (balles traçantes violettes). Son prix ne dépend pas des atouts achetés.
