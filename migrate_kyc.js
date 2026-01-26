const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'server', 'data.json');

if (!fs.existsSync(DB_FILE)) {
    console.log('DB file not found:', DB_FILE);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

// 1. Identify valid user IDs from the user list
const userIds = new Set(data.users.map(u => u.id));

// 2. Clean up KYC records
// Remove records where userId is 'undefined' or doesn't exist
data.kyc = (data.kyc || []).filter(k => {
    if (k.userId === 'undefined' || !k.userId) {
        console.log(`Removing orphaned KYC record ${k.id} (userId: ${k.userId})`);
        return false;
    }
    if (!userIds.has(k.userId)) {
        console.log(`Removing orphaned KYC record ${k.id} (user ${k.userId} not found)`);
        return false;
    }
    return true;
});

// 3. Update user KYC statuses
// Set users to 'none' if they don't have a valid KYC record and are currently 'pending' or 'submitted'
const usersWithKyc = new Set(data.kyc.map(k => k.userId));

data.users.forEach(u => {
    const hasKyc = usersWithKyc.has(u.id);
    if (!hasKyc && (u.kyc_status === 'pending' || u.kyc_status === 'submitted')) {
        console.log(`Updating user ${u.id} (${u.email}) status to 'none' (no submission found)`);
        u.kyc_status = 'none';
        u.kyc_submitted = false;
    } else if (hasKyc) {
        // Ensure status is correctly set to 'pending' if they have a record
        const record = data.kyc.find(k => k.userId === u.id && k.status === 'pending');
        if (record && u.kyc_status === 'none') {
            console.log(`Updating user ${u.id} status to 'pending' (found valid record)`);
            u.kyc_status = 'pending';
            u.kyc_submitted = true;
        }
    }
});

fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
console.log('Data migration complete.');
