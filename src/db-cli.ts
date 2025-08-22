#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import mysql from "mysql2/promise";

// Define interfaces for db.json structure
interface DbConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

interface DbConnections {
  [key: string]: DbConnectionConfig;
}

interface DbConfig {
  defaultConnection?: string; // Added this line
  connections: { [key: string]: DbConnectionConfig }[];
}

// Function to read db.json
async function readDbConfig(): Promise<{
  connections: DbConnections;
  defaultConnection?: string;
} | null> {
  const localConfigPath = path.join(__dirname, "..", "gemini-mysql.json");
  const homeConfigPath = path.join(
    process.env.HOME || process.env.USERPROFILE || "",
    ".debate300",
    "gemini-mysql.json"
  );
  const sampleConfigPath = path.join(__dirname, "..", "db.json.sample");

  let dbConfigPath = "";
  if (fs.existsSync(localConfigPath)) {
    dbConfigPath = localConfigPath;
  } else if (fs.existsSync(homeConfigPath)) {
    dbConfigPath = homeConfigPath;
  } else if (fs.existsSync(sampleConfigPath)) {
    dbConfigPath = sampleConfigPath;
    console.log("Configuration file not found. Using db.json.sample instead.");
  } else {
    console.error(
      "Error: Configuration file not found in local project directory, home directory, or as a sample file."
    );
    return null;
  }

  try {
    const fileContent = await fs.promises.readFile(dbConfigPath, "utf8");
    const config: DbConfig = JSON.parse(fileContent);
    const connections: DbConnections = {};
    config.connections.forEach((connObj) => {
      Object.assign(connections, connObj);
    });
    return { connections, defaultConnection: config.defaultConnection }; // Return both
  } catch (error) {
    console.error(`Error reading db.json at ${dbConfigPath}:`, error);
    return null;
  }
}

// Function to get a MySQL connection
async function getConnection(
  connectionName: string
): Promise<mysql.Connection | null> {
  const dbConfigResult = await readDbConfig(); // Changed
  if (!dbConfigResult) {
    return null;
  }
  const { connections } = dbConfigResult; // Destructure connections

  const config = connections[connectionName]; // Access connections
  if (!config) {
    console.error(
      `Connection configuration for '${connectionName}' not found in db.json.`
    );
    return null;
  }

  try {
    const connection = await mysql.createConnection({
      ...config,
      charset: "utf8mb4", // Explicitly set charset to utf8mb4
    });
    return connection;
  } catch (error) {
    console.error(`Error connecting to database '${connectionName}':`, error);
    return null;
  }
}

// 1. Get Table Info
async function getTableInfo(
  connectionName: string,
  tableName: string
): Promise<void> {
  const connection = await getConnection(connectionName);
  if (!connection) return;

  try {
    // Get table comment
    const [tableRows] = (await connection.execute(
      `SELECT TABLE_COMMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [tableName]
    )) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

    const tableComment =
      tableRows.length > 0 ? tableRows[0].TABLE_COMMENT : "No comment";

    console.log(`\n--- Table: ${tableName} (${tableComment}) ---`);

    // Get column info
    const [columnRows] = (await connection.execute(
      `SELECT COLUMN_NAME, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH, COLUMN_COMMENT
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
             ORDER BY ORDINAL_POSITION`,
      [tableName]
    )) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

    if (columnRows.length === 0) {
      console.log(`No columns found for table '${tableName}'.`);
      return;
    }

    console.log("Columns:");
    columnRows.forEach((col) => {
      const length = col.CHARACTER_MAXIMUM_LENGTH
        ? `(${col.CHARACTER_MAXIMUM_LENGTH})`
        : "";
      console.log(
        `  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}${length} (${
          col.COLUMN_COMMENT || "No comment"
        })`
      );
    });
  } catch (error) {
    console.error(`Error getting info for table '${tableName}':`, error);
  } finally {
    await connection.end();
  }
}

// 2. Find Tables
async function findTables(
  connectionName: string,
  searchPattern: string
): Promise<void> {
  const connection = await getConnection(connectionName);
  if (!connection) return;

  try {
    const [tableRows] = (await connection.execute(
      `SELECT TABLE_NAME, TABLE_COMMENT
             FROM INFORMATION_SCHEMA.TABLES
             WHERE TABLE_SCHEMA = DATABASE()
               AND (TABLE_NAME LIKE ? OR TABLE_COMMENT LIKE ?)`,
      [`%${searchPattern}%`, `%${searchPattern}%`]
    )) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

    if (tableRows.length === 0) {
      console.log(
        `No tables found matching '${searchPattern}' in database '${connectionName}'.`
      );
      return;
    }

    console.log(
      `\n--- Tables matching '${searchPattern}' in database '${connectionName}' ---`
    );
    tableRows.forEach((table) => {
      console.log(
        `  - ${table.TABLE_NAME} (${table.TABLE_COMMENT || "No comment"})`
      );
    });
  } catch (error) {
    console.error(`Error finding tables matching '${searchPattern}':`, error);
  } finally {
    await connection.end();
  }
}

// 3. Search Row Data
async function searchRowData(
  connectionName: string,
  tableName: string,
  columnName: string,
  searchValue: string
): Promise<void> {
  const connection = await getConnection(connectionName);
  if (!connection) return;

  try {
    const [rows] = (await connection.execute(`SELECT * FROM ?? WHERE ?? = ?`, [
      tableName,
      columnName,
      searchValue,
    ])) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

    if (rows.length === 0) {
      console.log(
        `No rows found in '${tableName}' where '${columnName}' is '${searchValue}'.`
      );
      return;
    }

    console.log(
      `\n--- Rows in '${tableName}' where '${columnName}' is '${searchValue}' ---`
    );
    rows.forEach((row, index) => {
      console.log(`--- Row ${index + 1} ---`);
      for (const key in row) {
        if (Object.prototype.hasOwnProperty.call(row, key)) {
          console.log(`  ${key}: ${row[key]}`);
        }
      }
    });
  } catch (error) {
    console.error(`Error searching data in '${tableName}':`, error);
  } finally {
    await connection.end();
  }
}

// Main CLI logic
async function main() {
  const args = process.argv.slice(2);

  const dbConfigResult = await readDbConfig();
  if (!dbConfigResult) {
    return;
  }
  const { connections, defaultConnection } = dbConfigResult;

  let command: string | undefined;
  let connectionName: string | undefined;
  let commandArgs: string[] = [];

  // Determine command
  if (args.length > 0) {
    command = args[0];
  }

  // Determine connectionName and commandArgs
  if (args.length > 1) {
    // Check if args[1] is a known connection name
    if (connections[args[1]]) {
      connectionName = args[1];
      commandArgs = args.slice(2); // Remaining args are for the command
    } else {
      // args[1] is not a connection name, assume default connection and args[1] is the first command arg
      connectionName = defaultConnection;
      commandArgs = args.slice(1); // Remaining args are for the command
    }
  } else {
    // Only command provided, use default connection
    connectionName = defaultConnection;
    commandArgs = [];
  }

  // If no command or connection name could be determined, show usage
  if (!command || !connectionName) {
    console.log("Usage:");
    console.log("  gemini-mysql-cli <command> [connection_name] <args...>");
    console.log("  Commands:");
    console.log("    table-info [connection_name] <table_name>");
    console.log("    find-tables [connection_name] <search_pattern>");
    console.log(
      "    search-data [connection_name] <table_name> <column_name> <search_value>"
    );
    console.log(
      "\nNote: If [connection_name] is omitted, the default connection from gemini-mysql.json will be used."
    );
    return;
  }

  // Now use command and connectionName, and commandArgs for specific command logic
  switch (command) {
    case "table-info":
      if (commandArgs.length !== 1) {
        console.log(
          "Usage: gemini-mysql-cli table-info [connection_name] <table_name>"
        );
        return;
      }
      await getTableInfo(connectionName, commandArgs[0]);
      break;
    case "find-tables":
      if (commandArgs.length !== 1) {
        console.log(
          "Usage: gemini-mysql-cli find-tables [connection_name] <search_pattern>"
        );
        return;
      }
      await findTables(connectionName, commandArgs[0]);
      break;
    case "search-data":
      if (commandArgs.length !== 3) {
        console.log(
          "Usage: gemini-mysql-cli search-data [connection_name] <table_name> <column_name> <search_value>"
        );
        return;
      }
      await searchRowData(
        connectionName,
        commandArgs[0],
        commandArgs[1],
        commandArgs[2]
      );
      break;
    default:
      console.log(`Unknown command: ${command}`);
      console.log("Available commands: table-info, find-tables, search-data");
      break;
  }
}

main();
