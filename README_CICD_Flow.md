### How it works in both modes
```
LOCAL RUN:
  npm run test:and:report
  → runs tests
  → reads test-results/results.json
  → sends email with HTML report attached
  → "Run Mode: 💻 Local" in email

CI RUN:
  GitHub Actions triggers automatically
  → runs tests
  → send email step runs (if: always)
  → reads test-results/results.json
  → sends email with link to GitHub Actions run
  → "Run Mode: 🤖 CI / GitHub Actions" in email