// Carregar módulos necessários
const PDFDocument = require('pdfkit');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

// Função para criar etiquetas
function criarEtiqueta(nomeCliente, sku) {
    let conteudo;
    if (['SB012', 'SB013', 'SB014'].includes(sku)) {
        conteudo = `NOME: ${nomeCliente}
TOMAR 2 CAPS ao dia - 1 branca e 1 azul
USO: INTERNO F.S.A: 90 CAPS
FAB: 08/2024 VAL: 24 MESES
DR. ROMULO CRUZ
CRM-MA: 4953/CRM-TO 2039
PRODUZIDO POR CNPJ: 12.185.547/0001-98`;
    } else if (['SB001', 'SB021', 'SB022'].includes(sku)) {
        conteudo = `NOME: ${nomeCliente}
TOMAR 6 CAPS POR DIA
USO: INTERNO F.S.A: 180 CAPS
FAB: 08/2024 VAL: 24 MESES
DR. ROMULO CRUZ
CRM-MA: 4953/CRM-TO 2039
PRODUZIDO POR CNPJ: 12.185.547/0001-98`;
    } else if (['SB002', 'SB010', 'SB011', 'SB015', 'SB016', 'SB019', 'SB009'].includes(sku)) {
        conteudo = `NOME: ${nomeCliente}
TOMAR 2 CAPS POR DIA
USO: INTERNO F.S.A: 60 CAPS
FAB: 08/2024 VAL: 24 MESES
DR. ROMULO CRUZ
CRM-MA: 4953/CRM-TO 2039
PRODUZIDO POR CNPJ: 12.185.547/0001-98`;
    } else if (['SB003', 'SB006', 'SB007', 'SB008', 'SB017', 'SB018', 'SB020'].includes(sku)) {
        conteudo = `NOME: ${nomeCliente}
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

    // Configurações de layout
    const etiquetaWidth = 250; // Largura de cada etiqueta
    const etiquetaHeight = 150; // Altura de cada etiqueta
    const margin = 20; // Margem entre etiquetas
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    let x = margin;
    let y = margin;

    notas.forEach((nota, index) => {
        if (x + etiquetaWidth + margin > pageWidth) {
            x = margin;
            y += etiquetaHeight + margin;
            if (y + etiquetaHeight + margin > pageHeight) {
                doc.addPage();
                y = margin; // Reseta a posição y
            }
        }

        // Verifica se a nota é válida antes de tentar dividir
        if (nota) {
            doc.rect(x, y, etiquetaWidth, etiquetaHeight).stroke();

            const lines = nota.split('\n'); // Divide o conteúdo da etiqueta em linhas
            lines.forEach((line, lineIndex) => {
                doc.fontSize(10).text(line.trim(), x + 10, y + 10 + lineIndex * 15, { width: etiquetaWidth - 20, align: 'left' });
            });
        } else {
            console.error('Nota inválida:', nota); // Log de nota inválida
        }

        x += etiquetaWidth + margin; // Move para a próxima coluna
    });

    doc.end();
    console.log(`PDF gerado com sucesso: ${pdfPath}`);
}

// Função para buscar separações no Tiny ERP
async function buscarSeparacoes() {
    const token = process.env.TINY_API_TOKEN; // Obtendo o token do arquivo .env
    try {
        const response = await axios.get(`https://api.tiny.com.br/api2/separacao.pesquisa.php?token=${token}&situacao=2&formato=json`);
        console.log('Resposta da API buscar separações:', response.data); // Log da resposta da API

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
                const quantidade = item.quantidade; // Obter a quantidade do item
                const nota = criarEtiqueta(nomeCliente, item.codigo); // Usar SKU como código
                
                // Adicionar a nota à lista de acordo com a quantidade
                for (let i = 0; i < quantidade; i++) {
                    todasNotas.push(nota);
                }
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
