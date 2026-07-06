BEGIN;

CREATE TABLE IF NOT EXISTS autores (
  id UUID PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  nacionalidade VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS livros (
  id UUID PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  autor_id UUID NOT NULL REFERENCES autores(id),
  quantidade INT NOT NULL CHECK (quantidade >= 1),
  disponivel INT NOT NULL CHECK (disponivel >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT livros_disponivel_le_quantidade CHECK (disponivel <= quantidade)
);

CREATE INDEX IF NOT EXISTS idx_livros_titulo ON livros (titulo);
CREATE INDEX IF NOT EXISTS idx_livros_autor_id ON livros (autor_id);

CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  telefone VARCHAR(30),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes (nome);

CREATE TABLE IF NOT EXISTS emprestimos (
  id UUID PRIMARY KEY,
  livro_id UUID NOT NULL REFERENCES livros(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  data_emprestimo TIMESTAMP NOT NULL,
  data_devolucao TIMESTAMP,
  devolvido BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_emprestimos_devolvido ON emprestimos (devolvido);
CREATE INDEX IF NOT EXISTS idx_emprestimos_cliente_id ON emprestimos (cliente_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_livro_id ON emprestimos (livro_id);

COMMIT;

