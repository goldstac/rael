# Agents Instructions

## Git Conventions

When pushing to GitHub, always use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

### Commit Format

```
<type>(<optional scope>): <short description>
```

### Allowed Types

| Type       | Description                                        |
|------------|----------------------------------------------------|
| `feat`     | A new feature                                      |
| `fix`      | A bug fix                                          |
| `docs`     | Documentation only changes                         |
| `style`    | Formatting, missing semi-colons, etc (no code change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | A code change that improves performance            |
| `test`     | Adding missing tests or correcting existing tests  |
| `build`    | Changes that affect the build system or dependencies |
| `ci`       | Changes to CI configuration files and scripts      |
| `chore`    | Other changes that don't modify src or test files  |
| `revert`   | Reverts a previous commit                          |

### Rules

- Use **imperative mood** in the description (e.g. "add feature" not "added feature")
- Keep the subject line under **72 characters**
- Do not capitalize the first letter of the description
- No period (`.`) at the end of the description
- Use a scope in parentheses when the change is limited to a specific module (e.g. `feat(auth): add login endpoint`)

### Workflow

When the user asks to push to GitHub, run:

1. `git add .` (or specific files)
2. `git commit -m "<type>(<scope>): <description>"`
3. `git push`
