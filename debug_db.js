const db = require('./server/db');
const fs = require('fs');
const path = require('path');

try {
    console.log('Loading data.json directly...');
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'server', 'data.json'), 'utf8'));
    console.log('JSON parse successful. Users:', data.users ? data.users.length : 'none');

    console.log('Testing db.getUserById for all users...');
    data.users.forEach(u => {
        try {
            const found = db.getUserById(u.id);
            if (!found) console.log('FAILED to find user', u.id);
            else console.log('OK:', u.id, u.email);
        } catch (e) {
            console.log('CRASH on user', u.id, ':', e.message);
        }
    });

    console.log('INTEGRITY CHECK COMPLETE');
} catch (e) {
    console.error('CRITICIAL FAILED:', e);
}
