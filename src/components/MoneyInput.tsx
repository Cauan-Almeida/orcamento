import React, { useState, useEffect } from 'react';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

const MoneyInput: React.FC<MoneyInputProps> = ({ 
  value, 
  onChange, 
  placeholder = 'R$ 0,00', 
  className = '' 
}) => {
  const [inputValue, setInputValue] = useState('');

  // Formata um número para o padrão brasileiro (1000 -> 1.000,00)
  const formatarParaBRL = (valor: number): string => {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Converte uma string no formato brasileiro para número
  const converterParaNumero = (texto: string): number => {
    // Remove R$, pontos e substitui vírgula por ponto
    const valorLimpo = texto
      .replace(/R\$\s?/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    
    return parseFloat(valorLimpo) || 0;
  };

  // Atualiza o campo quando o valor da prop mudar (ex: edição)
  useEffect(() => {
    // Só atualiza se o valor vier de fora (ex: edição de item)
    if (value !== converterParaNumero(inputValue)) {
      setInputValue(formatarParaBRL(value));
    }
    // eslint-disable-next-line
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoValor = e.target.value;
    
    // Permite apenas números, vírgulas, pontos e o símbolo R$
    const regex = /^[R$\s0-9.,]*$/;
    if (!regex.test(novoValor) && novoValor !== '') {
      return;
    }
    
    setInputValue(novoValor);
    
    // Converte para número e notifica o componente pai
    const valorNumerico = converterParaNumero(novoValor);
    onChange(valorNumerico);
  };

  const handleBlur = () => {
    if (inputValue === '') {
      return;
    }
    
    const valorNumerico = converterParaNumero(inputValue);
    setInputValue(formatarParaBRL(valorNumerico));
  };

  return (
    <div className={`money-input-container ${className}`}>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="preco-input form-input"
      />
    </div>
  );
};

export default MoneyInput; 