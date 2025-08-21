# Gemini Interaction Guide for Gemini MySQL CLI

This document provides guidelines for interacting with the Gemini MySQL CLI project using Gemini.

## Project Overview

Gemini MySQL CLI is a command-line tool for interacting with MySQL databases. It allows you to get table information, find tables, and search for data in tables.

## Getting Started

### For End-Users

To use the CLI tool, install it globally using npm:

```bash
npm install -g @debate300/gemini-mysql-cli
```

### For Developers

To contribute to the project, you'll need to have Node.js and pnpm installed.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/postgresql-co-kr/gemini-mysql-cli.git
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
3.  **Build the project:**
    ```bash
    pnpm build
    ```

## Available Tools

The following tools are available for interacting with this project:

- `read_file`: Reads the content of a file.
- `write_file`: Writes content to a file.
- `replace`: Replaces text within a file.
- `run_shell_command`: Executes a shell command.
- `list_directory`: Lists the files and directories in a given path.

## Common Tasks

Here are some examples of how you can use Gemini to perform common tasks:

### Get information about a table

> "cc_evt_tmpl_rel_info 테이블 정보를 출력 해줘" (Show me the information for the cc_evt_tmpl_rel_info table)
> "run `gemini-mysql-cli table-info my_connection products`"
> "run `gemini-mysql-cli table-info another_connection customers`"

### Find tables with a specific name

> "order가 포함된 테이블을 찾아줘" (Find tables that contain "order")
> "run `gemini-mysql-cli find-tables my_connection user`"
> "run `gemini-mysql-cli find-tables my_connection sales`"
> "run `gemini-mysql-cli find-tables another_connection log`"

### Search for data in a specific column of a table

> "run `gemini-mysql-cli search-data my_connection users email user@example.com`"
> "run `gemini-mysql-cli search-data my_connection products name \"Laptop\"`"
> "run `gemini-mysql-cli search-data my_connection customers city \"New York\"`"
> "run `gemini-mysql-cli search-data another_connection logs level \"error\"`"

### Build the project

> "pnpm build"

### Run the CLI

> "run `gemini-mysql-cli find-tables my_connection my_table`"
