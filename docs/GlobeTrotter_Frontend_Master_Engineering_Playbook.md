# GlobeTrotter Frontend — Master Engineering & Code-Ownership Playbook

> **Audience:** GlobeTrotter frontend team  
> **Purpose:** This document is the frontend team's single source of truth for code organization, file ownership, documentation, UI quality, accessibility, testing, Git discipline, and maintainability.
>
> **Important:** This document intentionally focuses on the **frontend only**. Backend architecture, API design, database design, RLS, authentication implementation, rate limiting, server infrastructure, and other backend-specific engineering details are outside this document.

---

# 1. The Most Important Rule

## Every file must explain itself.

This is a **mandatory project-wide frontend rule**.

Every source file — even a file containing only 10–20 lines — must begin with a clear documentation comment explaining:

1. **What this file is**
2. **What responsibility it has**
3. **Why the file exists**
4. **What part of the application uses it**
5. **What it must NOT be responsible for**, when that boundary is important
6. **Important dependencies or relationships**, when relevant

The purpose is simple:

> Any team member should be able to open any frontend file and understand its purpose within a few seconds, even if they did not write it.

This is not optional documentation.

It is part of the definition of done.

---

# 2. File Header Documentation — Mandatory

Every frontend source file must have a documentation block at the top.

### TypeScript / TSX example

```tsx
/**
 * TripCard
 *
 * Purpose:
 * Displays a compact summary of one user trip in the trip list.
 *
 * Responsibility:
 * - Shows trip title, dates, destination count, and status.
 * - Provides navigation actions for viewing and editing the trip.
 *
 * Why this file exists:
 * Keeps trip-card presentation logic isolated from the trip list,
 * page-level orchestration, and data-fetching logic.
 *
 * Used by:
 * - features/trips/components/TripList.tsx
 *
 * Important boundary:
 * This component does not fetch trip data or perform database/API operations.
 * It receives already-prepared data through props.
 */
```

### Utility example

```ts
/**
 * formatTripDate
 *
 * Purpose:
 * Converts an application date value into the standard human-readable
 * date format used throughout the GlobeTrotter frontend.
 *
 * Why this file/function exists:
 * Centralizes date presentation so different screens do not implement
 * slightly different formatting rules.
 *
 * Used by:
 * - TripCard
 * - ItineraryHeader
 * - DashboardTripCard
 *
 * Important boundary:
 * This function formats data only. It does not modify dates or perform
 * business calculations.
 */
```

### Hook example

```ts
/**
 * useTrips
 *
 * Purpose:
 * Provides the frontend with the current user's trip collection and
 * exposes the UI actions required to refresh or mutate that collection.
 *
 * Why this file exists:
 * Keeps trip-related client state and request orchestration separate
 * from visual components.
 *
 * Used by:
 * - MyTripsPage
 * - Dashboard
 *
 * Important boundary:
 * Components should consume this hook rather than duplicating the same
 * trip-loading logic.
 */
```

---

# 3. No File Without a Purpose

Before creating a file, answer:

```text
Why does this file need to exist?
What responsibility belongs here?
Why does this responsibility not belong in an existing file?
Which feature owns it?
Who will use it?
```

If the answer is unclear, do not create the file.

---

# 4. Do Not Create "Mystery Files"

Avoid names such as:

```text
helpers.ts
misc.ts
stuff.ts
common.ts
temp.ts
new.ts
test2.ts
final.ts
utils2.ts
```

unless the name describes a genuinely well-defined shared responsibility.

Prefer:

```text
formatTripDate.ts
validateTripDates.ts
TripCard.tsx
TripList.tsx
useTripFilters.ts
itineraryConstants.ts
```

The filename should already communicate what the file contains.

---

# 5. The File Documentation Standard

Every file header should answer the following:

| Question | Must be answered? |
|---|---|
| What is this file? | Yes |
| Why does it exist? | Yes |
| What does it own? | Yes |
| Who uses it? | When useful |
| What does it not own? | When boundaries matter |
| Important dependencies? | When useful |
| Special design decision? | When useful |

Do not write meaningless comments such as:

```ts
// This is a component.
```

That explains almost nothing.

Write:

```ts
/**
 * TripBudgetSummary
 *
 * Purpose:
 * Presents the calculated budget summary for the currently selected trip.
 *
 * Responsibility:
 * - Displays total estimated cost.
 * - Displays category breakdown.
 * - Displays average daily cost.
 * - Displays the over-budget warning when supplied by the parent state.
 *
 * Boundary:
 * This component is presentation-only. It does not calculate expenses
 * or fetch budget data.
 */
```

---

# 6. The Header Must Explain WHY, Not Just WHAT

Bad:

```ts
// Displays trip card.
```

Good:

```ts
/**
 * TripCard
 *
 * Displays a reusable summary of a trip.
 *
 * This component exists so dashboard and My Trips screens can present
 * trips consistently without duplicating card markup.
 *
 * Data is provided through props; this component intentionally does not
 * fetch or mutate trip data.
 */
```

The most valuable documentation explains **why the code is structured this way**.

---

# 7. Do Not Over-Comment Obvious Code

We want meaningful documentation, not hundreds of useless comments.

Bad:

```ts
const name = user.name; // Get user's name
```

Do not comment every obvious line.

Instead, document:

- file purpose
- architectural boundaries
- non-obvious decisions
- complex transformations
- accessibility decisions
- unusual workarounds
- important assumptions

---

# 8. Frontend Architecture

The frontend should be organized by product features.

Recommended:

```text
apps/web/
└── src/
    ├── app/
    ├── components/
    ├── features/
    │   ├── auth/
    │   ├── dashboard/
    │   ├── trips/
    │   ├── destinations/
    │   ├── activities/
    │   ├── itinerary/
    │   ├── budget/
    │   ├── sharing/
    │   ├── community/
    │   └── profile/
    ├── hooks/
    ├── lib/
    ├── styles/
    ├── types/
    └── config/
```

The exact framework-specific names can change, but the ownership principle must remain.

---

# 9. Feature-First Organization

A feature should contain the frontend code primarily responsible for that feature.

Example:

```text
features/trips/
├── components/
├── hooks/
├── pages/
├── api.ts
├── schemas.ts
├── types.ts
├── constants.ts
└── index.ts
```

This makes it possible for a developer to understand:

> "Everything related to trips is here."

---

# 10. Recommended Frontend Folder Responsibilities

## `app/`

Contains application-level routing/layout entry points.

It should not become a dumping ground for feature logic.

---

## `components/`

Contains genuinely reusable UI components.

Examples:

```text
Button
Modal
Input
Select
DatePicker
Card
EmptyState
LoadingSpinner
ErrorState
```

A component belongs here only when it is genuinely reusable across multiple features.

---

## `features/`

Contains feature-specific UI and client-side logic.

Examples:

```text
features/trips/
features/itinerary/
features/budget/
```

---

## `hooks/`

Contains truly shared hooks.

If a hook belongs only to trips, keep it inside:

```text
features/trips/hooks/
```

Do not put every hook into the global hooks directory.

---

## `lib/`

Contains carefully selected shared infrastructure such as:

```text
date utilities
formatters
client configuration
storage helpers
accessibility helpers
```

Do not put feature-specific business logic here.

---

## `types/`

Only use a global type folder for types genuinely shared across multiple features.

Feature-specific types should live with the feature.

---

## `config/`

Contains frontend configuration and static application configuration.

Do not put secrets here.

---

# 11. Avoid a Giant `components` Folder

Do not put everything into:

```text
components/
```

Example of bad organization:

```text
components/
├── TripCard.tsx
├── TripModal.tsx
├── ActivityCard.tsx
├── ActivityModal.tsx
├── BudgetChart.tsx
├── LoginForm.tsx
├── ProfileForm.tsx
├── Calendar.tsx
├── ...
```

If most components belong to specific features, organize them there:

```text
features/
├── trips/components/
├── activities/components/
├── budget/components/
├── auth/components/
└── profile/components/
```

---

# 12. Shared Components Must Actually Be Shared

Do not create a shared component just because it sounds architecturally clean.

A component belongs in shared components when:

- multiple features use it
- its behavior is generic
- it does not contain feature-specific assumptions

Example:

```text
Button
Modal
TextInput
```

belongs in shared components.

But:

```text
TripBudgetAlert
```

belongs under the budget feature.

---

# 13. Page Components Should Orchestrate, Not Become God Files

A page should coordinate:

```text
layout
data/state consumption
feature components
navigation
page-level loading/error states
```

A page should not contain:

- hundreds of lines of JSX
- duplicated business rules
- giant event handlers
- repeated validation logic
- unrelated UI components
- unrelated feature logic

If a page becomes difficult to understand, split it.

---

# 14. Component Size Rule

There is no magical line limit, but use this guideline:

```text
<100 lines     Usually comfortable
100–150        Review whether splitting improves clarity
150–200        Strong reason should exist
>200           Investigate and normally split
```

Do not split a component into meaningless one-line files merely to satisfy a number.

The goal is clarity.

---

# 15. One Component, One Main Responsibility

Bad:

```text
TripPage
 ├── fetches data
 ├── validates forms
 ├── calculates budget
 ├── renders calendar
 ├── renders activity cards
 ├── handles sharing
 ├── handles profile
 └── renders 500 lines of JSX
```

Better:

```text
TripPage
 ├── TripHeader
 ├── TripSummary
 ├── ItineraryPreview
 ├── BudgetSummary
 └── ShareTripButton
```

Each component has a clear responsibility.

---

# 16. Component Documentation

Every non-trivial component should document:

```text
Purpose
Props
State responsibilities
Important accessibility behavior
Important boundaries
```

Example:

```tsx
/**
 * ActivityCard
 *
 * Purpose:
 * Displays one discoverable activity and exposes the action to add it
 * to the current itinerary.
 *
 * Responsibility:
 * - Present activity information.
 * - Show cost and duration.
 * - Provide accessible add/remove controls.
 *
 * Boundary:
 * The component does not decide whether an activity belongs to a trip.
 * It delegates that action to the supplied callback.
 */
```

---

# 17. Props Must Be Explicit

Avoid vague props:

```ts
data
item
thing
value
```

when a more meaningful type is possible.

Prefer:

```ts
trip
activity
destination
isLoading
onSelect
onDelete
```

Good names make code self-documenting.

---

# 18. Avoid `any`

Do not use:

```ts
any
```

to silence a type error.

If data is unknown:

```text
unknown
 ↓
validate
 ↓
typed value
```

Do not simply cast it.

Bad:

```ts
const trip = response as Trip;
```

Better:

```text
unknown response
    ↓
schema validation
    ↓
Trip
```

---

# 19. Types Belong Close to Their Domain

If only trips use:

```text
Trip
TripSummary
TripStatus
```

keep those types with the trip feature.

If multiple features genuinely share:

```text
User
Currency
Pagination
```

they may belong in a shared type package/folder.

---

# 20. Naming Rules

Use names that communicate intent.

Good:

```text
TripCard
TripList
TripDetails
TripBudgetSummary
useTrip
useTripFilters
formatTripDate
validateTripForm
```

Bad:

```text
Box1
Card2
Thing
Handler
Manager
Helper
Common
Data
Temp
```

---

# 21. Hooks

Hooks should have one clear purpose.

Good:

```text
useTrips
useTrip
useTripFilters
useItinerary
useBudgetSummary
```

Avoid a giant:

```text
useAppEverything()
```

that manages the entire application.

---

# 22. Hook Documentation

Every non-trivial hook should explain:

```text
Purpose
State it owns
What it returns
When it should be used
Important side effects
```

Example:

```ts
/**
 * useTrip
 *
 * Purpose:
 * Provides the selected trip and its UI-facing state to trip screens.
 *
 * Used by:
 * TripDetailsPage and ItineraryPage.
 *
 * Important:
 * Components should use this hook instead of duplicating trip-loading
 * and refresh behavior.
 */
```

---

# 23. Do Not Hide Side Effects

A hook that:

- fetches data
- writes local storage
- triggers navigation
- changes global state

should make that behavior clear.

Do not create a hook whose name suggests a simple calculation while secretly performing network or navigation side effects.

---

# 24. Forms

Every form must have:

- clear labels
- validation
- error messages
- loading state
- disabled state during submission when appropriate
- accessible focus behavior
- success feedback
- failure feedback

---

# 25. Frontend Validation

Validate at the UI boundary for user experience.

Examples:

```text
required trip name
valid dates
end date >= start date
valid email
valid numeric budget
non-negative expense
```

But remember:

> Frontend validation improves UX. It is not a security boundary.

The frontend should still behave correctly when a request fails.

---

# 26. Form Error Design

Bad:

```text
Invalid input.
```

Better:

```text
End date must be on or after the start date.
```

Errors should explain:

```text
what went wrong
how to fix it
```

when possible.

---

# 27. Loading States

Every asynchronous UI operation needs a deliberate loading state.

Examples:

```text
Loading trips...
Searching destinations...
Adding activity...
Saving itinerary...
Generating share link...
```

Avoid blank screens.

---

# 28. Empty States

Every collection needs an intentional empty state.

Example:

```text
No trips yet.

Start planning your first journey.

[Plan New Trip]
```

An empty state should help the user take the next action.

---

# 29. Error States

Every important data-driven page needs an error state.

Example:

```text
We couldn't load your trips.

[Try Again]
```

Do not simply render an empty page when data loading fails.

---

# 30. Success Feedback

After important actions, provide clear feedback.

Examples:

```text
Trip created successfully.
Activity added to Day 2.
Trip link copied.
Changes saved.
```

Use accessible announcements where appropriate.

---

# 31. Accessibility Is Mandatory

Accessibility is not a final polish step.

Every frontend developer is responsible for it.

Use:

- semantic HTML
- proper labels
- keyboard navigation
- visible focus
- sufficient contrast
- meaningful alt text
- accessible dialogs
- accessible menus
- reduced-motion support
- correct heading hierarchy
- appropriate ARIA

---

# 32. Semantic HTML

Prefer:

```html
<header>
<nav>
<main>
<section>
<article>
<footer>
<button>
<form>
<label>
```

over building the entire application from generic `<div>` elements.

---

# 33. Buttons vs Links

Use:

```html
<button>
```

for actions.

Use:

```html
<a>
```

for navigation.

Do not use:

```html
<div onClick={...}>
```

as a fake button.

---

# 34. Keyboard Accessibility

Every interactive element must be usable with a keyboard.

Check:

```text
Tab
Shift+Tab
Enter
Space
Escape
Arrow keys where appropriate
```

Focus must remain visible.

---

# 35. Focus Management

When opening a modal:

```text
focus moves into modal
```

When closing:

```text
focus returns to triggering element
```

Do not leave keyboard users lost in the page.

---

# 36. Images

Every meaningful image requires useful alt text.

Decorative images should be treated as decorative.

Bad:

```html
<img alt="image" />
```

Good:

```html
<img alt="Eiffel Tower at sunset" />
```

---

# 37. Color

Do not communicate information through color alone.

Bad:

```text
red = over budget
green = under budget
```

without any text/icon/status.

Better:

```text
⚠ Over budget by ₹5,000
```

with color as additional information.

---

# 38. Reduced Motion

Respect:

```text
prefers-reduced-motion
```

Animations should never make the application unusable.

---

# 39. Responsive Design

Every core screen must be tested at:

```text
mobile
tablet
desktop
```

Test actual layouts rather than assuming CSS responsiveness is sufficient.

---

# 40. Design System

Use consistent:

```text
colors
typography
spacing
border radius
shadows
buttons
inputs
cards
dialogs
navigation
```

Do not let each developer create a different visual language.

---

# 41. Do Not Hardcode Random Styling

Avoid dozens of slightly different values:

```text
17px
19px
21px
23px
```

when the design system could use a spacing scale.

Consistency is more important than individual creativity.

---

# 42. State Management

Do not maintain multiple conflicting sources of truth.

For example:

```text
itineraryState
calendarState
budgetState
tripState
```

should not independently represent the same underlying data in ways that can diverge.

Prefer:

```text
source state
   ↓
derived views
```

---

# 43. Derived Data

If the total budget can be calculated from current expenses, do not maintain a second manually edited total in UI state unless there is a strong reason.

The frontend should avoid stale duplicated state.

---

# 44. URL State

Use URL state where it improves navigation/shareability.

Examples:

```text
/trips/123
/trips/123?view=calendar
/discover?country=France
```

Do not store navigation-critical state only in an opaque component variable.

---

# 45. Local Storage

Use local storage intentionally.

Good uses may include:

```text
UI preferences
dismissed hints
non-sensitive draft state
```

Do not store sensitive credentials or secrets in local storage.

---

# 46. API Client Boundary

Even though backend details are outside this document, the frontend should have one clean client boundary for communicating with application services.

Avoid scattering raw request logic everywhere:

```text
TripPage → fetch()
TripCard → fetch()
Dashboard → fetch()
Modal → fetch()
```

Instead, centralize feature-specific request functions:

```text
features/trips/api.ts
features/activities/api.ts
features/destinations/api.ts
```

This makes frontend code easier to test and maintain.

---

# 47. API Client Documentation

Every feature API file should have a header explaining:

```text
Purpose
Feature ownership
Available operations
Expected data shape
Important error behavior
```

Example:

```ts
/**
 * Trips API client
 *
 * Purpose:
 * Contains frontend request functions used by the trips feature.
 *
 * Responsibility:
 * - Load the user's trips.
 * - Load an individual trip.
 * - Create, update, and delete trips.
 *
 * Boundary:
 * This file contains request orchestration only.
 * UI rendering belongs to components and business presentation rules
 * belong to feature-level logic.
 */
```

---

# 48. No Raw Requests in UI Components

Avoid:

```tsx
const response = await fetch(...);
```

inside a large visual component.

Move request orchestration into the feature's API/client layer or appropriate hook.

The component should focus on presentation and user interaction.

---

# 49. Error Mapping

The frontend should translate technical failures into useful user-facing messages.

Do not show raw:

```text
500 Internal Server Error
```

to users.

Show:

```text
We couldn't save your trip. Please try again.
```

while retaining enough technical information for development logs/debugging.

---

# 50. Route Organization

Routes should reflect product concepts.

Examples:

```text
/login
/signup
/dashboard
/trips
/trips/new
/trips/:tripId
/trips/:tripId/itinerary
/trips/:tripId/budget
/trips/:tripId/calendar
/discover
/community
/profile
```

Avoid meaningless routes.

---

# 51. Navigation

Navigation should be consistent across the application.

Users should always know:

```text
Where am I?
Where can I go?
How do I return?
What is the primary action?
```

---

# 52. Primary Actions

Every screen should have a clear primary action.

Examples:

```text
Dashboard → Plan New Trip
My Trips → Plan New Trip
Create Trip → Create Trip
City Search → Add to Trip
Itinerary → Add Activity
Budget → Add Expense
```

Do not make five buttons look equally important.

---

# 53. Trip Flow

The core frontend journey should feel continuous:

```text
Create Trip
   ↓
Choose Cities
   ↓
Choose Activities
   ↓
Build Itinerary
   ↓
Review
   ↓
Budget
   ↓
Calendar
   ↓
Share
```

Do not make users repeatedly navigate through unrelated screens to complete one task.

---

# 54. Itinerary UI

The itinerary should communicate:

```text
City
Date
Day
Time
Activity
Duration
Cost
Order
```

Clearly.

A user should understand their entire trip at a glance.

---

# 55. Calendar UI

Calendar is another representation of itinerary data.

Do not create an entirely separate mental model.

The same itinerary should be visible as:

```text
List
Timeline
Calendar
```

without contradictory information.

---

# 56. Budget UI

Budget should clearly show:

```text
Total
Transport
Stay
Food
Activities
Other
Average per day
Over-budget status
```

Charts should support understanding, not replace readable numbers.

---

# 57. Public Trip UI

The public trip view should be read-only by default.

It should clearly communicate:

```text
Trip name
Dates
Cities
Itinerary
Relevant public cost information
```

and provide:

```text
Copy Trip
```

where appropriate.

---

# 58. Community UI

If community is implemented, keep it focused.

Users should be able to:

```text
discover public trips
search
open a trip
copy a trip
```

Do not add a complete social network unless the core product is already excellent.

---

# 59. Profile UI

Profile/settings should remain simple.

Possible areas:

```text
Personal information
Language preference
Saved destinations
Account actions
```

Do not bury important account actions in complicated navigation.

---

# 60. Testing Frontend Components

Important components should have tests for:

```text
normal rendering
empty state
loading state
error state
user interaction
keyboard behavior
accessibility
```

---

# 61. Testing Forms

Test:

```text
valid submission
required fields
invalid values
date relationships
disabled submission
loading state
server failure
success feedback
```

---

# 62. Testing User Journeys

Critical E2E journey:

```text
Login
 ↓
Dashboard
 ↓
Create Trip
 ↓
Add City
 ↓
Add Activity
 ↓
Build Itinerary
 ↓
View Budget
 ↓
View Calendar
 ↓
Share
 ↓
Open Public Trip
 ↓
Copy Trip
```

This is more valuable than hundreds of shallow tests.

---

# 63. Accessibility Testing

Use automated accessibility checks such as axe-core where available.

Also manually test:

```text
keyboard
focus
forms
dialogs
navigation
mobile
contrast
```

Do not rely on one automated scan alone.

---

# 64. Coverage

Coverage should be measured and enforced for important frontend code.

A strong target is:

```text
95%+
```

for appropriate application code.

Do not write meaningless tests merely to increase a percentage.

---

# 65. Mutation Testing

Where practical, use mutation testing to determine whether tests actually detect incorrect behavior.

The goal is not:

```text
100% coverage screenshot
```

The goal is:

```text
tests that catch real regressions
```

---

# 66. Mocking

Frontend tests should not depend on real external services unnecessarily.

Mock request responses and test:

```text
success
failure
empty
slow/loading
invalid data
```

This makes tests:

- fast
- deterministic
- repeatable

---

# 67. No Flaky Tests

Do not merge tests that randomly fail.

Avoid unnecessary:

```text
setTimeout
sleep
```

in tests.

Prefer deterministic conditions and proper waiting for UI state.

---

# 68. Git Branching

Everyone contributes through Git.

Recommended:

```text
main
develop

feature/auth-ui
feature/dashboard
feature/trips-ui
feature/discovery-ui
feature/itinerary-ui
feature/budget-ui
feature/calendar-ui
feature/sharing-ui
feature/profile-ui
```

Do not commit directly to `main` unless the team has an explicit emergency procedure.

---

# 69. Pull Requests

Every PR should explain:

```text
What changed?
Why?
How was it tested?
Which feature does it affect?
Any UI/accessibility considerations?
Any screenshots required?
```

Keep PRs focused.

---

# 70. Code Review

Review:

```text
[ ] File has a useful header
[ ] File has one clear responsibility
[ ] Naming is clear
[ ] No unnecessary duplication
[ ] No giant component
[ ] No unnecessary global state
[ ] No unsafe type casts
[ ] Loading state exists
[ ] Error state exists
[ ] Empty state exists
[ ] Accessibility considered
[ ] Responsive behavior considered
[ ] Tests included
[ ] Documentation updated
```

---

# 71. Commit Convention

Use conventional commits.

Examples:

```text
feat: add trip creation interface
feat: add destination search UI
feat: add itinerary timeline
fix: correct mobile trip card layout
fix: improve keyboard navigation in trip modal
refactor: split itinerary page into feature components
test: add trip form validation tests
docs: document itinerary component structure
style: standardize button spacing
```

Avoid:

```text
update
final
final2
latest
changes
new
```

---

# 72. No Unrelated Refactoring in Feature PRs

If you are implementing:

```text
trip creation
```

do not also rewrite:

```text
navigation
dashboard
profile
entire design system
```

unless the change is genuinely required.

Small focused PRs are easier to review and safer to merge.

---

# 73. Generated Code Rule

AI coding assistants are allowed.

Blind copy-paste is not.

Before accepting generated code, the author must understand:

```text
What does it do?
Why is it structured this way?
What assumptions exist?
What can fail?
How is it tested?
Does it fit our architecture?
Is it accessible?
```

If you cannot explain the code, do not merge it.

---

# 74. File Ownership

Every feature should have a clear owner during development.

Example:

```text
Auth UI          → Developer A
Dashboard        → Developer B
Trips            → Developer C
Itinerary        → Developer D
Budget/Calendar  → Developer E
```

Ownership does NOT mean nobody else can edit the files.

It means:

> There is a person responsible for maintaining understanding and quality.

---

# 75. Knowledge Sharing Rule

No developer should be the only person who understands a critical part of the frontend.

At least one other teammate should be able to explain each major feature.

The file-header rule helps with this.

---

# 76. File Documentation Review

Before merging any new frontend file, ask:

> "If I give this file to another teammate who has never seen it, can they understand why it exists without opening ten other files?"

If the answer is no:

**Improve the header.**

---

# 77. Documentation Should Survive Refactoring

When a file changes responsibility, update its header.

Example:

Before:

```text
TripCard displays a trip.
```

After the file gains navigation and state responsibilities:

```text
TripCard handles presentation and navigation actions.
```

The documentation must evolve with the code.

---

# 78. Do Not Leave Stale Comments

This is worse than having no comment.

Bad:

```ts
/**
 * Displays the login form.
 */
```

when the file now handles registration, password reset, and account recovery.

Update it.

---

# 79. TODO Rules

Do not leave random:

```text
TODO
FIXME
later
temporary
```

throughout the project.

If a TODO is necessary, write:

```text
TODO:
What needs to happen
Why it is deferred
Who owns it
```

and create a tracked issue/task where appropriate.

---

# 80. Temporary Code

Temporary code must be clearly marked.

Never allow:

```text
temporary demo code
```

to silently become production architecture.

If a shortcut is intentional for the hackathon, document it.

---

# 81. Final Frontend Definition of Done

A frontend feature is complete only when:

```text
[ ] Correct UI
[ ] Correct responsive behavior
[ ] Correct navigation
[ ] Correct loading state
[ ] Correct empty state
[ ] Correct error state
[ ] Correct validation
[ ] Accessible interaction
[ ] Keyboard usable
[ ] Mobile tested
[ ] Desktop tested
[ ] Types are strict
[ ] No unnecessary any
[ ] Tests added
[ ] E2E updated where appropriate
[ ] File documentation header present
[ ] Component documentation present where needed
[ ] No stale comments
[ ] No debug logs
[ ] No temporary code without explanation
[ ] Lint passes
[ ] Typecheck passes
[ ] Build passes
[ ] PR reviewed
```

---

# 82. Final Release Checklist — Frontend

```text
[ ] Every major screen works
[ ] Login/signup UI works
[ ] Dashboard works
[ ] Create Trip works
[ ] My Trips works
[ ] City discovery works
[ ] Activity discovery works
[ ] Itinerary builder works
[ ] Itinerary view works
[ ] Budget screen works
[ ] Calendar/timeline works
[ ] Public trip view works
[ ] Copy Trip flow works
[ ] Profile/settings works
[ ] Community works if included
[ ] Responsive mobile layout verified
[ ] Responsive tablet layout verified
[ ] Desktop layout verified
[ ] Keyboard navigation verified
[ ] Accessibility scan completed
[ ] E2E critical journey passes
[ ] Loading states verified
[ ] Empty states verified
[ ] Error states verified
[ ] No console errors
[ ] No broken images
[ ] No dead links
[ ] No placeholder text
[ ] No accidental debug UI
[ ] Documentation headers complete
[ ] README/screenshots updated where appropriate
```

---

# 83. The Frontend Standard

We are not targeting:

> "The page looks good."

We are targeting:

> **"The page is understandable, consistent, responsive, accessible, testable, maintainable, and clearly connected to the product flow."**

A beautiful interface with poor engineering is not enough.

A technically clean interface that is confusing to users is also not enough.

We need both.

---

# 84. The One Rule Every Frontend Developer Must Remember

Before creating or modifying any file, ask:

```text
What is this file responsible for?
Why does it exist?
Who uses it?
What should NOT be inside it?
Can another teammate understand it?
How will I test it?
How will a keyboard user interact with it?
What happens when it loads?
What happens when it is empty?
What happens when it fails?
```

Then write the code.

---

# 85. Final Team Principle

The frontend should feel like one product, not five developers' separate work.

That means:

```text
One design language
One component philosophy
One naming standard
One documentation standard
One accessibility standard
One testing standard
One Git workflow
One definition of done
```

The most important requirement is not that every developer writes code the same way.

It is that **every developer can understand every important part of the application**.

---

# 86. Mandatory File Header Template

Copy this template whenever creating a new frontend source file:

```ts
/**
 * <FILE / COMPONENT NAME>
 *
 * Purpose:
 * <What this file provides.>
 *
 * Responsibility:
 * - <Responsibility 1>
 * - <Responsibility 2>
 * - <Responsibility 3>
 *
 * Why this file exists:
 * <Why this responsibility is separated into this file.>
 *
 * Used by:
 * - <Relevant feature/page/component, when useful>
 *
 * Important boundary:
 * <What this file intentionally does not handle, when useful.>
 *
 * Notes:
 * <Important design/accessibility/technical consideration, if applicable.>
 */
```

For a simple file, this can be shorter:

```ts
/**
 * Date formatting utilities for the GlobeTrotter frontend.
 *
 * Centralizes presentation formatting so trip, itinerary, and dashboard
 * screens use the same date representation.
 */
```

Even a 20-line file must have a useful explanation.

---

# 87. Mandatory Component Header Template

```tsx
/**
 * <ComponentName>
 *
 * Purpose:
 * <What the component displays or enables.>
 *
 * Responsibility:
 * - <What it owns>
 * - <What it displays>
 * - <What interactions it exposes>
 *
 * Boundary:
 * <What it intentionally does not own.>
 *
 * Accessibility:
 * <Important keyboard, focus, semantic, or ARIA behavior.>
 */
```

---

# 88. Mandatory Hook Header Template

```ts
/**
 * <hookName>
 *
 * Purpose:
 * <What state/behavior the hook provides.>
 *
 * Responsibility:
 * - <State>
 * - <Actions>
 * - <Derived values>
 *
 * Used by:
 * - <Relevant screens/components>
 *
 * Side effects:
 * <Network/storage/navigation effects, if any.>
 */
```

---

# 89. Mandatory Utility Header Template

```ts
/**
 * <utilityName>
 *
 * Purpose:
 * <What transformation/calculation this utility performs.>
 *
 * Why it exists:
 * <Why this logic is centralized.>
 *
 * Input:
 * <Input expectations.>
 *
 * Output:
 * <Output expectations.>
 *
 * Important:
 * <Boundary or assumption, if applicable.>
 */
```

---

# 90. Mandatory Review Question

Every PR reviewer should ask:

> **"If this developer leaves the team tomorrow, can another developer understand this code without asking them what it does?"**

If not, improve:

- naming
- structure
- file headers
- component boundaries
- tests
- documentation

before merging.

---

# 91. Closing Rule

## Write code for the next developer, not only for the compiler.

The compiler needs valid code.

The user needs a good interface.

But the team needs code that remains understandable after:

- one week
- one month
- the hackathon
- a refactor
- a bug fix
- a new teammate joining

Every file should tell its own story.

**Small files. Clear responsibilities. Strong documentation. Consistent UI. Accessible interactions. Tested behavior. No mystery code.**

That is the frontend engineering standard for GlobeTrotter.

# END
