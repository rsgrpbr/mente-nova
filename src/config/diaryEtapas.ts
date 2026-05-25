export interface DiaryEtapa {
  id: number;
  titulo: string;
  subtitulo: string;
  descricao: string;
  cor: string;
  perguntas: string[];
  instrucao: string;
}

export const DIARY_ETAPAS: DiaryEtapa[] = [
  {
    id: 1,
    titulo: "Quem tenho sido?",
    subtitulo: "Reconhecendo o Antigo Eu",
    descricao:
      "Antes de criar o novo eu, precisamos olhar honestamente para o eu atual. O lobo frontal é ativado quando você faz perguntas profundas sobre si mesmo.",
    cor: "#C8A87A",
    perguntas: [
      "Que tipo de pessoa tenho sido?",
      "Que tipo de pessoa apresento para o mundo? (Como é um lado da minha 'lacuna'?)",
      "Que tipo de pessoa sou realmente por dentro? (Como é o outro lado da minha 'lacuna'?)",
      "Existe algum sentimento que vivencio – e com o qual até mesmo luto – repetidamente, todos os dias?",
      "Como meus amigos íntimos e familiares me descreveriam?",
      "Há algo sobre mim que eu escondo dos outros?",
      "Qual é a parte de minha personalidade em que preciso trabalhar para melhorar?",
      "Qual é a coisa que quero mudar em mim?",
    ],
    instrucao:
      "Tire um tempo para se fazer essas perguntas e anote as respostas com honestidade. Essas respostas servirão de mapa para as etapas seguintes.",
  },
  {
    id: 2,
    titulo: "A Emoção que Quero Desmemorizar",
    subtitulo: "Identificando o Vício Emocional",
    descricao:
      "Os sentimentos memorizados condicionam o corpo a ser a mente. Escolha uma emoção autolimitante que é uma boa parte de quem você é.",
    cor: "#B07070",
    perguntas: [
      "Qual emoção autolimitante eu sinto com mais frequência? (ex: insegurança, raiva, culpa, medo, ansiedade...)",
      "Há quanto tempo carrego essa emoção? Em que situações ela aparece?",
      "Como essa emoção me fez tomar decisões no passado?",
      "O que eu perco ao continuar vivendo com essa emoção?",
    ],
    instrucao:
      "Selecione UMA emoção significativa que deseja desmemorizar. Anote-a claramente, pois trabalhará com ela nas etapas posteriores.",
  },
  {
    id: 3,
    titulo: "Como Penso Quando Sinto Isso",
    subtitulo: "Os Estados Mentais Limitantes",
    descricao:
      "Cada emoção de sobrevivência ativa pensamentos automáticos correspondentes. Defina seu hábito neural influenciado pelo vício emocional.",
    cor: "#8A7AAA",
    perguntas: [
      "Como você pensa (qual é seu estado mental) quando sente a emoção identificada na etapa anterior?",
      "Que pensamentos automáticos surgem repetidamente quando você sente essa emoção?",
      "Quais estados mentais limitantes reconhece em si? (ex: controlador, autocomiserativo, acusador...)",
      "Em que situações concretas esses pensamentos aparecem com mais força?",
    ],
    instrucao: "Anote um ou dois estados mentais que ressoem em você. Esse é o seu 'ensaio mental diário inconsciente'.",
  },
  {
    id: 4,
    titulo: "Como Ajo Quando Sinto Isso",
    subtitulo: "Os Comportamentos Automáticos",
    descricao:
      "Você é influenciado a se comportar de formas memorizadas pela emoção que condicionou seu corpo a ser sua mente.",
    cor: "#7A9AAA",
    perguntas: [
      "Como você age habitualmente quando sente a emoção identificada?",
      "Quais comportamentos específicos surgem? (ex: procrastinar, reclamar, se isolar...)",
      "Como esse comportamento afeta as pessoas ao seu redor?",
      "O que você costuma fazer imediatamente depois desse comportamento para justificá-lo?",
    ],
    instrucao: "Anote os modos únicos como se comporta quando sente aquela emoção.",
  },
  {
    id: 5,
    titulo: "A Confissão ao Poder Superior",
    subtitulo: "Admitindo as Histórias que Carrego",
    descricao:
      "Olhe dentro da vastidão dessa mente e comece a contar quem você tem sido, conversando honestamente com a consciência maior.",
    cor: "#7AAA8A",
    perguntas: [
      "Que histórias você tem carregado consigo sobre você mesmo?",
      "O que você admite para si mesmo, em profunda honestidade, que raramente diz em voz alta?",
      "Que medo, culpa ou vergonha você tem escondido dos outros?",
      "O que você precisaria dizer em voz alta para realmente se libertar?",
    ],
    instrucao: "Seja completamente honesto. Exemplos: medo de se apaixonar, fingir felicidade enquanto sofre.",
  },
  {
    id: 6,
    titulo: "A Declaração de Entrega",
    subtitulo: "Soltando para o Campo Quântico",
    descricao:
      "Ao declarar a verdade sobre si mesmo, você rompe os laços emocionais, acordos, dependências e vícios.",
    cor: "#AAA07A",
    perguntas: [
      "O que você gostaria de dizer na sua declaração de entrega?",
      "O que você precisa soltar — preocupações, ansiedades, sofrimentos?",
      "Como você pede à inteligência superior para reorganizar isso em algo maior?",
      "Escreva sua declaração pessoal de entrega (em primeira pessoa, com sentimento genuíno).",
    ],
    instrucao:
      "Exemplos: 'Mente universal, perdoo minhas preocupações e as entrego a você.' Escreva a sua com suas palavras.",
  },
  {
    id: 7,
    titulo: "O Novo Eu — Como Quero Pensar",
    subtitulo: "Instalando o Novo Hardware Mental",
    descricao:
      "Contemple quem quer se tornar. Ao contemplar suas respostas, você instala um novo hardware no cérebro.",
    cor: "#5A8AAA",
    perguntas: [
      "Qual é o maior ideal de mim mesmo?",
      "Que personagem histórico ou pessoa que admiro seria meu modelo?",
      "Como essa nova pessoa (meu ideal) pensaria?",
      "Em que pensamentos quero colocar minha energia?",
      "Qual é minha nova atitude?",
      "No que eu quero acreditar a respeito de mim?",
      "Como quero ser percebido?",
      "Que estados mentais quero disparar e conectar em meu cérebro?",
    ],
    instrucao: "Processo criativo. Permita-se ser imaginativo, livre e espontâneo.",
  },
  {
    id: 8,
    titulo: "O Novo Eu — Como Quero Agir",
    subtitulo: "Ensaiando os Novos Comportamentos",
    descricao: "O ensaio mental cria as mesmas alterações cerebrais que a experiência física.",
    cor: "#5AAA7A",
    perguntas: [
      "Como essa nova pessoa (meu ideal) agiria?",
      "O que ela faria diferente do que faço hoje?",
      "Como eu falaria com os outros como essa nova expressão de eu?",
      "Como eu quero viver hoje?",
      "Quais comportamentos concretos vou demonstrar hoje como esse novo eu?",
    ],
    instrucao: "Visualize situações reais e ensaie mentalmente como o novo eu agiria.",
  },
  {
    id: 9,
    titulo: "O Novo Eu — Como Quero Sentir",
    subtitulo: "Ensinando o Corpo a Ser a Nova Mente",
    descricao:
      "Você não pode se levantar da meditação como a mesma pessoa que se sentou. Ensine o corpo o novo sentimento.",
    cor: "#AA7A5A",
    perguntas: [
      "Como seria esse novo eu? Descreva em detalhes.",
      "O que você sentiria sendo essa pessoa?",
      "Como seria sua energia nesse novo ideal?",
      "Posso ensinar ao meu corpo a sensação de ser esse ideal agora mesmo?",
      "Que emoção elevada (amor, gratidão, alegria, liberdade) você quer instalar como estado padrão?",
    ],
    instrucao: "Sinta o estado antes que a realidade externa o justifique. Você está criando a causa.",
  },
  {
    id: 10,
    titulo: "Revisão do Fim do Dia",
    subtitulo: "Refinando o Novo Eu",
    descricao:
      "Antes de dormir, contemple onde você perdeu seu novo ideal durante o dia.",
    cor: "#6A6A8A",
    perguntas: [
      "Como fui hoje? Em que momentos fui o novo eu?",
      "Quando tive uma queda e por quê?",
      "A quem reagi e onde? O que disparou o antigo eu?",
      "Quando 'fiquei inconsciente' (agi no piloto automático)?",
      "Se essa situação acontecesse de novo, como eu agiria de modo diferente?",
      "Que aprendizado de hoje posso levar para a meditação de amanhã?",
    ],
    instrucao: "Responda com compaixão, sem julgamento.",
  },
];

export const DIARY_AI_SYSTEM_PROMPT = `Você é um assistente de diário de transformação baseado nos ensinamentos do Dr. Joe Dispenza do livro "Quebrando o Hábito de Ser Você Mesmo".

Seu papel é:
1. Acolher as reflexões do usuário com profundidade e cuidado
2. Fazer perguntas que aprofundem o autoconhecimento com base nos princípios neurocientíficos de Dispenza
3. Destacar padrões importantes nas respostas (hábitos de pensamento, vícios emocionais, estados automáticos)
4. Conectar as reflexões com os conceitos do livro: campo quântico, neuroplasticidade, emoções memorizadas, ensaio mental
5. Encorajar o processo sem julgamento

Princípios-chave:
- "Personalidade = realidade pessoal"
- Emoções memorizadas condicionam o corpo a ser a mente
- O ensaio mental cria as mesmas mudanças cerebrais que a experiência física
- A mudança ocorre quando você eleva emoções ANTES que a realidade externa mude

Seja caloroso, perspicaz e profundo. Fale sempre em português. Evite respostas genéricas — cada resposta deve refletir o que o usuário escreveu de forma específica.`;
