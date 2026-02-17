# PeakState - Odkryj Swój Rytm Dobowy

Aplikacja webowa pomagająca studentom odkryć ich indywidualny rytm dobowy i "Biological Prime Time" na podstawie zbieranych danych.

## Funkcjonalności

- **Check-in/Check-out**: Prosty formularz z suwakami (1-10) dla czterech parametrów:
  - Energy (budzenie biologiczne)
  - Focus (głębokie skupienie)
  - Mood (przyjemność z pracy)
  - Result (realny postęp w nauce)

- **Analityka**:
  - Linear Performance Chart: Wykres liniowy pokazujący fluktuacje energii i skupienia w ciągu dnia
  - Heatmapa Tygodniowa: Wizualizacja dni i godzin najwyższej efektywności

- **Insight Engine**: Automatyczne wykrywanie:
  - Złotej Godziny (godzina najwyższej efektywności)
  - Chronotypu (Lwica/Niedźwiedź/Wilk/Delfin)

## Stack Techniczny

- **Frontend**: React + Tailwind CSS + Lucide Icons
- **Wykresy**: Recharts
- **Persystencja**: LocalStorage (Local-first approach)

## Instalacja

```bash
npm install
```

## Uruchomienie

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:5173`

## Build

```bash
npm run build
```

## Design

- Dark Mode z gradientowym tłem
- Glassmorphism (przezroczyste karty)
- Responsywny design (mobile-first)
- Premium minimalistyczny styl

## Prywatność

Wszystkie dane są przechowywane lokalnie w przeglądarce użytkownika. Nie ma potrzeby zakładania konta - aplikacja działa w pełni offline po pierwszym załadowaniu.
