const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Cria conexão com o banco de dados
const db = new sqlite3.Database(path.join(__dirname, "empresas.db"));

// Inicializa o banco de dados
function initDatabase() {
  db.serialize(() => {
    // Cria a tabela se não existir
    db.run(`CREATE TABLE IF NOT EXISTS empresas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            cnpj TEXT NOT NULL UNIQUE
        )`);

    // Array com os dados das empresas
    const empresas = [
      {
        nome: "V P REPRESENTACOES LTDA",
        cnpj: "46.347.851/0001-06",
      },
      {
        nome: "V. DE L. FLORES E L. DA S. FLORES E I. M. B. DA SILVA LTDA",
        cnpj: "57.029.047/0001-03",
      },
      {
        nome: "VALDEMIR ALCANTARA",
        cnpj: "26.581.728/0001-48",
      },
      {
        nome: "VERZIGNASSI OTICA E RELOJOARIA LTDA",
        cnpj: "54.942.668/0001-87",
      },
      {
        nome: "TAMARA DE ANDRADE",
        cnpj: "28.281.785/0001-37",
      },
      {
        nome: "CONFINA SERVIÇOS DE AGROPECUARIA LTDA",
        cnpj: "32.103.941/0001-47",
      },

      /* {
                nome: '',
                cnpj: ''
            },
            /* {
                nome: '',
                cnpj: ''
            },
             {
                nome: '',
                cnpj: ''
            },*/
    ];

    // Insere as empresas no banco de dados
    const stmt = db.prepare(
      "INSERT OR IGNORE INTO empresas (nome, cnpj) VALUES (?, ?)"
    );
    empresas.forEach((empresa) => {
      stmt.run(empresa.nome, empresa.cnpj);
    });
    stmt.finalize();
  });
}

// Função para buscar todas as empresas
function getAllEmpresas() {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM empresas", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Função para buscar empresa por CNPJ
function getEmpresaByCNPJ(cnpj) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM empresas WHERE cnpj = ?", [cnpj], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

module.exports = {
  initDatabase,
  getAllEmpresas,
  getEmpresaByCNPJ,
  db,
};
