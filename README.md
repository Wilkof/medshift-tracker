# MedShift — Облік медичних змін

Преміальний mobile-first PWA для обліку змін, робочих годин і заробітку медичних працівників.

> 🇺🇦 Повністю українською мовою. Працює як нативний застосунок на iOS та Android. Дані захищені Supabase RLS.

---

## Можливості

- **Dashboard** — кількість змін, годин, заробіток за місяць, найближча зміна, швидкий запис нової зміни, пресети (`⚡` денна / пів-дня / нічна).
- **Календар** — місячний календар із виділенням робочих днів, годин та заробітку по днях.
- **Список змін** — усі зміни з фільтрами за місяцем, пошуком, редагуванням та видаленням.
- **Статистика** — графіки заробітку / годин по місяцях, середнє за зміну та годину, найзавантаженіші дні тижня.
- **Профіль** — реєстрація / вхід (+ скидання паролю), ставка за замовчуванням, валюта, тема (світла / темна / авто), **імпорт з Excel** (`.xlsx`), експорт CSV.
- **PWA** — встановлюваний застосунок з prompt-банером, офлайн-режим (Workbox NetworkFirst для Supabase), іконки 192/512/maskable, iOS splash.

## Технології

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Supabase (Auth + Postgres + RLS + Realtime)
- Recharts (графіки)
- Lucide Icons
- date-fns (локаль uk)
- vite-plugin-pwa (Workbox)

## Автоматичні обчислення

- `hours = end - start` (з урахуванням нічних змін через північ)
- `wage = hours × rate`
- `weekday` — назва дня українською (`Нд`, `Пн`, …, `Сб`)

## База даних

Схема створюється міграцією `init_shifts_schema` у Supabase.

### `shifts`

| Колонка | Тип | Опис |
|---|---|---|
| id | `uuid` PK | ідентифікатор |
| user_id | `uuid` FK → `auth.users` | власник |
| date | `date` | дата зміни |
| weekday | `text` | день тижня (укр.) |
| start_time | `text` | початок (`HH:mm`) |
| end_time | `text` | кінець (`HH:mm`) |
| hours | `numeric(6,2)` | кількість годин |
| rate | `numeric(10,2)` | ставка за годину |
| wage | `numeric(12,2)` | заробіток |
| notes | `text` | нотатка |
| created_at | `timestamptz` | створено |
| updated_at | `timestamptz` | оновлено |

Унікальний індекс `(user_id, date)` запобігає дублюванню.

### `profiles`

| Колонка | Тип | Опис |
|---|---|---|
| id | `uuid` PK ↔ `auth.users` | |
| full_name | `text` | |
| default_rate | `numeric(10,2)` | ставка за замовчуванням (33) |
| currency | `text` | `PLN`, `UAH`, `EUR`, … |
| theme | `text` | `light` / `dark` / `system` |

Запис автоматично створюється тригером `on_auth_user_created`.

### Row Level Security

Обидві таблиці мають RLS увімкненим. Користувач бачить/змінює лише **власні** записи:

```sql
create policy "shifts_select_own" on public.shifts
  for select using (auth.uid() = user_id);
-- аналогічно insert/update/delete та для profiles
```

## Локальний запуск

```bash
npm install --legacy-peer-deps
cp .env.example .env.local      # заповнити ключами Supabase
npm run dev
```

## Production build

```bash
npm run build         # tsc -b && vite build
npm run preview
```

## Структура

```
src/
  components/        Reusable UI (BottomNav, ShiftForm, Modal, StatCard, AppLayout)
  contexts/          AuthContext, ThemeContext
  hooks/             useShifts, useProfile
  lib/               supabase client, types, utils (time/weekday/csv)
  pages/             Dashboard, Calendar, Shifts, Analytics, Profile, Login
  App.tsx            Router + protected routes
  main.tsx           Entry point
public/icons/        PWA icons (192/512/maskable) + favicon + apple-touch
netlify.toml         Build + SPA redirect + cache headers
vite.config.ts       PWA + Tailwind + chunking
```

## Deploy (Netlify)

Застосунок уже задеплоєно: **https://medshift-tracker-419.netlify.app**.

### Налаштувати auto-deploy з GitHub

1. Відкрити [app.netlify.com/projects/medshift-tracker-419](https://app.netlify.com/projects/medshift-tracker-419).
2. **Site configuration → Build & deploy → Continuous deployment → Link repository**.
3. Обрати **GitHub** → авторизувати Netlify GitHub App → обрати `Wilkof/medshift-tracker`.
4. Branch: `main`. Build command і publish dir читатимуться з `netlify.toml`.
5. Environment variables уже налаштовані (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
6. Кожен `git push` у `main` тепер автоматично деплоїться.

### Ручний deploy з CLI

```bash
netlify deploy --build --prod
```

SPA fallback, security та cache headers налаштовані у `netlify.toml`.

## PWA

- `manifest.webmanifest` з іконками 192/512 + maskable, `display: standalone`, `lang: uk`.
- Service Worker (Workbox): precache `html/js/css/img`, NetworkFirst для Supabase API (офлайн-кеш на 24 год).
- Installable на iOS / Android; splash screen формується автоматично з іконки + theme color.

## Ліцензія

MIT © 2026 MedShift
