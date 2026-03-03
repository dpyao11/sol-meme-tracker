import { Connection, PublicKey } from '@solana/web3.js';
import { HELIUS_RPC } from './config';

const connection = new Connection(HELIUS_RPC, 'confirmed');

// 获取代币持有者
export async function getTopHolders(tokenAddress, limit = 200) {
  try {
    const mintPubkey = new PublicKey(tokenAddress);
    const accounts = await connection.getTokenLargestAccounts(mintPubkey);
    
    const holders = await Promise.all(
      accounts.value.slice(0, limit).map(async (account) => {
        const accountInfo = await connection.getParsedAccountInfo(account.address);
        const owner = accountInfo.value?.data?.parsed?.info?.owner;
        return {
          address: owner,
          balance: account.amount,
          uiAmount: account.uiAmount
        };
      })
    );
    
    return holders.filter(h => h.address);
  } catch (error) {
    console.error('获取持有者失败:', error);
    throw error;
  }
}

// 获取早期买家
export async function getEarlyBuyers(tokenAddress, limit = 100) {
  try {
    const mintPubkey = new PublicKey(tokenAddress);
    
    // 获取代币账户的交易签名
    const signatures = await connection.getSignaturesForAddress(
      mintPubkey,
      { limit: 1000 }
    );
    
    const buyers = new Map();
    
    // 并发解析交易
    const batchSize = 50;
    for (let i = 0; i < signatures.length && buyers.size < limit; i += batchSize) {
      const batch = signatures.slice(i, i + batchSize);
      const txs = await Promise.all(
        batch.map(sig => 
          connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          })
        )
      );
      
      for (const tx of txs) {
        if (!tx || buyers.size >= limit) break;
        
        // 查找 token transfer 指令
        const instructions = tx.transaction.message.instructions;
        for (const ix of instructions) {
          if (ix.program === 'spl-token' && ix.parsed?.type === 'transfer') {
            const destination = ix.parsed.info.destination;
            const destinationOwner = await getTokenAccountOwner(destination);
            
            if (destinationOwner && !buyers.has(destinationOwner)) {
              buyers.set(destinationOwner, {
                address: destinationOwner,
                timestamp: tx.blockTime,
                signature: tx.transaction.signatures[0]
              });
            }
          }
        }
      }
    }
    
    return Array.from(buyers.values()).slice(0, limit);
  } catch (error) {
    console.error('获取早期买家失败:', error);
    throw error;
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
