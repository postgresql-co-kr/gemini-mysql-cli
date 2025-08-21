import * as fs from 'fs';
import * as path from 'path';
import mysql from 'mysql2/promise';

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
    connections: { [key: string]: DbConnectionConfig }[];
}

// Function to read db.json
async function readDbConfig(): Promise<DbConnections | null> {
    const dbConfigPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.debate300', 'gemini-mysql.json');
    try {
        const fileContent = await fs.promises.readFile(dbConfigPath, 'utf8');
        const config: DbConfig = JSON.parse(fileContent);
        const connections: DbConnections = {};
        config.connections.forEach(connObj => {
            Object.assign(connections, connObj);
        });
        return connections;
    } catch (error) {
        console.error(`Error reading db.json at ${dbConfigPath}:`, error);
        return null;
    }
}

// Function to get a MySQL connection
async function getConnection(connectionName: string): Promise<mysql.Connection | null> {
    const dbConfig = await readDbConfig();
    if (!dbConfig) {
        return null;
    }

    const config = dbConfig[connectionName];
    if (!config) {
        console.error(`Connection configuration for '${connectionName}' not found in db.json.`);
        return null;
    }

    try {
        const connection = await mysql.createConnection({
            ...config,
            charset: 'utf8mb4' // Explicitly set charset to utf8mb4
        });
        return connection;
    } catch (error) {
        console.error(`Error connecting to database '${connectionName}':`, error);
        return null;
    }
}

// 1. Get Table Info
async function getTableInfo(connectionName: string, tableName: string): Promise<void> {
    const connection = await getConnection(connectionName);
    if (!connection) return;

    try {
        // Get table comment
        const [tableRows] = await connection.execute(
            `SELECT TABLE_COMMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
            [tableName]
        ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

        const tableComment = tableRows.length > 0 ? tableRows[0].TABLE_COMMENT : 'No comment';

        console.log(`\n--- Table: ${tableName} (${tableComment}) ---`);

        // Get column info
        const [columnRows] = await connection.execute(
            `SELECT COLUMN_NAME, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH, COLUMN_COMMENT
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
             ORDER BY ORDINAL_POSITION`,
            [tableName]
        ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

        if (columnRows.length === 0) {
            console.log(`No columns found for table '${tableName}'.`);
            return;
        }

        console.log('Columns:');
        columnRows.forEach(col => {
            const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
            console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}${length} (${col.COLUMN_COMMENT || 'No comment'})`);
        });

    } catch (error) {
        console.error(`Error getting info for table '${tableName}':`, error);
    } finally {
        await connection.end();
    }
}

// 2. Find Tables
async function findTables(connectionName: string, searchPattern: string): Promise<void> {
    const connection = await getConnection(connectionName);
    if (!connection) return;

    try {
        const [tableRows] = await connection.execute(
            `SELECT TABLE_NAME, TABLE_COMMENT
             FROM INFORMATION_SCHEMA.TABLES
             WHERE TABLE_SCHEMA = DATABASE()
               AND (TABLE_NAME LIKE ? OR TABLE_COMMENT LIKE ?)`,
            [`%${searchPattern}%`, `%${searchPattern}%`]
        ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

        if (tableRows.length === 0) {
            console.log(`No tables found matching '${searchPattern}' in database '${connectionName}'.`);
            return;
        }

        console.log(`\n--- Tables matching '${searchPattern}' in database '${connectionName}' ---`);
        tableRows.forEach(table => {
            console.log(`  - ${table.TABLE_NAME} (${table.TABLE_COMMENT || 'No comment'})`);
        });

    } catch (error) {
        console.error(`Error finding tables matching '${searchPattern}':`, error);
    } finally {
        await connection.end();
    }
}

// 3. Search Row Data
async function searchRowData(connectionName: string, tableName: string, columnName: string, searchValue: string): Promise<void> {
    const connection = await getConnection(connectionName);
    if (!connection) return;

    try {
        const [rows] = await connection.execute(
            `SELECT * FROM ?? WHERE ?? = ?`,
            [tableName, columnName, searchValue]
        ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];

        if (rows.length === 0) {
            console.log(`No rows found in '${tableName}' where '${columnName}' is '${searchValue}'.`);
            return;
        }

        console.log(`\n--- Rows in '${tableName}' where '${columnName}' is '${searchValue}' ---`);
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
    const args = process.argv.slice(2); // Skip 'node' and 'db-cli.js'

    if (args.length < 2) {
        console.log('Usage:');
        console.log('  node dist/db-cli.js table-info <connection_name> <table_name>');
        console.log('  node dist/db-cli.js find-tables <connection_name> <search_pattern>');
        console.log('  node dist/db-cli.js search-data <connection_name> <table_name> <column_name> <search_value>');
        return;
    }

    const command = args[0];
    const connectionName = args[1];

    switch (command) {
        case 'table-info':
            if (args.length !== 3) {
                console.log('Usage: node dist/db-cli.js table-info <connection_name> <table_name>');
                return;
            }
            await getTableInfo(connectionName, args[2]);
            break;
        case 'find-tables':
            if (args.length !== 3) {
                console.log('Usage: node dist/db-cli.js find-tables <connection_name> <search_pattern>');
                return;
            }
            await findTables(connectionName, args[2]);
            break;
        case 'search-data':
            if (args.length !== 5) {
                console.log('Usage: node dist/db-cli.js search-data <connection_name> <table_name> <column_name> <search_value>');
                return;
            }
            await searchRowData(connectionName, args[2], args[3], args[4]);
            break;
        default:
            console.log(`Unknown command: ${command}`);
            console.log('Available commands: table-info, find-tables, search-data');
            break;
    }
}

main();
