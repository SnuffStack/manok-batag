module.exports = {
    apps: [
        {
            name: 'chicken-banana',
            script: 'server/index.js',
            env: {
                NODE_ENV: 'production',
                PORT: 4500
            },
            instances: 1, // SQLite works best with 1 instance in WAL mode
            autorestart: true,
            watch: false,
            max_memory_restart: '1G'
        }
    ]
};
