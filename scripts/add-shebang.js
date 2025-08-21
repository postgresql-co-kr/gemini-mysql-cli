const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'dist', 'db-cli.js');

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    if (!data.startsWith('#!')) {
        const newData = '#!/usr/bin/env node\n' + data;
        fs.writeFile(filePath, newData, 'utf8', (err) => {
            if (err) {
                console.error('Error writing file:', err);
                return;
            }
            console.log('Shebang added to ' + filePath);
        });
    } else {
        console.log('Shebang already present in ' + filePath);
    }
});
