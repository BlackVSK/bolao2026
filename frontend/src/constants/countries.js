// Código ISO 3166-1 alpha-2 de cada país
// A bandeira é renderizada via <img src={flagUrl(code)} /> — funciona em todos os sistemas
export const flagUrl = (code) =>
  `https://flagcdn.com/w40/${code.toLowerCase()}.png`

export const COUNTRIES = [
  // Anfitriões
  { name: "Canadá",                  code: "ca" },
  { name: "Estados Unidos",          code: "us" },
  { name: "México",                  code: "mx" },
  // AFC
  { name: "Arábia Saudita",          code: "sa" },
  { name: "Austrália",               code: "au" },
  { name: "Catar",                   code: "qa" },
  { name: "Coreia do Sul",           code: "kr" },
  { name: "Irã",                     code: "ir" },
  { name: "Iraque",                  code: "iq" },
  { name: "Japão",                   code: "jp" },
  { name: "Jordânia",                code: "jo" },
  { name: "Uzbequistão",             code: "uz" },
  // CAF
  { name: "África do Sul",           code: "za" },
  { name: "Argélia",                 code: "dz" },
  { name: "Cabo Verde",              code: "cv" },
  { name: "Costa do Marfim",         code: "ci" },
  { name: "Egito",                   code: "eg" },
  { name: "Gana",                    code: "gh" },
  { name: "Marrocos",                code: "ma" },
  { name: "RD do Congo",             code: "cd" },
  { name: "Senegal",                 code: "sn" },
  { name: "Tunísia",                 code: "tn" },
  // CONMEBOL
  { name: "Argentina",               code: "ar" },
  { name: "Brasil",                  code: "br" },
  { name: "Colômbia",                code: "co" },
  { name: "Equador",                 code: "ec" },
  { name: "Paraguai",                code: "py" },
  { name: "Uruguai",                 code: "uy" },
  // OFC
  { name: "Nova Zelândia",           code: "nz" },
  // UEFA
  { name: "Alemanha",                code: "de" },
  { name: "Áustria",                 code: "at" },
  { name: "Bélgica",                 code: "be" },
  { name: "Bósnia e Herzegovina",    code: "ba" },
  { name: "Croácia",                 code: "hr" },
  { name: "Escócia",                 code: "gb-sct" },
  { name: "Espanha",                 code: "es" },
  { name: "França",                  code: "fr" },
  { name: "Holanda",                 code: "nl" },
  { name: "Inglaterra",              code: "gb-eng" },
  { name: "Noruega",                 code: "no" },
  { name: "Portugal",                code: "pt" },
  { name: "República Tcheca",        code: "cz" },
  { name: "Suécia",                  code: "se" },
  { name: "Suíça",                   code: "ch" },
  { name: "Turquia",                 code: "tr" },
  // CONCACAF
  { name: "Curaçau",                 code: "cw" },
  { name: "Haiti",                   code: "ht" },
  { name: "Panamá",                  code: "pa" },
].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
