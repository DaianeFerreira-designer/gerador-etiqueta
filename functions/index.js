const functions = require('firebase-functions');
const axios = require('axios');

// Endpoint para buscar separações
exports.buscarSeparacoes = functions.https.onRequest(async (req, res) => {
    const token = 'seu_token_aqui'; // Insira seu token real

    try {
        const response = await axios.get(
            `https://api.tiny.com.br/api2/separacao.pesquisa.php?token=${token}&situacao=2&formato=json`
        );
        
        // Verifica se as separações estão no retorno
        const separacoes = response.data.retorno.separacoes;
        
        if (!separacoes) {
            return res.status(404).send('Nenhuma separação encontrada.');
        }

        // Para cada separação, obtenha os detalhes
        const resultados = await Promise.all(separacoes.map(async (separacao) => {
            const detalhes = await obterDetalhesSeparacao(separacao.id, token);
            return {
                cliente: separacao.destinatario,
                detalhes: detalhes
            };
        }));

        res.status(200).send(resultados);
    } catch (error) {
        console.error('Erro ao buscar separações:', error);
        res.status(500).send('Erro ao buscar separações');
    }
});

// Função auxiliar para obter detalhes da separação
async function obterDetalhesSeparacao(id, token) {
    const response = await axios.get(`https://api.tiny.com.br/api2/separacao.obter.php?token=${token}&idSeparacao=${id}&formato=json`);
    return response.data.retorno.separacao;
}
