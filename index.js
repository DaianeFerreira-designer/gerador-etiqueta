// Carregar módulos necessários
const PDFDocument = require('pdfkit');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

// Função para criar etiquetas
function criarEtiqueta(nomeCliente, sku) {
    let conteudo;
    if (['SB012', 'SB013', 'SB014'].includes(sku)) {
        conteudo = `Nome: ${nomeCliente}
        TOMAR 2 CAPS ao dia - 1 branca e 1 azul
        USO: INTERNO F.S.A: 90 CAPS
        FAB: 08/2024 VAL: 24 MESES
        DR. ROMULO CRUZ
        CRM-MA: 4953/CRM-TO 2039
        PRODUZIDO POR CNPJ: 12.185.547/0001-98`;
    } else if (['SB001', 'SB021', 'SB022'].includes(sku)) {
        conteudo = `Nome: ${nomeCliente}
        TOMAR 6 CAPS POR DIA
        USO: INTERNO F.S.A: 180 CAPS
        FAB: 08/2024 VAL: 24 MESES
        DR. ROMULO CRUZ
        CRM-MA: 4953/CRM-TO 2039
        PRODUZIDO POR CNPJ: 12.185.547/0001-98`;
    } else if (['SB002', 'SB010', 'SB011', 'SB015', 'SB016', 'SB019', 'SB009'].includes(sku)) {
        conteudo = `Nome: ${nomeCliente}
        TOMAR 2 CAPS POR DIA
        USO: INTERNO F.S.A: 60 CAPS
        FAB: 08/2024 VAL: 24 MESES
        DR. ROMULO CRUZ
        CRM-MA: 4953/CRM-TO 2039
        PRODUZIDO POR CNPJ: 12.185.547/0001-98`;
    } else if (['SB003', 'SB006', 'SB007', 'SB008', 'SB017', 'SB018', 'SB020'].includes(sku)) {
        conteudo = `Nome: ${nomeCliente}
        TOMAR 2 CAPS POR DIA
        USO: INTERNO F.S.A: 120 CAPS
        FAB: 08/2024 VAL: 24 MESES
        DR. ROMULO CRUZ
        CRM-MA: 4953/CRM-TO 2039
        PRODUZIDO POR CNPJ: 12.185.547/0001-98`;
    }
    return conteudo;
}

// Função para gerar PDF com etiquetas
function gerarPDF(notas) {
    const doc = new PDFDocument();
    const pdfPath = 'etiquetas.pdf'; // Caminho do arquivo PDF

    doc.pipe(fs.createWriteStream(pdfPath));
    console.log(`Gerando PDF: ${pdfPath}`);

    notas.forEach((nota, index) => {
        if (index > 0) doc.addPage();
        doc.fontSize(12).text(nota, { align: 'left' });
    });

    doc.end();
    console.log(`PDF gerado com sucesso: ${pdfPath}`);
}

// Função para buscar separações no Tiny ERP
async function buscarSeparacoes() {
    const token = process.env.TINY_API_TOKEN; // Obtendo o token do arquivo .env
    try {
        // Ajustar a URL para buscar separações (situacao=2 para pedidos separados)
        const response = await axios.get(`https://api.tiny.com.br/api2/separacao.pesquisa.php?token=${token}&situacao=2&formato=json`);
        console.log('Resposta da API buscar separações:', response.data); // Log da resposta da API

        // Verificar se a estrutura da resposta é válida
        if (response.data && response.data.retorno && response.data.retorno.separacoes) {
            return response.data.retorno.separacoes;
        } else {
            console.error('Estrutura de resposta inesperada:', response.data);
            return [];
        }
    } catch (error) {
        console.error('Erro ao buscar separações:', error.response ? error.response.data : error.message); // Log detalhado do erro
        return [];
    }
}

// Função para obter detalhes da separação pelo ID
async function obterDetalhesSeparacao(idSeparacao) {
    const token = process.env.TINY_API_TOKEN; // Obtendo o token do arquivo .env
    try {
        const response = await axios.get(`https://api.tiny.com.br/api2/separacao.obter.php?token=${token}&idSeparacao=${idSeparacao}&formato=json`);
        console.log('Resposta da API obter detalhes da separação:', response.data); // Log da resposta da API

        if (response.data && response.data.retorno && response.data.retorno.separacao) {
            return response.data.retorno.separacao;
        } else {
            console.error('Estrutura de resposta inesperada ao obter detalhes da separação:', response.data);
            return null;
        }
    } catch (error) {
        console.error('Erro ao obter detalhes da separação:', error.response ? error.response.data : error.message); // Log detalhado do erro
        return null;
    }
}

// Função principal para processar separações e gerar etiquetas
async function processarSeparacoes() {
    const separacoes = await buscarSeparacoes();
    if (!separacoes || separacoes.length === 0) {
        console.log('Nenhuma separação encontrada.');
        return;
    }

    const todasNotas = []; // Para armazenar todas as notas antes de gerar o PDF

    for (const separacao of separacoes) {
        const idSeparacao = separacao.id; // Obter o ID da separação
        const nomeCliente = separacao.destinatario; // Nome do cliente atrelado ao endereço de entrega

        // Obter detalhes da separação usando o ID
        const detalhesSeparacao = await obterDetalhesSeparacao(idSeparacao);

        if (detalhesSeparacao && detalhesSeparacao.itens && detalhesSeparacao.itens.length > 0) {
            detalhesSeparacao.itens.forEach(item => {
                console.log('Item encontrado:', item); // Log do item encontrado
                const nota = criarEtiqueta(nomeCliente, item.codigo); // Usar SKU como código
                todasNotas.push(nota); // Adicionar a nota à lista
            });
        } else {
            console.log('A separação não contém itens ou não foi encontrada:', separacao);
        }
    }

    // Gerar o PDF somente se houver notas
    if (todasNotas.length > 0) {
        gerarPDF(todasNotas);
    } else {
        console.log('Nenhuma etiqueta foi gerada.');
    }
}

// Executar a função principal
processarSeparacoes();
