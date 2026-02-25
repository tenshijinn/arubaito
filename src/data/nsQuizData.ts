export interface BookOption {
  title: string;
  author: string;
  cover: string;
  alignment: 'aligned' | 'neutral' | 'opposite';
  description?: string;
}

export interface QuizPair {
  id: number;
  bookA: BookOption;
  bookB: BookOption;
}

export const PASS_THRESHOLD = 8;
export const TIMER_SECONDS = 60;
export const TOTAL_QUESTIONS = 17;

export const quizPairs: QuizPair[] = [
  {
    id: 1,
    bookA: {
      title: "How Innovation Works",
      author: "Matt Ridley",
      cover: "/ns/covers/how-innovation-works.jpg",
      alignment: "aligned",
      description: "Argues innovation is a gradual, bottom-up process driven by trial and error, recombination, and free markets — not top-down planning or heroic inventors.",
    },
    bookB: {
      title: "The Entrepreneurial State",
      author: "Mariana Mazzucato",
      cover: "/ns/covers/the-entrepreneurial-state.jpg",
      alignment: "opposite",
      description: "Makes the case that governments, not private entrepreneurs, have been the primary drivers of transformative innovation through bold public investment.",
    },
  },
  {
    id: 2,
    bookA: {
      title: "Where Is My Flying Car?",
      author: "J. Storrs Hall",
      cover: "/ns/covers/where-is-my-flying-car.jpg",
      alignment: "aligned",
      description: "Explores why the technological progress predicted in the mid-20th century stalled, blaming regulatory capture and cultural pessimism for slowing innovation.",
    },
    bookB: {
      title: "Small Is Beautiful",
      author: "E.F. Schumacher",
      cover: "/ns/covers/small-is-beautiful.jpg",
      alignment: "neutral",
      description: "Advocates for human-scale, decentralized economics and appropriate technology over industrialized growth and large-scale production systems.",
    },
  },
  {
    id: 3,
    bookA: {
      title: "AI Superpowers",
      author: "Kai-Fu Lee",
      cover: "/ns/covers/ai-superpowers.jpg",
      alignment: "aligned",
      description: "Examines the US-China AI race, arguing that data abundance and entrepreneurial energy will shape the future of artificial intelligence and global power.",
    },
    bookB: {
      title: "The Age of Surveillance Capitalism",
      author: "Shoshana Zuboff",
      cover: "/ns/covers/the-age-of-surveillance-capitalism.jpg",
      alignment: "opposite",
      description: "Warns that tech companies are exploiting behavioral data to predict and control human behavior, creating a new form of capitalist extraction.",
    },
  },
  {
    id: 4,
    bookA: {
      title: "The Sovereign Individual",
      author: "James Dale Davidson & William Rees-Mogg",
      cover: "/ns/covers/the-sovereign-individual.jpeg",
      alignment: "aligned",
      description: "Predicts the rise of individuals empowered by technology to transcend nation-state control, with digital money and borderless commerce reshaping society.",
    },
    bookB: {
      title: "The People's Republic of Walmart",
      author: "Leigh Phillips & Michal Rozworski",
      cover: "/ns/covers/peoples-republic-of-walmart.jpg",
      alignment: "opposite",
      description: "Argues that large corporations like Walmart already practice central planning internally, suggesting democratic planning could work for entire economies.",
    },
  },
  {
    id: 5,
    bookA: {
      title: "The Feynman Lectures on Physics",
      author: "Richard Feynman",
      cover: "/ns/covers/feynman-lectures.jpg",
      alignment: "aligned",
      description: "A foundational physics textbook celebrated for its clarity and first-principles approach, emphasizing empirical rigor and the beauty of natural laws.",
    },
    bookB: {
      title: "Against Method",
      author: "Paul Feyerabend",
      cover: "/ns/covers/against-method.jpg",
      alignment: "opposite",
      description: "Argues that science has no single method and that rigid methodological rules hinder discovery, advocating an 'anything goes' epistemological anarchism.",
    },
  },
  {
    id: 6,
    bookA: {
      title: "The Knowledge",
      author: "Lewis Dartnell",
      cover: "/ns/covers/the-knowledge.jpg",
      alignment: "aligned",
      description: "A guide to rebuilding civilization from scratch, cataloguing the essential scientific and technical knowledge needed to restart after an apocalypse.",
    },
    bookB: {
      title: "The Collapse of Complex Societies",
      author: "Joseph Tainter",
      cover: "/ns/covers/the-collapse-of-complex-societies.jpg",
      alignment: "opposite",
      description: "Theorizes that societies collapse when increasing complexity yields diminishing returns, making simplification an economically rational response.",
    },
  },
  {
    id: 7,
    bookA: {
      title: "Who We Are and How We Got Here",
      author: "David Reich",
      cover: "/ns/covers/who-we-are-and-how-we-got-here.jpg",
      alignment: "aligned",
      description: "Uses ancient DNA analysis to reveal the deep history of human migration and mixture, showing that populations are far more mixed than previously assumed.",
    },
    bookB: {
      title: "Not in Our Genes",
      author: "Lewontin, Rose & Kamin",
      cover: "/ns/covers/not-in-our-genes.jpg",
      alignment: "neutral",
      description: "Critiques biological determinism and the misuse of genetics to justify social inequality, arguing for complex interactions between genes, environment, and society.",
    },
  },
  {
    id: 8,
    bookA: {
      title: "The Princeton Companion to Mathematics",
      author: "Timothy Gowers",
      cover: "/ns/covers/princeton-companion-math.jpg",
      alignment: "aligned",
      description: "A comprehensive survey of modern mathematics, covering its concepts, branches, theorems, and history in an accessible yet rigorous manner.",
    },
    bookB: {
      title: "What Is Mathematics, Really?",
      author: "Reuben Hersh",
      cover: "/ns/covers/what-is-mathematics-really.jpg",
      alignment: "opposite",
      description: "Challenges Platonism by arguing mathematics is a social-cultural activity — a human creation shaped by history, not a discovery of eternal truths.",
    },
  },
  {
    id: 9,
    bookA: {
      title: "Three Felonies a Day",
      author: "Harvey Silverglate",
      cover: "/ns/covers/three-felonies-a-day.jpg",
      alignment: "aligned",
      description: "Exposes how vague federal laws enable prosecutors to criminalize ordinary behavior, arguing the average American unknowingly commits multiple felonies daily.",
    },
    bookB: {
      title: "The New Jim Crow",
      author: "Michelle Alexander",
      cover: "/ns/covers/the-new-jim-crow.jpg",
      alignment: "opposite",
      description: "Argues that mass incarceration in the United States functions as a racial caste system, disproportionately targeting Black communities through the War on Drugs.",
    },
  },
  {
    id: 10,
    bookA: {
      title: "The Grey Lady Winked",
      author: "Ashley Rindsberg",
      cover: "/ns/covers/the-grey-lady-winked.jpg",
      alignment: "aligned",
      description: "Documents a history of journalistic failures and ideological bias at The New York Times, questioning the reliability of mainstream institutional media.",
    },
    bookB: {
      title: "Manufacturing Consent",
      author: "Noam Chomsky & Edward S. Herman",
      cover: "/ns/covers/manufacturing-consent.jpg",
      alignment: "opposite",
      description: "Introduces the 'propaganda model' showing how mass media serves elite interests through filters of ownership, advertising, sourcing, and ideology.",
    },
  },
  {
    id: 11,
    bookA: {
      title: "Reputation and Power",
      author: "Daniel Carpenter",
      cover: "/ns/covers/reputation-and-power.png",
      alignment: "aligned",
      description: "Analyzes how the FDA built and wielded bureaucratic power through reputation, showing how institutional credibility shapes regulatory authority and policy.",
    },
    bookB: {
      title: "The Dictator's Handbook",
      author: "Bruce Bueno de Mesquita & Alastair Smith",
      cover: "/ns/covers/dictators-handbook.png",
      alignment: "opposite",
      description: "Reveals that all leaders — democratic or autocratic — follow the same rules of political survival, prioritizing key supporters over public welfare.",
    },
  },
  {
    id: 12,
    bookA: {
      title: "Seeing Like a State",
      author: "James C. Scott",
      cover: "/ns/covers/seeing-like-a-state.jpg",
      alignment: "aligned",
      description: "Shows how states impose legibility through standardization and simplification, often destroying local knowledge and causing catastrophic failures.",
    },
    bookB: {
      title: "State-Building",
      author: "Francis Fukuyama",
      cover: "/ns/covers/state-building.png",
      alignment: "opposite",
      description: "Argues that strong, well-governed institutions are essential for development and that weak states are the source of many global problems.",
    },
  },
  {
    id: 13,
    bookA: {
      title: "The Communistic Societies of the United States",
      author: "Charles Nordhoff",
      cover: "/ns/covers/communistic-societies-us.jpg",
      alignment: "aligned",
      description: "A 19th-century study of intentional communities in America, documenting how voluntary communal living experiments organized work, property, and governance.",
    },
    bookB: {
      title: "Atlas Shrugged",
      author: "Ayn Rand",
      cover: "/ns/covers/atlas-shrugged.jpg",
      alignment: "opposite",
      description: "A novel depicting productive individuals withdrawing from a collectivist society, presenting Rand's philosophy of rational self-interest and laissez-faire capitalism.",
    },
  },
  {
    id: 14,
    bookA: {
      title: "The Significance of the Frontier in American History",
      author: "Frederick Jackson Turner",
      cover: "/ns/covers/significance-of-frontier.jpg",
      alignment: "aligned",
      description: "The influential thesis arguing that the American frontier shaped national character, democracy, and individualism through continuous westward expansion.",
    },
    bookB: {
      title: "Against the Grain",
      author: "James C. Scott",
      cover: "/ns/covers/against-the-grain.jpg",
      alignment: "aligned",
      description: "Challenges the narrative that agriculture was progress, arguing early states relied on coercion and that many people resisted settled grain-based life.",
    },
  },
  {
    id: 15,
    bookA: {
      title: "Principles for Dealing with the Changing World Order",
      author: "Ray Dalio",
      cover: "/ns/covers/changing-world-order.webp",
      alignment: "aligned",
      description: "Studies the rise and decline of reserve currencies and empires over 500 years to identify patterns that can predict the trajectory of the current world order.",
    },
    bookB: {
      title: "The Deficit Myth",
      author: "Stephanie Kelton",
      cover: "/ns/covers/the-deficit-myth.jpg",
      alignment: "opposite",
      description: "Argues that governments issuing their own currency can never 'run out of money' and that deficits are not inherently harmful, reframing fiscal policy.",
    },
  },
  {
    id: 16,
    bookA: {
      title: "From Third World to First",
      author: "Lee Kuan Yew",
      cover: "/ns/covers/from-third-world-to-first.jpg",
      alignment: "aligned",
      description: "Lee Kuan Yew's account of transforming Singapore from a developing country into a prosperous city-state through pragmatic governance and market economics.",
    },
    bookB: {
      title: "Seeing Like a State",
      author: "James C. Scott",
      cover: "/ns/covers/seeing-like-a-state.jpg",
      alignment: "aligned",
      description: "Shows how states impose legibility through standardization and simplification, often destroying local knowledge and causing catastrophic failures.",
    },
  },
  {
    id: 17,
    bookA: {
      title: "When Money Dies",
      author: "Adam Fergusson",
      cover: "/ns/covers/when-money-dies.jpg",
      alignment: "aligned",
      description: "Chronicles the hyperinflation of Weimar Germany, showing how monetary collapse destroyed savings, social order, and trust in institutions.",
    },
    bookB: {
      title: "The Price of Tomorrow",
      author: "Jeff Booth",
      cover: "/ns/covers/the-price-of-tomorrow.jpg",
      alignment: "aligned",
      description: "Argues technology is inherently deflationary and that governments fighting deflation with money printing creates an unsustainable economic system.",
    },
  },
];

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function scoreAnswer(book: BookOption): number {
  switch (book.alignment) {
    case "aligned": return 1;
    case "neutral": return 0.5;
    case "opposite": return 0;
  }
}
