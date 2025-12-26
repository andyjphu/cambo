# Code Review & Refactoring Recommendations

**Date**: 2025-01-XX  
**Reviewer**: AI Assistant  
**Scope**: Full codebase analysis for maintainability, consistency, and robustness

---

## Executive Summary

This review identifies opportunities to improve code organization, eliminate hardcoded values, standardize styles, and strengthen error handling. The codebase is generally well-structured but has several areas that would benefit from refactoring.

**Priority Issues**:
1. **AnalyzePage.tsx** (863 lines) - Too large, needs decomposition
2. **Hardcoded z-index values** - Inconsistent layering system
3. **Duplicate constants** - TYPE_LABELS defined in multiple files
4. **Inconsistent error handling** - localStorage access patterns vary
5. **Hardcoded spacing/sizing** - Should use CSS variables

---

## 1. Component Size & Single Responsibility

### 🔴 Critical: AnalyzePage.tsx (863 lines)

**Issue**: The `AnalyzePage` component violates single responsibility principle. It handles:
- State management (10+ useState hooks)
- Event handling (hover, click, scroll)
- Data transformation (clusters, words, tooltip data)
- UI rendering (5+ panels)
- localStorage persistence
- Tooltip positioning logic

**Recommendations**:

1. **Extract Panel Components**:
   ```typescript
   // src/components/analyzer/panels/
   - KhmerTextPanel.tsx      // Khmer text input/display
   - CharacterAnalysisPanel.tsx  // Character breakdown
   - WordBoundariesPanel.tsx     // Space editor wrapper
   - RomanizationPanel.tsx        // Already extracted ✓
   - DictionaryMatchesPanel.tsx   // Dictionary results
   ```

2. **Extract Custom Hooks**:
   ```typescript
   // src/hooks/
   - useClusterHighlighting.ts   // Hover/click/scroll logic
   - usePanelStates.ts           // Panel collapse state + persistence
   - useTextSegmentation.ts       // Text → clusters → words
   - useTooltipData.ts            // Tooltip data computation
   ```

3. **Extract Constants**:
   ```typescript
   // src/constants/
   - panelConstants.ts           // Panel state defaults, storage keys
   - displayConstants.ts          // TYPE_LABELS, POS_LABELS
   ```

**Estimated Reduction**: 863 → ~200 lines (main component) + 5 panel components (~100 lines each)

---

### 🔴 Critical: KhmerAnalyzer.tsx (464 lines) - DEAD CODE

**Issue**: This component is **NOT imported anywhere** in the codebase. It duplicates functionality from `AnalyzePage.tsx`:
- Same TYPE_LABELS constant
- Similar cluster parsing logic
- Similar hover/click handling

**Recommendation**: 
- ✅ **DELETE** - This is dead code and should be removed
- Also delete `KhmerAnalyzer.css` (if not used elsewhere)

**Impact**: Removes 464 lines of unused code, eliminates confusion

---

### 🟢 Low: wordSegmentation.ts (440 lines)

**Status**: Acceptable size for a utility module, but could benefit from:
- Extracting helper functions to separate file
- Better documentation of algorithm

---

## 2. Hardcoded Values

### 🔴 Critical: Z-Index Values

**Issue**: Z-index values scattered across files with no system:
- `100000` (Tooltip.tsx, ConfidenceWarning.css)
- `1000` (DictionaryPage.css)
- `300` (ConfidenceWarning.css - old)
- `200` (SubNav.css)
- `100` (Multiple files)
- `50`, `20`, `10`, `1` (Various)

**Recommendation**: Create z-index system in `index.css`:
```css
:root {
  /* Z-Index Layers */
  --z-base: 1;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 1000;
  --z-tooltip: 10000;  /* Changed from 100000 - excessive */
  --z-portal: 10000;   /* For portal-based components */
}
```

**Files to Update**:
- `src/components/ui/Tooltip.css`
- `src/components/analyzer/ConfidenceWarning.css`
- `src/pages/DictionaryPage.css`
- `src/components/layout/SubNav.css`
- `src/components/layout/Navbar.css`
- `src/components/analyzer/SelectionPanel.css`
- `src/pages/AnalyzePage.css`
- `src/components/KhmerAnalyzer.css`

---

### 🟡 Medium: Icon/Button Sizes

**Issue**: Hardcoded sizes repeated:
- `28px` (button width/height) - appears 10+ times
- `14px` (icon size) - appears 15+ times

**Recommendation**: Add to CSS variables:
```css
:root {
  --icon-size-sm: 14px;
  --icon-size-md: 16px;
  --icon-size-lg: 20px;
  
  --button-size-sm: 24px;
  --button-size-md: 28px;
  --button-size-lg: 32px;
}
```

**Files Affected**: All component CSS files

---

### 🟡 Medium: Max Height Values

**Issue**: `35vh` hardcoded in multiple places:
- `CollapsiblePanel.css` (line 92)
- Referenced in README.md

**Status**: Already using CSS variable `--panel-max-height` would be better, but `35vh` is acceptable if documented.

**Recommendation**: Add CSS variable:
```css
:root {
  --panel-max-height: 35vh;
}
```

---

### 🟡 Medium: Magic Numbers in Positioning

**Issue**: Hardcoded spacing values in tooltip positioning:
- `8` (margin)
- `12` (gap)
- `6` (arrow height)
- `300` (default tooltip width)

**Recommendation**: Extract to constants:
```typescript
// src/constants/tooltip.ts
export const TOOLTIP_CONSTANTS = {
  VIEWPORT_MARGIN: 8,
  TRIGGER_GAP: 12,
  ARROW_HEIGHT: 6,
  DEFAULT_WIDTH: 300,
  MAX_HEIGHT: 400,
} as const;
```

**Files**: `Tooltip.tsx`, `ConfidenceWarning.tsx`

---

## 3. Inconsistent Styles

### 🔴 Critical: Spacing Values

**Issue**: Hardcoded spacing values instead of CSS variables:
- `0.75rem` - appears 50+ times
- `1.25rem` - appears 30+ times
- `0.5rem` - appears 20+ times

**Current CSS Variables** (from `index.css`):
```css
--space-xs: 0.25rem;
--space-sm: 0.5rem;
--space-md: 1rem;
--space-lg: 1.5rem;
--space-xl: 2rem;
```

**Gap**: Missing `0.75rem` and `1.25rem` which are used frequently.

**Recommendation**: Add missing spacing variables:
```css
:root {
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 0.75rem;   /* NEW - most common spacing */
  --space-lg: 1rem;
  --space-xl: 1.25rem;   /* NEW - panel padding */
  --space-2xl: 1.5rem;
  --space-3xl: 2rem;
}
```

Then replace all hardcoded values with variables.

---

### 🟡 Medium: Font Sizes

**Issue**: Hardcoded font sizes:
- `0.75rem` - appears 30+ times
- `1.25rem` - appears 10+ times

**Current Variables**:
```css
--khmer-size-lg: 1.75rem;
--khmer-size-md: 1.5rem;
--khmer-size-sm: 1.25rem;
```

**Recommendation**: Add text size scale:
```css
:root {
  /* Text Sizes */
  --text-xs: 0.625rem;   /* 10px */
  --text-sm: 0.75rem;    /* 12px - most common */
  --text-base: 0.875rem; /* 14px */
  --text-md: 1rem;       /* 16px */
  --text-lg: 1.25rem;    /* 20px */
}
```

---

### 🟡 Medium: Border Radius

**Issue**: Some hardcoded border-radius values:
- `6px`, `4px`, `3px` scattered throughout

**Current Variables**:
```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
```

**Status**: Mostly consistent, but some `4px` and `3px` values should use `--radius-sm` or add `--radius-xs: 4px`.

---

## 4. Inconsistent Logic

### 🔴 Critical: Duplicate Constants

**Issue**: `TYPE_LABELS` defined in multiple files:
- `AnalyzePage.tsx` (lines 16-27)
- `KhmerAnalyzer.tsx` (lines 12-23)

**Recommendation**: Extract to shared constants file:
```typescript
// src/constants/khmerTypes.ts
export const TYPE_LABELS: Record<KhmerCharType, string> = {
  consonant: 'Consonant',
  subscript: 'Subscript',
  vowel: 'Vowel',
  indep_vowel: 'Ind. Vowel',
  sign: 'Sign',
  numeral: 'Number',
  punctuation: 'Punct.',
  coeng: 'Coeng',
  space: 'Space',
  other: 'Other',
};
```

---

### 🟡 Medium: Duplicate Tooltip Positioning Logic

**Issue**: Similar positioning logic in:
- `Tooltip.tsx` (~100 lines)
- `ConfidenceWarning.tsx` (~80 lines)

**Recommendation**: Extract shared positioning hook:
```typescript
// src/hooks/useTooltipPosition.ts
export function useTooltipPosition(
  triggerRef: RefObject<HTMLElement>,
  isVisible: boolean,
  options?: { gap?: number; margin?: number }
) {
  // Shared positioning logic
}
```

---

### 🟡 Medium: localStorage Access Patterns

**Issue**: Inconsistent error handling:
- Some wrapped in try-catch (`AnalyzePage.tsx`, `SettingsContext.tsx`)
- Some not (`userDictionary.ts` has try-catch but inconsistent)

**Recommendation**: Create utility wrapper:
```typescript
// src/utils/storage.ts
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent fail
    }
  }
};
```

---

### 🟡 Medium: Storage Key Naming

**Issue**: Storage keys defined in multiple places:
- `'cambo-input-text'` (AnalyzePage.tsx)
- `'cambo-panel-states'` (AnalyzePage.tsx)
- `'cambo-user-dictionary'` (userDictionary.ts)
- `'cambo-settings'` (SettingsContext.tsx)

**Recommendation**: Centralize in constants:
```typescript
// src/constants/storageKeys.ts
export const STORAGE_KEYS = {
  INPUT_TEXT: 'cambo-input-text',
  PANEL_STATES: 'cambo-panel-states',
  USER_DICTIONARY: 'cambo-user-dictionary',
  SETTINGS: 'cambo-settings',
} as const;
```

---

## 5. Potential Break Points

### 🔴 Critical: Missing Error Boundaries

**Issue**: No React error boundaries to catch component errors.

**Recommendation**: Add error boundary component:
```typescript
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<...> {
  // Catch and display errors gracefully
}
```

Wrap main routes in `App.tsx`.

---

### 🟡 Medium: Null Safety

**Issue**: Some potential null/undefined access:
- `getBoundingClientRect()` calls without null checks
- Array access without bounds checking in some places

**Examples**:
```typescript
// Tooltip.tsx line 37
const triggerRect = trigger.getBoundingClientRect(); // trigger could be null

// AnalyzePage.tsx line 369
const cluster = clusters[activeClusterIdx]; // No bounds check
```

**Recommendation**: Add defensive checks:
```typescript
if (!trigger || !tooltip) return;
if (activeClusterIdx === null || activeClusterIdx >= clusters.length) return null;
```

---

### 🟡 Medium: Console Statements

**Issue**: Mix of `console.log`, `console.warn`, `console.error`:
- Some for debugging (should be removed)
- Some for error reporting (should use proper error handling)

**Recommendation**: 
- Remove debug `console.log` statements
- Replace error `console.error` with proper error reporting (e.g., error boundary, error service)
- Keep `console.warn` for non-critical issues

**Files with console statements**:
- `dictionaryLoader.ts` (lines 49, 52, 177, 180)
- `wordSegmentation.ts` (line 421)
- `userDictionary.ts` (lines 28, 40, 165)
- `SettingsContext.tsx` (lines 48, 63, 77)
- `AnalyzePage.tsx` (lines 96, 105)
- `SelectionPanel.tsx` (lines 65, 80)
- `SubNav.tsx` (line 165)

---

### 🟡 Medium: Missing Type Guards

**Issue**: Some type assertions without validation:
```typescript
// AnalyzePage.tsx
const target = e.target as HTMLElement; // No runtime check
```

**Recommendation**: Add type guards:
```typescript
function isHTMLElement(target: EventTarget | null): target is HTMLElement {
  return target !== null && target instanceof HTMLElement;
}
```

---

## 6. Code Organization

### 🔴 Critical: Unused/Dead Code

**Issue**: `KhmerAnalyzer.tsx` (464 lines) - **CONFIRMED UNUSED**.

**Action**: 
- ✅ Delete `src/components/KhmerAnalyzer.tsx`
- ✅ Delete `src/components/KhmerAnalyzer.css` (verify not used elsewhere)
- ✅ Remove from any exports if present

**Impact**: Removes 464 lines of dead code

---

### 🟡 Medium: File Naming Consistency

**Issue**: Mix of naming conventions:
- `AnalyzePage.tsx` (PascalCase)
- `khmerParser.ts` (camelCase)
- `dictionaryCore.ts` (camelCase)

**Status**: Acceptable - TypeScript convention is PascalCase for components, camelCase for utilities.

---

## 7. Performance Considerations

### 🟢 Low: Memoization

**Status**: Good use of `useMemo` and `useCallback` throughout.

**Minor Optimization**: Some callbacks could be memoized but aren't critical.

---

### 🟢 Low: Bundle Size

**Status**: Good - lazy loading implemented for extended dictionary.

---

## 8. Documentation

### 🟡 Medium: Missing JSDoc

**Issue**: Many utility functions lack JSDoc comments.

**Recommendation**: Add JSDoc to public APIs:
```typescript
/**
 * Parses Khmer text into orthographic clusters.
 * 
 * @param text - Raw Khmer text string
 * @returns Array of Khmer clusters (syllables)
 * 
 * @example
 * ```typescript
 * const clusters = parseKhmerText('សួស្តី');
 * // Returns: [{ text: 'សួ', type: 'consonant', ... }, ...]
 * ```
 */
export function parseKhmerText(text: string): KhmerCluster[] {
  // ...
}
```

---

## Priority Action Items

### High Priority (Do First)

1. ✅ **Extract constants** - TYPE_LABELS, POS_LABELS, storage keys
2. ✅ **Standardize z-index** - Create CSS variable system
3. ✅ **Add missing CSS variables** - spacing (0.75rem, 1.25rem), icon sizes
4. ✅ **Create storage utility** - Centralize localStorage access
5. ✅ **Break down AnalyzePage** - Extract panels and hooks

### Medium Priority (Do Next)

6. ✅ **Extract tooltip positioning** - Shared hook for Tooltip and ConfidenceWarning
7. ✅ **Add error boundary** - Catch React errors gracefully
8. ✅ **Remove console.log** - Debug statements
9. ✅ **Add null checks** - Defensive programming
10. ✅ **Verify KhmerAnalyzer** - Remove if unused

### Low Priority (Nice to Have)

11. ✅ **Add JSDoc** - Document public APIs
12. ✅ **Standardize font sizes** - Use CSS variables
13. ✅ **Add type guards** - Runtime type checking

---

## Metrics

### Current State
- **Largest Component**: AnalyzePage.tsx (863 lines)
- **Hardcoded z-index values**: 8 different values
- **Duplicate constants**: 2 files (TYPE_LABELS)
- **Hardcoded spacing**: 50+ instances of `0.75rem`
- **Console statements**: 16 instances
- **Missing error boundaries**: 0

### Target State
- **Largest Component**: < 300 lines
- **Z-index values**: All use CSS variables
- **Duplicate constants**: 0 (centralized)
- **Hardcoded spacing**: 0 (use CSS variables)
- **Console statements**: < 5 (only critical warnings)
- **Error boundaries**: 1+ (main routes)

---

## Additional Findings

### 🟡 Medium: Inline SVG Icons

**Issue**: SVG icons are inline in multiple places:
- `AnalyzePage.tsx` - Edit, confirm, selection icons
- `SpaceEditor.tsx` - Edit icons
- `SelectionPanel.tsx` - Various icons

**Status**: Partially addressed - some icons use `react-icons` (BsArrowsAngleContract), but many still inline.

**Recommendation**: Consider extracting all SVG icons to a shared icon component or using react-icons consistently.

---

### 🟡 Medium: Hardcoded Placeholder Text

**Issue**: Placeholder text hardcoded:
- `'សូមសរសេរភាសាខ្មែរនៅទីនេះ...'` (AnalyzePage.tsx line 455)
- `'Click edit to add text...'` (AnalyzePage.tsx line 494)

**Recommendation**: Extract to constants file for i18n readiness.

---

### 🟡 Medium: Magic Number: maxClusters = 8

**Issue**: Hardcoded `maxClusters: number = 8` in `wordSegmentation.ts`:
- Line 114: `function forwardMaxMatch(clusters: KhmerCluster[], maxClusters: number = 8)`
- Line 218: `function backwardMaxMatch(clusters: KhmerCluster[], maxClusters: number = 8)`

**Recommendation**: Extract to constant:
```typescript
// src/constants/segmentation.ts
export const SEGMENTATION_CONSTANTS = {
  MAX_WORD_CLUSTERS: 8, // Maximum clusters to consider for a single word
} as const;
```

---

### 🟡 Medium: Duplicate Scroll Logic

**Issue**: `scrollIntoView` called with same parameters in two places:
- `AnalyzePage.tsx` lines 223 and 229

**Recommendation**: Extract to helper function:
```typescript
function scrollToCluster(element: HTMLElement | undefined) {
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }
}
```

---

### 🟡 Low: Inconsistent Button Disabled States

**Issue**: Some buttons check `!inputText.trim()`, others don't have disabled states.

**Recommendation**: Standardize disabled state logic.

---

## Summary Statistics

### Code Metrics
- **Total Lines**: ~5,937
- **Largest File**: AnalyzePage.tsx (863 lines)
- **Average Component Size**: ~200 lines
- **Dead Code**: KhmerAnalyzer.tsx (464 lines) - **REMOVE**

### Hardcoded Values
- **Z-index values**: 8 different values (should be 1 system)
- **Icon sizes**: 14px (15+ instances), 28px (10+ instances)
- **Spacing**: 0.75rem (50+ instances), 1.25rem (30+ instances)
- **Magic numbers**: 8 (maxClusters), 300 (tooltip width), etc.

### Duplications
- **TYPE_LABELS**: 2 files
- **Tooltip positioning**: 2 implementations
- **localStorage access**: 4+ different patterns

### Error Handling
- **Console statements**: 16 instances
- **Error boundaries**: 0
- **Try-catch coverage**: ~60% of localStorage access

---

## Conclusion

The codebase is well-structured overall, but would benefit significantly from:
1. Breaking down the large `AnalyzePage` component (863 → ~200 lines + 5 panel components)
2. Standardizing hardcoded values through CSS variables and constants
3. Improving error handling and null safety
4. Eliminating code duplication (TYPE_LABELS, tooltip positioning)
5. **Removing dead code** (KhmerAnalyzer.tsx - 464 lines)

These improvements will make the codebase more maintainable, testable, and robust. The architecture is sound, but the implementation could be more modular and consistent.

---

## Quick Wins (Can be done immediately)

1. ✅ Delete `KhmerAnalyzer.tsx` and `KhmerAnalyzer.css` (464 lines removed)
2. ✅ Extract `TYPE_LABELS` to `src/constants/khmerTypes.ts`
3. ✅ Extract `POS_LABELS` to `src/constants/khmerTypes.ts`
4. ✅ Add z-index CSS variables to `index.css`
5. ✅ Add missing spacing variables (0.75rem, 1.25rem) to `index.css`
6. ✅ Create `src/constants/storageKeys.ts` for storage key constants
7. ✅ Remove debug `console.log` statements

**Estimated Time**: 2-3 hours  
**Impact**: High - eliminates duplication, standardizes values, removes dead code

