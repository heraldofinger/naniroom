# Nani Room - Smart Layout 🛏️📐

Planejador de layout de quarto inteligente e interativo com visualização 2D arquitetônica e 3D realista, catálogo de móveis, personalização de medidas iniciais de paredes, portas e janelas, consultor de ergonomia e estimativa de orçamento.

![Nani Room - Smart Layout](https://raw.githubusercontent.com/placeholder-demo.png)

---

## ✨ Principais Funcionalidades

### 1. 📐 Personalização de Espaço & Medidas Iniciais
- **Paredes & Dimensões**: Configure a largura (paredes Norte/Sul), comprimento (paredes Leste/Oeste) e pé-direito (altura) em metros.
- **Portas de Entrada & Passagem**: Adicione múltiplas portas, escolha a parede, posição, largura da folha ($0{,}70\text{m}$ a $1{,}00\text{m}$) e sentido de abertura (para dentro/fora).
- **Janelas & Ventilação**: Defina posições, larguras e altura do peitoril de cada janela.
- **Acabamentos**: Revestimento de piso (Carvalho claro, Nogueira, Taco Espinha de Peixe, Travertino, Cimento queimado, Carpete) e paleta de tintas para paredes.

### 2. ✏️ Planta Baixa 2D Arquitetônica
- Grade métrica com alinhamento magnético (*snap* de $5\text{cm}$).
- Espessura real de paredes ($15\text{cm}$), cotas automáticas e arcos de abertura de portas.
- Ferramenta de régua de medição direta na tela.
- Faixas visuais de circulação livre recomendada.

### 3. 🧊 Visualização 3D Espacial (Three.js)
- Renderização PBR com iluminação solar e modo noturno acolhedor com luminárias acesas.
- Vãos e cortes arquitetônicos reais de portas e janelas com batentes, folha entreaberta, maçaneta, caixilharia de alumínio e vidro translúcido reflexivo.
- Presets de câmera: Isométrica, Planta Superior e Nível dos Olhos ($1{,}60\text{m}$).
- Captura de imagem em alta definição (PNG).

### 4. 🛋️ Catálogo de Móveis para Quarto
- **Camas**: Queen Size, Casal Padrão, King Size, Solteiro e Cama Baixa Japandi.
- **Armários & Armazenamento**: Roupeiros de 2 e 3 portas de correr, cômoda de gavetas e estantes.
- **Trabalho & Estudo**: Escrivaninhas para home office, cadeiras giratórias ergonômicas e penteadeiras com espelho.
- **Apoio & Decoração**: Mesas de cabeceira, poltronas de leitura, recamier, tapetes geométricos, painel com TV 55", vasos de plantas e luminárias.

### 5. 📏 Consultor de Ergonomia Arquitetônica
- Diagnóstico automático de fluxo e passagens livres.
- Alerta de obstrução de portas e colisões entre móveis.
- Cálculo de área total ($m^2$), área ocupada e percentual de circulação livre.

### 6. 💰 Orçamento & Exportação
- Lista de compras e estimativa de investimento em R$ com botão para imprimir ou copiar.
- Exportação e importação do projeto completo em formato JSON.

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- `npm` ou `pnpm` / `yarn`

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/SEU-USUARIO/nani-room-smart-layout.git

# 2. Acesse a pasta do projeto
cd nani-room-smart-layout

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Abra o navegador no endereço indicado (geralmente [http://localhost:3000](http://localhost:3000)).

### Build de Produção

```bash
npm run build
```

---

## 🛠️ Tecnologias Utilizadas

- **React 19**
- **TypeScript**
- **Three.js** (WebGL 3D Rendering & OrbitControls)
- **Tailwind CSS v4**
- **Vite**
- **Lucide Icons**
