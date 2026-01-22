module.exports = {
    apps: [
        {
            name: "dashboard",
            script: "apps/dashboard/server.js",
            instances: "max",
            exec_mode: "cluster",
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            env: {
                NODE_ENV: "production",
            },
        },
    ],
};
