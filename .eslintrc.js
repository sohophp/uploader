/**
 * @created 2020-03-15 eslint 標準化管理 js 代碼格式
 */
module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 2018
    },
    "rules": {
        "no-unused-vars": "warn",
        "no-undef": "warn",
        "indent": [
            "error",
            4,
            { "SwitchCase": 1 }
        ],
        "linebreak-style": [
            "off",
            "unix"
        ],
        // "quotes": [
        //     "warn",
        //     "double"
        // ],
        "semi": [
            "error",
            "always"
        ]
    },
    "ecmaFeatures": {
        "modules": true,
        "spread": true,
        "restParams": true
    }
};
