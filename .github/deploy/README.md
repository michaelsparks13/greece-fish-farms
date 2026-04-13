# Deployment setup — one-time

This directory holds a GitHub Actions workflow that builds and deploys the
Next.js static export to GitHub Pages. The OAuth token Claude used to push
this refactor lacks the `workflow` scope, so the file could not be committed
directly to `.github/workflows/`.

To enable auto-deploy, do this once in a terminal on your machine:

```bash
cd app
mkdir -p .github/workflows
git mv .github/deploy/nextjs.yml .github/workflows/nextjs.yml
git commit -m "Enable Pages deploy workflow"
git push origin main
```

Then in the repo on GitHub, go to **Settings → Pages** and set **Source** to
**GitHub Actions** (it is currently set to "Deploy from a branch"). The next
push to `main` — or a manual run from the Actions tab — will build and deploy
to the existing `https://michaelsparks13.github.io/greece-fish-farms/` URL.
