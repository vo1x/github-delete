# GitHub Delete

A minimal web app to view and bulk delete your months of hard work off of GitHub.

## Security & Privacy

> **⚠️ Warning:** Deleting repositories is **irreversible**. Use with caution.

- **Tokens are never saved:** They are only used in your session.
- **Delete your token after use:** For extra safety, always revoke your PAT after using this app.
- **Self-hosted:** No tracking or third-party analytics.

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/vo1x/github-delete.git
cd github-delete
npm install
```

### 2. Run Locally

```bash
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000) by default.

---

## Usage

1. **Create a GitHub PAT** (Personal Access Token) with `repo` scope:  
   [Create token here](https://github.com/settings/tokens/new?scopes=delete_repo,repo&description=GitHub%20Delete)
2. **Paste the token** into the input box.
3. **View** your repositories.
4. **Select** repos to delete (single or bulk).
5. **Confirm deletion** (action cannot be undone).

---

## Development

- Built with **React** and **Tailwind CSS**.
- No database. No cookies. No tracking.

---

## Contributing

PRs are welcome!  
To contribute:

1. Fork the repo.
2. Create a branch.
3. Make your changes.
4. Submit a pull request.

---

## License

[MIT](./LICENSE)

---

**Made with care by [vo1x](https://github.com/vo1x)**

