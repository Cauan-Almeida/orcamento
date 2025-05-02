import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Orcamento } from '../types';
import autoTable from 'jspdf-autotable';

// Função para gerar o número sequencial do orçamento no formato AAAA/NNN
const gerarNumeroOrcamento = (data: Date): string => {
  const ano = data.getFullYear();
  
  // Buscar contador no localStorage
  const contadorKey = `orcamento_contador_${ano}`;
  let contador = 1;
  
  const savedContador = localStorage.getItem(contadorKey);
  if (savedContador) {
    contador = parseInt(savedContador, 10) + 1;
  }
  
  // Salvar contador atualizado
  localStorage.setItem(contadorKey, contador.toString());
  
  // Formatar com zeros à esquerda (001, 002, etc)
  const contadorFormatado = contador.toString().padStart(3, '0');
  
  return `${ano}/${contadorFormatado}`;
};

// Função para formatar telefone corretamente
const formatarTelefone = (telefone: string): string => {
  if (!telefone) return '';
  
  // Remover caracteres não numéricos
  const apenasNumeros = telefone.replace(/\D/g, '');
  
  // Aplicar máscara conforme o tamanho
  if (apenasNumeros.length <= 2) {
    return apenasNumeros.length > 0 ? `(${apenasNumeros})` : apenasNumeros;
  } else if (apenasNumeros.length <= 6) {
    return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2)}`;
  } else if (apenasNumeros.length <= 10) { // Telefone fixo
    return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 6)}-${apenasNumeros.substring(6)}`;
  } else { // Celular
    return `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 7)}-${apenasNumeros.substring(7, 11)}`;
  }
};

export const generatePDF = (orcamento: Orcamento, callback: (() => void) | null) => {
  // Criar uma nova instância do jsPDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Cores de tema para o PDF
  const cores = {
    primaria: [41, 128, 185],  // Azul
    secundaria: [52, 73, 94],  // Azul escuro
    texto: [44, 62, 80],       // Quase preto
    cinzaClaro: [245, 245, 245],
    cinzaLinha: [220, 220, 220]
  };

  // Configurações do documento
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = 25;
  
  // Obter o número do orçamento
  let numeroOrcamento: string;
  
  // Se o orçamento já tiver um número, usá-lo
  if (orcamento.numeroOrcamento) {
    numeroOrcamento = orcamento.numeroOrcamento;
  } else {
    // Caso contrário, gerar um novo (compatibilidade com versões anteriores)
    const dataOrcamento = new Date(orcamento.data);
    numeroOrcamento = gerarNumeroOrcamento(dataOrcamento);
  }
  
  // Configurar cor do texto padrão
  pdf.setTextColor(cores.texto[0], cores.texto[1], cores.texto[2]);
  
  // Adicionar título do documento
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  const title = `ORÇAMENTO ${numeroOrcamento}`;
  pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
  
  // Adicionar data
  yPosition += lineHeight * 1.5;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const dataOrcamento = new Date(orcamento.data);
  const data = dataOrcamento.toLocaleDateString('pt-BR');
  pdf.text(`Data: ${data}`, pageWidth - margin, yPosition, { align: 'right' });
  
  // Adicionar linha horizontal para separar cabeçalho
  yPosition += lineHeight + 3;
  pdf.setDrawColor(cores.cinzaLinha[0], cores.cinzaLinha[1], cores.cinzaLinha[2]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += lineHeight;
  
  // Informações da empresa
  const empresa = orcamento.empresa || {
    nome: 'EMPRESA EXEMPLO LTDA',
    cnpj: '00.000.000/0001-00',
    telefone: '(00) 0000-0000',
    email: 'contato@empresa.com',
    endereco: 'Rua Exemplo, 123 - Cidade - UF'
  };
  
  // Seção da empresa
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(cores.secundaria[0], cores.secundaria[1], cores.secundaria[2]);
  pdf.text(empresa.nome.toUpperCase(), margin, yPosition);
  yPosition += lineHeight;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(cores.texto[0], cores.texto[1], cores.texto[2]);
  
  if (empresa.cnpj) {
    pdf.text(`CNPJ: ${empresa.cnpj}`, margin, yPosition);
    yPosition += lineHeight;
  }
  
  if (empresa.telefone) {
    const telefoneFormatado = formatarTelefone(empresa.telefone);
    pdf.text(`Telefone: ${telefoneFormatado}`, margin, yPosition);
    yPosition += lineHeight;
  }
  
  if (empresa.email) {
    pdf.text(`Email: ${empresa.email}`, margin, yPosition);
    yPosition += lineHeight;
  }
  
  if (empresa.endereco) {
    pdf.text(`Endereço: ${empresa.endereco}`, margin, yPosition);
    yPosition += lineHeight;
  }
  
  // Adicionar linha horizontal para separar seções
  yPosition += lineHeight;
  pdf.setDrawColor(cores.cinzaLinha[0], cores.cinzaLinha[1], cores.cinzaLinha[2]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += lineHeight;

  // Informações do cliente
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(cores.secundaria[0], cores.secundaria[1], cores.secundaria[2]);
  pdf.text('CLIENTE', margin, yPosition);
  yPosition += lineHeight;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(cores.texto[0], cores.texto[1], cores.texto[2]);
  pdf.text(`Nome: ${orcamento.cliente.nome}`, margin, yPosition);
  yPosition += lineHeight;
  
  if (orcamento.cliente.telefone) {
    const telefoneFormatado = formatarTelefone(orcamento.cliente.telefone);
    pdf.text(`Telefone: ${telefoneFormatado}`, margin, yPosition);
    yPosition += lineHeight;
  }
  
  if (orcamento.cliente.email) {
    pdf.text(`Email: ${orcamento.cliente.email}`, margin, yPosition);
    yPosition += lineHeight;
  }
  
  // Espaço antes da tabela
  yPosition += 10;

  // Tabela de itens - ajuste os nomes para serem mais curtos
  const tableColumn = ['Item', 'Descrição', 'Qtd', 'Preço', 'Total'];
  const tableRows: any[] = [];

  // Preencher dados da tabela
  orcamento.itens.forEach((item, index) => {
    const valorUnitario = `R$\u00A0${item.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const valorTotal = `R$\u00A0${(item.quantidade * item.precoUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    // Descrição e detalhes na mesma linha
    let descricao = item.descricao;
    if (item.detalhes) {
      descricao += ` - ${item.detalhes}`;
    }
    
    tableRows.push([
      (index + 1).toString(),
      descricao,
      item.quantidade.toString(),
      valorUnitario,
      valorTotal
    ]);
  });

  // Adicionar tabela ao documento com estilo melhorado
  autoTable(pdf, {
    head: [tableColumn],
    body: tableRows,
    startY: yPosition,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 8,
      lineColor: [180, 180, 180],
      lineWidth: 0.1,
      textColor: [50, 50, 50],
      font: 'helvetica',
      halign: 'center',
      valign: 'middle',
      minCellHeight: 14
    },
    headStyles: {
      fillColor: [41, 128, 185], // #2980b9
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 10,
      cellPadding: {top: 8, right: 5, bottom: 8, left: 5},
      minCellHeight: 16
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 40, halign: 'right' },
      4: { cellWidth: 40, halign: 'right' },
    },
    didDrawPage: (data) => {
      // Não desenhar rodapé aqui!
    },
  });

  // Adicionar o valor total após a tabela
  let finalY = (pdf as any).lastAutoTable.finalY + 10;

  // Verificar se precisa adicionar uma nova página
  if (finalY > pageHeight - 70) {
    pdf.addPage();
    finalY = 20;
    // Não desenhar rodapé aqui!
  }

  // Calcular o total
  const total = orcamento.itens.reduce((sum, item) => {
    return sum + (item.quantidade * item.precoUnitario);
  }, 0);

  // Adicionar o valor total com destaque
  pdf.setFillColor(cores.cinzaClaro[0], cores.cinzaClaro[1], cores.cinzaClaro[2]);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(cores.secundaria[0], cores.secundaria[1], cores.secundaria[2]);
  const totalText = `TOTAL: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  // Ajustar o retângulo apenas para ficar atrás do texto do total
  const totalTextWidth = pdf.getTextWidth(totalText);
  pdf.rect(pageWidth - margin - totalTextWidth - 5, finalY - 5, totalTextWidth + 10, 10, 'F');
  
  pdf.text(totalText, pageWidth - margin, finalY, { align: 'right' });
  finalY += lineHeight * 2;
  
  pdf.setTextColor(cores.texto[0], cores.texto[1], cores.texto[2]);

  // Adicionar observações
  if (orcamento.observacoes) {
    // Verificar se precisa adicionar uma nova página
    if (finalY > pageHeight - 90) {
      pdf.addPage();
      finalY = 30;
      // Não desenhar rodapé aqui!
    }

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(cores.secundaria[0], cores.secundaria[1], cores.secundaria[2]);
    const obsTitle = 'OBSERVAÇÕES';
    const obsTitleDim = pdf.getTextDimensions(obsTitle);
    pdf.text(obsTitle, margin, finalY);
    finalY += 7;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(cores.texto[0], cores.texto[1], cores.texto[2]);
    
    // Adicionar um retângulo de fundo para destacar as observações
    const observacoesLines = pdf.splitTextToSize(orcamento.observacoes, pageWidth - margin * 2);
    const obsTextDim = pdf.getTextDimensions(observacoesLines.join('\n'));
    const observacoesHeight = obsTitleDim.h + obsTextDim.h + 10; // 10 de padding
    pdf.setFillColor(248, 248, 248);
    pdf.rect(margin - 2, finalY - obsTitleDim.h - 7, pageWidth - (margin * 2) + 4, observacoesHeight, 'F');
    // Redesenhar o título e o texto por cima do fundo
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(cores.secundaria[0], cores.secundaria[1], cores.secundaria[2]);
    pdf.text(obsTitle, margin, finalY - obsTextDim.h - 3);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(cores.texto[0], cores.texto[1], cores.texto[2]);
    pdf.text(observacoesLines, margin, finalY);
    finalY += obsTextDim.h + 15;
  }

  // Texto das condições gerais
  const condicoesGerais = [
    '1. Orçamento válido por 15 dias.',
    '2. Forma de pagamento a combinar.',
    '3. Prazo de entrega a combinar após confirmação do pedido.'
  ];
  const condicoesTitle = 'CONDIÇÕES GERAIS:';
  const condicoesFontSize = 9;
  const condicoesLineHeight = 7;
  const condicoesPadding = 8;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  const condicoesTitleDim = pdf.getTextDimensions(condicoesTitle);

  // Altura total: altura do título + (número de linhas * altura da linha) + padding
  const condicoesTextHeight = condicoesTitleDim.h + (condicoesGerais.length * condicoesLineHeight) + condicoesPadding;
  let condicoesY = finalY + condicoesTitleDim.h + 2;

  // Checar se cabe na página
  if (finalY + condicoesTextHeight > pageHeight - 30) {
    pdf.addPage();
    finalY = 30;
    condicoesY = finalY + condicoesTitleDim.h + 2;
    // Não desenhar rodapé aqui!
  }

  // Fundo cinza
  pdf.setFillColor(cores.cinzaClaro[0], cores.cinzaClaro[1], cores.cinzaClaro[2]);
  pdf.rect(margin - 2, finalY - 2, pageWidth - (margin * 2) + 4, condicoesTextHeight, 'F');

  // Título
  const tituloY = finalY + condicoesTitleDim.h;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(cores.secundaria[0], cores.secundaria[1], cores.secundaria[2]);
  pdf.text(condicoesTitle, margin, tituloY);

  // Linhas
  pdf.setFontSize(condicoesFontSize);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(cores.texto[0], cores.texto[1], cores.texto[2]);
  let y = tituloY + condicoesLineHeight;
  condicoesGerais.forEach((linha) => {
    pdf.text(linha, margin, y);
    y += condicoesLineHeight;
  });
  finalY += condicoesTextHeight + 5;

  // Função para desenhar o rodapé
  // Durante a geração, desenha só o número da página atual
  function drawFooter(pageNumber: number, totalPages?: number) {
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    const textoPagina = totalPages
      ? `Página ${pageNumber} de ${totalPages}`
      : `Página ${pageNumber}`;
    pdf.text(
      textoPagina,
      pageWidth / 2,
      pageHeight - 18,
      { align: 'center' }
    );
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      empresa.nome,
      pageWidth / 2,
      pageHeight - 13,
      { align: 'center' }
    );
    // Rodapé de autoria mais discreto
    pdf.setFontSize(6);
    pdf.setTextColor(220, 220, 220);
    pdf.text(
      'Desenvolvido por Cauan Almeida / (21) 97262-5476',
      pageWidth / 2,
      pageHeight - 3,
      { align: 'center' }
    );
  }

  // Após gerar todo o conteúdo, garantir rodapé correto em todas as páginas
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    drawFooter(i, totalPages);
  }

  // Salvar o PDF com o novo formato de nome
  pdf.save(`orcamento_${numeroOrcamento.replace('/', '_')}.pdf`);
  
  // Callback opcional após a geração do PDF
  if (callback) {
    callback();
  }
}; 