import { Connection, PublicKey } from '@solana/web3.js';

const HELIUS_RPC = 'https://mainnet.helius-rpc.com/?api-key=56e3b257-db11-4639-a5a2-4f09a9199f9f';
const connection = new Connection(HELIUS_RPC, 'confirmed');

async function getTopHolders(tokenAddress, limit = 200) {
  try {
    console.log(`\n分析代币: ${tokenAddress.slice(0, 8)}...`);
    const mintPubkey = new PublicKey(tokenAddress);
    const accounts = await connection.getTokenLargestAccounts(mintPubkey);
    
    console.log(`找到 ${accounts.value.length} 个账户`);
    
    const holders = await Promise.all(
      accounts.value.slice(0, Math.min(limit, accounts.value.length)).map(async (account) => {
        const accountInfo = await connection.getParsedAccountInfo(account.address);
        const owner = accountInfo.value?.data?.parsed?.info?.owner;
        return {
          address: owner,
          balance: account.amount,
          uiAmount: account.uiAmount
        };
      })
    );
    
    const validHolders = holders.filter(h => h.address);
    console.log(`有效持有者: ${validHolders.length}`);
    return validHolders;
  } catch (error) {
    console.error('错误:', error.message);
    throw error;
  }
}

function findCommonAddresses(addressLists) {
  if (addressLists.length === 0) return [];
  if (addressLists.length === 1) return addressLists[0];
  
  const addressCounts = new Map();
  
  addressLists.forEach(list => {
    const uniqueAddresses = new Set(list.map(item => item.address));
    uniqueAddresses.forEach(addr => {
      addressCounts.set(addr, (addressCounts.get(addr) || 0) + 1);
    });
  });
  
  const commonAddresses = [];
  addressCounts.forEach((count, address) => {
    if (count === addressLists.length) {
      commonAddresses.push(address);
    }
  });
  
  return commonAddresses;
}

async function test() {
  const tokens = [
    '6JNX28ebGucLPGAxrh5AxoUgg63HryRThng1e3JJpump',
    '6iA73gWCKkLWKbVr8rgibV57MMRxzsaqS9cWpgKBpump'
  ];
  
  console.log('🚀 开始测试 SOL Meme Tracker...\n');
  const allData = [];
  
  for (const token of tokens) {
    const holders = await getTopHolders(token, 200);
    allData.push(holders);
  }
  
  const common = findCommonAddresses(allData);
  
  console.log('\n📊 === 分析结果 ===');
  console.log(`代币1持有者: ${allData[0].length}`);
  console.log(`代币2持有者: ${allData[1].length}`);
  console.log(`共同持有者: ${common.length}`);
  console.log(`重叠率: ${((common.length / allData[0].length) * 100).toFixed(2)}%`);
  
  if (common.length > 0) {
    console.log('\n🎯 前10个共同地址:');
    common.slice(0, 10).forEach((addr, idx) => {
      console.log(`  ${idx + 1}. ${addr}`);
    });
  } else {
    console.log('\n⚠️  没有找到共同持有者');
  }
  
  console.log('\n✅ 测试完成!');
}

test().catch(err => {
  console.error('\n❌ 测试失败:', err.message);
  process.exit(1);
});
