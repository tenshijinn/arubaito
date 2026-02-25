export interface BookOption {
  title: string;
  author: string;
  cover: string;
  alignment: 'aligned' | 'neutral' | 'opposite';
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
    },
    bookB: {
      title: "The Entrepreneurial State",
      author: "Mariana Mazzucato",
      cover: "/ns/covers/the-entrepreneurial-state.jpg",
      alignment: "opposite",
    },
  },
  {
    id: 2,
    bookA: {
      title: "Where Is My Flying Car?",
      author: "J. Storrs Hall",
      cover: "/ns/covers/where-is-my-flying-car.jpg",
      alignment: "aligned",
    },
    bookB: {
      title: "Small Is Beautiful",
      author: "E.F. Schumacher",
      cover: "/ns/covers/small-is-beautiful.jpg",
      alignment: "neutral",
    },
  },
  {
    id: 3,
    bookA: {
      title: "AI Superpowers",
      author: "Kai-Fu Lee",
      cover: "/ns/covers/ai-superpowers.png",
      alignment: "aligned",
    },
    bookB: {
      title: "The Age of Surveillance Capitalism",
      author: "Shoshana Zuboff",
      cover: "/ns/covers/the-age-of-surveillance-capitalism.jpg",
      alignment: "opposite",
    },
  },
  {
    id: 4,
    bookA: {
      title: "The Sovereign Individual",
      author: "James Dale Davidson & William Rees-Mogg",
      cover: "/ns/covers/the-sovereign-individual.jpeg",
      alignment: "aligned",
    },
    bookB: {
      title: "The People's Republic of Walmart",
      author: "Leigh Phillips & Michal Rozworski",
      cover: "/ns/covers/peoples-republic-of-walmart.jpg",
      alignment: "opposite",
    },
  },
  {
    id: 5,
    bookA: {
      title: "The Feynman Lectures on Physics",
      author: "Richard Feynman",
      cover: "/ns/covers/feynman-lectures.png",
      alignment: "aligned",
    },
    bookB: {
      title: "Against Method",
      author: "Paul Feyerabend",
      cover: "/ns/covers/against-method.png",
      alignment: "opposite",
    },
  },
  {
    id: 6,
    bookA: {
      title: "The Knowledge",
      author: "Lewis Dartnell",
      cover: "/ns/covers/the-knowledge.jpg",
      alignment: "aligned",
    },
    bookB: {
      title: "The Collapse of Complex Societies",
      author: "Joseph Tainter",
      cover: "/ns/covers/the-collapse-of-complex-societies.jpg",
      alignment: "opposite",
    },
  },
  {
    id: 7,
    bookA: {
      title: "Who We Are and How We Got Here",
      author: "David Reich",
      cover: "/ns/covers/who-we-are-and-how-we-got-here.jpg",
      alignment: "aligned",
    },
    bookB: {
      title: "Not in Our Genes",
      author: "Lewontin, Rose & Kamin",
      cover: "/ns/covers/not-in-our-genes.png",
      alignment: "neutral",
    },
  },
  {
    id: 8,
    bookA: {
      title: "The Princeton Companion to Mathematics",
      author: "Timothy Gowers",
      cover: "/ns/covers/princeton-companion-math.jpg",
      alignment: "aligned",
    },
    bookB: {
      title: "What Is Mathematics, Really?",
      author: "Reuben Hersh",
      cover: "/ns/covers/what-is-mathematics-really.jpg",
      alignment: "opposite",
    },
  },
  {
    id: 9,
    bookA: {
      title: "Three Felonies a Day",
      author: "Harvey Silverglate",
      cover: "/ns/covers/three-felonies-a-day.jpg",
      alignment: "aligned",
    },
    bookB: {
      title: "The New Jim Crow",
      author: "Michelle Alexander",
      cover: "/ns/covers/the-new-jim-crow.jpg",
      alignment: "opposite",
    },
  },
  {
    id: 10,
    bookA: {
      title: "The Grey Lady Winked",
      author: "Ashley Rindsberg",
      cover: "/ns/covers/the-grey-lady-winked.jpg",
      alignment: "aligned",
    },
    bookB: {
      title: "Manufacturing Consent",
      author: "Noam Chomsky & Edward S. Herman",
      cover: "/ns/covers/manufacturing-consent.png",
      alignment: "opposite",
    },
  },
  {
    id: 11,
    bookA: {
      title: "Reputation and Power",
      author: "Daniel Carpenter",
      cover: "/ns/covers/reputation-and-power.png",
      alignment: "aligned",
    },
    bookB: {
      title: "The Dictator's Handbook",
      author: "Bruce Bueno de Mesquita & Alastair Smith",
      cover: "/ns/covers/dictators-handbook.png",
      alignment: "opposite",
    },
  },
  {
    id: 12,
    bookA: {
      title: "Seeing Like a State",
      author: "James C. Scott",
      cover: "/ns/covers/seeing-like-a-state.jpg",
      alignment: "aligned",
    },
    bookB: {
      title: "State-Building",
      author: "Francis Fukuyama",
      cover: "/ns/covers/state-building.png",
      alignment: "opposite",
    },
  },
  {
    id: 13,
    bookA: {
      title: "The Communistic Societies of the United States",
      author: "Charles Nordhoff",
      cover: "/ns/covers/communistic-societies-us.jpg",
      alignment: "aligned",
    },
    bookB: {
      title: "Atlas Shrugged",
      author: "Ayn Rand",
      cover: "/ns/covers/atlas-shrugged.png",
      alignment: "opposite",
    },
  },
  {
    id: 14,
    bookA: {
      title: "The Significance of the Frontier in American History",
      author: "Frederick Jackson Turner",
      cover: "/ns/covers/significance-of-frontier.jpg",
      alignment: "aligned",
    },
    bookB: {
      title: "Against the Grain",
      author: "James C. Scott",
      cover: "/ns/covers/against-the-grain.jpg",
      alignment: "aligned",
    },
  },
  {
    id: 15,
    bookA: {
      title: "Principles for Dealing with the Changing World Order",
      author: "Ray Dalio",
      cover: "/ns/covers/changing-world-order.webp",
      alignment: "aligned",
    },
    bookB: {
      title: "The Deficit Myth",
      author: "Stephanie Kelton",
      cover: "/ns/covers/the-deficit-myth.jpg",
      alignment: "opposite",
    },
  },
  {
    id: 16,
    bookA: {
      title: "From Third World to First",
      author: "Lee Kuan Yew",
      cover: "/ns/covers/from-third-world-to-first.png",
      alignment: "aligned",
    },
    bookB: {
      title: "Seeing Like a State",
      author: "James C. Scott",
      cover: "/ns/covers/seeing-like-a-state.jpg",
      alignment: "aligned",
    },
  },
  {
    id: 17,
    bookA: {
      title: "When Money Dies",
      author: "Adam Fergusson",
      cover: "/ns/covers/when-money-dies.jpg",
      alignment: "aligned",
    },
    bookB: {
      title: "The Price of Tomorrow",
      author: "Jeff Booth",
      cover: "/ns/covers/the-price-of-tomorrow.jpg",
      alignment: "aligned",
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
