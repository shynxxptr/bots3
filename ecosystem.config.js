module.exports = {
    apps: [
        {
            name: "welcomer-bot",
            script: "./index.js",
            env: {
                NODE_ENV: "production",
            },
        },
        {
            name: "welcomer-dashboard",
            script: "./dashboard.js",
            env: {
                NODE_ENV: "production",
            },
        },
    ],
};
