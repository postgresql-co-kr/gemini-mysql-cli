const fs = require('fs');
const path = require('path');

const configDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.debate300');
const configFile = path.join(configDir, 'gemini-mysql.json');
const sampleConfigFile = path.join(__dirname, 'db.json.sample');

if (!fs.existsSync(configFile)) {
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    fs.copyFileSync(sampleConfigFile, configFile);
    console.log(`Created a default configuration file at: ${configFile}`);
}
