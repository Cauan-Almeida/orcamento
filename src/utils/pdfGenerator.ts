import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Orcamento } from '../types';

export const generatePDF = async (orcamento: Orcamento, element: HTMLElement | null, autoDownload: boolean = true) => {
  if (!element) {
    console.error('Elemento HTML não encontrado');
    return;
  }

  try {
    // Configurações de estilo temporárias para melhorar a aparência do PDF
    const botoes = element.querySelectorAll('button');
    botoes.forEach(btn => {
      btn.style.display = 'none';
    });

    // Ajustar o estilo para impressão
    const textarea = element.querySelector('textarea');
    if (textarea) {
      const conteudo = textarea.value;
      const divObservacoes = document.createElement('div');
      divObservacoes.innerHTML = conteudo
        .split('\n')
        .map(linha => `<p>${linha || '&nbsp;'}</p>`)
        .join('');
      
      divObservacoes.style.border = '1px solid #e5e7eb';
      divObservacoes.style.borderRadius = '0.375rem';
      divObservacoes.style.padding = '0.75rem';
      divObservacoes.style.minHeight = '100px';
      divObservacoes.style.fontSize = '0.9375rem';
      
      textarea.parentNode?.replaceChild(divObservacoes, textarea);
    }

    // Captura o elemento como imagem canvas com alta qualidade
    const canvas = await html2canvas(element, {
      scale: 2, // Maior qualidade
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calcular dimensões mantendo a proporção
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Inicializar o PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Adicionar múltiplas páginas se necessário
    let position = 0;
    
    while (position < imgHeight) {
      // Adicionar a imagem ao PDF
      pdf.addImage(imgData, 'PNG', 0, position * -1, imgWidth, imgHeight);
      
      position += pageHeight - 10; // Margens
      
      if (position < imgHeight) {
        pdf.addPage();
      }
    }

    // Adicionar metadados ao PDF
    pdf.setProperties({
      title: `Orçamento ${orcamento.id} - ${orcamento.empresa.nome}`,
      subject: `Orçamento para ${orcamento.cliente.nome}`,
      author: orcamento.empresa.nome,
      keywords: 'orçamento, proposta, serviços',
      creator: 'Sistema de Orçamentos'
    });

    // Restaurar os botões
    botoes.forEach(btn => {
      btn.style.display = '';
    });

    // Data formatada para incluir no nome do arquivo
    const dataFormatada = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const nomeCliente = orcamento.cliente.nome.replace(/\s+/g, '_').toLowerCase();
    const numeroOrcamento = orcamento.id.replace(/\s+/g, '');
    
    // Nome do arquivo
    const nomeArquivo = `orcamento_${numeroOrcamento}_${nomeCliente}_${dataFormatada}.pdf`;
    
    // Salvar o PDF se autoDownload for true
    if (autoDownload) {
      pdf.save(nomeArquivo);
    } else {
      // Para uso com email, ainda assim salvamos o arquivo
      pdf.save(nomeArquivo);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return false;
  }
}; 