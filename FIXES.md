# Fixes applied

## 1. Authentication was completely non-functional (critical)
`AuthService.login()`/`register()` generated a random token string but never
stored it anywhere. `SecurityConfig` allowed every request through
(`anyRequest().permitAll()`) and had no code that ever read the
`Authorization: Bearer <token>` header the frontend (`static/js/api.js`) sends
on every request. Net effect: `@AuthenticationPrincipal User user` was always
`null` in every controller (Budget, Expense, Income, Savings, User), so
nothing past the login screen actually worked correctly.

Fixed by adding:
- `security/TokenStore.java` — in-memory map of issued token → user email.
- `security/TokenAuthenticationFilter.java` — reads the bearer token on each
  request, resolves it via `TokenStore`, loads the user, and populates the
  Spring Security context.
- `security/SecurityConfig.java` — now requires authentication on `/api/**`
  (except `/api/auth/**`), stateless sessions, and registers the new filter.
- `service/AuthService.java` — issues tokens through `TokenStore` instead of
  a throwaway `UUID.randomUUID()`.

Tokens live in memory, so they reset on app restart (fine at this scale;
swap in JWTs or a persisted store if you need multi-instance/restart-durable
sessions later).

## 2. Creating a savings goal with $0 starting balance failed
`entity/Savings.java` required `currentAmount` to be `@Positive` (> 0), but
the DTO/service correctly allow and even default to `0` when no starting
balance is given. Any goal created without a starting balance (the normal
case) threw a bean-validation error on save. Changed the entity constraint
to `@PositiveOrZero` to match the DTO.

## 3. Default categories were never seeded
`import.sql` only runs automatically under Hibernate's
`ddl-auto: create`/`create-drop`. The app used `ddl-auto: update`, so the
file was silently skipped on every startup — a fresh install had zero
categories, breaking every expense/income/budget category dropdown.
Renamed it to `data.sql`, made every insert idempotent
(`WHERE NOT EXISTS (...)`), and turned on Spring's own SQL init
(`spring.sql.init.mode: always` + `defer-datasource-initialization: true`)
so it reliably runs regardless of `ddl-auto`.

## 4. The app couldn't start without a specific local MySQL setup
`application.yml` pointed at `jdbc:mysql://localhost:3306/...` with a
hardcoded username/password that only work on the original author's machine.
Switched the default profile to a zero-config, file-based H2 database
(the `h2` dependency was already in `pom.xml` but unused) so the app now
runs immediately with no external database required. Data persists in
`./data/` between restarts.

MySQL is still fully supported as an opt-in profile:
```
./mvnw spring-boot:run -Dspring-boot.run.profiles=mysql
```
See `application-mysql.yml` — set `DB_USERNAME`/`DB_PASSWORD` env vars, or
edit the file directly.

## 5. 403s weren't returned in the app's JSON envelope
Added an `AccessDeniedException` handler to `GlobalExceptionHandler` so
authorization failures (e.g. `@PreAuthorize` on `UserController`) return the
same `ApiResponse` JSON shape as every other error, instead of Spring
Security's default plain-text 403. This only matters now that authentication
actually works (see #1) — previously `@PreAuthorize` never had a real
principal to check.

## Known limitation (not changed)
`UserController`'s two `hasRole('ADMIN')` endpoints are unreachable by any
account — `User.getAuthorities()` only ever grants `ROLE_USER`, there's no
admin role anywhere in the app. Not a bug introduced by this pass, just
worth knowing if you plan to use those endpoints — you'd need to add a role
field to `User` and a way to grant it.

## How to run
```
cd "EXPENSE JAVA FULLSTACK PROJECT"
./mvnw spring-boot:run
```
Then open http://localhost:8080 — register an account and everything
(expenses, income, budgets, savings, categories, PDF import) should now work
end to end against the bundled H2 database.
