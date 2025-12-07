# Requirements Writing Guide

## Template Usage

Nutze `example-feature.md` als Template für neue Requirements.

**Wichtig:** Je detaillierter und klarer dein Requirement, desto besser arbeiten die Agenten.

## Best Practices

### 1. Kontext: Sei spezifisch
❌ **Zu vage:**
```
- Hintergrund: Wir brauchen eine neue Funktion
- Problem heute: Benutzer können es nicht machen
```

✅ **Besser:**
```
- Hintergrund: Ecommerce-System mit 10k+ Produkten
- Problem heute: Benutzer können Produkte nicht nach Preis/Kategorie sortieren
- Warum jetzt wichtig: Q4-Saison, Usability ist critical
```

### 2. User Story: Folge der Vorlage
✅ **Format:**
```
Als [ROLLE] möchte ich [ZIEL],
DAMIT ich [NUTZEN/WERT].
```

✅ **Beispiel:**
```
Als Shop-Manager möchte ich Produkte in Bulk-Operationen updaten,
DAMIT ich 10.000 Artikel pro Tag effizienter verwalten kann.
```

### 3. Funktionale Anforderungen: Klein und tesbar
✅ **Gut:**
- [ ] Users can sort by price (ascending/descending)
- [ ] Users can sort by category alphabetically
- [ ] Sorting persists across page reloads
- [ ] Default sort is by newest first

❌ **Zu groß:**
- [ ] Implement sorting and filtering

### 4. Akzeptanzkriterien: BDD-Format
✅ **Format:**
```
GIVEN [initial state]
WHEN [action]
THEN [expected outcome]
```

✅ **Beispiel:**
```
GIVEN I have a list of 10 products
WHEN I click "Sort by Price (Low to High)"
THEN products are reordered from €5 to €1000
AND the sort direction indicator shows ↑
```

### 5. Testideen: Konkrete Szenarien
✅ **E2E Beispiel:**
```
Szenario 1: User sorts by name
  1. Open product list
  2. Click "Name (A-Z)"
  3. Verify products are sorted alphabetically
  4. Click again (Z-A)
  5. Verify reverse order
```

### 6. Schnittstellen: APIs detaillieren
✅ **Statt vag:**
```
APIs: Filter und Sort Endpoints
```

✅ **Besser:**
```
GET /api/products?sort=price&order=asc
  Query Params:
    - sort: price | name | created_at
    - order: asc | desc
  Returns: Product[]

POST /api/products/bulk-update
  Body: { productIds: string[], updates: {} }
  Returns: { updated: number, failed: number }
```

### 7. Nicht-funktionale Anforderungen: Messbar
✅ **Nicht nur "Performance":**
```
Performance:
  - Sorting must complete within 200ms for 10k products
  - API response within 500ms
  
Security:
  - Only managers can use bulk-update
  - Audit log all changes
  
Usability:
  - Sort indicators must be obvious (arrows, colors)
  - Mobile-friendly sorting UI
```

---

## Tipps für bessere Generated Code

1. **Sei spezifisch mit Tech-Stack**
   ```yaml
   target_components: ["frontend-react", "backend-nodejs", "database-postgres"]
   ```

2. **Definiere Constraints früh**
   ```
   Nicht-funktionale Anforderungen:
     - Must work offline (IndexedDB fallback)
     - Accessible (WCAG AA)
     - Performance: < 100ms
   ```

3. **List edge cases**
   ```
   - Empty list (0 products)
   - Single item
   - Duplicate sort keys
   - Invalid sort parameters
   ```

4. **Erwähne Integrationen**
   ```
   - Must integrate with existing analytics
   - Must respect current permission system
   - Must work with lazy-loaded lists
   ```

---

## Häufige Fehler

❌ **Zu vage:**
"Implement a better search"

✅ **Besser:**
"Implement fuzzy search for product titles (Levensthein distance, 85%+ match)"

❌ **Keine ACs:**
GIVEN user searches
WHEN typing
THEN results appear

✅ **Besser:**
GIVEN user in product search with 0 results
WHEN typing "ipon" 
THEN "iPhone" appears (fuzzy match enabled)
AND results appear within 200ms

❌ **Keine Constraints:**
Performance: "Schnell"

✅ **Besser:**
Performance: "< 200ms for 10k products on 4G network (via Lighthouse)"

---

## Beispiel: Komplettes Requirement

```markdown
---
name: "product-sorting"
version: "1.0"
priority: "high"
target_components: ["frontend", "backend"]
artifacts:
  - "src/components/ProductSort.jsx"
  - "src/hooks/useProductSort.js"
  - "tests/e2e/product-sorting.spec.js"
build_test_commands:
  - "npm run lint"
  - "npm test"
---

# Feature: Product Sorting

## 1. Kontext
- **Hintergrund:** Ecommerce Plattform mit 10k+ Produkten
- **Problem:** User können nicht nach Preis/Name sortieren
- **Warum jetzt:** Q4 mit hohem Traffic, Usability critical

## 2. User Story
Als Shop-Besucher möchte ich die Produktliste nach Preis, Name, Bewertung sortieren,
DAMIT ich schneller relevante Produkte finde.

## 3. Funktionale Anforderungen
- [ ] Sortierbar nach: price, name, rating, created_date
- [ ] Bi-direktionale Sortierung (asc/desc)
- [ ] Sortierung mit Filter kombinierbar
- [ ] Sortierung wird in URL persistiert (?sort=price&order=desc)
- [ ] Default: newest first

## 4. Akzeptanzkriterien
- GIVEN: Liste mit 5 Produkten (Preise: €10, €50, €5, €100, €25)
  WHEN: User clicks "Price (Low to High)"
  THEN: Order ist €5, €10, €25, €50, €100 UND UI zeigt ↑ Pfeil

## 5. Testideen
E2E:
  - Sort by each column
  - Verify bi-directional sorting
  - Verify URL persists sorting
  - Test with filtered list (only 2 products match)
  
Unit:
  - sortProducts([...]) returns correct order
  - handleSort() updates state correctly
```

---

**Noch Fragen?** Schau die Hello-World Requirements als Beispiel an!
