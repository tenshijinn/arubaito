export interface PresetCategory {
  name: string;
  prompts: string[];
}

export const talentPresets: PresetCategory[] = [
  {
    name: "JOB SEARCH",
    prompts: [
      "find me web3 jobs matching my skills",
      "show remote blockchain dev positions",
      "looking for defi opportunities",
      "entry-level web3 roles"
    ]
  },
  {
    name: "TASKS",
    prompts: [
      "show available web3 tasks",
      "find quick bounties",
      "smart contract auditing tasks"
    ]
  },
  {
    name: "CONTRIBUTE",
    prompts: [
      "submit job opportunity",
      "submit task i found",
      "share new opportunity"
    ]
  },
  {
    name: "MY PROFILE",
    prompts: [
      "check my points",
      "show submission history",
      "view my stats"
    ]
  }
];

export const employerPresets: PresetCategory[] = [
  {
    name: "FIND TALENT",
    prompts: [
      "find react devs with web3 exp",
      "show solidity experts",
      "frontend dev familiar with defi",
      "designers with nft experience"
    ]
  },
  {
    name: "POST OPPORTUNITIES",
    prompts: [
      "post job opening",
      "post task",
      "list smart contract role"
    ]
  },
  {
    name: "BROWSE",
    prompts: [
      "show top talent",
      "browse developers",
      "find verified web3 pros"
    ]
  }
];

export const getPresetsForMode = (mode: 'talent' | 'employer'): PresetCategory[] => {
  return mode === 'talent' ? talentPresets : employerPresets;
};

export const getWelcomePresets = (mode: 'talent' | 'employer'): string[] => {
  const presets = getPresetsForMode(mode);
  // Get first preset from each category for welcome screen
  return presets.map(category => category.prompts[0]);
};
