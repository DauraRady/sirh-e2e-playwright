# Contributing

## How to contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Write tests following the patterns in this project
4. Ensure all tests pass (`npx playwright test`)
5. Create a Pull Request

## Code standards

- Use `test.extend()` for fixtures, not `beforeEach`
- Use `test.step()` in every POM method
- Use `Promise.all` for click + waitForResponse
- No `waitForTimeout` — use `expect.poll()` or `waitForResponse`
- No assertions in Page Objects
- Test names follow: `should [result] when [condition]`
