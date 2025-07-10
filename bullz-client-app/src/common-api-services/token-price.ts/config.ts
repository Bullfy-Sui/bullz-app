// Token configuration for price API
export const TOKEN_ADDRESSES = {
  // Original tokens
  CETUS: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
  SUI: "0x2::sui::SUI",
  WAL: "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",
  MIU: "0x32a976482bf4154961bf20bfa3567a80122fdf8e8f8b28d752b609d8640f7846::miu::MIU",
  
  // New tokens
  SCA: "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA",
  TOILET: "0xc5b61b1e1f7f88511c9c0c6f475f823c66cc4e2d39a49beb6777059710be8404::toilet::TOILET",
  NS: "0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS",
  MEMEFI: "0x506a6fc25f1c7d52ceb06ea44a3114c9380f8e2029b4356019822f248b49e411::memefi::MEMEFI",
  BLUB: "0xfa7ac3951fdca92c5200d468d31a365eb03b2be9936fde615e69f0c1274ad3a0::BLUB::BLUB",
  BLUE: "0xe1b45a0e641b9955a20aa0ad1c1f4ad86aad8afb07296d4085e349a50e90bdca::blue::BLUE",
  AXOL: "0xae00e078a46616bf6e1e6fb673d18dcd2aa31319a07c9bc92f6063363f597b4e::AXOL::AXOL",
  DEEP: "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
  TURBOS: "0x5d1f47ea69bb0de31c313d7acf89b890dbb8991ea8e03c6c355171f84bb1ba4a::turbos::TURBOS",
  LOFI: "0xf22da9a24ad027cccb5f2d496cbe91de953d363513db08a3a734d361c7c17503::LOFI::LOFI",
  SEND: "0xb45fcfcc2cc07ce0702cc2d229621e046c906ef14d9b25e8e4d25f6e8763fef7::send::SEND",
  UP: "0x87dfe1248a1dc4ce473bd9cb2937d66cdc6c30fee63f3fe0dbb55c7a09d35dec::up::UP",
  BLUE_FOOD: "0x6cbf071cadfa1d0cc611d488f70fd89248d922de2b1e4dac39ce79d516f00c9f::blue::BLUE",
  SLOVE: "0x6dd439dee053557b3dd340287a4b81099b3e729cb48fbdae726dd2dff82736c3::slove::SLOVE",
  ZEN: "0x2665dc784c7ff17fddba2442b36cb8b2bbc8adfa9fe08794fd941d80ef2758ec::zen::ZEN",
  E4C: "0x84b27ddadc6139c7e8837fef6759eba4670ba3fc0679acd118b4e9252f834e29::e4c::E4C",
  WSOL: "0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN",
  SUDENG: "0x8993129d72e733985f7f1a00396cbd055bad6f817fee36576ce483c8bbb8b87b::sudeng::SUDENG",
  ETH: "0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH",
  SPT: "0xb779486cfd6c19e9218cc7dc17c453014d2d9ba12d2ee4dbb0ec4e1e02ae1cca::spt::SPT",
  SUIP: "0xe4239cd951f6c53d9c41e25270d80d31f925ad1655e5ba5b543843d4a66975ee::SUIP::SUIP",
  ALPHA: "0xfe3afec26c59e874f3c1d60b8203cb3852d2bb2aa415df9548b8d688e6683f93::alpha::ALPHA",
  ZLP: "0xf7fade57462e56e2eff1d7adef32e4fd285b21fd81f983f407bb7110ca766cda::zlp::ZLP",
  XO: "0x90f9eb95f62d31fbe2179313547e360db86d88d2399103a94286291b63f469ba::xo::XO",
  BUT: "0xbc858cb910b9914bee64fff0f9b38855355a040c49155a17b265d9086d256545::but::BUT",
 
} as const;

// Get all token addresses as an array
export const getAllTokenAddresses = (): string[] => {
  return Object.values(TOKEN_ADDRESSES);
};

// Get default token addresses (original 4 tokens for backward compatibility)
export const getDefaultTokenAddresses = (): string[] => {
  return [
    TOKEN_ADDRESSES.CETUS,
    TOKEN_ADDRESSES.SUI,
    TOKEN_ADDRESSES.WAL,
    TOKEN_ADDRESSES.MIU,
  ];
};

// Token symbol to address mapping for easy lookup
export const getTokenAddressBySymbol = (symbol: string): string | undefined => {
  return TOKEN_ADDRESSES[symbol as keyof typeof TOKEN_ADDRESSES];
};

// Get token symbol from address
export const getTokenSymbolByAddress = (address: string): string | undefined => {
  const entry = Object.entries(TOKEN_ADDRESSES).find(([, addr]) => addr === address);
  return entry?.[0];
}; 