import { useEffect, useMemo, useState } from 'react'
import './App.css'

type StoreChoice = { name: string; preference: number }
type UnitConversion = { unit: string; factorToBaseUnit: number }
type Ingredient = {
  name: string
  amount: number
  unit: string
  stores: StoreChoice[]
  baseUnit?: string
  unitConversions?: UnitConversion[]
}
type Recipe = {
  id: string
  name: string
  category: string
  types: string[]
  time: number
  servings: number
  ingredients: Ingredient[]
  instructions: string[]
}
type PlanItem = {
  id: string
  recipeId: string
  servings: number
  date: string
  needs: Record<string, boolean>
  stores: Record<string, string>
}
type GroceryItem = {
  id: string
  name: string
  amount: number
  unit: string
  store: string
  checked: boolean
}
type GroceryList = {
  id: string
  name: string
  createdAt: string
  items: GroceryItem[]
}
type SavedWeeklyPlan = {
  id: string
  name: string
  createdAt: string
  items: PlanItem[]
}
type RecipeMetadata = Record<string, { rating: number; lastCookedAt: string | null }>

const recipes: Recipe[] = [
  {
    id: 'lemon-chicken',
    name: 'Poulet au citron et pommes de terre croustillantes',
    category: 'UN CLASSIQUE DE LA SEMAINE',
    types: ['Viande', 'Cuisine européenne'],
    time: 40,
    servings: 2,
    ingredients: [
      { name: 'Filet de poulet', amount: 300, unit: 'g', stores: [{ name: 'Boucherie', preference: 1 }, { name: 'Marché', preference: 2 }] },
      { name: 'Pommes de terre', amount: 500, unit: 'g', stores: [{ name: 'Marché', preference: 1 }, { name: 'Supermarché', preference: 2 }] },
      { name: 'Citron', amount: 1, unit: 'pièce', stores: [{ name: 'Marché', preference: 1 }, { name: 'Supermarché', preference: 2 }] },
      { name: 'Haricots verts', amount: 200, unit: 'g', stores: [{ name: 'Marché', preference: 1 }, { name: 'Supermarché', preference: 2 }] },
      { name: "Huile d’olive", amount: 2, unit: 'c. à soupe', stores: [{ name: 'Supermarché', preference: 1 }] },
    ],
    instructions: ['Préchauffez le four à 210 °C. Coupez les pommes de terre en quartiers et mélangez-les avec l’huile d’olive, du sel et du poivre.', 'Enfournez les pommes de terre pendant 30 minutes en les retournant à mi-cuisson. Assaisonnez le poulet et faites-le dorer à la poêle jusqu’à ce qu’il soit cuit.', 'Faites cuire les haricots verts à la vapeur. Arrosez le poulet de jus de citron et servez le tout.'],
  },
  {
    id: 'courgette-pasta',
    name: 'Pâtes crémeuses aux courgettes et au basilic',
    category: 'RAPIDE ET FRAIS',
    types: ['Végétarien', 'Cuisine italienne'],
    time: 25,
    servings: 2,
    ingredients: [
      { name: 'Pâtes', amount: 180, unit: 'g', stores: [{ name: 'Supermarché', preference: 1 }] },
      { name: 'Courgette', amount: 2, unit: 'pièce', stores: [{ name: 'Marché', preference: 1 }, { name: 'Supermarché', preference: 2 }] },
      { name: 'Crème', amount: 120, unit: 'ml', stores: [{ name: 'Supermarché', preference: 1 }] },
      { name: 'Parmesan', amount: 40, unit: 'g', stores: [{ name: 'Fromagerie', preference: 1 }, { name: 'Supermarché', preference: 2 }] },
      { name: 'Basilic frais', amount: 10, unit: 'g', stores: [{ name: 'Marché', preference: 1 }] },
    ],
    instructions: ['Faites cuire les pâtes dans de l’eau salée jusqu’à ce qu’elles soient al dente. Réservez une tasse d’eau de cuisson.', 'Coupez la courgette en rondelles et faites-la revenir jusqu’à ce qu’elle soit dorée. Ajoutez la crème et un peu d’eau de cuisson.', 'Mélangez avec les pâtes, le parmesan et le basilic effeuillé. Assaisonnez à votre goût.'],
  },
  {
    id: 'chickpea-curry',
    name: 'Curry de pois chiches au lait de coco',
    category: 'VÉGÉTAL',
    types: ['Végétarien', 'Cuisine indienne'],
    time: 35,
    servings: 3,
    ingredients: [
      { name: 'Pois chiches', amount: 2, unit: 'boîtes', stores: [{ name: 'Supermarché', preference: 1 }] },
      { name: 'Lait de coco', amount: 400, unit: 'ml', stores: [{ name: 'Supermarché', preference: 1 }] },
      { name: 'Épinards', amount: 150, unit: 'g', stores: [{ name: 'Marché', preference: 1 }, { name: 'Supermarché', preference: 2 }] },
      { name: 'Oignon jaune', amount: 1, unit: 'pièce', stores: [{ name: 'Marché', preference: 1 }, { name: 'Supermarché', preference: 2 }] },
      { name: 'Pâte de curry', amount: 2, unit: 'c. à soupe', stores: [{ name: 'Supermarché', preference: 1 }] },
    ],
    instructions: ['Émincez l’oignon et faites-le revenir doucement jusqu’à ce qu’il soit tendre. Ajoutez la pâte de curry et faites cuire une minute.', 'Ajoutez les pois chiches égouttés et le lait de coco. Laissez mijoter 20 minutes.', 'Incorporez les épinards et laissez-les fondre. Servez avec du riz ou du pain plat.'],
  },
]

const storageKey = 'table-and-thyme-grocery-lists'
const planStorageKey = 'table-and-thyme-weekly-plan'
const savedPlansStorageKey = 'table-and-thyme-saved-weekly-plans'
const recipeMetadataStorageKey = 'table-and-thyme-recipe-metadata'
const todayLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
const legacyTextTranslations: Record<string, string> = {
  'Chicken breast': 'Filet de poulet',
  Potatoes: 'Pommes de terre',
  Lemon: 'Citron',
  'Green beans': 'Haricots verts',
  'Olive oil': "Huile d’olive",
  Pasta: 'Pâtes',
  Cream: 'Crème',
  'Fresh basil': 'Basilic frais',
  Chickpeas: 'Pois chiches',
  'Coconut milk': 'Lait de coco',
  Spinach: 'Épinards',
  'Yellow onion': 'Oignon jaune',
  'Curry paste': 'Pâte de curry',
  Butcher: 'Boucherie',
  Market: 'Marché',
  Supermarket: 'Supermarché',
  'Cheese shop': 'Fromagerie',
  'Grocery list': 'Liste de courses',
  'Weekly plan': 'Menu de la semaine',
}

function displayFrench(value: string): string {
  return legacyTextTranslations[value] ?? value
}

function displayFrenchUnit(unit: string, amount = 1): string {
  const singular = ({ pc: 'pièce', pcs: 'pièce', cans: 'boîte', can: 'boîte' })[unit] ?? unit
  if (singular === 'pièce' || singular === 'boîte') return amount > 1 ? `${singular}s` : singular
  return unit === 'tbsp' ? 'c. à soupe' : singular
}

function formatFrenchDate(date: string | Date, options: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('fr-FR', options)
}

function groceryListTitle(list: GroceryList): string {
  return `Liste de courses · ${formatFrenchDate(list.createdAt, { day: 'numeric', month: 'short' })}`
}

function readLists(): GroceryList[] {
  try {
    const stored = localStorage.getItem(storageKey)
    return stored ? JSON.parse(stored) as GroceryList[] : []
  } catch {
    return []
  }
}

function readPlan(): PlanItem[] {
  try {
    const stored = localStorage.getItem(planStorageKey)
    if (!stored) return [makePlanItem()]
    const parsed = JSON.parse(stored) as PlanItem[]
    if (!Array.isArray(parsed)) return [makePlanItem()]
    return parsed.flatMap((item) => {
      const recipe = recipes.find((entry) => entry.id === item.recipeId)
      if (!recipe) return []
      const needs: Record<string, boolean> = {}
      const stores: Record<string, string> = {}
      recipe.ingredients.forEach((ingredient) => {
        const oldName = Object.entries(legacyTextTranslations).find(([, translated]) => translated === ingredient.name)?.[0] ?? ingredient.name
        needs[ingredient.name] = item.needs?.[ingredient.name] ?? item.needs?.[oldName] ?? true
        const oldStore = item.stores?.[ingredient.name] ?? item.stores?.[oldName]
        const translatedStore = oldStore ? displayFrench(oldStore) : ''
        stores[ingredient.name] = ingredient.stores.some((store) => store.name === translatedStore)
          ? translatedStore
          : [...ingredient.stores].sort((a, b) => a.preference - b.preference)[0].name
      })
      return [{ ...item, needs, stores }]
    })
  } catch {
    return [makePlanItem()]
  }
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) as T : fallback
  } catch {
    return fallback
  }
}

function getDefaultRecipeMetadata(): RecipeMetadata {
  return Object.fromEntries(recipes.map((recipe) => [recipe.id, { rating: 0, lastCookedAt: null }]))
}

function formatQuantity(amount: number): string {
  return amount.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
}

function makePlanItem(recipeId = recipes[0].id): PlanItem {
  const recipe = recipes.find((item) => item.id === recipeId) ?? recipes[0]
  const stores: Record<string, string> = {}
  const needs: Record<string, boolean> = {}
  recipe.ingredients.forEach((ingredient) => {
    stores[ingredient.name] = [...ingredient.stores].sort((a, b) => a.preference - b.preference)[0].name
    needs[ingredient.name] = true
  })
  return { id: crypto.randomUUID(), recipeId, servings: recipe.servings, date: '', needs, stores }
}

function App() {
  const [page, setPage] = useState<'plan' | 'review' | 'lists' | 'detail' | 'recipes'>('plan')
  const [plan, setPlan] = useState<PlanItem[]>(readPlan)
  const [lists, setLists] = useState<GroceryList[]>(readLists)
  const [savedPlans, setSavedPlans] = useState<SavedWeeklyPlan[]>(() => readStored(savedPlansStorageKey, []))
  const [recipeMetadata, setRecipeMetadata] = useState<RecipeMetadata>(() => ({ ...getDefaultRecipeMetadata(), ...readStored(recipeMetadataStorageKey, {}) }))
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null)
  const [expandedPlanItemId, setExpandedPlanItemId] = useState<string | null>(null)
  const [expandedSavedPlanId, setExpandedSavedPlanId] = useState<string | null>(null)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [ingredientFilter, setIngredientFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [recipeSort, setRecipeSort] = useState('name-asc')
  const [recipeChoiceId, setRecipeChoiceId] = useState(recipes[0].id)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(lists))
  }, [lists])

  useEffect(() => {
    localStorage.setItem(planStorageKey, JSON.stringify(plan))
  }, [plan])

  useEffect(() => {
    localStorage.setItem(savedPlansStorageKey, JSON.stringify(savedPlans))
  }, [savedPlans])

  useEffect(() => {
    localStorage.setItem(recipeMetadataStorageKey, JSON.stringify(recipeMetadata))
  }, [recipeMetadata])

  const activeList = lists.find((list) => list.id === activeListId)
  const selectedRecipeCount = plan.filter((item) => item.recipeId).length
  const totalTime = plan.reduce((sum, item) => sum + (recipes.find((recipe) => recipe.id === item.recipeId)?.time ?? 0), 0)
  const recipeTypes = [...new Set(recipes.flatMap((recipe) => recipe.types))].sort()
  const recipeIngredients = [...new Set(recipes.flatMap((recipe) => recipe.ingredients.map((ingredient) => ingredient.name)))].sort()
  const visibleRecipes = useMemo(() => {
    const search = recipeSearch.trim().toLocaleLowerCase()
    const filtered = recipes.filter((recipe) => {
      const matchesSearch = !search || recipe.name.toLocaleLowerCase().includes(search) || recipe.types.some((type) => type.toLocaleLowerCase().includes(search))
      const matchesIngredient = !ingredientFilter || recipe.ingredients.some((ingredient) => ingredient.name === ingredientFilter)
      const matchesType = !typeFilter || recipe.types.includes(typeFilter)
      return matchesSearch && matchesIngredient && matchesType
    })
    return filtered.sort((a, b) => {
      if (recipeSort === 'name-desc') return b.name.localeCompare(a.name)
      if (recipeSort === 'rating-desc') return (recipeMetadata[b.id]?.rating ?? 0) - (recipeMetadata[a.id]?.rating ?? 0) || a.name.localeCompare(b.name)
      if (recipeSort === 'rating-asc') return (recipeMetadata[a.id]?.rating ?? 0) - (recipeMetadata[b.id]?.rating ?? 0) || a.name.localeCompare(b.name)
      if (recipeSort === 'cooked-newest') return (recipeMetadata[b.id]?.lastCookedAt ?? '').localeCompare(recipeMetadata[a.id]?.lastCookedAt ?? '') || a.name.localeCompare(b.name)
      if (recipeSort === 'cooked-oldest') return (recipeMetadata[a.id]?.lastCookedAt ?? '').localeCompare(recipeMetadata[b.id]?.lastCookedAt ?? '') || a.name.localeCompare(b.name)
      return a.name.localeCompare(b.name)
    })
  }, [ingredientFilter, recipeMetadata, recipeSearch, recipeSort, typeFilter])

  const groupedIngredients = useMemo(() => {
    const grouped = new Map<string, GroceryItem>()
    plan.forEach((planItem) => {
      const recipe = recipes.find((item) => item.id === planItem.recipeId)
      if (!recipe) return
      recipe.ingredients.forEach((ingredient) => {
        if (!planItem.needs[ingredient.name]) return
        const store = planItem.stores[ingredient.name]
        const key = `${ingredient.name.toLowerCase()}|${ingredient.unit}|${store}`
        const amount = ingredient.amount * planItem.servings / recipe.servings
        const existing = grouped.get(key)
        if (existing) existing.amount += amount
        else grouped.set(key, { id: key, name: ingredient.name, amount, unit: ingredient.unit, store, checked: false })
      })
    })
    return [...grouped.values()].sort((a, b) => a.store.localeCompare(b.store) || a.name.localeCompare(b.name))
  }, [plan])

  function updatePlan(id: string, update: Partial<PlanItem>) {
    setPlan((items) => items.map((item) => item.id === id ? { ...item, ...update } : item))
  }

  function addRecipe(recipeId: string) {
    setPlan((items) => [...items, makePlanItem(recipeId)])
    setRecipeChoiceId(recipeId)
  }

  function toggleGroceryItem(listId: string, itemId: string) {
    setLists((current) => current.map((list) => list.id === listId ? {
      ...list,
      items: list.items.map((item) => item.id === itemId ? { ...item, checked: !item.checked } : item),
    } : list))
  }

  function saveGroceryList() {
    const now = new Date()
    const timestamp = now.toISOString()
    const nextList: GroceryList = {
      id: crypto.randomUUID(),
      name: `Liste de courses · ${formatFrenchDate(now, { day: 'numeric', month: 'short' })}`,
      createdAt: timestamp,
      items: groupedIngredients.map((item) => ({ ...item, id: crypto.randomUUID() })),
    }
    const nextSavedPlan: SavedWeeklyPlan = {
      id: crypto.randomUUID(),
      name: `Menu de la semaine · ${formatFrenchDate(now, { day: 'numeric', month: 'long', year: 'numeric' })}`,
      createdAt: timestamp,
      items: JSON.parse(JSON.stringify(plan)) as PlanItem[],
    }
    setLists((current) => [nextList, ...current])
    setSavedPlans((current) => [nextSavedPlan, ...current])
    setRecipeMetadata((current) => {
      const updated = { ...current }
      plan.forEach((item) => {
        updated[item.recipeId] = { rating: updated[item.recipeId]?.rating ?? 0, lastCookedAt: timestamp }
      })
      return updated
    })
    setActiveListId(nextList.id)
    setPage('detail')
  }

  function setRecipeRating(recipeId: string, rating: number) {
    setRecipeMetadata((current) => ({
      ...current,
      [recipeId]: { rating, lastCookedAt: current[recipeId]?.lastCookedAt ?? null },
    }))
  }

  const nav = [
    { id: 'plan', label: 'Menus de la semaine', count: savedPlans.length },
    { id: 'lists', label: 'Listes de courses', count: lists.length },
    { id: 'recipes', label: 'Recettes', count: recipes.length },
  ] as const

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#plan" onClick={() => setPage('plan')} aria-label="Accueil Recettes générateur">
          <span className="brand-mark">R<span>G</span></span>
          <span className="brand-name">recettes <i>générateur</i></span>
        </a>
        <div className="side-label">MA CUISINE</div>
        <nav className="main-nav" aria-label="Navigation principale">
          {nav.map((item) => (
            <button key={item.id} className={`nav-item ${page === item.id || (item.id === 'plan' && page === 'review') || (item.id === 'lists' && page === 'detail') ? 'active' : ''}`} onClick={() => setPage(item.id)}>
              <span className={`nav-mark mark-${item.id}`} aria-hidden="true">{item.id === 'plan' ? '◷' : item.id === 'lists' ? '☷' : '▤'}</span>
              <span>{item.label}</span>
              <span className="nav-count">{item.count}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-spark">✳</span>
          <p>Un peu plus d’intention.<br />Un peu moins de gaspillage.</p>
        </div>
        <div className="profile-row"><span className="profile-avatar">C</span><span><b>Mon carnet de cuisine</b><small>Espace local</small></span><span className="profile-dots">···</span></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">MA CUISINE <span>/</span> {page === 'plan' || page === 'review' ? 'MENUS DE LA SEMAINE' : page === 'lists' || page === 'detail' ? 'LISTES DE COURSES' : 'RECETTES'}</div>
          <div className="topbar-right"><span className="local-indicator"><i /> ENREGISTRÉ DANS CE NAVIGATEUR</span><span className="top-date">{todayLabel}</span></div>
        </header>

        {page === 'plan' && <section className="workspace">
          <div className="page-heading">
            <div><p className="eyebrow">BIEN COMMENCER LA SEMAINE</p><h1>Au menu cette semaine<span>.</span></h1><p className="heading-sub">Choisissez vos recettes, nous préparons la liste de courses.</p></div>
            <div className="week-picker"><span className="calendar-icon">▦</span><span><small>MENU DE</small><b>Cette semaine</b></span><span className="chevron">⌄</span></div>
          </div>
          <div className="summary-strip"><div><span className="summary-number">{String(selectedRecipeCount).padStart(2, '0')}</span><span>recettes prévues</span></div><i /><div><span className="summary-number">{totalTime}</span><span>min en cuisine</span></div><div className="summary-spacer"/><span className="summary-caption">Les dates sont facultatives : cuisinez quand cela vous arrange.</span></div>

          <div className="section-heading"><div><p className="eyebrow">VOTRE MENU</p><h2>Composez la semaine, un plat à la fois</h2></div></div>
          <div className="recipe-discovery">
            <label className="recipe-search"><span aria-hidden="true">⌕</span><input aria-label="Rechercher des recettes" placeholder="Rechercher une recette…" value={recipeSearch} onChange={(event) => setRecipeSearch(event.target.value)} /></label>
            <select aria-label="Filtrer par ingrédient" value={ingredientFilter} onChange={(event) => setIngredientFilter(event.target.value)}><option value="">Tous les ingrédients</option>{recipeIngredients.map((ingredient) => <option key={ingredient}>{ingredient}</option>)}</select>
            <select aria-label="Filtrer par type de recette" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">Tous les types et cuisines</option>{recipeTypes.map((type) => <option key={type}>{type}</option>)}</select>
            <select aria-label="Trier les recettes" value={recipeSort} onChange={(event) => setRecipeSort(event.target.value)}><option value="name-asc">Nom · A à Z</option><option value="name-desc">Nom · Z à A</option><option value="rating-desc">Mieux notées</option><option value="rating-asc">Moins bien notées</option><option value="cooked-newest">Cuisinées récemment</option><option value="cooked-oldest">Pas cuisinées récemment</option></select>
            <button className="surprise-button" onClick={() => addRecipe(recipes[Math.floor(Math.random() * recipes.length)].id)}>✳ <span>Surprenez-moi</span></button>
            <div className="recipe-add-row"><select aria-label="Choisir une recette à ajouter" value={visibleRecipes.some((recipe) => recipe.id === recipeChoiceId) ? recipeChoiceId : (visibleRecipes[0]?.id ?? '')} onChange={(event) => setRecipeChoiceId(event.target.value)} disabled={!visibleRecipes.length}><option value="" disabled>Choisir une recette à ajouter</option>{visibleRecipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}</select><button className="text-button" disabled={!visibleRecipes.length} onClick={() => addRecipe(visibleRecipes.find((recipe) => recipe.id === recipeChoiceId)?.id ?? visibleRecipes[0].id)}><span>+</span> Ajouter la recette</button></div>
            {!visibleRecipes.length && <p className="no-recipes-found">Aucune recette ne correspond à ces filtres.</p>}
          </div>
          <div className="section-heading menu-heading"><div><p className="eyebrow">CETTE SEMAINE</p><h2>{selectedRecipeCount} {selectedRecipeCount === 1 ? 'recette prévue' : 'recettes prévues'}</h2></div><span className="collapse-hint">Sélectionnez une recette pour afficher ses détails</span></div>
          <div className="recipe-plan-list">
            {plan.map((item, index) => {
              const recipe = recipes.find((entry) => entry.id === item.recipeId) ?? recipes[0]
              const isExpanded = expandedPlanItemId === item.id
              return <article className="plan-card" key={item.id}>
                <div className="plan-card-heading">
                  <button className="plan-card-toggle" aria-expanded={isExpanded} onClick={() => setExpandedPlanItemId(isExpanded ? null : item.id)}><span className="recipe-index">{String(index + 1).padStart(2, '0')}</span><span className="plan-recipe-name"><small>{recipe.category} · {recipe.types.join(' / ')}</small><b>{recipe.name}</b><span>◷ &nbsp;{recipe.time} min <i>·</i> {item.servings} portions <i>·</i> {item.date ? formatFrenchDate(`${item.date}T12:00:00`, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Date à définir'}</span></span><span className="chevron">{isExpanded ? '⌃' : '⌄'}</span></button>
                  {plan.length > 1 && <button className="remove-button" title="Supprimer la recette" aria-label={`Supprimer ${recipe.name}`} onClick={() => { setPlan((items) => items.filter((entry) => entry.id !== item.id)); if (isExpanded) setExpandedPlanItemId(null) }}>×</button>}
                </div>
                {isExpanded && <>
                <div className="plan-card-controls"><label className="date-field"><span className="eyebrow">À CUISINER LE <em>· FACULTATIF</em></span><input aria-label="Date de cuisson facultative" type="date" value={item.date} onChange={(event) => updatePlan(item.id, { date: event.target.value })} /></label><div className="serving-row"><span className="serving-label">PORTIONS</span><div className="stepper"><button aria-label="Diminuer le nombre de portions" onClick={() => updatePlan(item.id, { servings: Math.max(1, item.servings - 1) })}>−</button><span>{item.servings}</span><button aria-label="Augmenter le nombre de portions" onClick={() => updatePlan(item.id, { servings: item.servings + 1 })}>+</button></div><span className="serving-hint">Les quantités s’adaptent automatiquement</span></div></div>
                <div className="ingredients-table-wrap"><table className="ingredients-table"><thead><tr><th className="need-col">À ACHETER</th><th>INGRÉDIENT</th><th className="amount-col">QUANTITÉ</th><th className="store-col">MAGASIN PRÉFÉRÉ</th></tr></thead><tbody>
                  {recipe.ingredients.map((ingredient) => {
                    const amount = ingredient.amount * item.servings / recipe.servings
                    const options = [...ingredient.stores].sort((a, b) => a.preference - b.preference)
                    return <tr key={ingredient.name} className={item.needs[ingredient.name] ? '' : 'not-needed'}><td><input aria-label={`Ajouter ${ingredient.name} à la liste de courses`} type="checkbox" checked={!!item.needs[ingredient.name]} onChange={(event) => updatePlan(item.id, { needs: { ...item.needs, [ingredient.name]: event.target.checked } })} /></td><td className="ingredient-name">{ingredient.name}</td><td className="quantity">{formatQuantity(amount)} <span>{displayFrenchUnit(ingredient.unit, amount)}</span></td><td><select className="store-select" aria-label={`Magasin pour ${ingredient.name}`} value={item.stores[ingredient.name]} onChange={(event) => updatePlan(item.id, { stores: { ...item.stores, [ingredient.name]: event.target.value } })}>{options.map((store) => <option key={store.name} value={store.name}>{store.name}{store.preference === 1 ? ' · préféré' : ''}</option>)}</select></td></tr>
                  })}
                </tbody></table></div></>}
              </article>
            })}
          </div>
          <div className="finish-row"><span><b>{groupedIngredients.length} articles</b> regroupés par magasin</span><button className="primary-button" onClick={() => setPage('review')}>Vérifier les ingrédients <span>→</span></button></div>

          <div className="saved-weekly-plans"><div className="section-heading"><div><p className="eyebrow">VOTRE HISTORIQUE</p><h2>Menus précédents</h2></div><span className="collapse-hint">Enregistrés à la confirmation de la liste de courses</span></div>
            {savedPlans.length ? <div className="weekly-plan-archive">{savedPlans.map((savedPlan) => <article className="weekly-plan-entry" key={savedPlan.id}><div className="weekly-plan-entry-head"><button className="weekly-plan-toggle" aria-expanded={expandedSavedPlanId === savedPlan.id} onClick={() => setExpandedSavedPlanId(expandedSavedPlanId === savedPlan.id ? null : savedPlan.id)}><span className="list-icon">◷</span><span><b>Menu de la semaine · {formatFrenchDate(savedPlan.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</b><small>{formatFrenchDate(savedPlan.createdAt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {savedPlan.items.length} recettes</small></span><span className="chevron">{expandedSavedPlanId === savedPlan.id ? '⌃' : '⌄'}</span></button><button className="delete-button" aria-label={`Supprimer le menu du ${formatFrenchDate(savedPlan.createdAt, { day: 'numeric', month: 'long' })}`} title="Supprimer ce menu" onClick={() => setSavedPlans((current) => current.filter((entry) => entry.id !== savedPlan.id))}>×</button></div>{expandedSavedPlanId === savedPlan.id && <div className="weekly-plan-recipes">{savedPlan.items.map((savedItem) => {const savedRecipe = recipes.find((entry) => entry.id === savedItem.recipeId); if (!savedRecipe) return null; return <div className="weekly-plan-recipe" key={savedItem.id}><span>{savedItem.date ? formatFrenchDate(`${savedItem.date}T12:00:00`, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Date à définir'}</span><b>{savedRecipe.name}</b><small>{savedItem.servings} portions</small><button className="text-button" onClick={() => { setOpenRecipeId(savedRecipe.id); setPage('recipes') }}>Voir la recette</button></div>})}</div>}</article>)}</div> : <div className="archive-empty">Vos menus confirmés apparaîtront ici pour vous rappeler les plats prévus.</div>}
          </div>
        </section>}

        {page === 'review' && <section className="workspace review-workspace">
          <button className="back-link" onClick={() => setPage('plan')}>← &nbsp;Retour au menu</button>
          <div className="page-heading"><div><p className="eyebrow">DERNIÈRE VÉRIFICATION</p><h1>Vos courses, <span>bien organisées.</span></h1><p className="heading-sub">Les ingrédients identiques sont regroupés par magasin.</p></div><div className="review-count"><b>{groupedIngredients.length}</b><span>articles à acheter</span></div></div>
          <div className="review-list">{[...new Set(groupedIngredients.map((item) => item.store))].map((store) => <section className="store-group" key={store}><div className="store-group-heading"><span className="store-pin">⌖</span><h2>{displayFrench(store)}</h2><span>{groupedIngredients.filter((item) => item.store === store).length} ARTICLES</span></div>{groupedIngredients.filter((item) => item.store === store).map((item) => <div className="review-item" key={item.id}><span>{displayFrench(item.name)}</span><b>{formatQuantity(item.amount)} <small>{displayFrenchUnit(item.unit, item.amount)}</small></b></div>)}</section>)}</div>
          <div className="review-actions"><button className="secondary-button" onClick={() => setPage('plan')}>← &nbsp;Retour au menu</button><button className="primary-button" disabled={!groupedIngredients.length} onClick={saveGroceryList}>Confirmer et créer la liste <span>→</span></button></div>
        </section>}

        {page === 'lists' && <section className="workspace"><div className="page-heading"><div><p className="eyebrow">PRÊTES POUR VOS COURSES</p><h1>Vos listes de <span>courses.</span></h1><p className="heading-sub">Vos listes confirmées sont enregistrées dans ce navigateur.</p></div><button className="secondary-button" onClick={() => setPage('plan')}>+ &nbsp;Préparer un menu</button></div>
          {lists.length ? <div className="saved-lists">{lists.map((list) => <article className="saved-list-row" key={list.id}><button className="saved-list-open" onClick={() => { setActiveListId(list.id); setPage('detail') }}><span className="list-icon">☷</span><span><b>{groceryListTitle(list)}</b><small>{formatFrenchDate(list.createdAt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small></span><span className="saved-list-stats">{list.items.length} articles · {list.items.filter((item) => item.checked).length} cochés</span><span className="chevron">→</span></button><button className="delete-button" aria-label={`Supprimer ${groceryListTitle(list)}`} title="Supprimer la liste" onClick={() => setLists((current) => current.filter((entry) => entry.id !== list.id))}>×</button></article>)}</div> : <div className="empty-state"><span>☷</span><h2>Pas encore de liste</h2><p>Confirmez un menu de la semaine pour créer votre première liste de courses.</p><button className="primary-button" onClick={() => setPage('plan')}>Préparer un menu <span>→</span></button></div>}
        </section>}

        {page === 'detail' && activeList && <section className="workspace"><button className="back-link" onClick={() => setPage('lists')}>← &nbsp;Toutes les listes</button><div className="page-heading"><div><p className="eyebrow">{formatFrenchDate(activeList.createdAt, { weekday: 'long', day: 'numeric', month: 'long' }).toLocaleUpperCase('fr-FR')}</p><h1>Liste de courses<span>.</span></h1><p className="heading-sub">Cochez les articles au fil de vos achats. Ils passeront en bas de la liste.</p></div><div className="review-count"><b>{activeList.items.filter((item) => !item.checked).length}</b><span>articles restants</span></div></div>
          <div className="shopping-list">{[...new Set(activeList.items.map((item) => item.store))].map((store) => {const storeItems = activeList.items.filter((item) => item.store === store).sort((a, b) => Number(a.checked) - Number(b.checked) || a.name.localeCompare(b.name)); return <section className="shop-store-group" key={store}><div className="store-group-heading"><span className="store-pin">⌖</span><h2>{displayFrench(store)}</h2><span>{storeItems.filter((item) => !item.checked).length} À ACHETER</span></div>{storeItems.map((item) => <label className={`shopping-item ${item.checked ? 'is-checked' : ''}`} key={item.id}><input type="checkbox" checked={item.checked} onChange={() => toggleGroceryItem(activeList.id, item.id)} aria-label={`${displayFrench(item.name)} : ${item.checked ? 'acheté' : 'à acheter'}`} /><span className="shopping-name">{displayFrench(item.name)}</span><span className="shopping-amount">{formatQuantity(item.amount)} {displayFrenchUnit(item.unit, item.amount)}</span></label>)}</section>})}</div>
        </section>}

        {page === 'detail' && !activeList && <section className="workspace"><div className="empty-state"><h2>Liste introuvable</h2><button className="primary-button" onClick={() => setPage('lists')}>Voir toutes les listes <span>→</span></button></div></section>}

        {page === 'recipes' && (
          <section className="workspace">
            <div className="page-heading">
              <div>
                <p className="eyebrow">QUELQUES IDÉES POUR COMMENCER</p>
                <h1>Le carnet de <span>recettes.</span></h1>
                <p className="heading-sub">Les recettes sont des exemples pour le moment. Votre classeur pourra être importé ensuite.</p>
              </div>
              <span className="recipe-total">{recipes.length} RECETTES</span>
            </div>
            <div className="recipe-library">
              {recipes.map((recipe, index) => {
                const metadata = recipeMetadata[recipe.id] ?? { rating: 0, lastCookedAt: null }
                return (
                  <article className="library-recipe" key={recipe.id}>
                    <div className="library-recipe-top">
                      <button className="library-recipe-heading" aria-expanded={openRecipeId === recipe.id} onClick={() => setOpenRecipeId(openRecipeId === recipe.id ? null : recipe.id)}>
                        <span className="library-number">0{index + 1}</span>
                        <span className="library-name"><small>{recipe.category} · {recipe.types.join(' / ')}</small><b>{recipe.name}</b></span>
                        <span className="library-time">◷ &nbsp;{recipe.time} min</span>
                        <span className="chevron">{openRecipeId === recipe.id ? '⌃' : '⌄'}</span>
                      </button>
                      <div className="recipe-header-meta">
                        <div className="rating-control" aria-label={`Noter ${recipe.name}`}>
                          <span>VOTRE NOTE</span>
                          {[1, 2, 3, 4, 5].map((rating) => <button key={rating} className={rating <= metadata.rating ? 'star-filled' : ''} aria-label={`${rating} ${rating === 1 ? 'étoile' : 'étoiles'} sur 5`} aria-pressed={metadata.rating === rating} onClick={() => setRecipeRating(recipe.id, metadata.rating === rating ? 0 : rating)}>★</button>)}
                        </div>
                        <span className="last-cooked">Dernière préparation : {metadata.lastCookedAt ? formatFrenchDate(metadata.lastCookedAt, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Jamais'}</span>
                      </div>
                    </div>
                    {openRecipeId === recipe.id && (
                      <div className="recipe-details">
                        <div><h3>Ingrédients · {recipe.servings} portions</h3>{recipe.ingredients.map((ingredient) => <p key={ingredient.name}>{ingredient.name} <span>{formatQuantity(ingredient.amount)} {displayFrenchUnit(ingredient.unit, ingredient.amount)}</span></p>)}</div>
                        <div><h3>Préparation</h3><ol>{recipe.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol><button className="text-button" onClick={() => { addRecipe(recipe.id); setPage('plan') }}>+ Ajouter au menu de la semaine</button></div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
