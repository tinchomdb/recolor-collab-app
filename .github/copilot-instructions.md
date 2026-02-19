Don't use magic strings
For css styles, use global tokens, not hardcoded values

# VueJS 3 Development Instructions

Instructions for building high-quality VueJS 3 applications with the Composition API, TypeScript, and modern best practices.

## Project Context

- Vue 3.x with Composition API as default
- TypeScript for type safety
- Single File Components (`.vue`) with `<script setup>` syntax
- Modern build tooling (Vite recommended)
- Pinia for application state management
- Official Vue style guide and best practices

## Development Standards

### Architecture

- Favor the Composition API (`setup` functions and composables) over the Options API
- Organize components and composables by feature or domain for scalability
- Separate UI-focused components (presentational) from logic-focused components (containers)
- Extract reusable logic into composable functions in a `composables/` directory

### TypeScript Integration

- Enable `strict` mode in `tsconfig.json` for maximum type safety
- Use `defineComponent` or `<script setup lang="ts">` with `defineProps` and `defineEmits`
- Leverage `PropType<T>` for typed props and default values
- Use interfaces or type aliases for complex prop and state shapes
- Define types for event handlers, refs, and `useRoute`/`useRouter` hooks
- Implement generic components and composables where applicable

### Component Design

- Adhere to the single responsibility principle for components
- Use PascalCase for component names and kebab-case for file names
- Keep components small and focused on one concern
- Use `<script setup>` syntax for brevity and performance
- Validate props with TypeScript; use runtime checks only when necessary
- Favor slots and scoped slots for flexible composition

### State Management

- For simple local state, use `ref` and `reactive` within `setup`
- Use `computed` for derived state
- Keep state normalized for complex structures
- Leverage store plugins for persistence or debugging

### Composition API Patterns

- Create reusable composables for shared logic, e.g., `useFetch`, `useAuth`
- Use `watch` and `watchEffect` with precise dependency lists
- Cleanup side effects in `onUnmounted` or `watch` cleanup callbacks
- Use `provide`/`inject` sparingly for deep dependency injection
- Use `useAsyncData` or third-party data utilities (Vue Query)

### Styling

- Use `<style scoped>` for component-level styles or CSS Modules
- Follow functional CSS conventions for class naming
- Leverage CSS custom properties for theming and design tokens
- Implement mobile-first, responsive design with CSS Grid and Flexbox
- Ensure styles are accessible (contrast, focus states)

### Performance Optimization

- Lazy-load components with dynamic imports and `defineAsyncComponent`
- Use `<Suspense>` for async component loading fallbacks
- Apply `v-once` and `v-memo` for static or infrequently changing elements
- Profile with Vue DevTools Performance tab
- Avoid unnecessary watchers; prefer `computed` where possible
- Tree-shake unused code and leverage Vite’s optimization features

### Data Fetching

- Use composables like `useFetch` (Nuxt) or libraries like Vue Query
- Handle loading, error, and success states explicitly
- Cancel stale requests on component unmount or param change
- Implement optimistic updates with rollbacks on failure
- Cache responses and use background revalidation

### Error Handling

- Use global error handler (`app.config.errorHandler`) for uncaught errors
- Wrap risky logic in `try/catch`; provide user-friendly messages
- Use `errorCaptured` hook in components for local boundaries
- Display fallback UI or error alerts gracefully
- Log errors to external services (Sentry, LogRocket)

### Forms and Validation

- Use libraries like VeeValidate or @vueuse/form for declarative validation
- Build forms with controlled `v-model` bindings
- Validate on blur or input with debouncing for performance
- Handle file uploads and complex multi-step forms in composables
- Ensure accessible labeling, error announcements, and focus management

### Routing

- Use Vue Router 4 with `createRouter` and `createWebHistory`
- Implement nested routes and route-level code splitting
- Protect routes with navigation guards (`beforeEnter`, `beforeEach`)
- Use `useRoute` and `useRouter` in `setup` for programmatic navigation
- Manage query params and dynamic segments properly
- Implement breadcrumb data via route meta fields

### Testing

- Write unit tests with Vue Test Utils and Vitest
- Focus on behavior, not implementation details
- Use `mount` and `shallowMount` for component isolation
- Mock global plugins (router, Pinia) as needed
- Add end-to-end tests with Playwright
- Test accessibility using axe-core integration

### Security

- Avoid using `v-html`; sanitize any HTML inputs rigorously
- Use CSP headers to mitigate XSS and injection attacks
- Validate and escape data in templates and directives
- Use HTTPS for all API requests
- Store sensitive tokens in HTTP-only cookies, not `localStorage`

### Accessibility

- Use semantic HTML elements and ARIA attributes
- Manage focus for modals and dynamic content
- Provide keyboard navigation for interactive components
- Add meaningful `alt` text for images and icons
- Ensure color contrast meets WCAG AA standards

## Implementation Process

1. Plan component and composable architecture
2. Initialize Vite project with Vue 3 and TypeScript
3. Create core UI components and layout
4. Integrate routing and navigation
5. Implement data fetching and state logic
6. Build forms with validation and error states
7. Add global error handling and fallback UIs
8. Add unit and E2E tests
9. Optimize performance and bundle size
10. Ensure accessibility compliance
11. Document components, composables, and stores

## Additional Guidelines

- Follow Vue’s official style guide (vuejs.org/style-guide)
- Use ESLint (with `plugin:vue/vue3-recommended`) and Prettier for code consistency
- Write meaningful commit messages and maintain clean git history
- Keep dependencies up to date and audit for vulnerabilities
- Document complex logic with JSDoc/TSDoc
- Use Vue DevTools for debugging and profiling

## Common Patterns

- Renderless components and scoped slots for flexible UI
- Compound components using provide/inject
- Custom directives for cross-cutting concerns
- Teleport for modals and overlays
- Plugin system for global utilities (i18n, analytics)
- Composable factories for parameterized logic
