CREATE TABLE IF NOT EXISTS barbearias (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS servicos (
  id SERIAL PRIMARY KEY,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  nome TEXT NOT NULL,
  duracao INTEGER NOT NULL,
  preco NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS horarios (
  id SERIAL PRIMARY KEY,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  data DATE NOT NULL,
  hora TEXT NOT NULL,
  disponivel BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id SERIAL PRIMARY KEY,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  data DATE NOT NULL,
  hora TEXT NOT NULL,
  servico TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmado',
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planos_assinatura (
  id SERIAL PRIMARY KEY,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  nome TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  cortes_inclusos INTEGER NOT NULL,
  validade_dias INTEGER NOT NULL DEFAULT 30,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes_assinatura (
  id SERIAL PRIMARY KEY,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  plano_id INTEGER NOT NULL REFERENCES planos_assinatura(id),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  data_adesao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  status_pagamento TEXT NOT NULL DEFAULT 'pendente',
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagamentos_assinatura (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes_assinatura(id) ON DELETE CASCADE,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  valor NUMERIC(10,2) NOT NULL,
  competencia TEXT NOT NULL,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pago',
  metodo TEXT NOT NULL DEFAULT 'manual',
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagamentos_atendimento (
  id SERIAL PRIMARY KEY,
  agendamento_id INTEGER NOT NULL UNIQUE REFERENCES agendamentos(id) ON DELETE CASCADE,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  servico TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pago',
  metodo TEXT NOT NULL DEFAULT 'presencial',
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consumos_assinatura (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes_assinatura(id) ON DELETE CASCADE,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  data_consumo DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT NOT NULL DEFAULT 'Corte',
  quantidade INTEGER NOT NULL DEFAULT 1,
  agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lembretes (
  id SERIAL PRIMARY KEY,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  referencia_tipo TEXT NOT NULL,
  referencia_id INTEGER NOT NULL,
  categoria TEXT NOT NULL,
  telefone TEXT NOT NULL,
  nome_cliente TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  agendado_para TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  tentativas INTEGER NOT NULL DEFAULT 0,
  ultimo_erro TEXT,
  enviado_em TIMESTAMP,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_horarios_data ON horarios(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_servicos_barbearia_id ON servicos(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_horarios_barbearia_id ON horarios(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_barbearia_id ON agendamentos(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_planos_assinatura_barbearia ON planos_assinatura(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_clientes_assinatura_barbearia ON clientes_assinatura(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_clientes_assinatura_plano_id ON clientes_assinatura(plano_id);
CREATE INDEX IF NOT EXISTS idx_clientes_assinatura_vencimento ON clientes_assinatura(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_assinatura_cliente ON pagamentos_assinatura(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_assinatura_barbearia_id ON pagamentos_assinatura(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_atendimento_agendamento ON pagamentos_atendimento(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_atendimento_barbearia_id ON pagamentos_atendimento(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_atendimento_data ON pagamentos_atendimento(data_pagamento, criado_em);
CREATE INDEX IF NOT EXISTS idx_consumos_assinatura_cliente ON consumos_assinatura(cliente_id);
CREATE INDEX IF NOT EXISTS idx_consumos_assinatura_agendamento_id ON consumos_assinatura(agendamento_id);
CREATE INDEX IF NOT EXISTS idx_consumos_assinatura_barbearia_id ON consumos_assinatura(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_pendentes ON lembretes(status, agendado_para);
CREATE INDEX IF NOT EXISTS idx_lembretes_barbearia_id ON lembretes(barbearia_id);

ALTER TABLE barbearias ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_assinatura ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes_assinatura ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_assinatura ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_atendimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumos_assinatura ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembretes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deny_client_access_on_barbearias ON barbearias;
CREATE POLICY deny_client_access_on_barbearias
  ON barbearias
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS deny_client_access_on_servicos ON servicos;
CREATE POLICY deny_client_access_on_servicos
  ON servicos
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS deny_client_access_on_horarios ON horarios;
CREATE POLICY deny_client_access_on_horarios
  ON horarios
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS deny_client_access_on_agendamentos ON agendamentos;
CREATE POLICY deny_client_access_on_agendamentos
  ON agendamentos
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS deny_client_access_on_planos_assinatura ON planos_assinatura;
CREATE POLICY deny_client_access_on_planos_assinatura
  ON planos_assinatura
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS deny_client_access_on_clientes_assinatura ON clientes_assinatura;
CREATE POLICY deny_client_access_on_clientes_assinatura
  ON clientes_assinatura
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS deny_client_access_on_pagamentos_assinatura ON pagamentos_assinatura;
CREATE POLICY deny_client_access_on_pagamentos_assinatura
  ON pagamentos_assinatura
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS deny_client_access_on_pagamentos_atendimento ON pagamentos_atendimento;
CREATE POLICY deny_client_access_on_pagamentos_atendimento
  ON pagamentos_atendimento
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS deny_client_access_on_consumos_assinatura ON consumos_assinatura;
CREATE POLICY deny_client_access_on_consumos_assinatura
  ON consumos_assinatura
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS deny_client_access_on_lembretes ON lembretes;
CREATE POLICY deny_client_access_on_lembretes
  ON lembretes
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
