# Minimal Todo — PRD

## Problem Statement

People who just want to track a short list of things to do are stuck choosing
between a bare sticky note that nobody else can access from another device,
or a full-featured todo app cluttered with due dates, tags, reminders, and
sharing settings they never asked for. They lose track of simple tasks, or
give up on tools that ask them to configure more than they want to think
about.

## Solution

A very minimal, single-purpose todo app: a user signs in, adds todos, and
marks them done. There is no editing and no deleting — the list only ever
grows and items only ever move from open to done. Each user's todos are
private to them and persisted in a database, so their list is there the next
time they sign in, from any device.

## Actors

- **User** — signs in, creates todos, views their own todo list, and marks
their own todos as done. Every user's todos are private to that user.

## User Stories

1. As a User, I want to sign up for an account, so that I can start keeping my own todo list.
2. As a User, I want to sign in to the app, so that I can access my todo list.
3. As a User, I want to create a new todo with a short description, so that I can capture something I need to do.
4. As a User, I want to see my list of todos, so that I know what is open and what is already done.
5. As a User, I want to mark a todo as done, so that my list reflects what I've completed.

## Product Decisions

- Sign-in is via SSO through Thunder, the platform IDP (org default).
- Sign-up is self-service: anyone can create their own account and start
using the app immediately — no invitation or admin provisioning step.
- Todos are private per user: nobody sees or acts on another user's todos.
- Todos have no edit or delete action — this is a deliberate constraint of
the product, not a gap. Once created, a todo can only move from open to
done.
- Todo data is persisted in a database so a user's list survives across
sessions and devices.

## Out of Scope

- Editing a todo's text after creation.
- Deleting a todo.
- Un-marking a done todo (reopening it).
- Sharing a todo list between users, or any collaboration features.
- Due dates, reminders, notifications, priorities, tags, or categories.
- Search or filtering of the todo list.

## Open Questions

None at this time.

## Further Notes

None.