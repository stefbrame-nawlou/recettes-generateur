# Recettes générateur

Prototype local-first de planification des repas. Choisissez des recettes et le nombre de portions, sélectionnez les magasins, vérifiez les quantités regroupées, puis enregistrez des listes de courses à cocher.

## Lancer en local

```sh
npm install
npm run dev
```

Ouvrez l’adresse locale affichée par Vite. Exécutez `npm run lint` et `npm run build` pour vérifier le code et créer une version de production.

## Synchronisation familiale

Le projet Supabase `recettes-famille` héberge un état partagé protégé par le code familial. Le code est vérifié par la fonction Edge `family-state`; la clé secrète Supabase reste côté serveur. Les appareils synchronisent les menus, les listes de courses et les notes, avec le stockage local comme copie de secours.

Pour déployer la fonction, configurez les secrets du dépôt GitHub `SUPABASE_ACCESS_TOKEN` (jeton Supabase limité au projet `recettes-famille`) et `FAMILY_ACCESS_CODE` (code familial aléatoire d’au moins 16 caractères). Le workflow `.github/workflows/deploy-supabase.yml` déploie ensuite la fonction et transmet le code à Supabase. Dans chaque navigateur ou téléphone, ouvrez le bouton d’état en haut de page, saisissez le même code familial une seule fois, puis les données seront partagées. Ne placez jamais le code familial, un jeton Supabase ou la clé service-role dans le code source.

## Publication sur GitHub Pages

Le workflow `.github/workflows/deploy.yml` publie automatiquement le site à chaque envoi sur la branche `main`. Il est configuré pour un dépôt nommé `recettes-generateur`; son adresse sera `https://<votre-nom-github>.github.io/recettes-generateur/`. Créez ce dépôt sur GitHub et sélectionnez la visibilité publique si vous souhaitez accéder au site sans connexion. Dans les paramètres du dépôt, choisissez **Pages > Build and deployment > GitHub Actions** si ce n’est pas déjà configuré.

## Données de démonstration

Les exemples de recettes et les préférences de magasins sont définis dans `src/App.tsx`. Ils pourront être remplacés par les données du classeur lorsqu’il sera disponible sous une forme lisible. Sans code familial configuré, les menus, notes, historiques et listes restent locaux à ce navigateur.

Les unités ne sont pas encore converties. Le modèle prévoit des métadonnées facultatives pour une future conversion vers une unité de base. Les quantités sont regroupées uniquement si l’ingrédient, l’unité et le magasin sélectionné correspondent.

## Fonctionnalités actuelles

- Planification des recettes de la semaine, avec dates facultatives et adaptation des portions
- Recherche, filtres par ingrédient ou type, tri par nom, note et date de préparation
- Cases à cocher pour les ingrédients et choix du magasin par défaut selon les préférences
- Vérification des courses regroupées par magasin, avec retour au menu pour le modifier
- Historique des menus et des listes de courses, suppression et cases à cocher pour les achats
- Carnet de recettes d’exemple avec notes, dates de préparation et instructions
- Création et modification de recettes, avec magasins autorisés par ingrédient
- Magasins disponibles : Colruyt ch. Wavre, Delhaize Hankar, Delhaize Boileau, Carrefour Thieffry et Farm Hankar

Le format JSON et le prompt recommandé pour extraire des recettes depuis des photos se trouvent dans [docs/recipe-image-import.md](docs/recipe-image-import.md). Les achats courants et le regroupement par familles d’ingrédients sont prévus pour une étape ultérieure.
# Recettes générateur

Application de planification des repas et de gestion des listes de courses.

## Site

Publié avec GitHub Pages à l’adresse : https://stefbrame-nawlou.github.io/recettes-generateur/

Le déploiement est automatisé par `.github/workflows/deploy.yml` à chaque commit sur `main`.

## Développement local

```sh
npm install
npm run dev
```

Vérifications : `npm run lint` et `npm run build`.

## Données

Les recettes présentes sont des exemples. Les menus, les notes et les listes sont enregistrés dans le stockage local du navigateur et ne sont pas synchronisés entre appareils. Les données de recettes sont définies dans `src/App.tsx`.
# Recettes générateur

Application web de planification des repas et de création de listes de courses.

## Publication

Cette application est destinée à GitHub Pages. Le dépôt doit s’appeler `recettes-generateur`. Le workflow de déploiement sera ajouté dans `.github/workflows/deploy.yml`.
