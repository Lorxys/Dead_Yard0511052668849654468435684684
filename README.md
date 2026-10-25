# Dead Yard
Zombie shooter pixel art vu du dessus, jouable sur mobile (Android/iOS) et PC.

## Structure
- index.html : page et éléments d'interface
- css/style.css : mise en page, HUD, joysticks
- js/config.js : réglages (taille de la map, vitesses, vies)
- js/input.js : joysticks tactiles + clavier/souris
- js/sprites.js : pixel art dessiné par code
- js/map.js : map fermée, tuiles, collisions
- js/entities.js : joueur et zombies
- js/game.js : boucle, vagues, tirs, rendu

## Publier sur GitHub Pages
1. Crée un dépôt GitHub et envoie tous ces fichiers à la racine.
2. Settings > Pages > Source : "Deploy from a branch", branche main, dossier /(root).
3. Ouvre l'URL https://TON-PSEUDO.github.io/NOM-DU-DEPOT/ sur ton téléphone.

## Contrôles
Mobile : pouce gauche = bouger, pouce droit = viser et tirer.
PC : ZQSD/WASD ou flèches pour bouger, clic maintenu pour viser et tirer.
