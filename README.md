# C - 212 Arcade Suite

Welcome to the **C - 212 Arcade Suite**, a premium collection of responsive card games, match scorekeepers, and web tools. 

Designed for visual excellence, responsiveness on both desktop and mobile, and seamless offline data persistence.

---

## Author & Copyright

* **Created By:** Harsh Patel
* **Copyright:** &copy; 2026 Harsh Patel. All Rights Reserved.

---

## Projects Included

### 1. C - 212 Card Arena (`/Patta 67`)
An interactive, high-fidelity scorecard for card game matches.

* **Score Matrix:** Log player scores dynamically round-by-round.
* **Auto-sorting Leaderboard:** Tracks totals and updates rankings instantly, highlighting the leader with a cyber gold crown badge.
* **Round Metadata Tracking:** Log additional round details:
  - **Guesser:** Note who made the guess for the round.
  - **Biding of:** Record the cards bid for the round.
  - **Score:** Note specific score points.
  - **Partners 1–4:** Add up to 4 partner names and notes.
  - **Sir:** Record the trump card or sir details.
* **Persistent Cache:** Synchronizes state automatically with `localStorage` to survive refreshes.

### 2. Coming Soon Slot (`/Project Slot II`)
Future templates and game cards will occupy this area of the suite.

---

## Tech Stack

* **Structure:** Semantic HTML5
* **Design & Theme:** Vanilla CSS3 (CSS Variables, Flexbox, CSS Grid, Glassmorphism, animations)
* **Logic:** ES6+ JavaScript (Modular State Management, Local Storage persistence, real-time recalculations)

---

## How to Run Locally

You can serve this repository locally using a simple HTTP server. Open your terminal in the root folder and run:

```bash
# Using Python:
python -m http.server 8000

# Using Node (npx):
npx http-server -p 8000
```
Then open your browser to `http://localhost:8000/`.

---

## Deployment on GitHub Pages

The portal page is set up in the root directory. To publish it to GitHub Pages:
1. Push this repository to GitHub.
2. In your repository settings, navigate to **Pages** under the **Code and automation** section.
3. Set the source branch to **`main`** and directory to **`/ (root)`**, then click **Save**.
4. The hub is hosted at `https://Harsh97120.github.io/Games/`.