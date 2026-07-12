// Remote image assets to replace later with owned/local files:
// - https://ext.same-assets.com/1560170732/4204020783.webp
// - https://ext.same-assets.com/1560170732/3744010572.webp
// - https://ext.same-assets.com/1560170732/2527038437.webp
// - https://ext.same-assets.com/1560170732/4075116294.webp

export type Article = {
  title: string;
  excerpt: string;
  category: "Research" | "Opinion" | "Recruiting" | "Comment-Letter" | "Legal";
  href: string;
  image?: string;
};

export const featuredWriting: Article[] = [
  {
    title: "In Defense of Exponentials",
    category: "Opinion",
    href: "https://writing.dragonfly.xyz/post/in-defense-of-exponentials",
    image: "https://ext.same-assets.com/1560170732/4204020783.webp",
    excerpt:
      "I used to tell founders, the reaction you are going to get to your launch is not hate, it's indifference. By default, nobody cares...",
  },
  {
    title: "Stablecoins and the Collapse of the Legacy Payment Model",
    category: "Opinion",
    href: "https://writing.dragonfly.xyz/post/stablecoins-and-the-collapse-of-the-legacy-payment-model",
    image: "https://ext.same-assets.com/1560170732/3744010572.webp",
    excerpt:
      "Stablecoins aren't just an improvement on or connective tissue for existing payment rails, they allow companies to bypass those...",
  },
  {
    title: "The Agentic Economy Will Be Massive. Agentic Commerce Won't",
    category: "Opinion",
    href: "https://writing.dragonfly.xyz/post/the-agentic-economy-will-be-massive-agentic-commerce-won-t",
    image: "https://ext.same-assets.com/1560170732/2527038437.webp",
    excerpt:
      "Whenever an emerging narrative enters the public discourse, the prevailing thesis gets reduced to its most memetic form...",
  },
  {
    title: "(Re) Introducing Dragonfly",
    category: "Research",
    href: "https://writing.dragonfly.xyz/post/re-introducing-dragonfly",
    image: "https://ext.same-assets.com/1560170732/4075116294.webp",
    excerpt:
      "Dragonfly includes Dragonfly Ventures, Dragonfly Liquid, and now Metastable, the oldest crypto hedge fund, which we recently acquired...",
  },
];

export const allContent: Article[] = [
  {
    title: "Dragonfly's State of Airdrops Report 2025",
    category: "Research",
    href: "https://airdropreport2025.dragonfly.xyz/",
    excerpt:
      "We analyzed data from over 12 airdrops (11 geoblocked airdrops and 1 non-geoblocked airdrop as a control) that conducted airdro...",
  },
  {
    title: "In Defense of Exponentials",
    category: "Opinion",
    href: "https://writing.dragonfly.xyz/post/in-defense-of-exponentials",
    excerpt:
      "I used to tell founders, the reaction you are going to get to your launch is not hate, it's indifference. By...",
  },
  {
    title: "The Comprehensive Guide to Token Compensation",
    category: "Recruiting",
    href: "https://writing.dragonfly.xyz/post/the-comprehensive-guide-to-token-compensation",
    excerpt:
      "Designing token-based compensation is a hard problem, especially given token liquidity and the...",
  },
  {
    title: "Dragonfly's 2023 Crypto Compensation Report",
    category: "Recruiting",
    href: "https://dccr23.dragonfly.xyz/",
    excerpt:
      "Crypto moves fast, and industry compensation data is scarce — especially comprehensive...",
  },
  {
    title:
      "Stablecoin Payments from the Ground Up: A $94 Billion Study by Artemis, Castle Island, and Dragonfly",
    category: "Research",
    href: "https://reports.artemisanalytics.com/stablecoins/",
    excerpt:
      "Stablecoins have quickly become a credible alternative to traditional payment and settlement...",
  },
  {
    title: "(Re) Introducing Dragonfly",
    category: "Research",
    href: "https://writing.dragonfly.xyz/post/re-introducing-dragonfly",
    excerpt:
      "Dragonfly includes Dragonfly Ventures, Dragonfly Liquid, and now Metastable, the oldest crypto...",
  },
  {
    title: "The Agentic Economy Will Be Massive. Agentic Commerce Won't",
    category: "Opinion",
    href: "https://writing.dragonfly.xyz/post/the-agentic-economy-will-be-massive-agentic-commerce-won-t",
    excerpt:
      "Whenever an emerging narrative enters the public discourse, the prevailing thesis gets reduced to its...",
  },
  {
    title: "2024/2025 Crypto Compensation Report",
    category: "Recruiting",
    href: "https://dccr.dragonfly.xyz/report",
    excerpt:
      "Compensation is one of the most common topics we're asked about by the Dragonfly portfolio (and...",
  },
  {
    title: "Comment Letter on the SEC's Proposed Custody Rule",
    category: "Comment-Letter",
    href: "#",
    excerpt:
      "We submitted a formal response to the proposed changes affecting qualified custodians and digital asset...",
  },
  {
    title: "Disclosures & Regulatory Framework",
    category: "Legal",
    href: "#",
    excerpt:
      "An overview of Dragonfly's approach to compliance, disclosures, and the evolving regulatory environment...",
  },
];

export type TeamMember = { name: string; title: string };

export const team: TeamMember[] = [
  { name: "Haseeb Qureshi", title: "Managing Partner" },
  { name: "Bo Feng", title: "Managing Partner" },
  { name: "Tom Schmidt", title: "General Partner" },
  { name: "Rob Hadick", title: "General Partner" },
  { name: "Gengmo Qi", title: "Partner" },
  { name: "Omar Kanji", title: "Partner" },
  { name: "Elton Chang", title: "Junior Partner" },
  {
    name: "Casey Taylor",
    title: "Platform Partner & Global Head of Founder Support",
  },
  { name: "Tony Li", title: "Portfolio Support Partner - Asia" },
  { name: "Amal M", title: "Portfolio Support" },
  { name: "Hildebert Mouli", title: "Head of Data Science" },
  { name: "Joshua Lim", title: "Liquid Portfolio Analyst" },
  { name: "Heather Bailey", title: "Head of Events" },
  { name: "Lindsay Lin", title: "COO" },
  { name: "Sylvia Liu", title: "CFO" },
  { name: "Scott Hershorin", title: "CCO" },
  { name: "Chen Yuan", title: "General Counsel" },
  { name: "Bryan Edelman", title: "Associate General Counsel" },
  { name: "Peter Shin", title: "Associate General Counsel" },
  { name: "Kelly Johnson", title: "Director of Compliance" },
  { name: "Matt Moore", title: "Head of Security" },
  { name: "Michal Ulmer", title: "Senior Investor Relations Associate" },
  { name: "Michael Derbin", title: "Senior Portfolio Controller" },
  { name: "Xinyi Pan", title: "Portfolio Controller" },
  { name: "April Li", title: "Portfolio Controller" },
  { name: "Hannah Zeng", title: "Legal Operations Manager" },
  { name: "Zoe Tang", title: "Senior Finance Manager" },
  { name: "Elaine Leong", title: "Finance Manager" },
  { name: "Demetrios Stellatos", title: "Tax Adviser" },
  { name: "Lisa Kinard", title: "Head of People" },
  { name: "Zack Skelly", title: "Head of Talent" },
  { name: "Chris Ahsing", title: "Talent Partner" },
  { name: "Richard Rodairos", title: "Talent Partner" },
  { name: "Alex Han", title: "Talent Partner" },
  { name: "Elicia Ng", title: "Singapore HR & Admin Manager" },
  { name: "Nadia Ferrari", title: "Executive Assistant" },
  { name: "Di Zhang", title: "Executive Assistant" },
  { name: "Catherine Gebron", title: "Executive Assistant" },
  { name: "David Kastner", title: "Senior Operations Manager" },
  { name: "Eileen Cangany", title: "Business Operations Associate" },
  { name: "Phillip Bodine", title: "Social Media Manager" },
];

export type Category =
  | "CeFi"
  | "DeFi"
  | "Infrastructure"
  | "L1/L2s"
  | "NFT"
  | "Stablecoin";

export const spotlight: { name: string; category: Category }[] = [
  { name: "Bybit", category: "CeFi" },
  { name: "Near Foundation", category: "L1/L2s" },
  { name: "Dune Analytics", category: "Infrastructure" },
  { name: "Ethena", category: "Stablecoin" },
  { name: "Agora", category: "Stablecoin" },
  { name: "Polymarket", category: "Infrastructure" },
  { name: "Rain", category: "Stablecoin" },
  { name: "MegaEth", category: "L1/L2s" },
  { name: "Monad", category: "L1/L2s" },
];

export type PortfolioCompany = { name: string; category: Category };

export const portfolio: PortfolioCompany[] = [
  { name: "1inch Network", category: "DeFi" },
  { name: "Aevo", category: "DeFi" },
  { name: "Afriex", category: "Stablecoin" },
  { name: "Agora", category: "Stablecoin" },
  { name: "Alliance DAO", category: "Infrastructure" },
  { name: "Amber Group", category: "CeFi" },
  { name: "Anchorage Digital", category: "CeFi" },
  { name: "Ancient8", category: "L1/L2s" },
  { name: "Andrena", category: "Infrastructure" },
  { name: "Animoca Brands", category: "NFT" },
  { name: "ApeX Protocol", category: "DeFi" },
  { name: "Aptos", category: "L1/L2s" },
  { name: "ARCx", category: "DeFi" },
  { name: "Artemis", category: "Infrastructure" },
  { name: "August", category: "Infrastructure" },
  { name: "Aurora", category: "L1/L2s" },
  { name: "Avail", category: "Infrastructure" },
  { name: "Avalanche", category: "L1/L2s" },
  { name: "Axelar Network", category: "Infrastructure" },
  { name: "BENQI", category: "DeFi" },
  { name: "BIT", category: "CeFi" },
  { name: "Bitget", category: "CeFi" },
  { name: "BloXroute Labs", category: "Infrastructure" },
  { name: "Blur", category: "NFT" },
  { name: "Bybit", category: "CeFi" },
  { name: "Caldera", category: "Infrastructure" },
  { name: "Celo", category: "L1/L2s" },
  { name: "Codex", category: "Stablecoin" },
  { name: "Coin Metrics", category: "Infrastructure" },
  { name: "Common", category: "Infrastructure" },
  { name: "Commonware", category: "Infrastructure" },
  { name: "Compound Labs", category: "DeFi" },
  { name: "Conduit", category: "Infrastructure" },
  { name: "Consensys", category: "Infrastructure" },
  { name: "Context", category: "Infrastructure" },
  { name: "Cosmos", category: "L1/L2s" },
  { name: "Cozy Finance", category: "DeFi" },
  { name: "Crusoe", category: "Infrastructure" },
  { name: "CryptoSlam", category: "NFT" },
  { name: "DeBank", category: "DeFi" },
  { name: "DerivaDEX", category: "DeFi" },
  { name: "Domination Finance", category: "DeFi" },
  { name: "DoubleZero", category: "Infrastructure" },
  { name: "Drakula", category: "NFT" },
  { name: "Dune Analytics", category: "Infrastructure" },
  { name: "dYdX", category: "DeFi" },
  { name: "Eigenlayer", category: "Infrastructure" },
  { name: "Ethena", category: "Stablecoin" },
  { name: "Ethlas", category: "NFT" },
  { name: "Everyrealm", category: "NFT" },
  { name: "Exo", category: "Infrastructure" },
  { name: "Fantasy Top", category: "NFT" },
  { name: "Flashbots", category: "Infrastructure" },
  { name: "Florida Street", category: "CeFi" },
  { name: "Frax", category: "Stablecoin" },
  { name: "Galactic Holdings", category: "CeFi" },
  { name: "Galxe", category: "Infrastructure" },
  { name: "Gauntlet", category: "DeFi" },
  { name: "Gelato", category: "Infrastructure" },
  { name: "Goldsky", category: "Infrastructure" },
  { name: "Hashflow", category: "DeFi" },
  { name: "Hello.Trade", category: "DeFi" },
  { name: "Hibachi", category: "DeFi" },
  { name: "Hopscotch", category: "DeFi" },
  { name: "InfStones", category: "Infrastructure" },
  { name: "Internet Game", category: "NFT" },
  { name: "Inversion", category: "Infrastructure" },
  { name: "Kaito", category: "Infrastructure" },
  { name: "Li.Finance", category: "DeFi" },
  { name: "Lido", category: "DeFi" },
  { name: "Lighter", category: "DeFi" },
  { name: "MakerDAO", category: "Stablecoin" },
  { name: "Matter Labs", category: "L1/L2s" },
  { name: "Medallion", category: "Infrastructure" },
  { name: "MegaEth", category: "L1/L2s" },
  { name: "Megapot", category: "DeFi" },
  { name: "Mesh", category: "Infrastructure" },
  { name: "MetaPool", category: "DeFi" },
  { name: "Metatheory", category: "NFT" },
  { name: "Monad", category: "L1/L2s" },
  { name: "Morph", category: "L1/L2s" },
  { name: "MyPrize", category: "CeFi" },
  { name: "Near Foundation", category: "L1/L2s" },
  { name: "Nexus", category: "Infrastructure" },
  { name: "Oasis Labs", category: "Infrastructure" },
  { name: "OneKey", category: "Infrastructure" },
  { name: "Optimism", category: "L1/L2s" },
  { name: "Ora Labs", category: "Infrastructure" },
  { name: "Orderly", category: "DeFi" },
  { name: "Paradigm", category: "DeFi" },
  { name: "Parcl", category: "DeFi" },
  { name: "PartyDAO", category: "NFT" },
  { name: "Perpl", category: "DeFi" },
  { name: "PleasrDAO", category: "NFT" },
  { name: "Polygon", category: "L1/L2s" },
  { name: "Polymarket", category: "Infrastructure" },
  { name: "Prodia", category: "Infrastructure" },
  { name: "Quantstamp", category: "Infrastructure" },
  { name: "Rain", category: "Stablecoin" },
  { name: "Renegade", category: "DeFi" },
  { name: "Rhythmic", category: "Infrastructure" },
  { name: "Routemesh", category: "Infrastructure" },
  { name: "Saffron", category: "DeFi" },
  { name: "Sanctum", category: "DeFi" },
  { name: "Shrapnel", category: "NFT" },
  { name: "Sipher", category: "NFT" },
  { name: "Slingshot DAO", category: "DeFi" },
  { name: "Solend", category: "DeFi" },
  { name: "Starkware", category: "L1/L2s" },
  { name: "SynFutures", category: "DeFi" },
  { name: "Taker", category: "DeFi" },
  { name: "Thesis", category: "Infrastructure" },
  { name: "TRLab", category: "NFT" },
  { name: "Two Cents", category: "Infrastructure" },
  { name: "UMA Protocol", category: "Infrastructure" },
  { name: "USD.ai", category: "Stablecoin" },
  { name: "Utorg", category: "Stablecoin" },
  { name: "Variational", category: "DeFi" },
  { name: "Velocity", category: "CeFi" },
  { name: "Yeet", category: "DeFi" },
  { name: "ZA Bank", category: "CeFi" },
  { name: "ZAR", category: "Stablecoin" },
];

export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Thesis", href: "#brain" },
  { label: "Science", href: "#writing" },
  { label: "Product", href: "#team" },
  { label: "Who It's For", href: "#portfolio" },
  { label: "Contact", href: "#footer" },
];

export const careers = [
  {
    index: "01",
    title: "Opportunities at\nDragonfly",
    action: "View",
    href: "https://career.dragonfly.xyz/venture.html",
  },
  {
    index: "02",
    title: "Browse our Portfolio\nJob Board",
    action: "Browse",
    href: "https://jobs.dragonfly.xyz/jobs",
  },
  {
    index: "03",
    title: "Join our Talent\nNetwork",
    action: "Join",
    href: "https://career.dragonfly.xyz/portfolio.html",
  },
];
