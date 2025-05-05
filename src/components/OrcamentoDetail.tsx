import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { generatePDF } from '../utils/pdfGenerator';
import '../styles/OrcamentoDetail.css';
import ConnectionStatus from './ConnectionStatus';
import { useConfig } from '../context/ConfigContext';

// Interfaces para tipagem dos dados
interface Cliente {
  nome: string;
  telefone?: string;
  email?: string;
}

interface ItemOrcamento {
  id: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  unidade?: string;
}

interface Empresa {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

interface OrcamentoDetalhe {
  id: string;
  numeroOrcamento: string;
  cliente: Cliente;
  itens: ItemOrcamento[];
  observacoes?: string;
  dataCriacao: Date;
  valorTotal?: number;
  empresa?: Empresa;
  status?: 'Enviado' | 'Aprovado' | 'Recusado' | 'Pendente';
}

const OrcamentoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orcamento, setOrcamento] = useState<OrcamentoDetalhe | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { config } = useConfig();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          await loadOrcamento(user.uid, id as string);
        } catch (error) {
          console.error('Erro ao carregar orçamento:', error);
          setError(error instanceof Error ? error.message : 'Erro ao carregar o orçamento');
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [id, navigate]);

  // Função para gerar um número de orçamento temporário
  const gerarNumeroTemporario = (): string => {
    const ano = new Date().getFullYear();
    const contador = Math.floor(Math.random() * 900) + 100; // Gera um número entre 100 e 999
    return `${ano}/${contador.toString().padStart(3, '0')}`;
  };

  const loadOrcamento = async (userId: string, orcamentoId: string) => {
    try {
      const orcamentoRef = doc(db, 'users', userId, 'orcamentos', orcamentoId);
      const orcamentoDoc = await getDoc(orcamentoRef);

      if (orcamentoDoc.exists()) {
        const data = orcamentoDoc.data();
        
        // Converter data do Firestore para objeto Date
        let dataCriacao;
        if (data.dataCriacao && typeof data.dataCriacao.toDate === 'function') {
          // Se for um timestamp do Firestore
          dataCriacao = data.dataCriacao.toDate();
        } else if (data.dataCriacao instanceof Date) {
          // Se já for um objeto Date
          dataCriacao = data.dataCriacao;
        } else if (data.dataCriacao) {
          // Se for uma string de data ou timestamp
          dataCriacao = new Date(data.dataCriacao);
        } else {
          // Fallback para data atual
          dataCriacao = new Date();
        }
        
        setOrcamento({
          id: orcamentoDoc.id,
          ...data,
          numeroOrcamento: data.numeroOrcamento || gerarNumeroTemporario(),
          dataCriacao: dataCriacao
        } as OrcamentoDetalhe);
      } else {
        // Tenta recuperar do localStorage se estiver offline
        const offlineOrcamentos = JSON.parse(localStorage.getItem('offline_orcamentos') || '[]');
        const offlineOrcamento = offlineOrcamentos.find((o: any) => o.id === orcamentoId);
        
        if (offlineOrcamento) {
          setOrcamento({
            ...offlineOrcamento,
            numeroOrcamento: offlineOrcamento.numeroOrcamento || gerarNumeroTemporario(),
            dataCriacao: new Date(offlineOrcamento.data),
            status: 'Pendente (Offline)'
          } as OrcamentoDetalhe);
        } else {
          setError('Orçamento não encontrado');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error);
      
      // Se estiver offline, tentar recuperar do localStorage
      if (!navigator.onLine) {
        const offlineOrcamentos = JSON.parse(localStorage.getItem('offline_orcamentos') || '[]');
        const offlineOrcamento = offlineOrcamentos.find((o: any) => o.id === orcamentoId);
        
        if (offlineOrcamento) {
          setOrcamento({
            ...offlineOrcamento,
            dataCriacao: new Date(offlineOrcamento.data),
            status: 'Pendente (Offline)'
          } as OrcamentoDetalhe);
          return;
        }
      }
      
      throw error;
    }
  };

  const handleGerarPDF = () => {
    if (orcamento && userId) {
      // Preparar dados para o PDF
      const pdfOrcamento = {
        id: orcamento.id,
        numeroOrcamento: orcamento.numeroOrcamento,
        cliente: orcamento.cliente,
        itens: orcamento.itens,
        observacoes: orcamento.observacoes,
        data: orcamento.dataCriacao,
        empresa: orcamento.empresa,
        firestoreId: orcamento.id
      };
      
      // Gerar o PDF
      generatePDF(pdfOrcamento, userId, () => {
        alert('PDF gerado com sucesso!');
      });
    }
  };

  const handleEnviarWhatsApp = () => {
    if (orcamento && orcamento.cliente && orcamento.cliente.telefone) {
      const telefone = orcamento.cliente.telefone.replace(/\D/g, '');
      
      // Textos 
      const valorTotal = orcamento.valorTotal || 
        orcamento.itens.reduce((acc: number, item: ItemOrcamento) => acc + (item.precoUnitario * item.quantidade), 0);
      
      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valorTotal);
      
      const mensagem = encodeURIComponent(
        `Olá ${orcamento.cliente.nome}, segue o orçamento nº ${orcamento.numeroOrcamento}:\n\n` +
        orcamento.itens.map((item: ItemOrcamento, idx: number) =>
          `${idx + 1}. ${item.descricao} - Qtd: ${item.quantidade} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.precoUnitario)}`
        ).join('\n') +
        `\n\nValor Total: ${valorFormatado}` +
        `\n\nObservações: ${orcamento.observacoes || '-'}\n\nAtenciosamente,\n${orcamento.empresa?.nome || 'Empresa'}`
      );
      
      window.open(`https://wa.me/55${telefone}?text=${mensagem}`, '_blank');
    } else {
      alert('Cliente sem número de telefone cadastrado');
    }
  };

  const handleEnviarEmail = () => {
    if (orcamento && orcamento.cliente && orcamento.cliente.email) {
      const destinatario = orcamento.cliente.email;
      const assunto = encodeURIComponent(`Orçamento ${orcamento.numeroOrcamento || ''}`);
      
      // Textos 
      const valorTotal = orcamento.valorTotal || 
        orcamento.itens.reduce((acc: number, item: ItemOrcamento) => acc + (item.precoUnitario * item.quantidade), 0);
      
      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valorTotal);
      
      const corpo = encodeURIComponent(
        `Olá ${orcamento.cliente.nome},\n\nSegue o orçamento solicitado:\n\n` +
        orcamento.itens.map((item: ItemOrcamento, idx: number) =>
          `${idx + 1}. ${item.descricao} - Qtd: ${item.quantidade} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.precoUnitario)}`
        ).join('\n') +
        `\n\nValor Total: ${valorFormatado}` +
        `\n\nObservações: ${orcamento.observacoes || '-'}\n\nAtenciosamente,\n${orcamento.empresa?.nome || 'Empresa'}`
      );
      
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${destinatario}&su=${assunto}&body=${corpo}`, '_blank');
    } else {
      alert('Cliente sem e-mail cadastrado');
    }
  };

  // Função para obter as iniciais do nome
  const getInitials = (name: string) => {
    if (!name) return 'CL';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Função para gerar cor baseada no nome
  const getRandomColor = (name: string) => {
    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#d35400', '#34495e', '#16a085', '#c0392b'
    ];
    
    // Gerar um índice baseado no nome para sempre ter a mesma cor
    let hash = 0;
    for (let i = 0; i < (name || 'CL').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash % colors.length);
    return colors[index];
  };

  // Função para formatar valor monetário conforme configurações
  const formatarDinheiro = (valor: number) => {
    try {
      // Assegurar que o valor é um número
      const valorSeguro = isNaN(valor) ? 0 : valor;
      
      const moeda = config.formatoMonetario || 'BRL';
      const idioma = config.idioma || 'pt-BR';
      
      // Criar o formatador
      const formatter = new Intl.NumberFormat(idioma, {
        style: 'currency',
        currency: moeda,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
      });
      
      // Formatar o valor e substituir espaços por espaços não quebráveis
      let valorFormatado = formatter.format(valorSeguro);
      
      // Garantir que não haja quebra de linha ao substituir espaços por espaços não quebráveis
      valorFormatado = valorFormatado.replace(/ /g, '\u00A0');
      
      return valorFormatado;
    } catch (error) {
      console.error('Erro ao formatar valor monetário:', error);
      // Fallback simples para garantir consistência
      const symbol = 
        config.formatoMonetario === 'USD' ? '$' :
        config.formatoMonetario === 'EUR' ? '€' : 'R$';
      
      // Usar espaço não quebrável entre símbolo e valor
      return `${symbol}\u00A0${valor.toFixed(2).replace('.', ',')}`;
    }
  };

  // Função para formatar data conforme configurações
  const formatarData = (data: Date) => {
    if (!data || !(data instanceof Date) || isNaN(data.getTime())) {
      // Se a data for inválida, usar a data atual
      data = new Date();
    }
    
    try {
      return new Intl.DateTimeFormat(config.idioma, { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }).format(data);
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return data.toLocaleDateString('pt-BR');
    }
  };

  // Componente específico para valores monetários
  const ValorMonetario = ({ valor }: { valor: number }) => {
    const valorFormatado = formatarDinheiro(valor);
    // Usar caracteres não quebráveis para garantir que não haja quebra de linha
    const valorSemQuebra = valorFormatado.replace(/ /g, '\u00A0');
    return <span className="valor-formatado">{valorSemQuebra}</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando orçamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Erro!</h2>
        <p>{error}</p>
        <Link to="/dashboard" className="btn btn-primary">Voltar ao Dashboard</Link>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="error-container">
        <h2>Orçamento não encontrado</h2>
        <p>O orçamento que você está procurando não existe ou foi removido.</p>
        <Link to="/dashboard" className="btn btn-primary">Voltar ao Dashboard</Link>
      </div>
    );
  }

  const valorTotal = orcamento.valorTotal || 
    orcamento.itens.reduce((acc: number, item: ItemOrcamento) => acc + (item.precoUnitario * item.quantidade), 0);

  return (
    <div className="orcamento-detail-container">
      <ConnectionStatus />
      
      <div className="orcamento-header">
        <div className="orcamento-title">
          <h1>Orçamento #{orcamento.numeroOrcamento || `${new Date().getFullYear()}/${(Math.floor(Math.random() * 900) + 100)}`}</h1>
          <span className={`status-badge ${orcamento.status?.toLowerCase() || 'pendente'}`}>
            {orcamento.status || 'Pendente'}
          </span>
        </div>
        
        <div className="orcamento-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Voltar
          </button>
          <button className="btn btn-primary" onClick={handleGerarPDF}>
            Gerar PDF
          </button>
          <button className="btn btn-success" onClick={handleEnviarWhatsApp}>
            Enviar WhatsApp
          </button>
          <button className="btn btn-info" onClick={handleEnviarEmail}>
            Enviar Email
          </button>
          <button className="btn btn-warning" onClick={() => {
            alert("Orçamento salvo com sucesso!");
          }}>
            Salvar sem enviar
          </button>
        </div>
      </div>

      <div className="orcamento-content">
        <div className="orcamento-section">
          <h2>Dados do Cliente</h2>
          <div className="client-details">
            <div className="client-avatar" 
              style={{ backgroundColor: getRandomColor(orcamento.cliente.nome) }}>
              {getInitials(orcamento.cliente.nome)}
            </div>
            <div className="client-info">
              <div className="detail-row">
                <span className="detail-label">Nome:</span>
                <span className="detail-value">{orcamento.cliente.nome}</span>
              </div>
              {orcamento.cliente.telefone && (
                <div className="detail-row">
                  <span className="detail-label">Telefone:</span>
                  <span className="detail-value">{orcamento.cliente.telefone}</span>
                </div>
              )}
              {orcamento.cliente.email && (
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{orcamento.cliente.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="orcamento-section">
          <h2>Itens do Orçamento</h2>
          <div className="table-responsive">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Quantidade</th>
                  <th>Valor Unitário</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orcamento.itens.map((item: ItemOrcamento, index: number) => {
                  // Verificar se a descrição é apenas um número
                  const descricao = !isNaN(Number(item.descricao)) 
                    ? `Item ${item.descricao}` 
                    : item.descricao;
                    
                  return (
                    <tr key={index}>
                      <td>{descricao}</td>
                      <td>{item.quantidade}</td>
                      <td className="valor-cell">
                        <ValorMonetario valor={item.precoUnitario} />
                      </td>
                      <td className="valor-cell">
                        <ValorMonetario valor={item.precoUnitario * item.quantidade} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="total-label">Valor Total</td>
                  <td className="total-value">
                    <ValorMonetario valor={valorTotal} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {orcamento.observacoes && (
          <div className="orcamento-section">
            <h2>Observações</h2>
            <div className="observacoes-box">
              {orcamento.observacoes}
            </div>
          </div>
        )}

        <div className="orcamento-section info-adicionais">
          <h2>Informações Adicionais</h2>
          <div className="detail-row">
            <span className="detail-label">Data de Criação:</span>
            <span className="detail-value">
              {formatarData(orcamento.dataCriacao)}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Empresa:</span>
            <span className="detail-value">
              {orcamento.empresa?.nome || 'Não informada'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrcamentoDetail; 