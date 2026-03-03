import { Connection, PublicKey } from '@solana/web3.js';
import { HELIUS_RPC } from './config';

const connection = new Connection(HELIUS_RPC, 'confirmed');

// 获取代币持有者
export async function getTopHolders(tokenAddress, limit = 200) {
  try {
    const mintPubkey = new PublicKey(tokenAddress);
    
    // 使用 Helius DAS API 获取所有持有者
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=56e3b257-db11-4639-a5a2-4f09a9199f9f`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'get-holders',
        method: 'getTokenAccounts',
        params: {
          mint: tokenAddress,
          limit: limit,
          page: 1
        }
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      // 降级到标准 RPC
      console.warn('Helius API 失败,使用标准 RPC');
      return await getTopHoldersStandard(tokenAddress, limit);
    }
    
    const holders = (data.result?.token_accounts || []).map(account => ({
      address: account.owner,
      balance: account.amount,
      uiAmount: parseFloat(account.amount) / Math.pow(10, account.decimals || 9)
    }));
    
    return holders.filter(h => h.address);
  } catch (error) {
    console.error('获取持有者失败,尝试标准方法:', error);
    return await getTopHoldersStandard(tokenAddress, limit);
  }
}

// 标准 RPC 方法 (降级方案)
async function getTopHoldersStandard(tokenAddress, limit) {
  const mintPubkey = new PublicKey(tokenAddress);
  const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  
  const accounts = await connection.getProgramAccounts(
    TOKEN_PROGRAM_ID,
    {
      filters: [
        { dataSize: 165 },
        { memcmp: { offset: 0, bytes: mintPubkey.toBase58() } }
      ]
    }
  );
  
  const holders = accounts
    .map(account => {
      const data = account.account.data;
      const owner = new PublicKey(data.slice(32, 64)).toBase58();
      const amount = data.readBigUInt64LE(64);
      return {
        address: owner,
        balance: amount.toString(),
        uiAmount: Number(amount) / 1e9
      };
    })
    .sort((a, b) => b.uiAmount - a.uiAmount)
    .slice(0, limit);
  
  return holders;
}

// 获取早期买家
export async function getEarlyBuyers(tokenAddress, limit = 100) {
  try {
    // 使用 Helius Enhanced Transactions API
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=56e3b257-db11-4639-a5a2-4f09a9199f9f`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'get-txs',
        method: 'getSignaturesForAddress',
        params: [
          tokenAddress,
          { limit: 1000 }
        ]
      })
    });
    
    const data = await response.json();
    
    if (!data.result || data.result.length === 0) {
      throw new Error('无法获取交易历史');
    }
    
    const signatures = data.result;
    const buyers = new Map();
    
    // 分批处理交易
    const batchSize = 20;
    for (let i = signatures.length - 1; i >= 0 && buyers.size < limit; i -= batchSize) {
      const batch = signatures.slice(Math.max(0, i - batchSize + 1), i + 1);
      
      const txResponse = await fetch(`https://mainnet.helius-rpc.com/?api-key=56e3b257-db11-4639-a5a2-4f09a9199f9f`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          batch.map((sig, idx) => ({
            jsonrpc: '2.0',
            id: idx,
            method: 'getTransaction',
            params: [
              sig.signature,
              { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
            ]
          }))
        )
      });
      
      const txData = await txResponse.json();
      const transactions = Array.isArray(txData) ? txData : [txData];
      
      for (const txResult of transactions) {
        if (!txResult.result || buyers.size >= limit) continue;
        
        const tx = txResult.result;
        const accountKeys = tx.transaction?.message?.accountKeys || [];
        
        // 查找交易发起者 (第一个签名者)
        if (accountKeys.length > 0) {
          const signer = accountKeys[0].pubkey;
          
          if (signer && !buyers.has(signer)) {
            buyers.set(signer, {
              address: signer,
              timestamp: tx.blockTime,
              signature: tx.transaction.signatures[0]
            });
          }
        }
      }
    }
    
    return Array.from(buyers.values()).slice(0, limit);
  } catch (error) {
    console.error('获取早期买家失败:', error);
    // 降级方案: 返回持有者作为买家
    console.warn('降级到持有者列表');
    return await getTopHolders(tokenAddress, limit);
  }
}

// 获取 token account 的 owner
async function getTokenAccountOwner(accountAddress) {
  try {
    const pubkey = new PublicKey(accountAddress);
    const accountInfo = await connection.getParsedAccountInfo(pubkey);
    return accountInfo.value?.data?.parsed?.info?.owner;
  } catch {
    return null;
  }
}

// 找出共同地址
export function findCommonAddresses(addressLists) {
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
