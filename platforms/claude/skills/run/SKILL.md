---
name: run
description: Launch and drive an app, service, CLI, TUI, or browser flow to observe behavior directly.
---

# Run

Get the project running and observe the requested behavior. Prefer an existing project recipe over rediscovery.

## Workflow

1. Check for a project-specific run skill or documented runbook.
2. Run `scripts/detect_project.js --root <project>` to collect likely launch commands and ports.
3. Choose the least invasive launch path. Install dependencies only with approval when network or global writes are required.
4. Start the process in a way that can be stopped. Capture PID, port, URL, logs, and env assumptions.
5. Drive the app through the requested path: HTTP request, CLI invocation, browser automation, screenshot, or log inspection.
6. Stop helper processes you started unless the user asked to keep them running.
7. Report the launch command, observed result, and any URL or evidence.

## Detection Order

1. Existing repo-specific skill or documented runbook
2. `package.json` scripts such as `dev`, `start`, `preview`, or `serve`
3. `Makefile` targets such as `run`, `dev`, `serve`, or `test`
4. Language conventions such as Python modules, Go main packages, `cargo run`, or `dotnet run`
5. Compose files or a Dockerfile

## Evidence

Use the strongest practical signal: HTTP status and response content, CLI output and exit code, browser screenshot or accessibility state, a log line proving the behavior, or a listener plus health endpoint.

Report using this shape:

```text
Launched with: <command>
Working directory: <path>
URL/process: <url or pid>
Observed: <specific behavior>
Evidence: <command/screenshot/log summary>
Stopped: <yes/no and why>
```

## Guardrails

- Do not claim the app works from build/test output alone.
- Prefer localhost binds over public interfaces.
- Avoid opening browsers or GUI apps without approval when the environment requires it.
- If launch fails, capture the first actionable error and next fix.
