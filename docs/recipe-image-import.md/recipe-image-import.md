# Import de recettes depuis des images



## Format préféré



Utiliser un fichier JSON UTF-8 contenant un tableau `recipes`. Une recette doit respecter cette structure :



```json

{

  "name": "Nom exact de la recette",

  "category": "RECETTE PERSONNELLE",

  "types": ["Végétarien", "Cuisine italienne"],

  "time": 35,

  "servings": 4,

  "ingredients": [

    {

      "name": "Courgette",

      "amount": 2,

      "unit": "pièce",

      "baseUnit": "pièce",

      "stores": []

    }

  ],

  "instructions": [

    "Première étape.",

    "Deuxième étape."

  ],

  "source": {

    "imageFile": "recette-001.jpg",

    "page": null,

    "confidence": 0.94,

    "notes": []

  }

}

```



Les champs `baseUnit`, `source.page` et `source.notes` sont optionnels. Les magasins doivent rester `[]` pour les recettes extraites : je les compléterai ensuite manuellement.



## Prompt pour l’autre IA



Tu es un assistant d’extraction de recettes. Analyse les images fournies et retourne uniquement un JSON valide, sans Markdown et sans commentaire.



Pour chaque recette, extrais :



- `name`: nom de la recette, sans le recopier dans les instructions ;

- `category`: une catégorie courte en français, par exemple `RECETTE PERSONNELLE`, `RAPIDE`, `FAMILLE`, `DESSERT`;

- `types`: tableau de tags en français, par exemple `Viande`, `Poisson`, `Végétarien`, `Végétal`, `Cuisine italienne`, `Cuisine japonaise`;

- `time`: temps total de cuisson/préparation en minutes, nombre entier;

- `servings`: nombre de portions, nombre entier;

- `ingredients`: tableau d’objets avec `name`, `amount`, `unit`, `baseUnit` facultatif et `stores`;

- `instructions`: tableau ordonné d’étapes de préparation;

- `source`: fichier image, numéro de page si visible, niveau de confiance entre 0 et 1 et notes d’incertitude.



Règles d’extraction :



1. Préserve les quantités exactement. Ne convertis pas les unités sans indication explicite.

2. Utilise des unités simples et cohérentes : `g`, `kg`, `ml`, `l`, `pièce`, `boîte`, `c. à soupe`, `c. à café`, `pincée`, `au goût`.

3. Pour une quantité comme `1/2`, utilise `0.5`. Pour `1 à 2`, garde `amount: 1` et ajoute une note `"quantite_lisible: 1 à 2"`.

4. Ne devine jamais un ingrédient ou une quantité masquée. Ajoute une note et baisse `confidence`.

5. Si un ingrédient apparaît plusieurs fois avec la même unité, garde les lignes séparées et ajoute une note; ne les additionne pas pendant l’extraction.

6. Si le texte indique seulement « selon votre goût », utilise `amount: 0` et `unit: "au goût"`.

7. Les magasins doivent toujours être `[]`. Ils seront associés plus tard selon les préférences de la famille.

8. Les instructions doivent rester dans l’ordre de l’image, avec une étape par élément du tableau.

9. Si plusieurs images correspondent à la même recette, fusionne-les uniquement quand le nom et le contexte correspondent clairement.

10. Retourne un tableau JSON sous la clé `recipes`, même s’il n’y a qu’une recette.



Structure de sortie obligatoire :



```json

{

  "recipes": [],

  "extractionNotes": [

    "Liste globale des images difficiles à lire ou des éléments à vérifier."

  ]

}

```



## Validation humaine



Avant import dans l’application, vérifier au minimum : nom, portions, temps, chaque quantité, unité, ordre des instructions et les notes de confiance inférieures à `0.85`. Les magasins et préférences seront ajoutés ensuite dans le carnet de recettes.

