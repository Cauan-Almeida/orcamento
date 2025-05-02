import './App.css';
import { useState, useEffect } from 'react';
import ClientForm from './components/ClientForm';
import Budget from './components/Budget';
import { Orcamento, Cliente, ItemOrcamento, Empresa } from './types';
import { v4 as uuidv4 } from 'uuid';
import { generatePDF } from './utils/pdfGenerator';
import BudgetHistory from './pages/BudgetHistory';
import CompanyConfig from './components/CompanyConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faFileInvoice, faCog } from '@fortawesome/free-solid-svg-icons';

function App() {
  const [cliente, setCliente] = useState<Cliente>({ nome: '', telefone: '', email: '' });
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [showHistoryPage, setShowHistoryPage] = useState(false);
  const [showCompanyConfig, setShowCompanyConfig] = useState(false);
  const [transitionClass, setTransitionClass] = useState('');
  const [empresa, setEmpresa] = useState<Empresa>({
    nome: 'Empresa Exemplo',
    cnpj: '00.000.000/0001-00',
    telefone: '(00) 0000-0000',
    email: 'contato@empresa.com',
    endereco: 'Rua Exemplo, 123 - Cidade - UF'
  });

  // Carregar dados salvos no localStorage ao iniciar
  useEffect(() => {
    // Carregar dados do cliente
    const savedCliente = localStorage.getItem('lastCliente');
    if (savedCliente) {
      try {
        setCliente(JSON.parse(savedCliente));
      } catch (e) {
        console.error('Erro ao carregar cliente:', e);
      }
    }

    // Carregar dados da empresa
    const savedEmpresa = localStorage.getItem('dadosEmpresa');
    if (savedEmpresa) {
      try {
        setEmpresa(JSON.parse(savedEmpresa));
      } catch (e) {
        console.error('Erro ao carregar dados da empresa:', e);
      }
    }
  }, []);

  const handleClienteSubmit = (clienteData: Cliente) => {
    setCliente(clienteData);
    localStorage.setItem('lastCliente', JSON.stringify(clienteData));
  };

  const handleEmpresaSubmit = (empresaData: Empresa) => {
    setEmpresa(empresaData);
    localStorage.setItem('dadosEmpresa', JSON.stringify(empresaData));
    setShowCompanyConfig(false);
  };

  const handleItensChange = (novosItens: ItemOrcamento[]) => {
    setItens(novosItens);
  };

  const handleObservacoesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setObservacoes(e.target.value);
  };

  // Função para salvar orçamento no histórico/localStorage
  const salvarOrcamentoNoHistorico = () => {
    if (!cliente.nome || itens.length === 0) {
      alert('Por favor, preencha os dados do cliente e adicione pelo menos um item ao orçamento.');
      return false;
    }

    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const contadorKey = `orcamento_contador_${anoAtual}`;
    let orcamentosAntigos = localStorage.getItem('orcamentos');
    let proximoNumero = 1;

    if (orcamentosAntigos) {
      try {
        const orcamentos = JSON.parse(orcamentosAntigos);
        const orcamentosDoAnoAtual = orcamentos.filter((orc: Orcamento) => {
          const dataOrc = new Date(orc.data);
          return dataOrc.getFullYear() === anoAtual;
        });
        if (orcamentosDoAnoAtual.length > 0) {
          proximoNumero = orcamentosDoAnoAtual.reduce((max: number, orc: Orcamento) => {
            const numeroOrcamento = orc.numeroOrcamento;
            if (numeroOrcamento) {
              const partes = numeroOrcamento.split('/');
              if (partes.length === 2) {
                const num = parseInt(partes[1], 10);
                return num > max ? num : max;
              }
            }
            return max;
          }, 0) + 1;
        }
      } catch (e) {
        const savedContador = localStorage.getItem(contadorKey);
        if (savedContador) {
          proximoNumero = parseInt(savedContador, 10) + 1;
        }
      }
    }

    const numeroFormatado = `${anoAtual}/${proximoNumero.toString().padStart(3, '0')}`;
    localStorage.setItem(contadorKey, proximoNumero.toString());

    const novoOrcamento: Orcamento = {
      id: uuidv4(),
      numeroOrcamento: numeroFormatado,
      cliente,
      itens,
      observacoes,
      data: dataAtual,
      empresa
    };

    let orcamentos = [];
    if (orcamentosAntigos) {
      try {
        orcamentos = JSON.parse(orcamentosAntigos);
      } catch (e) {}
    }
    orcamentos.push(novoOrcamento);
    localStorage.setItem('orcamentos', JSON.stringify(orcamentos));
    return true;
  };

  const limparFormulario = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados do formulário?')) {
      setItens([]);
      setObservacoes('');
    }
  };

  const handleSelectBudget = (orcamento: Orcamento) => {
    setCliente(orcamento.cliente);
    setItens(orcamento.itens);
    setObservacoes(orcamento.observacoes || '');
    setShowHistoryPage(false);
  };

  const toggleHistoryPage = () => {
    if (!showHistoryPage) {
      // Mostrar a página de histórico com animação
      setTransitionClass('slide-in');
      setShowHistoryPage(true);
      setShowCompanyConfig(false);
    } else {
      // Esconder a página de histórico com animação
      setTransitionClass('slide-out');
      setTimeout(() => {
        setShowHistoryPage(false);
      }, 300); // Tempo da animação
    }
  };

  const toggleCompanyConfig = () => {
    if (!showCompanyConfig) {
      setShowCompanyConfig(true);
      setShowHistoryPage(false);
    } else {
      setShowCompanyConfig(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Gerador de Orçamentos</h1>
        <div className="header-buttons">
          <button 
            className="btn btn-secondary"
            onClick={toggleCompanyConfig}
            title="Configurações da empresa"
          >
            <FontAwesomeIcon icon={faCog} /> Empresa
          </button>
          <button 
            className="btn btn-secondary"
            onClick={toggleHistoryPage}
            title="Ver histórico de orçamentos"
          >
            <FontAwesomeIcon icon={faHistory} /> Histórico
          </button>
        </div>
      </header>

      {showHistoryPage ? (
        <div className={`history-container ${transitionClass}`}>
          <BudgetHistory 
            onSelectBudget={handleSelectBudget} 
            onClose={toggleHistoryPage} 
          />
        </div>
      ) : showCompanyConfig ? (
        <div className="company-config-container">
          <CompanyConfig 
            empresa={empresa} 
            onSubmit={handleEmpresaSubmit} 
            onCancel={() => setShowCompanyConfig(false)} 
          />
        </div>
      ) : (
        <div className="main-content">
          <div className="form-section">
            <h2>Dados do Cliente</h2>
            <ClientForm cliente={cliente} onSubmit={handleClienteSubmit} />
          </div>

          <div className="budget-section">
            <h2>Orçamento</h2>
            <Budget 
              itens={itens} 
              observacoes={observacoes}
              onItensChange={handleItensChange} 
              onObservacoesChange={handleObservacoesChange} 
            />
          </div>

          <div className="actions-section">
            <button className="btn btn-primary btn-large" onClick={() => {
              if (salvarOrcamentoNoHistorico()) {
                alert('Orçamento salvo com sucesso!');
                setItens([]);
                setObservacoes('');
              }
            }}>
              <FontAwesomeIcon icon={faFileInvoice} /> Salvar Orçamento
            </button>
            <button className="btn btn-success btn-large" onClick={() => {
              if (salvarOrcamentoNoHistorico()) {
                const orcamentos = JSON.parse(localStorage.getItem('orcamentos') || '[]');
                const ultimoOrcamento = orcamentos[orcamentos.length - 1];
                generatePDF(ultimoOrcamento, () => {
                  if (window.confirm('PDF gerado e orçamento salvo! Deseja limpar o formulário para criar um novo orçamento?')) {
                    setItens([]);
                    setObservacoes('');
                  }
                });
              }
            }}>
              <FontAwesomeIcon icon={faFileInvoice} /> Gerar PDF
            </button>
            <button className="btn btn-danger" onClick={limparFormulario}>
              Limpar Formulário
            </button>
            <button
              className="btn btn-success"
              onClick={() => {
                if (!cliente.telefone) {
                  alert('Preencha o telefone do cliente!');
                  return;
                }
                const telefone = cliente.telefone.replace(/\D/g, '');
                const mensagem = encodeURIComponent(
                  `Olá ${cliente.nome}, segue o detalhamento do seu orçamento:\n\n` +
                  itens.map((item, idx) =>
                    `${idx + 1}. ${item.descricao} - Qtd: ${item.quantidade}`
                  ).join('\n') +
                  `\n\nObservações: ${observacoes || '-'}\n\nAtenciosamente,\n${empresa.nome}`
                );
                window.open(`https://wa.me/55${telefone}?text=${mensagem}`, '_blank');
              }}
              disabled={itens.length === 0 || !cliente.nome || !cliente.telefone}
            >
              <FontAwesomeIcon icon={faFileInvoice} /> Enviar orçamento por WhatsApp
            </button>
            <button
              className="btn btn-success"
              onClick={() => {
                if (!cliente.email) {
                  alert('Preencha o e-mail do cliente!');
                  return;
                }
                const destinatario = cliente.email;
                const assunto = encodeURIComponent('Orçamento solicitado');
                const corpo = encodeURIComponent(
                  `Olá ${cliente.nome},\n\nSegue o detalhamento do seu orçamento:\n\n` +
                  itens.map((item, idx) =>
                    `${idx + 1}. ${item.descricao} - Qtd: ${item.quantidade}`
                  ).join('\n') +
                  `\n\nObservações: ${observacoes || '-'}\n\nAtenciosamente,\n${empresa.nome}`
                );
                window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${destinatario}&su=${assunto}&body=${corpo}`, '_blank');
              }}
              disabled={itens.length === 0 || !cliente.nome || !cliente.email}
            >
              <FontAwesomeIcon icon={faFileInvoice} /> Enviar orçamento por Gmail
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
