# Інструкція: Як зберегти проєкт в GitHub

## Крок 1: Ініціалізуйте Git репозиторій

Відкрийте термінал у папці проєкту та виконайте:

```bash
cd /Users/viacheslav.miekh/Desktop/feedback-copilot
git init
```

## Крок 2: Додайте файли

```bash
git add .
```

## Крок 3: Зробіть перший commit

```bash
git commit -m "Initial commit: Feedback Co-Pilot"
```

## Крок 4: Створіть репозиторій на GitHub

1. Відкрийте https://github.com
2. Натисніть "+" у верхньому правому куті
3. Виберіть "New repository"
4. Назва: `feedback-copilot`
5. Оберіть Public або Private
6. НЕ додавайте README, .gitignore або license (вони вже є)
7. Натисніть "Create repository"

## Крок 5: Підключіть локальний репозиторій до GitHub

Після створення репозиторію GitHub покаже інструкції. Виконайте:

```bash
git remote add origin https://github.com/YOUR_USERNAME/feedback-copilot.git
git branch -M main
git push -u origin main
```

Замініть `YOUR_USERNAME` на ваш GitHub username.

## Альтернатива: Використання GitHub CLI

Якщо у вас встановлено `gh`:

```bash
gh repo create feedback-copilot --public --source=. --remote=origin --push
```

## Важливо!

Файл `.env` з вашим API ключем НЕ буде завантажено в GitHub (він в `.gitignore`).
Тільки `.env.example` буде в репозиторії.


