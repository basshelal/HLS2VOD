module.exports = {
    presets: [
        "@babel/preset-typescript",
        ["@babel/preset-env", {targets: {node: "current"}}],
        "@babel/preset-react"
    ],
    plugins: [
        ["@babel/plugin-transform-typescript", {"allowDeclareFields": true}],
        ["@babel/plugin-transform-runtime", {"regenerator": true}],
        "@babel/proposal-class-properties",
        "@babel/plugin-proposal-export-default-from",
        "@babel/proposal-object-rest-spread"
    ]
}
