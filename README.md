# Amurex

![Static Badge](https://img.shields.io/badge/shadcn%2Fui-2.1.2-blue?link=https%3A%2F%2Fgithub.com%2Fshadcn%2Fui)

> [!NOTE]

> This is not the original project and I will probably delete/private this repo once the real amurex team reviews this.
> You can find the original project <a href="https://github.com/thepersonalaicompany">here</a>.
> This app uses `pnpm` as package manager.

## Using this example

Clone the repository:

```sh
git clone https://github.com/dwi11harsh/amurex.git
```

Install dependencies:

```sh
cd amurex
pnpm install
```

### Add ui components

Use the pre-made script:

```sh
pnpm ui add <component-name>
```

> This works just like the `shadcn/ui` CLI.

### Add a new app

Turborepo offer a simple command to add a new app:

```sh
pnpm turbo gen workspace --name <app-name>
```

This will create a new empty app in the `apps` directory.

If you want, you can copy an existing app with:

```sh
pnpm turbo gen workspace --name <app-name> --copy
```

> [!NOTE]
> Remember to run `pnpm install` after copying an app.

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `web`: a [Next.js](https://nextjs.org/) app
- `@amurex/ui`: a stub React component library (🚀 powered by **shadcn/ui**)
- `@amurex/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@amurex/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```sh
cd amurex
pnpm build
```

### Develop

To develop all apps and packages, run the following command:

```sh
cd amurex
pnpm dev
```

#### Supabase Setup

You can navigate to Supabase directory and follow the instructions to setup your DB for testing

### Remote Caching

Turborepo can use a technique known as [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup), then enter the following commands:

```
cd amurex
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```sh
npx turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)

Learn more about shadcn/ui:

- [Documentation](https://ui.shadcn.com/docs)
