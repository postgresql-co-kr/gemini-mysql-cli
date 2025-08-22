# Gemini MySQL CLI

A CLI tool to interact with MySQL databases.

## Installation

```bash
npm install -g @debate300/gemini-mysql-cli
```

## Usage

```bash
gemini-mysql-cli <command> [connection_name] <args...>

# Specific Commands
# When using defaultConnection:
gemini-mysql-cli table-info <table_name>
gemini-mysql-cli find-tables <search_pattern>
gemini-mysql-cli search-data <table_name> <column_name> <search_value>

# When specifying connection_name:
gemini-mysql-cli table-info [connection_name] <table_name>
gemini-mysql-cli find-tables [connection_name] <search_pattern>
gemini-mysql-cli search-data [connection_name] <table_name> <column_name> <search_value>
```

Note: If `[connection_name]` is omitted, the `defaultConnection` from `gemini-mysql.json` will be used.

## Configuration

The tool requires a configuration file located at `~/.debate300/gemini-mysql.json`.

A sample configuration file is created automatically upon installation.

The configuration file should have the following structure:

```json
{
  "defaultConnection": "my_connection_name",
  "connections": [
    {
      "my_connection_name": {
        "host": "your_host",
        "port": 3306,
        "user": "your_user",
        "password": "your_password",
        "database": "your_database"
      }
    }
  ]
}
```
