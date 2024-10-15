module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true
    },
    extends: [
        'eslint:recommended',
        'google' // Se você estiver usando a configuração do Google
    ],
    parserOptions: {
        ecmaVersion: 12, // Versão do ECMAScript
        sourceType: 'module'
    },
    rules: {
        'max-len': ['error', 100], // Limite de comprimento da linha
        'comma-dangle': ['error', 'never'], // Não permitir trailing commas
        'indent': ['error', 4] // Usar 4 espaços para indentação
    }
};
