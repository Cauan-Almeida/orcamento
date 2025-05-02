import { useState, useRef, useEffect } from 'react';
import { Cliente, Item, Orcamento, Empresa } from '../types';
import BudgetItemForm from '../components/BudgetItemForm';
import { generatePDF } from '../utils/pdfGenerator';

const NewBudget = () => {
  // Carregar dados salvos do localStorage ao iniciar
  const getSavedEmpresa = (): Empresa => {
    const savedEmpresa = localStorage.getItem('empresa');
    if (savedEmpresa) {
      return JSON.parse(savedEmpresa);
    }
    return {
      nome: 'Sua Empresa',
      cnpj: '00.000.000/0000-00',
      telefone: '(99) 99999-9999',
      email: 'contato@suaempresa.com.br'
    };
  };

  const getNextOrcamentoNumber = (): string => {
    const ano = new Date().getFullYear();
    
    // Tentar pegar o número atual do localStorage
    const currentNumberKey = `orcamento_number_${ano}`;
    let currentNumber = parseInt(localStorage.getItem(currentNumberKey) || '0', 10);
    
    // Incrementar o número
    currentNumber += 1;
    
    // Salvar o novo número
    localStorage.setItem(currentNumberKey, currentNumber.toString());
    
    // Formatar o número (ex: 2025-0001)
    return `${ano}-${currentNumber.toString().padStart(4, '0')}`;
  };

  // Carregar orçamentos salvos do localStorage
  const getSavedOrcamentos = (): Orcamento[] => {
    const savedOrcamentos = localStorage.getItem('orcamentos');
    if (savedOrcamentos) {
      return JSON.parse(savedOrcamentos);
    }
    return [];
  };

  const [cliente, setCliente] = useState<Cliente>({ nome: '' });
  const [itens, setItens] = useState<Item[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [empresa, setEmpresa] = useState<Empresa>(getSavedEmpresa());
  const [mostrarConfiguracoes, setMostrarConfiguracoes] = useState(false);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>(getSavedOrcamentos());
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  
  const orcamentoRef = useRef<HTMLDivElement>(null);
  const numeroOrcamento = useRef<string>(getNextOrcamentoNumber());

  // Salvar empresa no localStorage sempre que for atualizada
  useEffect(() => {
    localStorage.setItem('empresa', JSON.stringify(empresa));
  }, [empresa]);

  // Salvar orcamentos no localStorage sempre que forem atualizados
  useEffect(() => {
    localStorage.setItem('orcamentos', JSON.stringify(orcamentos));
  }, [orcamentos]);

  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCliente((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmpresaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmpresa((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = (item: Item) => {
    setItens((prev) => [...prev, item]);
  };

  const handleRemoveItem = (id: string) => {
    setItens((prev) => prev.filter((item) => item.id !== id));
  };

  const calcularSubtotal = (item: Item) => {
    return item.quantidade * item.precoUnitario;
  };

  const calcularTotal = () => {
    return itens.reduce((total, item) => total + calcularSubtotal(item), 0);
  };

  const handleGerarPDF = () => {
    const orcamento: Orcamento = {
      id: numeroOrcamento.current,
      cliente,
      itens,
      observacoes,
      data: new Date(),
      empresa
    };
    
    // Salvar o orçamento na lista
    setOrcamentos(prev => [...prev, orcamento]);
    
    generatePDF(orcamento, orcamentoRef.current);
  };

  const handleEnviarWhatsApp = () => {
    if (!cliente.whatsapp) {
      alert('Digite o número de WhatsApp do cliente para enviar!');
      return;
    }

    const telefone = cliente.whatsapp.replace(/\D/g, '');
    const total = calcularTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const mensagem = encodeURIComponent(
      `Olá ${cliente.nome}, aqui é da ${empresa.nome}. Segue o orçamento solicitado no valor total de ${total}. Orçamento Nº ${numeroOrcamento.current}. Estou à disposição para qualquer dúvida.`
    );
    
    window.open(`https://wa.me/${telefone}?text=${mensagem}`, '_blank');
  };

  const handleEnviarEmail = async () => {
    if (!cliente.email) {
      alert('Digite o email do cliente para enviar!');
      return;
    }

    setEmailStatus('Enviando email...');

    // Gerar o PDF primeiro
    const orcamento: Orcamento = {
      id: numeroOrcamento.current,
      cliente,
      itens,
      observacoes,
      data: new Date(),
      empresa
    };

    try {
      // Salvar o orçamento
      if (!orcamentos.some(orc => orc.id === orcamento.id)) {
        setOrcamentos(prev => [...prev, orcamento]);
      }

      // Gerar o PDF e enviar por email usando mailto do Gmail
      await generatePDF(orcamento, orcamentoRef.current, false);
      
      const total = calcularTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const assunto = encodeURIComponent(`Orçamento ${numeroOrcamento.current} - ${empresa.nome}`);
      const corpo = encodeURIComponent(
        `Olá ${cliente.nome},\n\n` +
        `Segue em anexo o orçamento solicitado no valor total de ${total}.\n\n` +
        `Orçamento Nº ${numeroOrcamento.current}.\n\n` +
        `Qualquer dúvida estamos à disposição.\n\n` +
        `Atenciosamente,\n${empresa.nome}\n${empresa.telefone}`
      );
      
      // Abrir Gmail diretamente com URL específica
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${cliente.email}&su=${assunto}&body=${corpo}`, '_blank');
      
      setEmailStatus('Email preparado no Gmail! Anexe o PDF baixado.');
      
      // Limpar mensagem após alguns segundos
      setTimeout(() => {
        setEmailStatus(null);
      }, 5000);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      setEmailStatus('Erro ao preparar email.');
      
      setTimeout(() => {
        setEmailStatus(null);
      }, 5000);
    }
  };

  const formatarMoeda = (valor: number) => {
    return `R$ ${valor.toString().replace('.', ',')}`;
  };

  const limparFormulario = () => {
    if (confirm('Deseja criar um novo orçamento? Os dados atuais serão limpos.')) {
      setCliente({ nome: '' });
      setItens([]);
      setObservacoes('');
      numeroOrcamento.current = getNextOrcamentoNumber();
    }
  };

  return (
    <div className="container">
      <div className="mb-8">
        <h1>Sistema de Orçamentos</h1>
        <div className="flex justify-between">
          <button
            className="btn btn-secondary"
            onClick={limparFormulario}
          >
            Novo Orçamento
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setMostrarConfiguracoes(!mostrarConfiguracoes)}
          >
            {mostrarConfiguracoes ? 'Fechar Configurações' : 'Configurar Empresa'}
          </button>
        </div>
      </div>

      {mostrarConfiguracoes && (
        <div className="card mb-6">
          <h2 className="mb-4">Dados da Empresa</h2>
          <div className="grid grid-cols-1 grid-cols-2 mb-6">
            <div className="form-group">
              <label className="form-label">Nome da Empresa</label>
              <input 
                type="text" 
                name="nome" 
                className="form-input"
                value={empresa.nome}
                onChange={handleEmpresaChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">CNPJ</label>
              <input 
                type="text" 
                name="cnpj" 
                className="form-input"
                value={empresa.cnpj}
                onChange={handleEmpresaChange}
                placeholder="00.000.000/0000-00"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input 
                type="tel" 
                name="telefone" 
                className="form-input"
                value={empresa.telefone}
                onChange={handleEmpresaChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input 
                type="email" 
                name="email" 
                className="form-input"
                value={empresa.email}
                onChange={handleEmpresaChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Formulário de Orçamento */}
      <div className="card mb-6">
        <h2 className="mb-4">Dados do Cliente</h2>
        
        <div className="grid grid-cols-1 grid-cols-2 mb-6">
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input 
              type="text" 
              name="nome" 
              className="form-input"
              value={cliente.nome}
              onChange={handleClienteChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">WhatsApp</label>
            <input 
              type="tel" 
              name="whatsapp" 
              className="form-input"
              value={cliente.whatsapp || ''}
              onChange={handleClienteChange}
              placeholder="(99) 99999-9999"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 mb-4">
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input 
              type="email" 
              name="email" 
              className="form-input"
              value={cliente.email || ''}
              onChange={handleClienteChange}
              placeholder="cliente@exemplo.com"
            />
          </div>
        </div>
      </div>
      
      {/* Adicionar Itens */}
      <BudgetItemForm onAddItem={handleAddItem} />
      
      {/* Visualização do Orçamento */}
      <div 
        ref={orcamentoRef}
        id="orcamento-preview" 
        className="card mt-6 orcamento-document"
      >
        {/* Cabeçalho do Orçamento */}
        <div className="orcamento-header mb-6">
          <div className="flex">
            <div className="empresa-info">
              <h2>{empresa.nome}</h2>
              {empresa.cnpj && <p><strong>CNPJ:</strong> {empresa.cnpj}</p>}
              <p>
                {empresa.telefone && <span>{empresa.telefone}</span>}
                {empresa.email && <span> • {empresa.email}</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="orcamento-title text-center mb-6">
          <h2 className="orcamento-heading">ORÇAMENTO</h2>
          <p className="orcamento-number">Nº {numeroOrcamento.current}</p>
          <p className="orcamento-date">Data: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        
        {cliente.nome && (
          <div className="mb-6 cliente-section">
            <h3 className="mb-2 section-title">CLIENTE</h3>
            <div className="cliente-data">
              <p><strong>Nome:</strong> {cliente.nome}</p>
              {cliente.whatsapp && <p><strong>WhatsApp:</strong> {cliente.whatsapp}</p>}
              {cliente.email && <p><strong>E-mail:</strong> {cliente.email}</p>}
            </div>
          </div>
        )}
        
        <div className="mb-6 itens-section">
          <h3 className="mb-2 section-title">ITENS DO ORÇAMENTO</h3>
          
          {itens.length === 0 ? (
            <p className="no-items">Nenhum item adicionado</p>
          ) : (
            <div className="items-table-container">
              <table border={1} cellPadding={10} cellSpacing={0} style={{width: '100%', borderCollapse: 'collapse'}}>
                <tr style={{backgroundColor: '#2980b9', color: 'white'}}>
                  <td width="60" align="center">Item</td>
                  <td align="left">Descrição</td>
                  <td width="60" align="center">Qtd.</td>
                  <td width="100" align="right">Preço Unit.</td>
                  <td width="100" align="right">Subtotal</td>
                  <td width="100" align="center">Ações</td>
                </tr>
                {itens.map((item, index) => (
                  <tr key={item.id}>
                    <td align="center">{index + 1}</td>
                    <td align="left">
                      <div className="item-content">
                        <span className="item-descricao">{item.descricao}</span>
                        {item.detalhes && <span className="item-detalhes"> - {item.detalhes}</span>}
                      </div>
                    </td>
                    <td align="center">{item.quantidade}</td>
                    <td align="right">{formatarMoeda(item.precoUnitario)}</td>
                    <td align="right">{formatarMoeda(calcularSubtotal(item))}</td>
                    <td align="center">
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="btn btn-danger"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
                <tr style={{borderTop: '2px solid #e5e7eb'}}>
                  <td colSpan={4} align="right"><strong>TOTAL:</strong></td>
                  <td align="right" style={{position: 'relative'}}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: '#f9fafb',
                      zIndex: -1
                    }}></div>
                    <span style={{color: '#2563EB', fontWeight: 'bold'}}>{formatarMoeda(calcularTotal())}</span>
                  </td>
                  <td></td>
                </tr>
              </table>
            </div>
          )}
        </div>
        
        <div className="mb-6 observacoes-section">
          <h3 className="mb-2 section-title">OBSERVAÇÕES</h3>
          <textarea
            className="form-textarea observacoes-textarea"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Validade do orçamento, prazo de entrega, forma de pagamento..."
          ></textarea>
        </div>
        
        <div className="assinatura-section">
          <div className="assinatura-linha"></div>
          <p className="assinatura-nome">{empresa.nome}</p>
        </div>
      </div>
      
      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6 buttons-container">
        <button
          onClick={handleGerarPDF}
          disabled={itens.length === 0 || !cliente.nome}
          className="btn btn-success btn-large"
        >
          <span className="mr-2">📄</span> Gerar PDF
        </button>
        
        <button
          onClick={handleEnviarWhatsApp}
          disabled={itens.length === 0 || !cliente.nome || !cliente.whatsapp}
          className="btn btn-success btn-large"
        >
          <span className="mr-2">📱</span> Enviar por WhatsApp
        </button>
        
        <button
          onClick={handleEnviarEmail}
          disabled={itens.length === 0 || !cliente.nome || !cliente.email}
          className="btn btn-success btn-large"
        >
          <span className="mr-2">📧</span> Enviar por Gmail
        </button>
      </div>
      
      {emailStatus && (
        <div className="mt-4 text-center">
          <p className="email-status">{emailStatus}</p>
        </div>
      )}
    </div>
  );
};

export default NewBudget; 