import { useEffect, useMemo, useRef, useState } from 'react'
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
type RecipeDraft = Omit<Recipe, 'id'> & { id?: string }
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
type FamilyConfig = { projectUrl: string; anonKey: string; accessCode: string }
type SharedAppState = {
  recipes: Recipe[]
  plan: PlanItem[]
  lists: GroceryList[]
  savedPlans: SavedWeeklyPlan[]
  recipeMetadata: RecipeMetadata
}
type RemoteFamilyState = { state: SharedAppState | null; updatedAt: string | null }
type SyncStatus = 'local' | 'connecting' | 'connected' | 'syncing' | 'error'

const storeNames = ['Colruyt ch. Wavre', 'Delhaize Hankar', 'Delhaize Boileau', 'Carrefour Thieffry', 'Farm Hankar']
const availableStoreNames = [...new Set([...storeNames, 'Boucherie', 'MarchÃ©', 'SupermarchÃ©', 'Fromagerie'])]
const recipeStorageKey = 'table-and-thyme-recipes'

const baseRecipes: Recipe[] = [
  {
    id: 'lemon-chicken',
    name: 'Poulet au citron et pommes de terre croustillantes',
    category: 'UN CLASSIQUE DE LA SEMAINE',
    types: ['Viande', 'Cuisine europÃ©enne'],
    time: 40,
    servings: 2,
    ingredients: [
      { name: 'Filet de poulet', amount: 300, unit: 'g', stores: [{ name: 'Boucherie', preference: 1 }, { name: 'MarchÃ©', preference: 2 }] },
      { name: 'Pommes de terre', amount: 500, unit: 'g', stores: [{ name: 'MarchÃ©', preference: 1 }, { name: 'SupermarchÃ©', preference: 2 }] },
      { name: 'Citron', amount: 1, unit: 'piÃ¨ce', stores: [{ name: 'MarchÃ©', preference: 1 }, { name: 'SupermarchÃ©', preference: 2 }] },
      { name: 'Haricots verts', amount: 200, unit: 'g', stores: [{ name: 'MarchÃ©', preference: 1 }, { name: 'SupermarchÃ©', preference: 2 }] },
      { name: "Huile dâ€™olive", amount: 2, unit: 'c. Ã  soupe', stores: [{ name: 'SupermarchÃ©', preference: 1 }] },
    ],
    instructions: ['PrÃ©chauffez le four Ã  210 Â°C. Coupez les pommes de terre en quartiers et mÃ©langez-les avec lâ€™huile dâ€™olive, du sel et du poivre.', 'Enfournez les pommes de terre pendant 30 minutes en les retournant Ã  mi-cuisson. Assaisonnez le poulet et faites-le dorer Ã  la poÃªle jusquâ€™Ã  ce quâ€™il soit cuit.', 'Faites cuire les haricots verts Ã  la vapeur. Arrosez le poulet de jus de citron et servez le tout.'],
  },
  {
    id: 'courgette-pasta',
    name: 'PÃ¢tes crÃ©meuses aux courgettes et au basilic',
    category: 'RAPIDE ET FRAIS',
    types: ['VÃ©gÃ©tarien', 'Cuisine italienne'],
    time: 25,
    servings: 2,
    ingredients: [
      { name: 'PÃ¢tes', amount: 180, unit: 'g', stores: [{ name: 'SupermarchÃ©', preference: 1 }] },
      { name: 'Courgette', amount: 2, unit: 'piÃ¨ce', stores: [{ name: 'MarchÃ©', preference: 1 }, { name: 'SupermarchÃ©', preference: 2 }] },
      { name: 'CrÃ¨me', amount: 120, unit: 'ml', stores: [{ name: 'SupermarchÃ©', preference: 1 }] },
      { name: 'Parmesan', amount: 40, unit: 'g', stores: [{ name: 'Fromagerie', preference: 1 }, { name: 'SupermarchÃ©', preference: 2 }] },
      { name: 'Basilic frais', amount: 10, unit: 'g', stores: [{ name: 'MarchÃ©', preference: 1 }] },
    ],
    instructions: ['Faites cuire les pÃ¢tes dans de lâ€™eau salÃ©e jusquâ€™Ã  ce quâ€™elles soient al dente. RÃ©servez une tasse dâ€™eau de cuisson.', 'Coupez la courgette en rondelles et faites-la revenir jusquâ€™Ã  ce quâ€™elle soit dorÃ©e. Ajoutez la crÃ¨me et un peu dâ€™eau de cuisson.', 'MÃ©langez avec les pÃ¢tes, le parmesan et le basilic effeuillÃ©. Assaisonnez Ã  votre goÃ»t.'],
  },
  {
    id: 'chickpea-curry',
    name: 'Curry de pois chiches au lait de coco',
    category: 'VÃ‰GÃ‰TAL',
    types: ['VÃ©gÃ©tarien', 'Cuisine indienne'],
    time: 35,
    servings: 3,
    ingredients: [
      { name: 'Pois chiches', amount: 2, unit: 'boÃ®tes', stores: [{ name: 'SupermarchÃ©', preference: 1 }] },
      { name: 'Lait de coco', amount: 400, unit: 'ml', stores: [{ name: 'SupermarchÃ©', preference: 1 }] },
      { name: 'Ã‰pinards', amount: 150, unit: 'g', stores: [{ name: 'MarchÃ©', preference: 1 }, { name: 'SupermarchÃ©', preference: 2 }] },
      { name: 'Oignon jaune', amount: 1, unit: 'piÃ¨ce', stores: [{ name: 'MarchÃ©', preference: 1 }, { name: 'SupermarchÃ©', preference: 2 }] },
      { name: 'PÃ¢te de curry', amount: 2, unit: 'c. Ã  soupe', stores: [{ name: 'SupermarchÃ©', preference: 1 }] },
    ],
    instructions: ['Ã‰mincez lâ€™oignon et faites-le revenir doucement jusquâ€™Ã  ce quâ€™il soit tendre. Ajoutez la pÃ¢te de curry et faites cuire une minute.', 'Ajoutez les pois chiches Ã©gouttÃ©s et le lait de coco. Laissez mijoter 20 minutes.', 'Incorporez les Ã©pinards et laissez-les fondre. Servez avec du riz ou du pain plat.'],
  },
]

const storageKey = 'table-and-thyme-grocery-lists'
const planStorageKey = 'table-and-thyme-weekly-plan'
const savedPlansStorageKey = 'table-and-thyme-saved-weekly-plans'
const recipeMetadataStorageKey = 'table-and-thyme-recipe-metadata'
const familyConfigStorageKey = 'table-and-thyme-family-connection'
const supabaseProjectUrl = 'https://kdcgareakwfnjisntlyj.supabase.co'
const supabasePublishableKey = 'sb_publishable_aKw1gSxU_uuVtf_7NJh2nw_6ZiPv9wQ'
const todayLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
const legacyTextTranslations: Record<string, string> = {
  'Chicken breast': 'Filet de poulet',
  Potatoes: 'Pommes de terre',
  Lemon: 'Citron',
  'Green beans': 'Haricots verts',
  'Olive oil': "Huile dâ€™olive",
  Pasta: 'PÃ¢tes',
  Cream: 'CrÃ¨me',
  'Fresh basil': 'Basilic frais',
  Chickpeas: 'Pois chiches',
  'Coconut milk': 'Lait de coco',
  Spinach: 'Ã‰pinards',
  'Yellow onion': 'Oignon jaune',
  'Curry paste': 'PÃ¢te de curry',
  Butcher: 'Boucherie',
  Market: 'MarchÃ©',
  Supermarket: 'SupermarchÃ©',
  'Cheese shop': 'Fromagerie',
  'Grocery list': 'Liste de courses',
  'Weekly plan': 'Menu de la semaine',
}

function readRecipes(): Recipe[] {
  const saved = readStored<Recipe[] | null>(recipeStorageKey, null)
  if (!saved?.length) return baseRecipes
  return saved
}

function displayFrench(value: string): string {
  return legacyTextTranslations[value] ?? value
}

function displayFrenchUnit(unit: string, amount = 1): string {
  const singular = ({ pc: 'piÃ¨ce', pcs: 'piÃ¨ce', cans: 'boÃ®te', can: 'boÃ®te' })[unit] ?? unit
  if (singular === 'piÃ¨ce' || singular === 'boÃ®te') return amount > 1 ? `${singular}s` : singular
  return unit === 'tbsp' ? 'c. Ã  soupe' : singular
}

function formatFrenchDate(date: string | Date, options: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('fr-FR', options)
}

function groceryListTitle(list: GroceryList): string {
  return `Liste de courses Â· ${formatFrenchDate(list.createdAt, { day: 'numeric', month: 'short' })}`
}

function readLists(): GroceryList[] {
  try {
    const stored = localStorage.getItem(storageKey)
    return stored ? JSON.parse(stored) as GroceryList[] : []
  } catch {
    return []
  }
}

function readPlan(catalog = baseRecipes): PlanItem[] {
  try {
    const stored = localStorage.getItem(planStorageKey)
    if (!stored) return [makePlanItem()]
    const parsed = JSON.parse(stored) as PlanItem[]
    if (!Array.isArray(parsed)) return [makePlanItem()]
    return parsed.flatMap((item) => {
      const recipe = catalog.find((entry) => entry.id === item.recipeId)
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
  return Object.fromEntries(baseRecipes.map((recipe) => [recipe.id, { rating: 0, lastCookedAt: null }]))
}

function formatQuantity(amount: number): string {
  return amount.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
}

function readFamilyConfig(): FamilyConfig | null {
  const saved = readStored<FamilyConfig | null>(familyConfigStorageKey, null)
  return saved?.accessCode ? { ...saved, projectUrl: supabaseProjectUrl, anonKey: supabasePublishableKey } : null
}

function normalizeSharedState(value: unknown): SharedAppState | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<SharedAppState>
  if (!Array.isArray(candidate.recipes) || !candidate.recipes.length || !Array.isArray(candidate.plan) || !Array.isArray(candidate.lists) || !Array.isArray(candidate.savedPlans)) return null
  return {
    recipes: candidate.recipes,
    plan: candidate.plan,
    lists: candidate.lists,
    savedPlans: candidate.savedPlans,
    recipeMetadata: { ...getDefaultRecipeMetadata(), ...(candidate.recipeMetadata ?? {}) },
  }
}

async function requestFamilyState(config: FamilyConfig, method: 'GET' | 'POST', state?: SharedAppState): Promise<RemoteFamilyState> {
  const projectUrl = config.projectUrl.trim().replace(/\/+$/, '')
  const response = await fetch(`${projectUrl}/functions/v1/family-state`, {
    method,
    headers: {
      apikey: config.anonKey.trim(),
      'Content-Type': 'application/json',
      'x-family-code': config.accessCode,
    },
    ...(method === 'POST' ? { body: JSON.stringify({ state }) } : {}),
  })
  const result = await response.json() as { state?: unknown; updatedAt?: string | null; error?: string; saved?: boolean }
  if (!response.ok) throw new Error(result.error ?? `Erreur de synchronisation (${response.status}).`)
  if (method === 'POST') return { state: null, updatedAt: result.updatedAt ?? new Date().toISOString() }
  return { state: normalizeSharedState(result.state), updatedAt: result.updatedAt ?? null }
}

function makePlanItem(recipeId = baseRecipes[0].id, catalog = baseRecipes): PlanItem {
  const recipe = catalog.find((item) => item.id === recipeId) ?? catalog[0]
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
  const [recipes, setRecipes] = useState<Recipe[]>(readRecipes)
  const [plan, setPlan] = useState<PlanItem[]>(() => readPlan(readRecipes()))
  const [lists, setLists] = useState<GroceryList[]>(readLists)
  const [savedPlans, setSavedPlans] = useState<SavedWeeklyPlan[]>(() => readStored(savedPlansStorageKey, []))
  const [recipeMetadata, setRecipeMetadata] = useState<RecipeMetadata>(() => ({ ...getDefaultRecipeMetadata(), ...readStored(recipeMetadataStorageKey, {}) }))
  const [familyConfig, setFamilyConfig] = useState<FamilyConfig | null>(readFamilyConfig)
  const [familyForm, setFamilyForm] = useState<FamilyConfig>(() => readFamilyConfig() ?? { projectUrl: supabaseProjectUrl, anonKey: supabasePublishableKey, accessCode: '' })
  const [familySettingsOpen, setFamilySettingsOpen] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => readFamilyConfig() ? 'connecting' : 'local')
  const [syncError, setSyncError] = useState('')
  const [remoteReady, setRemoteReady] = useState(false)
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null)
  const [expandedPlanItemId, setExpandedPlanItemId] = useState<string | null>(null)
  const [expandedSavedPlanId, setExpandedSavedPlanId] = useState<string | null>(null)
  const [recipeSearch, setRecipeSearch] = useState('')
  const [ingredientFilter, setIngredientFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [recipeSort, setRecipeSort] = useState('name-asc')
  const [recipeChoiceId, setRecipeChoiceId] = useState(recipes[0].id)
  const [recipeEditorOpen, setRecipeEditorOpen] = useState(false)
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null)
  const [recipeDraft, setRecipeDraft] = useState<RecipeDraft>(() => ({ ...recipes[0], ingredients: recipes[0].ingredients.map((ingredient) => ({ ...ingredient, stores: [...ingredient.stores] })), instructions: [...recipes[0].instructions] }))
  const localSnapshotRef = useRef<SharedAppState>({ recipes, plan, lists, savedPlans, recipeMetadata })
  const lastUpdatedAtRef = useRef<string | null>(null)
  const skipNextPushRef = useRef(false)

  useEffect(() => {
    localStorage.setItem(recipeStorageKey, JSON.stringify(recipes))
  }, [recipes])

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

  useEffect(() => {
    localSnapshotRef.current = { recipes, plan, lists, savedPlans, recipeMetadata }
  }, [recipes, plan, lists, savedPlans, recipeMetadata])

  useEffect(() => {
    const config = familyConfig
    if (!config) return
    const activeConfig: FamilyConfig = config

    let active = true

    async function connectAndPoll() {
      try {
        const remote = await requestFamilyState(activeConfig, 'GET')
        if (!active) return
        if (remote.state) {
          skipNextPushRef.current = true
          setRecipes(remote.state.recipes)
          setPlan(remote.state.plan)
          setLists(remote.state.lists)
          setSavedPlans(remote.state.savedPlans)
          setRecipeMetadata(remote.state.recipeMetadata)
        } else {
          const initialized = await requestFamilyState(activeConfig, 'POST', localSnapshotRef.current)
          if (!active) return
          lastUpdatedAtRef.current = initialized.updatedAt
        }
        lastUpdatedAtRef.current = remote.updatedAt ?? lastUpdatedAtRef.current
        setRemoteReady(true)
        setSyncStatus('connected')

        const pollId = window.setInterval(async () => {
          try {
            const latest = await requestFamilyState(activeConfig, 'GET')
            if (!active || !latest.state || !latest.updatedAt || latest.updatedAt <= (lastUpdatedAtRef.current ?? '')) return
            lastUpdatedAtRef.current = latest.updatedAt
            skipNextPushRef.current = true
            setRecipes(latest.state.recipes)
            setPlan(latest.state.plan)
            setLists(latest.state.lists)
            setSavedPlans(latest.state.savedPlans)
            setRecipeMetadata(latest.state.recipeMetadata)
            setSyncStatus('connected')
          } catch (error) {
            if (active) {
              setSyncError(error instanceof Error ? error.message : 'Synchronisation impossible.')
              setSyncStatus('error')
            }
          }
        }, 15000)
        return () => window.clearInterval(pollId)
      } catch (error) {
        if (active) {
          setSyncError(error instanceof Error ? error.message : 'Connexion Ã  la base impossible.')
          setSyncStatus('error')
        }
      }
    }

    let stopPolling: (() => void) | undefined
    void connectAndPoll().then((cleanup) => { stopPolling = cleanup })
    return () => {
      active = false
      stopPolling?.()
    }
  }, [familyConfig])

  useEffect(() => {
    if (!familyConfig || !remoteReady) return
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false
      return
    }
    const timeoutId = window.setTimeout(async () => {
      setSyncStatus('syncing')
      try {
        const result = await requestFamilyState(familyConfig, 'POST', localSnapshotRef.current)
        lastUpdatedAtRef.current = result.updatedAt
        setSyncError('')
        setSyncStatus('connected')
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : 'Synchronisation impossible.')
        setSyncStatus('error')
      }
    }, 700)
    return () => window.clearTimeout(timeoutId)
  }, [recipes, plan, lists, savedPlans, recipeMetadata, familyConfig, remoteReady])

  function saveFamilyConnection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextConfig = {
      projectUrl: supabaseProjectUrl,
      anonKey: supabasePublishableKey,
      accessCode: familyForm.accessCode.trim(),
    }
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(nextConfig.projectUrl) || !nextConfig.anonKey || nextConfig.accessCode.length < 16) {
      setSyncError('VÃ©rifiez lâ€™URL, la clÃ© publique et utilisez un code familial dâ€™au moins 16 caractÃ¨res.')
      setSyncStatus('error')
      return
    }
    localStorage.setItem(familyConfigStorageKey, JSON.stringify(nextConfig))
    setRemoteReady(false)
    setSyncStatus('connecting')
    setSyncError('')
    setFamilyConfig(nextConfig)
    setFamilySettingsOpen(false)
  }

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
  }, [ingredientFilter, recipeMetadata, recipeSearch, recipeSort, recipes, typeFilter])

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
  }, [plan, recipes])

  function updatePlan(id: string, update: Partial<PlanItem>) {
    setPlan((items) => items.map((item) => item.id === id ? { ...item, ...update } : item))
  }

  function addRecipe(recipeId: string) {
    setPlan((items) => [...items, makePlanItem(recipeId, recipes)])
    setRecipeChoiceId(recipeId)
  }

  function openRecipeEditor(recipe?: Recipe) {
    const source = recipe ?? { id: '', name: '', category: 'NOUVELLE RECETTE', types: ['VÃ©gÃ©tarien'], time: 30, servings: 2, ingredients: [{ name: '', amount: 1, unit: 'g', stores: storeNames.map((name, index) => ({ name, preference: index + 1 })) }], instructions: [''] }
    setEditingRecipeId(recipe?.id ?? null)
    setRecipeDraft({ ...source, ingredients: source.ingredients.map((ingredient) => ({ ...ingredient, stores: [...ingredient.stores] })), instructions: [...source.instructions] })
    setRecipeEditorOpen(true)
  }

  function saveRecipe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const previous = editingRecipeId ? recipes.find((recipe) => recipe.id === editingRecipeId) : undefined
    const cleaned: Recipe = {
      id: editingRecipeId ?? crypto.randomUUID(),
      name: recipeDraft.name.trim() || 'Recette sans nom',
      category: recipeDraft.category.trim() || 'RECETTE PERSONNELLE',
      types: recipeDraft.types.filter(Boolean),
      time: Math.max(1, Number(recipeDraft.time) || 1),
      servings: Math.max(1, Number(recipeDraft.servings) || 1),
      ingredients: recipeDraft.ingredients.filter((ingredient) => ingredient.name.trim()).map((ingredient) => ({ ...ingredient, name: ingredient.name.trim(), amount: Number(ingredient.amount) || 0, stores: ingredient.stores.length ? ingredient.stores : storeNames.map((name, index) => ({ name, preference: index + 1 })) })),
      instructions: recipeDraft.instructions.map((instruction) => instruction.trim()).filter(Boolean),
    }
    setRecipes((current) => editingRecipeId ? current.map((recipe) => recipe.id === editingRecipeId ? cleaned : recipe) : [...current, cleaned])
    if (previous && editingRecipeId) {
      const oldIngredients = previous.ingredients
      setPlan((current) => current.map((item) => {
        if (item.recipeId !== editingRecipeId) return item
        const nextNeeds: Record<string, boolean> = {}
        const nextStores: Record<string, string> = {}
        cleaned.ingredients.forEach((ingredient, index) => {
          const oldIngredient = oldIngredients[index]
          const previousName = oldIngredient?.name ?? ingredient.name
          nextNeeds[ingredient.name] = item.needs[ingredient.name] ?? item.needs[previousName] ?? true
          const selectedStore = item.stores[ingredient.name] ?? item.stores[previousName]
          nextStores[ingredient.name] = ingredient.stores.some((store) => store.name === selectedStore)
            ? selectedStore
            : [...ingredient.stores].sort((a, b) => a.preference - b.preference)[0].name
        })
        return { ...item, needs: nextNeeds, stores: nextStores }
      }))
    }
    setRecipeChoiceId(cleaned.id)
    setRecipeEditorOpen(false)
  }

  function deleteRecipe(recipeId: string) {
    if (recipes.length <= 1) {
      window.alert('Conservez au moins une recette dans le carnet.')
      return
    }
    if (!window.confirm('Supprimer cette recette du carnet ?')) return
    setRecipes((current) => current.filter((recipe) => recipe.id !== recipeId))
    setPlan((current) => current.filter((item) => item.recipeId !== recipeId))
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
      name: `Liste de courses Â· ${formatFrenchDate(now, { day: 'numeric', month: 'short' })}`,
      createdAt: timestamp,
      items: groupedIngredients.map((item) => ({ ...item, id: crypto.randomUUID() })),
    }
    const nextSavedPlan: SavedWeeklyPlan = {
      id: crypto.randomUUID(),
      name: `Menu de la semaine Â· ${formatFrenchDate(now, { day: 'numeric', month: 'long', year: 'numeric' })}`,
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
        <a className="brand" href="#plan" onClick={() => setPage('plan')} aria-label="Accueil Recettes gÃ©nÃ©rateur">
          <span className="brand-mark">R<span>G</span></span>
          <span className="brand-name">recettes <i>gÃ©nÃ©rateur</i></span>
        </a>
        <div className="side-label">MA CUISINE</div>
        <nav className="main-nav" aria-label="Navigation principale">
          {nav.map((item) => (
            <button key={item.id} className={`nav-item ${page === item.id || (item.id === 'plan' && page === 'review') || (item.id === 'lists' && page === 'detail') ? 'active' : ''}`} onClick={() => setPage(item.id)}>
              <span className={`nav-mark mark-${item.id}`} aria-hidden="true">{item.id === 'plan' ? 'â—·' : item.id === 'lists' ? 'â˜·' : 'â–¤'}</span>
              <span>{item.label}</span>
              <span className="nav-count">{item.count}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-spark">âœ³</span>
          <p>Un peu plus dâ€™intention.<br />Un peu moins de gaspillage.</p>
        </div>
        <div className="profile-row"><span className="profile-avatar">C</span><span><b>Mon carnet de cuisine</b><small>Espace local</small></span><span className="profile-dots">Â·Â·Â·</span></div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">MA CUISINE <span>/</span> {page === 'plan' || page === 'review' ? 'MENUS DE LA SEMAINE' : page === 'lists' || page === 'detail' ? 'LISTES DE COURSES' : 'RECETTES'}</div>
          <div className="topbar-right"><button className={`family-status status-${syncStatus}`} onClick={() => { setFamilyForm(familyConfig ?? familyForm); setFamilySettingsOpen(true) }}><i />{syncStatus === 'local' ? 'DONNÃ‰ES LOCALES' : syncStatus === 'connecting' ? 'CONNEXIONâ€¦' : syncStatus === 'syncing' ? 'SYNCHRONISATIONâ€¦' : syncStatus === 'error' ? 'ERREUR DE SYNCHRO' : 'FAMILLE SYNCHRONISÃ‰E'}</button><span className="top-date">{todayLabel}</span></div>
        </header>

        {page === 'plan' && <section className="workspace">
          <div className="page-heading">
            <div><p className="eyebrow">BIEN COMMENCER LA SEMAINE</p><h1>Au menu cette semaine<span>.</span></h1><p className="heading-sub">Choisissez vos recettes, nous prÃ©parons la liste de courses.</p></div>
            <div className="week-picker"><span className="calendar-icon">â–¦</span><span><small>MENU DE</small><b>Cette semaine</b></span><span className="chevron">âŒ„</span></div>
          </div>
          <div className="summary-strip"><div><span className="summary-number">{String(selectedRecipeCount).padStart(2, '0')}</span><span>recettes prÃ©vues</span></div><i /><div><span className="summary-number">{totalTime}</span><span>min en cuisine</span></div><div className="summary-spacer"/><span className="summary-caption">Les dates sont facultatives : cuisinez quand cela vous arrange.</span></div>

          <div className="section-heading"><div><p className="eyebrow">VOTRE MENU</p><h2>Composez la semaine, un plat Ã  la fois</h2></div></div>
          <div className="recipe-discovery">
            <label className="recipe-search"><span aria-hidden="true">âŒ•</span><input aria-label="Rechercher des recettes" placeholder="Rechercher une recetteâ€¦" value={recipeSearch} onChange={(event) => setRecipeSearch(event.target.value)} /></label>
            <select aria-label="Filtrer par ingrÃ©dient" value={ingredientFilter} onChange={(event) => setIngredientFilter(event.target.value)}><option value="">Tous les ingrÃ©dients</option>{recipeIngredients.map((ingredient) => <option key={ingredient}>{ingredient}</option>)}</select>
            <select aria-label="Filtrer par type de recette" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">Tous les types et cuisines</option>{recipeTypes.map((type) => <option key={type}>{type}</option>)}</select>
            <select aria-label="Trier les recettes" value={recipeSort} onChange={(event) => setRecipeSort(event.target.value)}><option value="name-asc">Nom Â· A Ã  Z</option><option value="name-desc">Nom Â· Z Ã  A</option><option value="rating-desc">Mieux notÃ©es</option><option value="rating-asc">Moins bien notÃ©es</option><option value="cooked-newest">CuisinÃ©es rÃ©cemment</option><option value="cooked-oldest">Pas cuisinÃ©es rÃ©cemment</option></select>
            <button className="surprise-button" onClick={() => addRecipe(recipes[Math.floor(Math.random() * recipes.length)].id)}>âœ³ <span>Surprenez-moi</span></button>
            <div className="recipe-add-row"><select aria-label="Choisir une recette Ã  ajouter" value={visibleRecipes.some((recipe) => recipe.id === recipeChoiceId) ? recipeChoiceId : (visibleRecipes[0]?.id ?? '')} onChange={(event) => setRecipeChoiceId(event.target.value)} disabled={!visibleRecipes.length}><option value="" disabled>Choisir une recette Ã  ajouter</option>{visibleRecipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}</select><button className="text-button" disabled={!visibleRecipes.length} onClick={() => addRecipe(visibleRecipes.find((recipe) => recipe.id === recipeChoiceId)?.id ?? visibleRecipes[0].id)}><span>+</span> Ajouter la recette</button></div>
            {!visibleRecipes.length && <p className="no-recipes-found">Aucune recette ne correspond Ã  ces filtres.</p>}
          </div>
          <div className="section-heading menu-heading"><div><p className="eyebrow">CETTE SEMAINE</p><h2>{selectedRecipeCount} {selectedRecipeCount === 1 ? 'recette prÃ©vue' : 'recettes prÃ©vues'}</h2></div><span className="collapse-hint">SÃ©lectionnez une recette pour afficher ses dÃ©tails</span></div>
          <div className="recipe-plan-list">
            {plan.map((item, index) => {
              const recipe = recipes.find((entry) => entry.id === item.recipeId) ?? recipes[0]
              const isExpanded = expandedPlanItemId === item.id
              return <article className="plan-card" key={item.id}>
                <div className="plan-card-heading">
                  <button className="plan-card-toggle" aria-expanded={isExpanded} onClick={() => setExpandedPlanItemId(isExpanded ? null : item.id)}><span className="recipe-index">{String(index + 1).padStart(2, '0')}</span><span className="plan-recipe-name"><small>{recipe.category} Â· {recipe.types.join(' / ')}</small><b>{recipe.name}</b><span>â—· &nbsp;{recipe.time} min <i>Â·</i> {item.servings} portions <i>Â·</i> {item.date ? formatFrenchDate(`${item.date}T12:00:00`, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Date Ã  dÃ©finir'}</span></span><span className="chevron">{isExpanded ? 'âŒƒ' : 'âŒ„'}</span></button>
                  {plan.length > 1 && <button className="remove-button" title="Supprimer la recette" aria-label={`Supprimer ${recipe.name}`} onClick={() => { setPlan((items) => items.filter((entry) => entry.id !== item.id)); if (isExpanded) setExpandedPlanItemId(null) }}>Ã—</button>}
                </div>
                {isExpanded && <>
                <div className="plan-card-controls"><label className="date-field"><span className="eyebrow">Ã€ CUISINER LE <em>Â· FACULTATIF</em></span><input aria-label="Date de cuisson facultative" type="date" value={item.date} onChange={(event) => updatePlan(item.id, { date: event.target.value })} /></label><div className="serving-row"><span className="serving-label">PORTIONS</span><div className="stepper"><button aria-label="Diminuer le nombre de portions" onClick={() => updatePlan(item.id, { servings: Math.max(1, item.servings - 1) })}>âˆ’</button><span>{item.servings}</span><button aria-label="Augmenter le nombre de portions" onClick={() => updatePlan(item.id, { servings: item.servings + 1 })}>+</button></div><span className="serving-hint">Les quantitÃ©s sâ€™adaptent automatiquement</span></div></div>
                <div className="ingredients-table-wrap"><table className="ingredients-table"><thead><tr><th className="need-col">Ã€ ACHETER</th><th>INGRÃ‰DIENT</th><th className="amount-col">QUANTITÃ‰</th><th className="store-col">MAGASIN PRÃ‰FÃ‰RÃ‰</th></tr></thead><tbody>
                  {recipe.ingredients.map((ingredient) => {
                    const amount = ingredient.amount * item.servings / recipe.servings
                    const options = [...ingredient.stores].sort((a, b) => a.preference - b.preference)
                    return <tr key={ingredient.name} className={item.needs[ingredient.name] ? '' : 'not-needed'}><td><input aria-label={`Ajouter ${ingredient.name} Ã  la liste de courses`} type="checkbox" checked={!!item.needs[ingredient.name]} onChange={(event) => updatePlan(item.id, { needs: { ...item.needs, [ingredient.name]: event.target.checked } })} /></td><td className="ingredient-name">{ingredient.name}</td><td className="quantity">{formatQuantity(amount)} <span>{displayFrenchUnit(ingredient.unit, amount)}</span></td><td><select className="store-select" aria-label={`Magasin pour ${ingredient.name}`} value={item.stores[ingredient.name]} onChange={(event) => updatePlan(item.id, { stores: { ...item.stores, [ingredient.name]: event.target.value } })}>{options.map((store) => <option key={store.name} value={store.name}>{store.name}{store.preference === 1 ? ' Â· prÃ©fÃ©rÃ©' : ''}</option>)}</select></td></tr>
                  })}
                </tbody></table></div></>}
              </article>
            })}
          </div>
          <div className="finish-row"><span><b>{groupedIngredients.length} articles</b> regroupÃ©s par magasin</span><button className="primary-button" onClick={() => setPage('review')}>VÃ©rifier les ingrÃ©dients <span>â†’</span></button></div>

          <div className="saved-weekly-plans"><div className="section-heading"><div><p className="eyebrow">VOTRE HISTORIQUE</p><h2>Menus prÃ©cÃ©dents</h2></div><span className="collapse-hint">EnregistrÃ©s Ã  la confirmation de la liste de courses</span></div>
            {savedPlans.length ? <div className="weekly-plan-archive">{savedPlans.map((savedPlan) => <article className="weekly-plan-entry" key={savedPlan.id}><div className="weekly-plan-entry-head"><button className="weekly-plan-toggle" aria-expanded={expandedSavedPlanId === savedPlan.id} onClick={() => setExpandedSavedPlanId(expandedSavedPlanId === savedPlan.id ? null : savedPlan.id)}><span className="list-icon">â—·</span><span><b>Menu de la semaine Â· {formatFrenchDate(savedPlan.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</b><small>{formatFrenchDate(savedPlan.createdAt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} Â· {savedPlan.items.length} recettes</small></span><span className="chevron">{expandedSavedPlanId === savedPlan.id ? 'âŒƒ' : 'âŒ„'}</span></button><button className="delete-button" aria-label={`Supprimer le menu du ${formatFrenchDate(savedPlan.createdAt, { day: 'numeric', month: 'long' })}`} title="Supprimer ce menu" onClick={() => setSavedPlans((current) => current.filter((entry) => entry.id !== savedPlan.id))}>Ã—</button></div>{expandedSavedPlanId === savedPlan.id && <div className="weekly-plan-recipes">{savedPlan.items.map((savedItem) => {const savedRecipe = recipes.find((entry) => entry.id === savedItem.recipeId); if (!savedRecipe) return null; return <div className="weekly-plan-recipe" key={savedItem.id}><span>{savedItem.date ? formatFrenchDate(`${savedItem.date}T12:00:00`, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Date Ã  dÃ©finir'}</span><b>{savedRecipe.name}</b><small>{savedItem.servings} portions</small><button className="text-button" onClick={() => { setOpenRecipeId(savedRecipe.id); setPage('recipes') }}>Voir la recette</button></div>})}</div>}</article>)}</div> : <div className="archive-empty">Vos menus confirmÃ©s apparaÃ®tront ici pour vous rappeler les plats prÃ©vus.</div>}
          </div>
        </section>}

        {page === 'review' && <section className="workspace review-workspace">
          <button className="back-link" onClick={() => setPage('plan')}>â† &nbsp;Retour au menu</button>
          <div className="page-heading"><div><p className="eyebrow">DERNIÃˆRE VÃ‰RIFICATION</p><h1>Vos courses, <span>bien organisÃ©es.</span></h1><p className="heading-sub">Les ingrÃ©dients identiques sont regroupÃ©s par magasin.</p></div><div className="review-count"><b>{groupedIngredients.length}</b><span>articles Ã  acheter</span></div></div>
          <div className="review-list">{[...new Set(groupedIngredients.map((item) => item.store))].map((store) => <section className="store-group" key={store}><div className="store-group-heading"><span className="store-pin">âŒ–</span><h2>{displayFrench(store)}</h2><span>{groupedIngredients.filter((item) => item.store === store).length} ARTICLES</span></div>{groupedIngredients.filter((item) => item.store === store).map((item) => <div className="review-item" key={item.id}><span>{displayFrench(item.name)}</span><b>{formatQuantity(item.amount)} <small>{displayFrenchUnit(item.unit, item.amount)}</small></b></div>)}</section>)}</div>
          <div className="review-actions"><button className="secondary-button" onClick={() => setPage('plan')}>â† &nbsp;Retour au menu</button><button className="primary-button" disabled={!groupedIngredients.length} onClick={saveGroceryList}>Confirmer et crÃ©er la liste <span>â†’</span></button></div>
        </section>}

        {page === 'lists' && <section className="workspace"><div className="page-heading"><div><p className="eyebrow">PRÃŠTES POUR VOS COURSES</p><h1>Vos listes de <span>courses.</span></h1><p className="heading-sub">Vos listes confirmÃ©es sont enregistrÃ©es dans ce navigateur.</p></div><button className="secondary-button" onClick={() => setPage('plan')}>+ &nbsp;PrÃ©parer un menu</button></div>
          {lists.length ? <div className="saved-lists">{lists.map((list) => <article className="saved-list-row" key={list.id}><button className="saved-list-open" onClick={() => { setActiveListId(list.id); setPage('detail') }}><span className="list-icon">â˜·</span><span><b>{groceryListTitle(list)}</b><small>{formatFrenchDate(list.createdAt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small></span><span className="saved-list-stats">{list.items.length} articles Â· {list.items.filter((item) => item.checked).length} cochÃ©s</span><span className="chevron">â†’</span></button><button className="delete-button" aria-label={`Supprimer ${groceryListTitle(list)}`} title="Supprimer la liste" onClick={() => setLists((current) => current.filter((entry) => entry.id !== list.id))}>Ã—</button></article>)}</div> : <div className="empty-state"><span>â˜·</span><h2>Pas encore de liste</h2><p>Confirmez un menu de la semaine pour crÃ©er votre premiÃ¨re liste de courses.</p><button className="primary-button" onClick={() => setPage('plan')}>PrÃ©parer un menu <span>â†’</span></button></div>}
        </section>}

        {page === 'detail' && activeList && <section className="workspace"><button className="back-link" onClick={() => setPage('lists')}>â† &nbsp;Toutes les listes</button><div className="page-heading"><div><p className="eyebrow">{formatFrenchDate(activeList.createdAt, { weekday: 'long', day: 'numeric', month: 'long' }).toLocaleUpperCase('fr-FR')}</p><h1>Liste de courses<span>.</span></h1><p className="heading-sub">Cochez les articles au fil de vos achats. Ils passeront en bas de la liste.</p></div><div className="review-count"><b>{activeList.items.filter((item) => !item.checked).length}</b><span>articles restants</span></div></div>
          <div className="shopping-list">{[...new Set(activeList.items.map((item) => item.store))].map((store) => {const storeItems = activeList.items.filter((item) => item.store === store).sort((a, b) => Number(a.checked) - Number(b.checked) || a.name.localeCompare(b.name)); return <section className="shop-store-group" key={store}><div className="store-group-heading"><span className="store-pin">âŒ–</span><h2>{displayFrench(store)}</h2><span>{storeItems.filter((item) => !item.checked).length} Ã€ ACHETER</span></div>{storeItems.map((item) => <label className={`shopping-item ${item.checked ? 'is-checked' : ''}`} key={item.id}><input type="checkbox" checked={item.checked} onChange={() => toggleGroceryItem(activeList.id, item.id)} aria-label={`${displayFrench(item.name)} : ${item.checked ? 'achetÃ©' : 'Ã  acheter'}`} /><span className="shopping-name">{displayFrench(item.name)}</span><span className="shopping-amount">{formatQuantity(item.amount)} {displayFrenchUnit(item.unit, item.amount)}</span></label>)}</section>})}</div>
        </section>}

        {page === 'detail' && !activeList && <section className="workspace"><div className="empty-state"><h2>Liste introuvable</h2><button className="primary-button" onClick={() => setPage('lists')}>Voir toutes les listes <span>â†’</span></button></div></section>}

        {page === 'recipes' && (
          <section className="workspace">
            <div className="page-heading">
              <div>
                <p className="eyebrow">QUELQUES IDÃ‰ES POUR COMMENCER</p>
                <h1>Le carnet de <span>recettes.</span></h1>
                <p className="heading-sub">Ajoutez vos recettes, adaptez-les et gardez vos favoris au mÃªme endroit.</p>
              </div>
              <div className="recipe-book-actions"><span className="recipe-total">{recipes.length} RECETTES</span><button className="primary-button" onClick={() => openRecipeEditor()}>+ Nouvelle recette</button></div>
            </div>
            <div className="recipe-library">
              {recipes.map((recipe, index) => {
                const metadata = recipeMetadata[recipe.id] ?? { rating: 0, lastCookedAt: null }
                return (
                  <article className="library-recipe" key={recipe.id}>
                    <div className="library-recipe-top">
                      <button className="library-recipe-heading" aria-expanded={openRecipeId === recipe.id} onClick={() => setOpenRecipeId(openRecipeId === recipe.id ? null : recipe.id)}>
                        <span className="library-number">0{index + 1}</span>
                        <span className="library-name"><small>{recipe.category} Â· {recipe.types.join(' / ')}</small><b>{recipe.name}</b></span>
                        <span className="library-time">â—· &nbsp;{recipe.time} min</span>
                        <span className="chevron">{openRecipeId === recipe.id ? 'âŒƒ' : 'âŒ„'}</span>
                      </button>
                      <div className="recipe-header-meta">
                        <div className="rating-control" aria-label={`Noter ${recipe.name}`}>
                          <span>VOTRE NOTE</span>
                          {[1, 2, 3, 4, 5].map((rating) => <button key={rating} className={rating <= metadata.rating ? 'star-filled' : ''} aria-label={`${rating} ${rating === 1 ? 'Ã©toile' : 'Ã©toiles'} sur 5`} aria-pressed={metadata.rating === rating} onClick={() => setRecipeRating(recipe.id, metadata.rating === rating ? 0 : rating)}>â˜…</button>)}
                        </div>
                        <div className="recipe-header-actions"><span className="last-cooked">DerniÃ¨re prÃ©paration : {metadata.lastCookedAt ? formatFrenchDate(metadata.lastCookedAt, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Jamais'}</span><button className="mini-action" onClick={(event) => { event.stopPropagation(); openRecipeEditor(recipe) }}>Modifier</button><button className="mini-action danger" onClick={(event) => { event.stopPropagation(); deleteRecipe(recipe.id) }}>Supprimer</button></div>
                      </div>
                    </div>
                    {openRecipeId === recipe.id && (
                      <div className="recipe-details">
                        <div><h3>IngrÃ©dients Â· {recipe.servings} portions</h3>{recipe.ingredients.map((ingredient) => <p key={ingredient.name}>{ingredient.name} <span>{formatQuantity(ingredient.amount)} {displayFrenchUnit(ingredient.unit, ingredient.amount)}</span></p>)}</div>
                        <div><h3>PrÃ©paration</h3><ol>{recipe.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol><button className="text-button" onClick={() => { addRecipe(recipe.id); setPage('plan') }}>+ Ajouter au menu de la semaine</button></div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </main>
      {familySettingsOpen && <div className="family-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFamilySettingsOpen(false) }}><section className="family-modal" role="dialog" aria-modal="true" aria-labelledby="family-modal-title"><button className="family-modal-close" aria-label="Fermer" onClick={() => setFamilySettingsOpen(false)}>Ã—</button><p className="eyebrow">PARTAGE FAMILIAL</p><h2 id="family-modal-title">Synchroniser vos appareils</h2><p className="family-modal-copy">Configurez la connexion une fois sur chaque tÃ©lÃ©phone. Le mÃªme code familial donne accÃ¨s aux mÃªmes menus et listes, sans compte utilisateur.</p>
        {syncError && <p className="family-error" role="alert">{syncError}</p>}
        <form className="family-form" onSubmit={saveFamilyConnection}><p className="family-project-label">Projet partagÃ© : <b>recettes-famille</b></p><label>Code familial partagÃ©<input type="password" required minLength={16} autoComplete="new-password" placeholder="Au moins 16 caractÃ¨res" value={familyForm.accessCode} onChange={(event) => setFamilyForm({ ...familyForm, accessCode: event.target.value })} /></label><p className="family-code-note">Le code doit aussi Ãªtre dÃ©fini comme secret <code>FAMILY_ACCESS_CODE</code> dans Supabase. Il est mÃ©morisÃ© uniquement dans ce navigateur. Choisissez un code long et difficile Ã  deviner.</p><div className="family-modal-actions"><button type="button" className="secondary-button" onClick={() => setFamilySettingsOpen(false)}>Fermer</button><button type="submit" className="primary-button">Connecter cet appareil <span>â†’</span></button></div></form>
        <p className="family-sync-footnote">{syncStatus === 'connected' ? 'Les changements se synchronisent entre appareils environ toutes les 15 secondes.' : 'En mode local, vos donnÃ©es restent enregistrÃ©es uniquement dans ce navigateur.'}</p>
      </section></div>}
      {recipeEditorOpen && <div className="family-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRecipeEditorOpen(false) }}><section className="family-modal recipe-editor-modal" role="dialog" aria-modal="true" aria-labelledby="recipe-editor-title"><button className="family-modal-close" aria-label="Fermer" onClick={() => setRecipeEditorOpen(false)}>Ã—</button><p className="eyebrow">CARNET DE RECETTES</p><h2 id="recipe-editor-title">{editingRecipeId ? 'Modifier la recette' : 'Ajouter une recette'}</h2><form className="recipe-form" onSubmit={saveRecipe}><div className="recipe-form-grid"><label>Nom de la recette<input required value={recipeDraft.name} onChange={(event) => setRecipeDraft({ ...recipeDraft, name: event.target.value })} /></label><label>CatÃ©gorie<input placeholder="Ex. RAPIDE, FAMILLEâ€¦" value={recipeDraft.category} onChange={(event) => setRecipeDraft({ ...recipeDraft, category: event.target.value })} /></label><label>Temps de cuisson (minutes)<input required type="number" min="1" value={recipeDraft.time} onChange={(event) => setRecipeDraft({ ...recipeDraft, time: Number(event.target.value) })} /></label><label>Portions de base<input required type="number" min="1" value={recipeDraft.servings} onChange={(event) => setRecipeDraft({ ...recipeDraft, servings: Number(event.target.value) })} /></label><label className="recipe-form-wide">Types / cuisines<input placeholder="Ex. VÃ©gÃ©tarien, Italien, Rapide" value={recipeDraft.types.join(', ')} onChange={(event) => setRecipeDraft({ ...recipeDraft, types: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} /></label></div><div className="recipe-form-section"><div className="recipe-form-section-head"><h3>IngrÃ©dients</h3><button type="button" className="text-button" onClick={() => setRecipeDraft({ ...recipeDraft, ingredients: [...recipeDraft.ingredients, { name: '', amount: 1, unit: 'g', stores: storeNames.map((name, index) => ({ name, preference: index + 1 })) }] })}>+ Ajouter un ingrÃ©dient</button></div>{recipeDraft.ingredients.map((ingredient, index) => <div className="draft-ingredient" key={`${index}-${ingredient.name}`}><div className="draft-ingredient-main"><input aria-label={`Nom de lâ€™ingrÃ©dient ${index + 1}`} placeholder="IngrÃ©dient" value={ingredient.name} onChange={(event) => setRecipeDraft({ ...recipeDraft, ingredients: recipeDraft.ingredients.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item) })} /><input aria-label={`QuantitÃ© de lâ€™ingrÃ©dient ${index + 1}`} type="number" min="0" step="any" placeholder="QuantitÃ©" value={ingredient.amount} onChange={(event) => setRecipeDraft({ ...recipeDraft, ingredients: recipeDraft.ingredients.map((item, itemIndex) => itemIndex === index ? { ...item, amount: Number(event.target.value) } : item) })} /><input aria-label={`UnitÃ© de lâ€™ingrÃ©dient ${index + 1}`} placeholder="g, ml, piÃ¨ceâ€¦" value={ingredient.unit} onChange={(event) => setRecipeDraft({ ...recipeDraft, ingredients: recipeDraft.ingredients.map((item, itemIndex) => itemIndex === index ? { ...item, unit: event.target.value } : item) })} /><button type="button" className="delete-button" aria-label={`Supprimer lâ€™ingrÃ©dient ${index + 1}`} onClick={() => setRecipeDraft({ ...recipeDraft, ingredients: recipeDraft.ingredients.filter((_, itemIndex) => itemIndex !== index) })}>Ã—</button></div><div className="store-checks"><span>Magasins autorisÃ©s :</span>{availableStoreNames.map((store) => <label key={store}><input type="checkbox" checked={ingredient.stores.some((choice) => choice.name === store)} onChange={(event) => setRecipeDraft({ ...recipeDraft, ingredients: recipeDraft.ingredients.map((item, itemIndex) => { if (itemIndex !== index) return item; const stores = event.target.checked ? [...item.stores, { name: store, preference: item.stores.length + 1 }] : item.stores.filter((choice) => choice.name !== store); return { ...item, stores } }) })} />{store}</label>)}<button type="button" className="mini-action" onClick={() => setRecipeDraft({ ...recipeDraft, ingredients: recipeDraft.ingredients.map((item, itemIndex) => itemIndex === index ? { ...item, stores: availableStoreNames.map((name, storeIndex) => ({ name, preference: storeIndex + 1 })) } : item) })}>Tous</button></div></div>)}</div><div className="recipe-form-section"><div className="recipe-form-section-head"><h3>Instructions</h3><button type="button" className="text-button" onClick={() => setRecipeDraft({ ...recipeDraft, instructions: [...recipeDraft.instructions, ''] })}>+ Ajouter une Ã©tape</button></div>{recipeDraft.instructions.map((instruction, index) => <div className="draft-instruction" key={index}><span>{index + 1}</span><textarea aria-label={`Ã‰tape ${index + 1}`} rows={2} placeholder="DÃ©crivez cette Ã©tapeâ€¦" value={instruction} onChange={(event) => setRecipeDraft({ ...recipeDraft, instructions: recipeDraft.instructions.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} /><button type="button" className="delete-button" aria-label={`Supprimer lâ€™Ã©tape ${index + 1}`} onClick={() => setRecipeDraft({ ...recipeDraft, instructions: recipeDraft.instructions.filter((_, itemIndex) => itemIndex !== index) })}>Ã—</button></div>)}</div><div className="family-modal-actions"><button type="button" className="secondary-button" onClick={() => setRecipeEditorOpen(false)}>Annuler</button><button type="submit" className="primary-button">Enregistrer la recette <span>â†’</span></button></div></form></section></div>}
    </div>
  )
}

export default App
