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

## Gemini MySQL CLI 활용 안내

이 프로젝트에서는 `gemini-mysql-cli`를 사용하여 데이터베이스와 상호 작용할 수 있습니다. `gemini-mysql-cli`는 MySQL 데이터베이스의 테이블 정보를 조회하고, 특정 테이블을 검색하며, 테이블 내 데이터를 검색하는 등의 기능을 제공하는 커맨드 라인 도구입니다.

### 테이블 정보 조회

특정 테이블의 상세 정보를 확인하려면 `table-info` 명령어를 사용합니다. 명령어 실행 시, 설정된 **연결 이름**과 **테이블 이름**을 지정해야 합니다.

**사용 예시:**
> "users 테이블의 정보를 보여줘."
> "run `gemini-mysql-cli table-info [연결이름] users`"

> "products 테이블의 정보를 알려줘."
> "run `gemini-mysql-cli table-info [연결이름] products`"

### 테이블 검색

테이블 이름에 특정 문자열이 포함된 테이블들을 찾고 싶을 때는 `find-tables` 명령어를 사용합니다.

**사용 예시:**
> "'order'가 포함된 테이블을 찾아줘."
> "run `gemini-mysql-cli find-tables [연결이름] order`"

> "'log'가 포함된 테이블을 검색해줘."
> "run `gemini-mysql-cli find-tables [연결이름] log`"

### 데이터 검색

특정 테이블의 특정 컬럼에서 데이터를 검색하려면 `search-data` 명령어를 사용합니다. 명령어 실행 시, 설정된 **연결 이름**, **테이블 이름**, **컬럼 이름**, 그리고 **검색할 값**을 지정해야 합니다.

**사용 예시:**
> "users 테이블의 email 컬럼에서 'user@example.com'을 검색해줘."
> "run `gemini-mysql-cli search-data [연결이름] users email user@example.com`"

> "products 테이블의 name 컬럼에서 'Laptop'을 검색해줘."
> "run `gemini-mysql-cli search-data [연결이름] products name \"Laptop\"`"

### 기본 연결 설정 (Optional)

`gemini-mysql-cli` 사용 시 매번 연결 이름을 지정하는 대신, 기본 연결을 설정하여 편리하게 사용할 수 있습니다. 이는 일반적으로 `gemini-mysql.json`과 같은 설정 파일을 통해 이루어집니다.

**설정 방법 (예시):**
`gemini-mysql.json` 파일에 다음과 같은 필드를 추가하여 기본 연결을 지정할 수 있습니다. (정확한 설정 방법은 `gemini-mysql-cli`의 공식 문서를 참조하십시오.)

```json
{
  "defaultConnection": "my_connection",
  "connections": {
    "my_connection": {
      "host": "localhost",
      "user": "root",
      "password": "password",
      "database": "mydb"
    }
    // ... 다른 연결 설정
  }
}
```

위 예시처럼 `defaultConnection` 필드를 추가하면, 명령어를 실행할 때 연결 이름을 생략할 수 있습니다.
예: `run `gemini-mysql-cli table-info users`` (이 경우 `my_connection`이 기본으로 사용됨)