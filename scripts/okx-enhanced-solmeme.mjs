import crypto from 'crypto';
import { Connection, PublicKey } from '@solana/web3.js';

const BASE = 'https://web3.okx.com';
const SOL_CHAIN_INDEX = '501';
const HELIUS_RPC = process.env.HELIUS_RPC || 'https://mainnet.helius-rpc.com/?api-key=56e3b257-db11-4639-a5a2-4f09a9199f9f';

const connection = new Connection(HELIUS_RPC, 'confirmed');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function okxHeaders(method, path, bodyStr = '') {
  const apiKey = requireEnv('OKX_API_KEY');
  const secret = requireEnv('OKX_SECRET_KEY');
  const passphrase = requireEnv('OKX_PASSPHRASE');
  const timestamp = new Date().toISOString();
  const sign = crypto
    .createHmac('sha256', secret)
    .update(timestamp + method + path + bodyStr)
    .digest('base64');

  return {
    'Content-Type': 'application/json',
    'OK-ACCESS-KEY': apiKey,
    'OK-ACCESS-SIGN': sign,
    'OK-ACCESS-PASSPHRASE': passphrase,
    'OK-ACCESS-TIMESTAMP': timestamp,
  };
}

async function okxPost(path, bodyObj) {
  const bodyStr = JSON.stringify(bodyObj);
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: okxHeaders('POST', path, bodyStr),
    body: bodyStr,
  });
  const json = await res.json();
  if (json.code !== '0') {
    throw new Error(`OKX API error ${json.code}: ${json.msg || 'unknown'}`);
  }
  return json.data || [];
}

async function getTopHolders(mintAddress, limit = 200) {
  const mintPubkey = new PublicKey(mintAddress);
  const TOKEN_PROGRAM_IDS = [
    new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    new PublicKey('TokenzQdB8uS5f8zQhB64fxYz6n1vCtbmZh9rqxQf2S'), // Token-2022
  ];

  const accountGroups = await Promise.all(
    TOKEN_PROGRAM_IDS.map((programId) =>
      connection.getProgramAccounts(programId, {
        filters: [
          { dataSize: 165 },
          { memcmp: { offset: 0, bytes: mintPubkey.toBase58() } },
        ],
      }).catch(() => [])
    )
  );

  const accounts = accountGroups.flat();
  const ownerBalances = new Map();

  for (const account of accounts) {
    const data = account.account.data;
    const owner = new PublicKey(data.slice(32, 64)).toBase58();
    const amount = Number(data.readBigUInt64LE(64));
    if (amount <= 0) continue;
    ownerBalances.set(owner, (ownerBalances.get(owner) || 0) + amount);
  }

  let holders = [...ownerBalances.entries()]
    .map(([address, amount]) => ({
      address,
      uiAmount: amount,
    }))
    .sort((a, b) => b.uiAmount - a.uiAmount)
    .slice(0, limit);

  if (holders.length === 0) {
    const largest = await connection.getTokenLargestAccounts(mintPubkey);
    const resolved = await Promise.all(
      largest.value.slice(0, Math.min(limit, largest.value.length)).map(async (item) => {
        const info = await connection.getParsedAccountInfo(item.address).catch(() => null);
        const owner = info?.value?.data?.parsed?.info?.owner;
        return owner ? { address: owner, uiAmount: item.uiAmount || 0 } : null;
      })
    );
    holders = resolved.filter(Boolean);
  }

  return holders;
}

function intersectWallets(walletLists) {
  if (walletLists.length < 2) return [];
  const map = new Map();

  for (const list of walletLists) {
    const unique = new Set(list.map((x) => x.address));
    for (const wallet of unique) {
      map.set(wallet, (map.get(wallet) || 0) + 1);
    }
  }

  return [...map.entries()]
    .filter(([, count]) => count === walletLists.length)
    .map(([wallet]) => wallet);
}

function scoreToken(meta) {
  const liquidity = Number(meta.liquidity || 0);
  const marketCap = Number(meta.marketCap || 0);
  const community = meta.tagList?.communityRecognized ? 1 : 0;

  let score = 0;
  if (liquidity >= 5_000_000) score += 40;
  else if (liquidity >= 1_000_000) score += 25;
  else if (liquidity >= 100_000) score += 10;

  if (marketCap >= 100_000_000) score += 30;
  else if (marketCap >= 10_000_000) score += 20;
  else if (marketCap >= 1_000_000) score += 10;

  score += community ? 30 : 0;
  return Math.min(100, score);
}

async function run() {
  const tokens = process.argv.slice(2).filter(Boolean);
  if (tokens.length < 2) {
    console.error('Usage: node scripts/okx-enhanced-solmeme.mjs <token1> <token2> [token3...]');
    process.exit(1);
  }

  const basicPayload = tokens.map((address) => ({
    chainIndex: SOL_CHAIN_INDEX,
    tokenContractAddress: address,
  }));

  const [basicInfo, priceInfo, holderLists] = await Promise.all([
    okxPost('/api/v6/dex/market/token/basic-info', basicPayload),
    okxPost('/api/v6/dex/market/price-info', basicPayload),
    Promise.all(tokens.map((t) => getTopHolders(t, 200))),
  ]);

  const commonWallets = intersectWallets(holderLists);

  const byAddress = new Map();
  for (const item of basicInfo) byAddress.set(item.tokenContractAddress, { ...item });
  for (const item of priceInfo) {
    const old = byAddress.get(item.tokenContractAddress) || {};
    byAddress.set(item.tokenContractAddress, { ...old, ...item });
  }

  const tokenReports = tokens.map((address, idx) => {
    const meta = byAddress.get(address) || {};
    const score = scoreToken(meta);
    return {
      address,
      name: meta.tokenName || 'Unknown',
      symbol: meta.tokenSymbol || 'Unknown',
      communityRecognized: !!meta.tagList?.communityRecognized,
      price: meta.price || null,
      marketCap: meta.marketCap || null,
      liquidity: meta.liquidity || null,
      priceChange24H: meta.priceChange24H || null,
      holdersFetched: holderLists[idx]?.length || 0,
      qualityScore: score,
    };
  });

  const overlapRatio = tokenReports[0]?.holdersFetched
    ? Number((commonWallets.length / tokenReports[0].holdersFetched).toFixed(4))
    : 0;

  const output = {
    timestamp: new Date().toISOString(),
    mode: 'okx-enhanced-solmeme',
    tokens: tokenReports,
    overlap: {
      commonWalletCount: commonWallets.length,
      overlapRatio,
      sampleWallets: commonWallets.slice(0, 20),
    },
    summary: {
      avgQualityScore: Number(
        (tokenReports.reduce((sum, x) => sum + x.qualityScore, 0) / tokenReports.length).toFixed(2)
      ),
      caution: tokenReports.some((t) => Number(t.liquidity || 0) < 100000),
    },
  };

  console.log(JSON.stringify(output, null, 2));
}

run().catch((err) => {
  console.error('Enhanced analysis failed:', err.message);
  process.exit(1);
});
